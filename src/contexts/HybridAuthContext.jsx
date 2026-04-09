// Contexte d'authentification hybride pour gérer Supabase Auth + authentification manuelle
// Remplace ou complète l'AuthContext existant

import React, { createContext, useContext, useEffect, useState } from 'react';
import hybridAuthService from '../services/hybridAuthService';
import { supabase } from '../config/supabase';

const HybridAuthContext = createContext({});

export const useHybridAuth = () => {
  const context = useContext(HybridAuthContext);
  if (!context) {
    throw new Error('useHybridAuth must be used within a HybridAuthProvider');
  }
  return context;
};

export const HybridAuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authMethod, setAuthMethod] = useState('none');

  // Initialiser la session au chargement
  useEffect(() => {
    initializeAuth();

    // Écouter les changements de session Supabase
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Changement d\'état auth Supabase:', event);
        
        if (event === 'SIGNED_IN' && session?.user) {
          await handleSupabaseSignIn(session.user);
        } else if (event === 'SIGNED_OUT') {
          await handleSignOut();
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Initialiser l'authentification
  const initializeAuth = async () => {
    try {
      setLoading(true);
      const { session, profile, method } = await hybridAuthService.getCurrentSession();
      
      if (session?.user) {
        setUser(session.user);
        setUserProfile(profile);
        setAuthMethod(method);
        console.log(`✅ Session ${method} restaurée pour:`, session.user.email);
      } else {
        console.log('ℹ️ Aucune session active');
      }
    } catch (error) {
      console.error('❌ Erreur initialisation auth:', error);
    } finally {
      setLoading(false);
    }
  };

  // Gérer la connexion Supabase
  const handleSupabaseSignIn = async (supabaseUser) => {
    try {
      const profile = await hybridAuthService.getUserProfile(supabaseUser.id);
      setUser(supabaseUser);
      setUserProfile(profile);
      setAuthMethod('supabase');
    } catch (error) {
      console.error('❌ Erreur handleSupabaseSignIn:', error);
    }
  };

  // Gérer la déconnexion
  const handleSignOut = async () => {
    setUser(null);
    setUserProfile(null);
    setAuthMethod('none');
  };

  // Connexion hybride
  const signIn = async (email, password) => {
    try {
      setLoading(true);
      const result = await hybridAuthService.signIn(email, password);
      
      if (result.success) {
        setUser(result.user);
        setUserProfile(result.profile);
        setAuthMethod(result.method);
        
        console.log(`✅ Connexion ${result.method} réussie pour:`, email);
        return { success: true, method: result.method };
      } else {
        console.error('❌ Échec de connexion:', result.error);
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('❌ Erreur signIn:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Déconnexion
  const signOut = async () => {
    try {
      setLoading(true);
      await hybridAuthService.signOut();
      await handleSignOut();
      console.log('✅ Déconnexion réussie');
      return { success: true };
    } catch (error) {
      console.error('❌ Erreur signOut:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Vérifier si l'utilisateur a un rôle
  const hasRole = (role) => {
    if (!user) return false;
    
    // Pour l'authentification manuelle
    if (authMethod === 'manual') {
      return user.user_metadata?.role === role;
    }
    
    // Pour Supabase Auth
    if (userProfile) {
      return userProfile.role === role;
    }
    
    return user.app_metadata?.role === role || user.user_metadata?.role === role;
  };

  // Vérifier si l'utilisateur a l'un des rôles
  const hasAnyRole = (roles) => {
    return roles.some(role => hasRole(role));
  };

  // Obtenir le profil utilisateur (avec cache)
  const getUserProfile = async (forceRefresh = false) => {
    if (userProfile && !forceRefresh) {
      return userProfile;
    }

    if (!user) return null;

    try {
      let profile = null;
      
      if (authMethod === 'manual') {
        // Pour l'auth manuelle, le profil est dans user
        profile = {
          id: user.id,
          email: user.email,
          nom: user.user_metadata?.nom,
          prenom: user.user_metadata?.prenom,
          role: user.user_metadata?.role,
          specialite: user.user_metadata?.specialite
        };
      } else {
        // Pour Supabase Auth, récupérer depuis la BDD
        profile = await hybridAuthService.getUserProfile(user.id);
      }

      if (profile) {
        setUserProfile(profile);
      }
      
      return profile;
    } catch (error) {
      console.error('❌ Erreur getUserProfile:', error);
      return null;
    }
  };

  // Obtenir les informations de l'utilisateur
  const getCurrentUser = () => user;
  const getCurrentUserRole = () => {
    if (authMethod === 'manual') {
      return user?.user_metadata?.role;
    }
    return userProfile?.role || user?.app_metadata?.role || user?.user_metadata?.role;
  };

  // Vérifier si connecté
  const isAuthenticated = () => !!user;

  const value = {
    // État
    user,
    userProfile,
    loading,
    authMethod,
    
    // Méthodes d'authentification
    signIn,
    signOut,
    
    // Vérifications de rôles
    hasRole,
    hasAnyRole,
    
    // Utilitaires
    getUserProfile,
    getCurrentUser,
    getCurrentUserRole,
    isAuthenticated,
    
    // Informations supplémentaires
    isManualAuth: authMethod === 'manual',
    isSupabaseAuth: authMethod === 'supabase'
  };

  return (
    <HybridAuthContext.Provider value={value}>
      {children}
    </HybridAuthContext.Provider>
  );
};

export default HybridAuthContext;
