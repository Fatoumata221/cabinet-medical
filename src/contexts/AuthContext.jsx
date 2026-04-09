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

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileCacheAt, setProfileCacheAt] = useState(0);
  const lastLoggedProfileRef = useRef(null);

  // Fonction pour charger le profil utilisateur (mémorisée avec useCallback)
  const loadUserProfile = useCallback(async (user) => {
    if (!user?.email && !user?.id) {
      setUserProfile(null);
      return null;
    }

    try {
      setProfileLoading(true);
      
      // Essayer d'abord avec auth_id (plus rapide et plus fiable)
      let profileResult = await supabase
        .from('users')
        .select('*')
        .eq('auth_id', user.id)
        .maybeSingle();
      
      // Si pas de résultat avec auth_id, essayer avec email
      if (!profileResult.data && !profileResult.error && user.email) {
        console.log('🔄 [AuthContext] Essai avec email comme fallback...');
        profileResult = await supabase
          .from('users')
          .select('*')
          .eq('email', user.email)
          .maybeSingle();
      }
      
      const { data: profile, error: profileError } = profileResult;
      
      if (profileError) {
        console.warn('⚠️ [AuthContext] Erreur lors du chargement du profil:', profileError.message, {
          email: user.email,
          authId: user.id,
          errorCode: profileError.code,
          errorDetails: profileError.details
        });
        setUserProfile(null);
        return null;
      }
      
      if (!profile) {
        console.warn('⚠️ [AuthContext] Profil utilisateur non trouvé:', {
          email: user.email,
          authId: user.id
        });
        setUserProfile(null);
        return null;
      }
      
      // Log seulement si le profil a vraiment changé (évite les logs dupliqués)
      const profileKey = `${profile.id}-${profile.role}`;
      if (lastLoggedProfileRef.current !== profileKey) {
        console.log('✅ [AuthContext] Profil utilisateur chargé:', { 
          role: profile.role,
          email: profile.email,
          id: profile.id 
        });
        lastLoggedProfileRef.current = profileKey;
      }
      
      console.log('✅ [AuthContext] Profil utilisateur trouvé:', {
        id: profile.id,
        username: profile.username,
        email: profile.email,
        role: profile.role,
        nom: profile.nom,
        prenom: profile.prenom
      });
      
      setUserProfile(profile);
      return profile;
    } catch (error) {
      console.error('❌ [AuthContext] Erreur lors du chargement du profil:', error);
      setUserProfile(null);
      return null;
    } finally {
      setProfileLoading(false);
    }
  }, []);

  // Écouter les changements d'authentification
  useEffect(() => {
    let mounted = true;

    // Récupérer la session initiale (simplifié, sans timeout)
    supabase.auth.getSession()
      .then(({ data: { session }, error }) => {
        if (!mounted) return;

        if (error) {
          console.error('❌ [AuthContext] Erreur lors de la récupération de la session:', error);
          setCurrentUser(null);
          setSession(null);
          setUserProfile(null);
          setIsLoading(false);
          return;
        }

        console.log('📋 [AuthContext] Session récupérée:', {
          hasSession: !!session,
          hasUser: !!session?.user,
          hasToken: !!session?.access_token,
          userId: session?.user?.id,
          email: session?.user?.email
        });

        if (session?.user) {
          setCurrentUser(session.user);
          setSession(session);
          // Le profil sera chargé dans un useEffect séparé
        } else {
          setCurrentUser(null);
          setSession(null);
          setUserProfile(null);
        }
      })
      .catch((error) => {
        if (!mounted) return;
        console.error('❌ [AuthContext] Erreur critique lors de la récupération de la session:', error);
        setCurrentUser(null);
        setSession(null);
        setUserProfile(null);
      })
      .finally(() => {
        if (mounted) {
          console.log('✅ [AuthContext] Initialisation terminée, isLoading = false');
          setIsLoading(false);
        }
      });

    // Écouter les changements d'authentification Supabase
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        console.log('🔄 [AuthContext] Événement auth:', event, {
          hasSession: !!session,
          hasUser: !!session?.user,
          hasToken: !!session?.access_token
        });
        
        try {
          if (event === 'TOKEN_REFRESHED' && session?.user) {
            console.log('🔄 [AuthContext] Token rafraîchi');
            setSession(session);
            setIsLoading(false);
            return;
          }
          
          if (event === 'SIGNED_OUT') {
            console.log('👋 [AuthContext] Utilisateur déconnecté');
            setCurrentUser(null);
            setSession(null);
            setUserProfile(null);
            setIsLoading(false);
            return;
          }
          
          if (session?.user) {
            setCurrentUser(session.user);
            setSession(session);
            // Le profil sera chargé dans un useEffect séparé
          } else {
            console.log('ℹ️ [AuthContext] Session invalide ou expirée');
            setCurrentUser(null);
            setSession(null);
            setUserProfile(null);
          }
        } catch (error) {
          console.error('❌ [AuthContext] Erreur lors de la mise à jour de la session:', error);
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
  }, []);

  // Charger le profil utilisateur quand l'utilisateur change (séparé pour éviter les blocages)
  useEffect(() => {
    // Ne pas charger le profil tant que la session initiale est en cours
    if (isLoading) {
      return;
    }

    // Aucun utilisateur connecté → réinitialiser le profil et sortir
    if (!currentUser) {
      setUserProfile(null);
      return;
    }

    // Si le profil est déjà présent sur l'utilisateur courant, synchroniser et éviter un nouvel appel
    if (currentUser.profile) {
      setUserProfile((prev) => {
        if (prev?.id === currentUser.profile.id) {
          return prev;
        }
        return currentUser.profile;
      });
      setProfileCacheAt((prev) =>
        currentUser.profile ? Date.now() : prev
      );
      return;
    }

    // Si un profil déjà chargé correspond à l'utilisateur courant, attacher au currentUser sans rechargement
    if (userProfile && userProfile.auth_id === currentUser.id) {
      setCurrentUser((prev) => {
        if (!prev || prev.id !== currentUser.id) {
          return prev;
        }
        if (prev.profile?.id === userProfile.id) {
          return prev;
        }
        return { ...prev, profile: userProfile };
      });
      return;
    }

    // Sinon, charger le profil (avec un léger délai pour regrouper les changements)
    const timeoutId = setTimeout(() => {
      loadUserProfile(currentUser).then((profile) => {
        if (!profile) {
          return;
        }

        setCurrentUser((prev) => {
          if (!prev || prev.id !== currentUser.id) {
            return prev;
          }
          if (prev.profile?.id === profile.id) {
            return prev;
          }
          return { ...prev, profile };
        });
        setProfileCacheAt(Date.now());
      });
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [currentUser?.id, currentUser?.profile, isLoading, loadUserProfile, userProfile]);

  // Fonction de connexion avec Supabase Auth (utilise maintenant username)
  const login = async (username, password) => {
    try {
      setIsLoading(true);
      const { data, error } = await signIn(username, password);
      
      if (error) {
        return { success: false, error: error.message };
      }
         // Vérifier si l'utilisateur utilise un mot de passe temporaire
         const isTemporaryPassword = password === 'temp123456';
      
         return { 
           success: true, 
           user: data.user,
           isTemporaryPassword: isTemporaryPassword
         };
         
      
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

  // Vérifier les rôles (utilise le cache du profil ou les métadonnées utilisateur)
  const hasRole = (role) => {
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
  };

  const hasAnyRole = (roles) => {
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
  };

  // Obtenir les informations utilisateur (avec cache)
  const getUserProfile = async (forceRefresh = false) => {
    if (!currentUser) {
      return null;
    }
    
    if (userProfile && !forceRefresh) {
      const now = Date.now();
      if (now - profileCacheAt < 5 * 60 * 1000) {
        return userProfile;
      }
      return userProfile;
    }
    
    // Éviter les requêtes multiples simultanées
    if (profileLoading) {
      // Attendre un peu et retourner le cache
      await new Promise(resolve => setTimeout(resolve, 100));
      return userProfile;
    }
    
    try {
      setProfileLoading(true);
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', currentUser.email)
        .maybeSingle();
      
      if (error) {
        console.error('Erreur lors de la récupération du profil:', error);
        return userProfile; // Retourner le cache en cas d'erreur
      }
      
      // Mettre à jour le cache
      setUserProfile(data);
      setProfileCacheAt(Date.now());
      return data;
    } catch (error) {
      console.error('Erreur générale lors de la récupération du profil:', error);
      return userProfile; // Retourner le cache en cas d'erreur
    } finally {
      setProfileLoading(false);
    }
  };

  // Vérifier si l'utilisateur est authentifié
  const isAuthenticated = () => {
    return !!currentUser && !!session;
  };

  // Obtenir le token d'accès
  const getAccessToken = () => {
    if (!session?.access_token) {
      console.warn('⚠️ [AuthContext] Aucun token d\'accès disponible');
      return null;
    }
    
    // Vérifier si le token est expiré (optionnel)
    if (session.expires_at && Date.now() / 1000 >= session.expires_at) {
      console.warn('⚠️ [AuthContext] Token expiré');
      return null;
    }
    
    console.log('✅ [AuthContext] Token d\'accès disponible:', {
      hasToken: !!session.access_token,
      expiresAt: session.expires_at ? new Date(session.expires_at * 1000).toISOString() : 'N/A'
    });
    
    return session.access_token;
  };

  const value = {
    currentUser,
    session,
    userProfile,
    login,
    logout,
    register,
    hasRole,
    hasAnyRole,
    getUserProfile,
    isAuthenticated,
    getAccessToken,
    isLoading,
    profileLoading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

