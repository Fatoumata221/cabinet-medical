import React from 'react';
import { SimpleAuthProvider, useSimpleAuth } from '../contexts/SimpleAuthContext';

const TestAuthContent = () => {
  const { currentUser, isLoading, isAuthenticated } = useSimpleAuth();

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <p>Chargement de l'authentification...</p>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Test d'Authentification Simple</h1>
      
      <div className="bg-white shadow-md rounded-lg p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <strong>Statut:</strong>
            <span className={`ml-2 px-2 py-1 rounded text-sm ${
              isAuthenticated ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {isAuthenticated ? 'Connecté' : 'Non connecté'}
            </span>
          </div>
          
          <div>
            <strong>Chargement:</strong>
            <span className={`ml-2 px-2 py-1 rounded text-sm ${
              isLoading ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
            }`}>
              {isLoading ? 'En cours' : 'Terminé'}
            </span>
          </div>
        </div>

        {currentUser && (
          <div className="mt-4">
            <h3 className="text-lg font-semibold mb-2">Informations utilisateur:</h3>
            <div className="bg-gray-50 p-4 rounded space-y-2">
              <p><strong>ID:</strong> {currentUser.id}</p>
              <p><strong>Email:</strong> {currentUser.email}</p>
              <p><strong>Créé le:</strong> {new Date(currentUser.created_at).toLocaleString()}</p>
              <p><strong>Dernière connexion:</strong> {new Date(currentUser.last_sign_in_at).toLocaleString()}</p>
            </div>
          </div>
        )}

        {!currentUser && !isLoading && (
          <div className="mt-4 p-4 bg-blue-50 rounded">
            <p className="text-blue-800">
              Aucun utilisateur connecté. 
              <a href="/login" className="underline ml-1">Se connecter</a>
            </p>
          </div>
        )}
      </div>

      <div className="mt-6 text-center">
        <a 
          href="/login" 
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded mr-4"
        >
          Page de connexion
        </a>
        <a 
          href="/dashboard" 
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
        >
          Dashboard
        </a>
      </div>
    </div>
  );
};

const TestAuth = () => {
  return (
    <SimpleAuthProvider>
      <TestAuthContent />
    </SimpleAuthProvider>
  );
};

export default TestAuth;
