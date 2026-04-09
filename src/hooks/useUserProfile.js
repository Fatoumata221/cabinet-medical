import { useAuth } from '../contexts/AuthContext';

/**
 * Hook personnalisé pour accéder au profil utilisateur de manière optimisée
 * Utilise le cache du contexte d'authentification pour éviter les requêtes répétées
 */
export const useUserProfile = () => {
  const { userProfile, getUserProfile, profileLoading, currentUser } = useAuth();

  // Fonction pour obtenir le profil (utilise le cache par défaut)
  const getProfile = async (forceRefresh = false) => {
    return await getUserProfile(forceRefresh);
  };

  // Fonction pour vérifier un rôle spécifique
  const hasRole = (role) => {
    if (!userProfile) return false;
    return userProfile.role === role;
  };

  // Fonction pour vérifier plusieurs rôles
  const hasAnyRole = (roles) => {
    if (!userProfile) return false;
    return roles.includes(userProfile.role);
  };

  // Informations de base du profil
  const profileInfo = {
    id: userProfile?.id,
    nom: userProfile?.nom,
    prenom: userProfile?.prenom,
    email: userProfile?.email,
    role: userProfile?.role,
    specialite: userProfile?.specialite,
    telephone: userProfile?.telephone,
    actif: userProfile?.actif
  };

  return {
    // Données du profil
    profile: userProfile,
    profileInfo,
    
    // États de chargement
    isLoading: profileLoading,
    isLoaded: !!userProfile,
    
    // Fonctions utilitaires
    getProfile,
    hasRole,
    hasAnyRole,
    
    // Informations d'authentification
    isAuthenticated: !!currentUser,
    userId: currentUser?.id
  };
};

export default useUserProfile;
