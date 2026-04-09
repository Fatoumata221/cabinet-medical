import React, { useRef, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getRoleDisplayName } from '../utils/permissions';

/**
 * Composant de protection des routes basé sur les rôles
 * @param {Object} props - Les propriétés du composant
 * @param {React.ReactNode} props.children - Les composants enfants à protéger
 * @param {string|Array} props.allowedRoles - Rôle(s) autorisé(s) à accéder à cette route
 * @param {string} props.fallbackPath - Chemin de redirection si l'accès est refusé
 * @returns {React.ReactNode} Le composant protégé ou une redirection
 */
const ProtectedRoute = ({ 
  children, 
  allowedRoles, 
  fallbackPath = '/dashboard' 
}) => {
  const { currentUser, userProfile, hasRole, isAuthenticated, isLoading, profileLoading } = useAuth();
  const location = useLocation();
  const lastLoggedPath = useRef(null);
  const lastLoggedRole = useRef(null);

  // Calculer les valeurs nécessaires avant les returns conditionnels
  const currentRole = currentUser 
    ? (userProfile?.role || currentUser.profile?.role || currentUser.user_metadata?.role || currentUser.app_metadata?.role)
    : null;
  const roleDisplayName = currentRole ? getRoleDisplayName(currentRole) : 'non défini';
  
  // Convertir allowedRoles en tableau si c'est une chaîne
  const roles = allowedRoles 
    ? (Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles])
    : [];

  // Logging pour débogage
  console.log('🔍 [ProtectedRoute] Vérification accès:', {
    allowedRoles,
    currentRole,
    userProfile: userProfile?.role,
    userMetadataRole: currentUser?.user_metadata?.role,
    appMetadataRole: currentUser?.app_metadata?.role,
    hasRole: roles.some(role => hasRole(role))
  });

  // Vérifier si l'utilisateur a l'un des rôles autorisés
  const hasAccess = !allowedRoles || roles.length === 0 || roles.some(role => hasRole(role));

  // Ne logger qu'une fois par changement de route ou de rôle
  // IMPORTANT: Tous les hooks doivent être appelés avant les returns conditionnels
  useEffect(() => {
    // Ne logger que si l'utilisateur est authentifié et a accès
    if (isAuthenticated && currentUser && hasAccess && currentRole) {
      const pathKey = `${location.pathname}-${currentRole}`;
      if (lastLoggedPath.current !== pathKey || lastLoggedRole.current !== currentRole) {
        console.log(`✅ Accès autorisé pour ${currentUser.email} avec le rôle: ${roleDisplayName} (${currentRole})`);
        lastLoggedPath.current = pathKey;
        lastLoggedRole.current = currentRole;
      }
    }
  }, [location.pathname, currentRole, currentUser?.email, roleDisplayName, isAuthenticated, hasAccess]);

  // Afficher un loader pendant le chargement initial seulement
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-700">Chargement...</p>
        </div>
      </div>
    );
  }

  // Éviter un refus d'accès prématuré tant que le profil (et donc le rôle) n'est pas encore chargé
  if (allowedRoles && profileLoading && !userProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="animate-pulse">
            <div className="h-8 w-8 bg-blue-600 rounded-full mx-auto mb-4"></div>
          </div>
          <p className="text-gray-700">Chargement du profil...</p>
        </div>
      </div>
    );
  }

  // Rediriger vers la page de connexion si non authentifié
  if (!isAuthenticated || !currentUser) {
    console.warn('🚫 Accès refusé: utilisateur non authentifié');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Si aucun rôle spécifique n'est requis, autoriser l'accès
  if (!allowedRoles || roles.length === 0) {
    return children;
  }

  if (!hasAccess) {
    const roleForLog = currentRole || 'non défini';
    console.warn(`🚫 Accès refusé: rôle requis ${roles.join(' ou ')}, rôle actuel: ${roleForLog}`);
    
    // Rediriger vers la page de fallback ou le dashboard
    return <Navigate to={fallbackPath} replace />;
  }

  return children;
};

export default ProtectedRoute;
