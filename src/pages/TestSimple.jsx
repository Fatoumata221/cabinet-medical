import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const TestSimple = () => {
  const { currentUser, userProfile, isLoading } = useAuth();

  if (isLoading) {
    return <div className="p-4">Chargement...</div>;
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Test Simple</h1>
      <div className="space-y-2">
        <p><strong>Utilisateur connecté:</strong> {currentUser ? 'Oui' : 'Non'}</p>
        <p><strong>Email:</strong> {currentUser?.email || 'N/A'}</p>
        <p><strong>Profil chargé:</strong> {userProfile ? 'Oui' : 'Non'}</p>
        <p><strong>Rôle:</strong> {userProfile?.role || currentUser?.user_metadata?.role || 'N/A'}</p>
        <p><strong>Nom:</strong> {userProfile?.nom || 'N/A'}</p>
        <p><strong>Prénom:</strong> {userProfile?.prenom || 'N/A'}</p>
      </div>
      
      <div className="mt-4 p-4 bg-gray-100 rounded">
        <h3 className="font-bold">Debug Info:</h3>
        <pre className="text-xs mt-2">
          {JSON.stringify({ 
            hasCurrentUser: !!currentUser,
            hasProfile: !!userProfile,
            isLoading,
            userEmail: currentUser?.email,
            profileRole: userProfile?.role
          }, null, 2)}
        </pre>
      </div>
    </div>
  );
};

export default TestSimple;
