import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Shield, ArrowLeft, Home } from 'lucide-react';
import { ROLES, getRoleDisplayName } from '../utils/permissions';

const AccessDenied = ({ requiredRole, currentRole }) => {
  const navigate = useNavigate();
  const { hasRole } = useAuth();

  const getHomePath = () => {
    if (hasRole(ROLES.ADMIN)) return '/admin';
    if (hasRole(ROLES.DOCTOR)) return '/doctor';
    if (hasRole(ROLES.SECRETARY)) return '/secretary';
    return '/dashboard';
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Shield className="w-8 h-8 text-red-600" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Accès refusé
        </h1>
        
        <p className="text-gray-600 mb-6">
          Vous n'avez pas les permissions nécessaires pour accéder à cette page.
        </p>
        
        {requiredRole && currentRole && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-600">
              <span className="font-medium">Rôle requis :</span> {getRoleDisplayName(requiredRole)}
            </p>
            <p className="text-sm text-gray-600">
              <span className="font-medium">Votre rôle :</span> {getRoleDisplayName(currentRole)}
            </p>
          </div>
        )}
        
        <div className="space-y-3">
          <button
            onClick={() => navigate(getHomePath())}
            className="w-full bg-medical-primary hover:bg-medical-primary/90 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
          >
            <Home size={20} />
            <span>Retour à l'accueil</span>
          </button>
          
          <button
            onClick={() => navigate(-1)}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
          >
            <ArrowLeft size={20} />
            <span>Page précédente</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AccessDenied;
