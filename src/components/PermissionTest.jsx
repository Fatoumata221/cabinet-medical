import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ROLES, PERMISSIONS, hasPermission, getRoleDisplayName, getRoleColor } from '../utils/permissions';
import { Shield, Check, X, User, Settings, FileText, Coins, BarChart3 } from 'lucide-react';

/**
 * Composant de test pour vérifier les permissions
 * À utiliser uniquement en développement
 */
const PermissionTest = () => {
  const { currentUser, hasRole } = useAuth();

  if (!currentUser) {
    return (
      <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-yellow-800">Aucun utilisateur connecté</p>
      </div>
    );
  }

  const userRole = currentUser.user_metadata?.role || currentUser.app_metadata?.role || 'non défini';
  const userPermissions = PERMISSIONS[userRole] || {};

  const testPermissions = [
    { key: 'canViewDashboard', label: 'Voir le Dashboard', icon: User },
    { key: 'canManageAppointments', label: 'Gérer les Rendez-vous', icon: Settings },
    { key: 'canManagePatients', label: 'Gérer les Patients', icon: User },
    { key: 'canManageConsultations', label: 'Gérer les Consultations', icon: FileText },
    { key: 'canManageBilling', label: 'Gérer la Facturation', icon: Coins },
    { key: 'canViewReports', label: 'Voir les Rapports', icon: BarChart3 },
    { key: 'canManageSettings', label: 'Gérer les Paramètres', icon: Settings },
    { key: 'canManageUsers', label: 'Gérer les Utilisateurs', icon: User },
    { key: 'canManageSecurity', label: 'Gérer la Sécurité', icon: Shield },
  ];

  return (
    <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="flex items-center space-x-3 mb-6">
        <Shield className="w-6 h-6 text-blue-600" />
        <h2 className="text-xl font-bold text-gray-900">Test des Permissions</h2>
      </div>

      {/* Informations utilisateur */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-medium text-gray-900 mb-2">Informations utilisateur</h3>
        <div className="space-y-1 text-sm">
          <p><span className="font-medium">Email:</span> {currentUser.email}</p>
          <p><span className="font-medium">Rôle:</span> 
            <span className={`ml-2 ${getRoleColor(userRole)}`}>
              {getRoleDisplayName(userRole)}
            </span>
          </p>
          <p><span className="font-medium">Rôle brut:</span> {userRole}</p>
        </div>
      </div>

      {/* Test des rôles */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-medium text-gray-900 mb-3">Test des rôles</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {Object.values(ROLES).map(role => (
            <div key={role} className="flex items-center space-x-2">
              {hasRole(role) ? (
                <Check className="w-4 h-4 text-green-600" />
              ) : (
                <X className="w-4 h-4 text-red-600" />
              )}
              <span className="text-sm">{getRoleDisplayName(role)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Test des permissions */}
      <div className="p-4 bg-gray-50 rounded-lg">
        <h3 className="font-medium text-gray-900 mb-3">Test des permissions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {testPermissions.map(permission => {
            const hasAccess = hasPermission(userRole, permission.key);
            const Icon = permission.icon;
            
            return (
              <div key={permission.key} className="flex items-center space-x-3 p-2 bg-white rounded border">
                <Icon className="w-4 h-4 text-gray-600" />
                <span className="text-sm flex-1">{permission.label}</span>
                {hasAccess ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <X className="w-4 h-4 text-red-600" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Debug des permissions brutes */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-medium text-blue-900 mb-2">Debug - Permissions brutes</h3>
        <pre className="text-xs text-blue-800 overflow-auto">
          {JSON.stringify(userPermissions, null, 2)}
        </pre>
      </div>
    </div>
  );
};

export default PermissionTest;
