// Service d'authentification hybride pour gérer Supabase Auth + authentification manuelle
// Permet aux médecins de se connecter avec leurs mots de passe manuels

import { supabase } from '../config/supabase';

class HybridAuthService {
  constructor() {
    this.currentUser = null;
    this.isManualAuth = false;
  }

  // Authentification hybride - essaie d'abord Supabase, puis manuel
  async signIn(email, password) {
    try {
      console.log('🔐 Tentative de connexion hybride pour:', email);

      // Méthode 1: Essayer Supabase Auth d'abord
      const { data: supabaseData, error: supabaseError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (supabaseData?.user && !supabaseError) {
        console.log('✅ Connexion Supabase réussie');
        this.currentUser = supabaseData.user;
        this.isManualAuth = false;
        
        // Récupérer le profil utilisateur
        const profile = await this.getUserProfile(supabaseData.user.id);
        return {
          success: true,
          user: supabaseData.user,
          profile,
          method: 'supabase'
        };
      }

      // Méthode 2: Essayer l'authentification manuelle
      console.log('🔄 Tentative d\'authentification manuelle...');
      const manualResult = await this.authenticateManual(email, password);
      
      if (manualResult.success) {
        console.log('✅ Connexion manuelle réussie');
        this.currentUser = manualResult.user;
        this.isManualAuth = true;
        
        // Créer une session manuelle
        await this.createManualSession(manualResult.user);
        
        return {
          success: true,
          user: manualResult.user,
          profile: manualResult.user,
          method: 'manual'
        };
      }

      // Aucune méthode n'a fonctionné
      return {
        success: false,
        error: 'Email ou mot de passe incorrect',
        method: 'none'
      };

    } catch (error) {
      console.error('❌ Erreur lors de la connexion hybride:', error);
      return {
        success: false,
        error: error.message || 'Erreur de connexion'
      };
    }
  }

  // Authentification manuelle via la fonction SQL
  async authenticateManual(email, password) {
    try {
      const { data, error } = await supabase.rpc('authenticate_manual_user', {
        p_email: email,
        p_password: password
      });

      if (error) {
        console.error('❌ Erreur RPC authenticate_manual_user:', error);
        return { success: false, error: error.message };
      }

      if (data && data.success) {
        return {
          success: true,
          user: {
            id: data.user.id,
            email: data.user.email,
            user_metadata: {
              nom: data.user.nom,
              prenom: data.user.prenom,
              role: data.user.role,
              specialite: data.user.specialite
            },
            app_metadata: {
              role: data.user.role
            }
          }
        };
      }

      return { success: false, error: data?.message || 'Authentification échouée' };
    } catch (error) {
      console.error('❌ Erreur authentification manuelle:', error);
      return { success: false, error: error.message };
    }
  }

  // Créer une session manuelle (stockage local)
  async createManualSession(user) {
    const session = {
      user,
      expires_at: Date.now() + (24 * 60 * 60 * 1000), // 24h
      created_at: Date.now(),
      method: 'manual'
    };

    localStorage.setItem('manual_session', JSON.stringify(session));
    localStorage.setItem('supabase.auth.token', JSON.stringify(session));
  }

  // Récupérer le profil utilisateur depuis la base
  async getUserProfile(userId) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('auth_id', userId)
        .single();

      if (error) {
        console.error('❌ Erreur récupération profil:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('❌ Erreur getUserProfile:', error);
      return null;
    }
  }

  // Vérifier la session actuelle
  async getCurrentSession() {
    try {
      // Vérifier d'abord Supabase
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        this.currentUser = session.user;
        this.isManualAuth = false;
        const profile = await this.getUserProfile(session.user.id);
        return { session, profile, method: 'supabase' };
      }

      // Vérifier la session manuelle
      const manualSession = localStorage.getItem('manual_session');
      if (manualSession) {
        const parsed = JSON.parse(manualSession);
        
        // Vérifier si la session n'a pas expiré
        if (parsed.expires_at > Date.now()) {
          this.currentUser = parsed.user;
          this.isManualAuth = true;
          return { 
            session: { user: parsed.user }, 
            profile: parsed.user, 
            method: 'manual' 
          };
        } else {
          // Session expirée
          localStorage.removeItem('manual_session');
          localStorage.removeItem('supabase.auth.token');
        }
      }

      return { session: null, profile: null, method: 'none' };
    } catch (error) {
      console.error('❌ Erreur getCurrentSession:', error);
      return { session: null, profile: null, method: 'none' };
    }
  }

  // Déconnexion hybride
  async signOut() {
    try {
      // Déconnexion Supabase
      await supabase.auth.signOut();
      
      // Nettoyer la session manuelle
      localStorage.removeItem('manual_session');
      localStorage.removeItem('supabase.auth.token');
      
      this.currentUser = null;
      this.isManualAuth = false;
      
      return { success: true };
    } catch (error) {
      console.error('❌ Erreur lors de la déconnexion:', error);
      return { success: false, error: error.message };
    }
  }

  // Vérifier si l'utilisateur a un rôle spécifique
  hasRole(role) {
    if (!this.currentUser) return false;
    
    if (this.isManualAuth) {
      return this.currentUser.user_metadata?.role === role;
    } else {
      return this.currentUser.app_metadata?.role === role || 
             this.currentUser.user_metadata?.role === role;
    }
  }

  // Vérifier si l'utilisateur a l'un des rôles
  hasAnyRole(roles) {
    return roles.some(role => this.hasRole(role));
  }

  // Obtenir le rôle de l'utilisateur actuel
  getCurrentUserRole() {
    if (!this.currentUser) return null;
    
    if (this.isManualAuth) {
      return this.currentUser.user_metadata?.role;
    } else {
      return this.currentUser.app_metadata?.role || 
             this.currentUser.user_metadata?.role;
    }
  }

  // Obtenir les informations de l'utilisateur actuel
  getCurrentUser() {
    return this.currentUser;
  }

  // Vérifier si l'utilisateur est connecté
  isAuthenticated() {
    return !!this.currentUser;
  }
}

// Instance singleton
const hybridAuthService = new HybridAuthService();

export default hybridAuthService;
