# 🔐 Implémentation de la Sécurité des Rôles

## 🎯 **Vue d'ensemble**

La sécurité des rôles a été entièrement remise en place avec un système de permissions granulaire basé sur trois rôles principaux :

- **👑 Admin** : Accès complet au système
- **👨‍⚕️ Médecin** : Accès aux consultations et dossiers patients
- **👩‍💼 Secrétaire** : Accès à la gestion des rendez-vous et facturation

## 🏗️ **Architecture de Sécurité**

### 1. **Système d'Authentification**

```javascript
// src/contexts/AuthContext.jsx
const hasRole = (role) => {
  if (!currentUser) return false;
  const userRole = currentUser.user_metadata?.role || currentUser.app_metadata?.role;
  return userRole === role;
};

const hasAnyRole = (roles) => {
  if (!currentUser) return false;
  const userRole = currentUser.user_metadata?.role || currentUser.app_metadata?.role;
  return roles.includes(userRole);
};
```

### 2. **Protection des Routes**

```javascript
// src/App.jsx - Composant ProtectedRoute
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { currentUser, isLoading, hasAnyRole } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0) {
    const userRole = currentUser.user_metadata?.role || currentUser.app_metadata?.role;
    
    if (!userRole || !allowedRoles.includes(userRole)) {
      return <AccessDenied requiredRole={allowedRoles.join(' ou ')} currentRole={userRole} />;
    }
  }

  return children;
};
```

### 3. **Protection du Sidebar**

```javascript
// src/components/Sidebar.jsx
const getCurrentRole = () => {
  if (hasRole('admin')) return 'admin';
  if (hasRole('doctor')) return 'medecin';
  if (hasRole('secretary')) return 'secretaire';
  return null; // Pas de rôle par défaut pour la sécurité
};

// Si pas de rôle valide, ne pas afficher le sidebar
if (!currentRole) {
  return null;
}
```

## 📋 **Permissions par Rôle**

### 👑 **Administrateur (admin)**
- ✅ **Accès complet** à toutes les fonctionnalités
- ✅ **Gestion des utilisateurs** et paramètres système
- ✅ **Paramétrage médical** complet
- ✅ **Reporting** et statistiques
- ✅ **Administration** du cabinet

**Routes accessibles :**
- `/admin` - Dashboard administrateur
- `/users` - Gestion des utilisateurs
- `/parametrage/*` - Tous les paramètres
- `/administration/*` - Administration
- `/reporting` - Reporting
- `/statistics` - Statistiques
- `/security` - Sécurité

### 👨‍⚕️ **Médecin (doctor)**
- ✅ **Consultations** et dossiers patients
- ✅ **Prescriptions** et examens médicaux
- ✅ **Dossiers médicaux** personnels
- ✅ **File d'attente** personnelle
- ❌ **Pas d'accès** à la facturation
- ❌ **Pas d'accès** aux paramètres

**Routes accessibles :**
- `/doctor` - Dashboard médecin
- `/my-waiting-queue` - Ma file d'attente
- `/consultations` - Consultations
- `/medical-records` - Dossiers médicaux
- `/prescriptions` - Prescriptions
- `/examen-medical` - Examens médicaux
- `/prescription` - Prescription
- `/actes` - Actes médicaux
- `/bcds` - BCDS

### 👩‍💼 **Secrétaire (secretary)**
- ✅ **Gestion des rendez-vous** et planning
- ✅ **File d'attente** générale
- ✅ **Facturation** et actes
- ✅ **Introduction de patients**
- ✅ **Gestion des patients**
- ❌ **Pas d'accès** aux consultations médicales
- ❌ **Pas d'accès** aux paramètres

**Routes accessibles :**
- `/secretary` - Dashboard secrétaire
- `/waiting-queue` - File d'attente
- `/appointments` - Calendrier
- `/patients` - Patients
- `/introduction-patient` - Introduction patient
- `/fiche-identification` - Fiche identification
- `/facturation/*` - Toutes les pages de facturation
- `/rendez-vous/*` - Gestion des rendez-vous

## 🚀 **Fonctionnalités de Sécurité**

### 1. **Redirection Intelligente**

```javascript
// Redirection automatique selon le rôle après connexion
const handleSubmit = async (e) => {
  const result = await login(email, password);
  
  if (result.success) {
    if (hasRole('admin')) {
      navigate('/admin');
    } else if (hasRole('doctor')) {
      navigate('/doctor');
    } else if (hasRole('secretary')) {
      navigate('/secretary');
    } else {
      navigate('/dashboard');
    }
  }
};
```

### 2. **Dashboard Intelligent**

```javascript
// src/App.jsx - SmartDashboard
const SmartDashboard = () => {
  const { hasRole } = useAuth();
  
  if (hasRole('admin')) {
    return <Dashboard />;
  } else if (hasRole('doctor')) {
    return <Navigate to="/my-waiting-queue" replace />;
  } else if (hasRole('secretary')) {
    return <Navigate to="/waiting-queue" replace />;
  } else {
    return <Dashboard />;
  }
};
```

