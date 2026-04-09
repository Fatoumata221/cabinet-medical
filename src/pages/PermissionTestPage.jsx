import React from 'react';
import Layout from '../components/Layout';
import PermissionTest from '../components/PermissionTest';

/**
 * Page de test des permissions
 * Accessible uniquement en développement
 */
const PermissionTestPage = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Test des Permissions</h1>
          <p className="text-gray-600 mt-2">
            Cette page permet de tester et vérifier le système de permissions
          </p>
        </div>
      </div>

      <PermissionTest />
    </div>
  );
};

export default PermissionTestPage;
