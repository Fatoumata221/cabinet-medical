import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import Sidebar from './Sidebar';
import Header from './Header';

const Layout = ({ children }) => {
  const { currentUser, userProfile, profileLoading } = useAuth();

  // Si pas d'utilisateur connecté, ne pas afficher le layout
  if (!currentUser) {
    return null;
  }

  // Éviter un refus d'accès prématuré si le profil (et donc le rôle) n'est pas encore chargé
  if (profileLoading && !userProfile?.role) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-medical-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement du profil...</p>
        </div>
      </div>
    );
  }

  // Vérifier si l'utilisateur a un rôle valide
  const userRole = userProfile?.role || currentUser.user_metadata?.role || currentUser.app_metadata?.role;
  if (!userRole || !['admin', 'doctor', 'secretary', 'accounting', 'caissier'].includes(userRole)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">⚠️</span>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Accès non autorisé</h2>
          <p className="text-gray-600">Votre compte n'a pas les permissions nécessaires.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;

