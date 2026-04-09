import React, { memo, useMemo } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/OptimizedAuthContext';

/**
 * Composant de protection des routes optimisé avec cache intelligent
 * @param {Object} props - Les propriétés du composant
 * @param {React.ReactNode} props.children - Les composants enfants à protéger
 * @param {string|Array} props.allowedRoles - Rôle(s) autorisé(s) à accéder à cette route
 * @param {string} props.fallbackPath - Chemin de redirection si l'accès est refusé
 * @param {boolean} props.requireProfile - Si true, attend le chargement du profil
 * @returns {React.ReactNode} Le composant protégé ou une redirection
 */
const OptimizedProtectedRoute = memo(({ 
  children, 
  allowedRoles, 
  fallbackPath = '/dashboard',
  requireProfile = false
}) => {
  const { 
    currentUser, 
    userProfile, 
    hasRole, 
    hasAnyRole, 
    isAuthenticated, 
    isLoading, 
    profileLoading 
  } = useAuth();
  
  const location = useLocation();

  // Mémoriser la vérification des rôles pour éviter les recalculs
  const accessCheck = useMemo(() => {
    // Si aucun rôle spécifique n'est requis, autoriser l'accès
    if (!allowedRoles || (Array.isArray(allowedRoles) && allowedRoles.length === 0)) {
      return { hasAccess: true, roles: [] };
    }

    // Convertir allowedRoles en tableau si c'est une chaîne
    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

    // Vérifier si l'utilisateur a l'un des rôles autorisés
    const hasAccess = roles.some(role => hasRole(role));

    return { hasAccess, roles };
  }, [allowedRoles, hasRole]);

  // Afficher un loader optimisé pendant le chargement initial
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-700 font-medium">Vérification des permissions...</p>
          <p className="text-gray-500 text-sm mt-1">Optimisation en cours</p>
        </div>
      </div>
    );
  }

  // Rediriger vers la page de connexion si non authentifié
  if (!isAuthenticated() || !currentUser) {
    console.warn('🚫 Accès refusé: utilisateur non authentifié');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Si requireProfile est true et que le profil est en cours de chargement
  if (requireProfile && profileLoading && !userProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="animate-pulse">
            <div className="h-8 w-8 bg-blue-600 rounded-full mx-auto mb-4"></div>
          </div>
          <p className="text-gray-700 font-medium">Chargement du profil...</p>
          <p className="text-gray-500 text-sm mt-1">Cache optimisé</p>
        </div>
      </div>
    );
  }

  // Vérifier l'accès basé sur les rôles (utilise le cache)
  if (!accessCheck.hasAccess) {
    const currentRole = userProfile?.role || 
                       currentUser.user_metadata?.role || 
                       currentUser.app_metadata?.role || 
                       'non défini';
    
    console.warn(`🚫 Accès refusé: rôle requis ${accessCheck.roles.join(' ou ')}, rôle actuel: ${currentRole}`);
    
    // Rediriger vers la page de fallback ou le dashboard
    return <Navigate to={fallbackPath} replace />;
  }

  // Log de succès pour debug (utilise le cache du profil)
  const currentRole = userProfile?.role || 
                     currentUser.user_metadata?.role || 
                     currentUser.app_metadata?.role;
  
  if (process.env.NODE_ENV === 'development') {
    console.log(`✅ Accès autorisé (cache) pour ${currentUser.email} avec le rôle: ${currentRole}`);
  }

  return children;
});

OptimizedProtectedRoute.displayName = 'OptimizedProtectedRoute';

export default OptimizedProtectedRoute;