### 3. **Page d'Accès Refusé**

```javascript
// src/components/AccessDenied.jsx
const AccessDenied = ({ requiredRole, currentRole }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Accès refusé</h1>
        <p className="text-gray-600 mb-6">
          Vous n'avez pas les permissions nécessaires pour accéder à cette page.
        </p>
        {/* Affichage des rôles requis et actuels */}
      </div>
    </div>
  );
};
```

## 🔧 **Configuration des Rôles**

### 1. **Données Mockées**

```javascript
// src/data/mockData.js
export const users = [
  {
    id: 1,
    email: 'secretaire@cabinet.com',
    role: 'secretaire',
    // ...
  },
  {
    id: 2,
    email: 'dr.martin@cabinet.com',
    role: 'medecin',
    // ...
  },
  {
    id: 4,
    email: 'admin@cabinet.com',
    role: 'admin',
    // ...
  }
];
```

### 2. **Types TypeScript**

```typescript
// src/types/database.ts
export interface User {
  id: number
  email: string
  role: 'secretary' | 'doctor' | 'admin'
  nom?: string
  prenom?: string
  specialite?: string
  created_at: string
  updated_at: string
}
```

## 🛡️ **Sécurité Avancée**

### 1. **Vérification au Niveau du Layout**

```javascript
// src/components/Layout.jsx
const Layout = ({ children }) => {
  const { currentUser } = useAuth();

  // Si pas d'utilisateur connecté, ne pas afficher le layout
  if (!currentUser) {
    return null;
  }

  // Vérifier si l'utilisateur a un rôle valide
  const userRole = currentUser.user_metadata?.role || currentUser.app_metadata?.role;
  if (!userRole || !['admin', 'doctor', 'secretary'].includes(userRole)) {
    return <AccessDenied />;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      {/* ... */}
    </div>
  );
};
```

### 2. **Protection du Sidebar**

Le sidebar ne s'affiche que si l'utilisateur a un rôle valide et affiche uniquement les modules correspondant à son rôle.

### 3. **Composant RoleGuard**

```javascript
// src/components/RoleGuard.jsx
const RoleGuard = ({ children, allowedRoles = [], fallbackPath = '/dashboard' }) => {
  const { currentUser, hasRole, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0) {
    const userRole = currentUser.user_metadata?.role || currentUser.app_metadata?.role;
    
    if (!userRole || !allowedRoles.includes(userRole)) {
      // Redirection intelligente selon le rôle
      if (hasRole('admin')) return <Navigate to="/admin" replace />;
      if (hasRole('doctor')) return <Navigate to="/doctor" replace />;
      if (hasRole('secretary')) return <Navigate to="/secretary" replace />;
      return <Navigate to={fallbackPath} replace />;
    }
  }

  return children;
};
```

## 🧪 **Tests de Sécurité**

### 1. **Comptes de Test**

```javascript
// Comptes de démonstration
const testAccounts = {
  admin: {
    email: 'admin@cabinet.com',
    password: 'password',
    role: 'admin'
  },
  doctor: {
    email: 'dr.martin@cabinet.com',
    password: 'password',
    role: 'doctor'
  },
  secretary: {
    email: 'secretaire@cabinet.com',
    password: 'password',
    role: 'secretary'
  }
};
```

### 2. **Scénarios de Test**

1. **Connexion avec chaque rôle** → Vérifier la redirection correcte
2. **Accès à une page non autorisée** → Vérifier l'affichage d'AccessDenied
3. **Navigation dans le sidebar** → Vérifier l'affichage des modules appropriés
4. **Déconnexion** → Vérifier la redirection vers /login

## 📝 **Maintenance et Évolution**

### 1. **Ajout d'un Nouveau Rôle**

1. Ajouter le rôle dans `src/types/database.ts`
2. Mettre à jour `src/data/mockData.js`
3. Ajouter les permissions dans `src/App.jsx`
4. Mettre à jour `src/components/Sidebar.jsx`
5. Tester les redirections

### 2. **Modification des Permissions**

1. Modifier les `allowedRoles` dans les routes appropriées
2. Mettre à jour la documentation
3. Tester les accès

### 3. **Audit de Sécurité**

- Vérifier régulièrement les permissions
- Tester les accès non autorisés
- Surveiller les tentatives d'accès
- Maintenir les logs de sécurité

## ✅ **Validation de la Sécurité**

La sécurité des rôles est maintenant entièrement fonctionnelle avec :

- ✅ **Authentification obligatoire** pour toutes les routes protégées
- ✅ **Vérification des rôles** à chaque accès
- ✅ **Redirection intelligente** selon le rôle
- ✅ **Interface adaptée** selon les permissions
- ✅ **Messages d'erreur clairs** pour les accès refusés
- ✅ **Protection du sidebar** et du layout
- ✅ **Séparation claire** des responsabilités par rôle

Cette implémentation garantit une sécurité robuste et une expérience utilisateur optimale selon le rôle de chaque utilisateur.
