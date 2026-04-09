import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase, signIn, signOut, signUp, getCurrentUser } from '../lib/supabase';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth doit être utilisé dans un AuthProvider');
  }
  return context;
};

// Cache intelligent pour les profils utilisateurs
class ProfileCache {
  constructor() {
    this.cache = new Map();
    this.ttl = 5 * 60 * 1000; // 5 minutes TTL
    this.sessionTtl = 30 * 60 * 1000; // 30 minutes pour les sessions
  }

  set(key, value, customTtl = null) {
    const ttl = customTtl || this.ttl;
    const expiry = Date.now() + ttl;
    this.cache.set(key, { value, expiry });
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value;
  }

  clear() {
    this.cache.clear();
  }

  has(key) {
    const item = this.cache.get(key);
    if (!item) return false;
    
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  // Nettoyage automatique des entrées expirées
  cleanup() {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiry) {
        this.cache.delete(key);
      }
    }
  }
}

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  
  // Cache intelligent
  const cacheRef = useRef(new ProfileCache());
  const loadingRef = useRef(new Set()); // Éviter les requêtes multiples simultanées

  // Nettoyage périodique du cache
  useEffect(() => {
    const interval = setInterval(() => {
      cacheRef.current.cleanup();
    }, 60000); // Nettoyage toutes les minutes

    return () => clearInterval(interval);
  }, []);

  // Fonction optimisée pour récupérer le profil utilisateur
  const getUserProfileOptimized = useCallback(async (email, forceRefresh = false) => {
    if (!email) return null;

    const cacheKey = `profile_${email}`;
    
    // Vérifier le cache d'abord
    if (!forceRefresh && cacheRef.current.has(cacheKey)) {
      const cached = cacheRef.current.get(cacheKey);
      if (cached) {
        return cached;
      }
    }

    // Éviter les requêtes multiples simultanées
    if (loadingRef.current.has(email)) {
      // Attendre un peu et retourner le cache
      await new Promise(resolve => setTimeout(resolve, 100));
      return cacheRef.current.get(cacheKey);
    }

    try {
      loadingRef.current.add(email);
      
      // Utiliser la fonction SQL optimisée
      const { data, error } = await supabase
        .rpc('get_user_profile_optimized', { user_email: email });

      if (error) {
        console.error('Erreur lors de la récupération du profil:', error);
        return null;
      }

      const profile = data?.[0] || null;
      
      if (profile) {
        // Mettre en cache avec TTL
        cacheRef.current.set(cacheKey, profile);
      }

      return profile;
    } catch (error) {
      console.error('Erreur générale lors de la récupération du profil:', error);
      return null;
    } finally {
      loadingRef.current.delete(email);
    }
  }, []);

  // Vérification rapide des rôles avec cache
  const hasRoleOptimized = useCallback((role) => {
    // Essayer d'abord le profil en cache
    if (userProfile?.role) {
      return userProfile.role === role;
    }
    
    // Puis le profil dans currentUser
    if (currentUser?.profile?.role) {
      return currentUser.profile.role === role;
    }
    
    // Enfin les métadonnées utilisateur comme fallback
    const userRole = currentUser?.user_metadata?.role || currentUser?.app_metadata?.role;
    return userRole === role;
  }, [userProfile, currentUser]);

  const hasAnyRoleOptimized = useCallback((roles) => {
    // Essayer d'abord le profil en cache
    if (userProfile?.role) {
      return roles.includes(userProfile.role);
    }
    
    // Puis le profil dans currentUser
    if (currentUser?.profile?.role) {
      return roles.includes(currentUser.profile.role);
    }
    
    // Enfin les métadonnées utilisateur comme fallback
    const userRole = currentUser?.user_metadata?.role || currentUser?.app_metadata?.role;
    return roles.includes(userRole);
  }, [userProfile, currentUser]);

  // Fonction pour charger le profil et mettre à jour le state
  const loadUserProfile = useCallback(async (user, forceRefresh = false) => {
    if (!user?.email) return null;

    try {
      setProfileLoading(true);
      const profile = await getUserProfileOptimized(user.email, forceRefresh);
      
      if (profile) {
        const userWithProfile = {
          ...user,
          profile: profile
        };
        
        setCurrentUser(userWithProfile);
        setUserProfile(profile);
        return profile;
      } else {
        // Continuer avec l'utilisateur sans profil
        setCurrentUser(user);
        setUserProfile(null);
        return null;
      }
    } catch (error) {
      console.error('Erreur lors du chargement du profil:', error);
      setCurrentUser(user);
      setUserProfile(null);
      return null;
    } finally {
      setProfileLoading(false);
    }
  }, [getUserProfileOptimized]);

  // Écouter les changements d'authentification
  useEffect(() => {
    let mounted = true;

    // Récupérer la session initiale
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        if (session?.user) {
          setSession(session);
          await loadUserProfile(session.user);
        } else {
          setCurrentUser(null);
          setSession(null);
          setUserProfile(null);
        }
      } catch (error) {
        console.error('Erreur lors du chargement de la session:', error);
        if (mounted) {
          setCurrentUser(null);
          setSession(null);
          setUserProfile(null);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    getInitialSession();

    // Écouter les changements d'authentification Supabase
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        try {
          if (session?.user) {
            setSession(session);
            await loadUserProfile(session.user);
          } else {
            setCurrentUser(null);
            setSession(null);
            setUserProfile(null);
            // Nettoyer le cache lors de la déconnexion
            cacheRef.current.clear();
          }
        } catch (error) {
          console.error('Erreur lors de la mise à jour de la session:', error);
        } finally {
          if (mounted) {
            setIsLoading(false);
          }
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [loadUserProfile]);

  // Fonction de connexion avec Supabase Auth
  const login = async (email, password) => {
    try {
      setIsLoading(true);
      const { data, error } = await signIn(email, password);
      
      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true, user: data.user };
    } catch (error) {
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  // Fonction de déconnexion avec Supabase Auth
  const logout = async () => {
    try {
      setIsLoading(true);
      const { error } = await signOut();
      
      // Nettoyer tout le cache
      cacheRef.current.clear();
      loadingRef.current.clear();
      
      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  // Fonction d'inscription avec Supabase Auth
  const register = async (email, password, userData = {}) => {
    try {
      setIsLoading(true);
      const { data, error } = await signUp(email, password, userData);
      
      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true, user: data.user };
    } catch (error) {
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  // Obtenir les informations utilisateur (avec cache optimisé)
  const getUserProfile = async (forceRefresh = false) => {
    if (!currentUser) {
      return null;
    }
    
    // Retourner le cache si disponible et pas de rafraîchissement forcé
    if (userProfile && !forceRefresh) {
      return userProfile;
    }
    
    return await getUserProfileOptimized(currentUser.email, forceRefresh);
  };

  // Vérification rapide des rôles avec fonction SQL
  const checkRoleWithSQL = useCallback(async (role) => {
    if (!currentUser?.email) return false;

    try {
      const { data, error } = await supabase
        .rpc('check_user_role', { 
          user_email: currentUser.email, 
          required_role: role 
        });

      if (error) {
        console.error('Erreur lors de la vérification du rôle:', error);
        return hasRoleOptimized(role); // Fallback sur cache
      }

      return data === true;
    } catch (error) {
      console.error('Erreur générale lors de la vérification du rôle:', error);
      return hasRoleOptimized(role); // Fallback sur cache
    }
  }, [currentUser, hasRoleOptimized]);

  // Vérification rapide des rôles multiples avec fonction SQL
  const checkAnyRoleWithSQL = useCallback(async (roles) => {
    if (!currentUser?.email) return false;

    try {
      const { data, error } = await supabase
        .rpc('check_user_any_role', { 
          user_email: currentUser.email, 
          required_roles: roles 
        });

      if (error) {
        console.error('Erreur lors de la vérification des rôles:', error);
        return hasAnyRoleOptimized(roles); // Fallback sur cache
      }

      return data === true;
    } catch (error) {
      console.error('Erreur générale lors de la vérification des rôles:', error);
      return hasAnyRoleOptimized(roles); // Fallback sur cache
    }
  }, [currentUser, hasAnyRoleOptimized]);

  // Vérifier si l'utilisateur est authentifié
  const isAuthenticated = () => {
    return !!currentUser && !!session;
  };

  // Obtenir le token d'accès avec cache
  const getAccessToken = useCallback(() => {
    if (!session) return null;
    
    const cacheKey = `token_${currentUser?.email}`;
    
    // Vérifier le cache d'abord
    if (cacheRef.current.has(cacheKey)) {
      return cacheRef.current.get(cacheKey);
    }
    
    // Stocker le token dans le cache avec un TTL court (5 min)
    if (session.access_token) {
      cacheRef.current.set(cacheKey, session.access_token, 5 * 60 * 1000);
      return session.access_token;
    }
    
    return null;
  }, [session, currentUser]);

  // Rafraîchir le profil utilisateur
  const refreshProfile = useCallback(async () => {
    if (currentUser?.email) {
      return await loadUserProfile(currentUser, true);
    }
    return null;
  }, [currentUser, loadUserProfile]);

  // Statistiques du cache (pour debug)
  const getCacheStats = useCallback(() => {
    return {
      size: cacheRef.current.cache.size,
      loadingRequests: loadingRef.current.size
    };
  }, []);

  const value = {
    currentUser,
    session,
    userProfile,
    login,
    logout,
    register,
    hasRole: hasRoleOptimized,
    hasAnyRole: hasAnyRoleOptimized,
    checkRoleWithSQL,
    checkAnyRoleWithSQL,
    getUserProfile,
    refreshProfile,
    isAuthenticated,
    getAccessToken,
    isLoading,
    profileLoading,
    getCacheStats
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
