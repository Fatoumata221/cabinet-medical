import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';

const RoleGuard = ({ children, allowedRoles = [], fallbackPath = '/dashboard' }) => {
  const { currentUser, hasRole, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-medical-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Vérification des permissions...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // Si des rôles sont spécifiés, vérifier les permissions
  if (allowedRoles.length > 0) {
    const userRole = currentUser.user_metadata?.role || currentUser.app_metadata?.role;
    
    if (!userRole || !allowedRoles.includes(userRole)) {
      // Rediriger selon le rôle de l'utilisateur
      if (hasRole('admin')) {
        return <Navigate to="/admin" replace />;
      } else if (hasRole('doctor')) {
        return <Navigate to="/doctor" replace />;
      } else if (hasRole('secretary')) {
        return <Navigate to="/secretary" replace />;
      } else if (hasRole('accounting')) {
        return <Navigate to="/accounting" replace />;
      } else {
        return <Navigate to={fallbackPath} replace />;
      }
    }
  }

  return children;
};

export default RoleGuard;
