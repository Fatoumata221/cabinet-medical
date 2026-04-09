/**
 * Service d'authentification hybride avec support des mots de passe temporaires
 * Gère Supabase Auth + système de mots de passe temporaires
 */

import { supabase } from '../lib/supabase';

class TemporaryAuthService {
  constructor() {
    this.sessionKey = 'temp_auth_session';
    this.sessionDuration = 24 * 60 * 60 * 1000; // 24h en millisecondes
  }

  /**
   * Connexion hybride : essaie Supabase Auth puis mot de passe temporaire
   */
  async signIn(email, password) {
    try {
      // 1. Essayer d'abord Supabase Auth standard
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (authData?.user && !authError) {
        // Connexion Supabase réussie
        const profile = await this.getUserProfile(authData.user.id);
        return {
          success: true,
          user: authData.user,
          profile,
          isTemporary: false,
          mustResetPassword: false
        };
      }

      // 2. Si Supabase échoue, essayer le mot de passe temporaire
      console.log('Tentative avec mot de passe temporaire...');
      return await this.signInWithTemporaryPassword(email, password);

    } catch (error) {
      console.error('Erreur lors de la connexion:', error);
      return {
        success: false,
        error: error.message || 'Erreur de connexion'
      };
    }
  }

  /**
   * Connexion avec mot de passe temporaire
   */
  async signInWithTemporaryPassword(email, password) {
    try {
      const { data, error } = await supabase.rpc('verify_temporary_password', {
        p_email: email,
        p_password: password
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data && data.length > 0) {
        const result = data[0];
        
        if (result.is_valid) {
          // Créer une session temporaire
          const session = {
            user: {
              id: result.user_id,
              email: result.email,
              role: result.role
            },
            profile: {
              id: result.user_id,
              email: result.email,
              role: result.role,
              nom: result.nom,
              prenom: result.prenom
            },
            isTemporary: true,
            mustResetPassword: result.must_reset,
            expiresAt: Date.now() + this.sessionDuration
          };

          // Sauvegarder la session
          localStorage.setItem(this.sessionKey, JSON.stringify(session));

          return {
            success: true,
            user: session.user,
            profile: session.profile,
            isTemporary: true,
            mustResetPassword: result.must_reset
          };
        }
      }

      return {
        success: false,
        error: 'Email ou mot de passe incorrect'
      };

    } catch (error) {
      console.error('Erreur mot de passe temporaire:', error);
      return {
        success: false,
        error: error.message || 'Erreur de vérification du mot de passe temporaire'
      };
    }
  }

  /**
   * Récupérer le profil utilisateur depuis Supabase
   */
  async getUserProfile(authId) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('auth_id', authId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Erreur récupération profil:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Erreur getUserProfile:', error);
      return null;
    }
  }

  /**
   * Vérifier si une session temporaire est active
   */
  getTemporarySession() {
    try {
      const sessionData = localStorage.getItem(this.sessionKey);
      if (!sessionData) return null;

      const session = JSON.parse(sessionData);
      
      // Vérifier si la session n'a pas expiré
      if (session.expiresAt && Date.now() > session.expiresAt) {
        this.clearTemporarySession();
        return null;
      }

      return session;
    } catch (error) {
      console.error('Erreur lecture session temporaire:', error);
      this.clearTemporarySession();
      return null;
    }
  }

  /**
   * Nettoyer la session temporaire
   */
  clearTemporarySession() {
    localStorage.removeItem(this.sessionKey);
  }

  /**
   * Réinitialiser le mot de passe définitif
   */
  async resetPassword(email, newPassword, confirmPassword) {
    try {
      if (newPassword !== confirmPassword) {
        throw new Error('Les mots de passe ne correspondent pas');
      }

      if (newPassword.length < 6) {
        throw new Error('Le mot de passe doit contenir au moins 6 caractères');
      }

      // 1. Créer le compte dans Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password: newPassword
      });

      if (authError && !authError.message.includes('already registered')) {
        throw new Error(authError.message);
      }

      // 2. Marquer le mot de passe temporaire comme utilisé
      const { error: resetError } = await supabase.rpc('complete_password_reset', {
        p_email: email,
        p_new_password: newPassword
      });

      if (resetError) {
        console.warn('Erreur marquage mot de passe temporaire:', resetError);
      }

      // 3. Mettre à jour le profil avec auth_id si création réussie
      if (authData?.user) {
        const { error: updateError } = await supabase
          .from('users')
          .update({ auth_id: authData.user.id })
          .eq('email', email);

        if (updateError) {
          console.warn('Erreur mise à jour auth_id:', updateError);
        }
      }

      // 4. Nettoyer la session temporaire
      this.clearTemporarySession();

      return {
        success: true,
        message: 'Mot de passe réinitialisé avec succès'
      };

    } catch (error) {
      console.error('Erreur réinitialisation mot de passe:', error);
      return {
        success: false,
        error: error.message || 'Erreur lors de la réinitialisation'
      };
    }
  }

  /**
   * Déconnexion hybride
   */
  async signOut() {
    try {
      // Déconnexion Supabase
      await supabase.auth.signOut();
      
      // Nettoyer session temporaire
      this.clearTemporarySession();
      
      return { success: true };
    } catch (error) {
      console.error('Erreur déconnexion:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Obtenir l'utilisateur actuel (Supabase ou temporaire)
   */
  async getCurrentUser() {
    try {
      // 1. Vérifier session Supabase
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const profile = await this.getUserProfile(user.id);
        return {
          user,
          profile,
          isTemporary: false,
          mustResetPassword: false
        };
      }

      // 2. Vérifier session temporaire
      const tempSession = this.getTemporarySession();
      if (tempSession) {
        return {
          user: tempSession.user,
          profile: tempSession.profile,
          isTemporary: true,
          mustResetPassword: tempSession.mustResetPassword
        };
      }

      return null;
    } catch (error) {
      console.error('Erreur getCurrentUser:', error);
      return null;
    }
  }

  /**
   * Créer un nouveau mot de passe temporaire (pour les admins)
   */
  async createTemporaryPassword(email, tempPassword, expiresHours = 24) {
    try {
      const { data, error } = await supabase.rpc('create_temporary_password', {
        p_email: email,
        p_temp_password: tempPassword,
        p_expires_hours: expiresHours
      });

      if (error) {
        throw new Error(error.message);
      }

      return {
        success: true,
        message: `Mot de passe temporaire créé pour ${email}`
      };
    } catch (error) {
      console.error('Erreur création mot de passe temporaire:', error);
      return {
        success: false,
        error: error.message || 'Erreur lors de la création du mot de passe temporaire'
      };
    }
  }
}

// Instance singleton
export const temporaryAuthService = new TemporaryAuthService();
export default temporaryAuthService;
