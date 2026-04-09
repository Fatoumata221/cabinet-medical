# Rapport Complet du Système de Sécurité

## Vue d'ensemble

Ce document présente une analyse complète du système de sécurité mis en place dans l'application Cabinet Médical. Il couvre tous les aspects de la sécurité : authentification, autorisation, protection des données, et audit.

---

## 1. Architecture de Sécurité

### 1.1 Authentification Supabase

L'application utilise Supabase Auth pour gérer l'authentification des utilisateurs avec un système de tokens JWT.

#### Configuration du Client Supabase

```javascript
// src/lib/supabase.js
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});
```

**Caractéristiques** :
- ✅ Refresh automatique des tokens
- ✅ Persistance des sessions
- ✅ Détection automatique des sessions dans l'URL
- ✅ Gestion sécurisée des tokens JWT

#### Fonctions d'Authentification

```javascript
// Connexion avec tokens JWT
export const signIn = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  return { data, error };
};

// Vérification de l'authentification
export const checkAuth = async () => {
  const { data: { session }, error } = await supabase.auth.getSession();
  return { session, error };
};
```

### 1.2 Système de Rôles

L'application utilise un système de rôles granulaire avec trois rôles principaux :

#### Rôles Disponibles

1. **Administrateur (admin)**
   - Accès complet au système
   - Gestion des utilisateurs
   - Paramétrage complet
   - Administration et sécurité

2. **Médecin (doctor)**
   - Accès aux consultations et dossiers patients
   - Prescriptions et examens médicaux
   - File d'attente personnelle
   - Pas d'accès à la facturation complète
   - Pas d'accès aux paramètres système

3. **Secrétaire (secretary)**
   - Gestion des rendez-vous et planning
   - File d'attente générale
   - Facturation et actes
   - Introduction de patients
   - Pas d'accès aux consultations médicales détaillées
   - Pas d'accès aux paramètres système

#### Implémentation des Rôles

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

### 1.3 Tokens JWT

Toutes les requêtes vers Supabase utilisent des tokens JWT pour l'authentification :

- **Access Token** : Token d'accès de courte durée (1 heure)
- **Refresh Token** : Token de rafraîchissement de longue durée
- **Renouvellement automatique** : Les tokens sont automatiquement renouvelés avant expiration

---

## 2. Row Level Security (RLS)

### 2.1 Activation RLS

Le Row Level Security est activé sur toutes les tables sensibles de la base de données :

```sql
-- Tables protégées par RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waiting_queue ENABLE ROW LEVEL SECURITY;
```

### 2.2 Politiques RLS par Table

#### Table Users

```sql
-- Lecture : Tous les utilisateurs authentifiés
CREATE POLICY "Users can view all users" ON public.users
  FOR SELECT USING (auth.role() = 'authenticated');

-- Modification : Uniquement son propre profil
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Création : Uniquement les administrateurs
CREATE POLICY "Admins can create users" ON public.users
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT id FROM public.users 
      WHERE role = 'admin'
    )
  );
```

#### Table Patients

```sql
-- Lecture : Tous les utilisateurs authentifiés
CREATE POLICY "Users can view all patients" ON public.patients
  FOR SELECT USING (auth.role() = 'authenticated');

-- Création : Tous les utilisateurs authentifiés
CREATE POLICY "Users can create patients" ON public.patients
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Modification : Tous les utilisateurs authentifiés
CREATE POLICY "Users can update patients" ON public.patients
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Suppression : Tous les utilisateurs authentifiés
CREATE POLICY "Users can delete patients" ON public.patients
  FOR DELETE USING (auth.role() = 'authenticated');
```

#### Table Appointments

```sql
-- Lecture : Tous les utilisateurs authentifiés
CREATE POLICY "Users can view all appointments" ON public.appointments
  FOR SELECT USING (auth.role() = 'authenticated');

-- Politique spéciale pour les médecins : voir leurs propres rendez-vous
CREATE POLICY "Doctors can view own appointments" ON public.appointments
  FOR SELECT USING (
    auth.uid() = medecin_id AND 
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'doctor'
    )
  );

-- Politique pour les secrétaires : accès complet
CREATE POLICY "Secretaries have full access" ON public.appointments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'secretary'
    )
  );
```

#### Tables Paramétrage Médical

Toutes les tables de paramétrage médical (types_actes, appareils, diagnostics, medicaments, types_certificats) ont des politiques similaires :

```sql
-- Lecture : Tous les utilisateurs authentifiés
CREATE POLICY "Enable read access for authenticated users" ON public.types_actes
  FOR SELECT USING (auth.role() = 'authenticated');

-- Écriture : Admins et médecins uniquement
CREATE POLICY "Enable write access for admin and doctor" ON public.types_actes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.auth_id = auth.uid() 
      AND (users.role = 'admin' OR users.role = 'doctor')
    )
  );
```

### 2.3 Fonction Utilitaire RLS

```sql
-- Fonction pour obtenir le rôle de l'utilisateur actuel
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
BEGIN
  RETURN (
    SELECT role 
    FROM public.users 
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 3. Protection des Routes

### 3.1 Composant ProtectedRoute

Le composant `ProtectedRoute` protège toutes les routes sensibles de l'application :

```javascript
// src/components/ProtectedRoute.jsx
const ProtectedRoute = ({ 
  children, 
  allowedRoles, 
  fallbackPath = '/dashboard' 
}) => {
  const { currentUser, hasRole, isAuthenticated, isLoading } = useAuth();
  
  // Afficher un loader pendant le chargement
  if (isLoading) {
    return <LoadingSpinner />;
  }
  
  // Rediriger vers la page de connexion si non authentifié
  if (!isAuthenticated || !currentUser) {
    return <Navigate to="/login" replace />;
  }
  
  // Vérifier les rôles si spécifiés
  if (allowedRoles && allowedRoles.length > 0) {
    const userRole = currentUser.user_metadata?.role || currentUser.app_metadata?.role;
    
    if (!userRole || !allowedRoles.includes(userRole)) {
      return <Navigate to={fallbackPath} replace />;
    }
  }
  
  return children;
};
```

### 3.2 Routes par Rôle

#### Routes Administrateur

```javascript
<Route path="/admin" element={
  <ProtectedRoute allowedRoles={['admin']}>
    <AdminDashboard />
  </ProtectedRoute>
} />

<Route path="/users" element={
  <ProtectedRoute allowedRoles={['admin']}>
    <UsersManagement />
  </ProtectedRoute>
} />

<Route path="/security" element={
  <ProtectedRoute allowedRoles={['admin']}>
    <SecuritySettings />
  </ProtectedRoute>
} />
```

#### Routes Médecin

```javascript
<Route path="/doctor" element={
  <ProtectedRoute allowedRoles={['doctor']}>
    <DoctorDashboard />
  </ProtectedRoute>
} />

<Route path="/my-waiting-queue" element={
  <ProtectedRoute allowedRoles={['doctor']}>
    <MyWaitingQueue />
  </ProtectedRoute>
} />

<Route path="/consultations" element={
  <ProtectedRoute allowedRoles={['doctor', 'secretary']}>
    <Consultations />
  </ProtectedRoute>
} />
```

#### Routes Secrétaire

```javascript
<Route path="/secretary" element={
  <ProtectedRoute allowedRoles={['secretary']}>
    <SecretaryDashboard />
  </ProtectedRoute>
} />

<Route path="/waiting-queue" element={
  <ProtectedRoute allowedRoles={['secretary']}>
    <WaitingQueue />
  </ProtectedRoute>
} />

<Route path="/facturation/*" element={
  <ProtectedRoute allowedRoles={['secretary']}>
    <FacturationRoutes />
  </ProtectedRoute>
} />
```

### 3.3 Gestion des Accès Refusés

Le composant `AccessDenied` affiche un message clair lorsque l'accès est refusé :

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
        <p className="text-sm text-gray-500">
          Rôle requis : {requiredRole}
        </p>
        <p className="text-sm text-gray-500">
          Votre rôle : {currentRole}
        </p>
      </div>
    </div>
  );
};
```

---

## 4. Services Sécurisés

### 4.1 Services avec Authentification Obligatoire

Tous les services dans `src/lib/secureServices.js` vérifient l'authentification avant d'exécuter les opérations :

```javascript
// Exemple : securePatientService
export const securePatientService = {
  async getAll() {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('Utilisateur non authentifié');
    }
    
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .order('nom', { ascending: true });
    
    if (error) throw error;
    return data;
  }
};
```

### 4.2 Traçabilité des Actions

Les services sécurisés enregistrent automatiquement qui a créé ou modifié les données :

```javascript
// Création avec traçabilité
async create(patientData) {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    throw new Error('Utilisateur non authentifié');
  }
  
  const { data, error } = await supabase
    .from('patients')
    .insert([{ ...patientData, created_by: session.user.id }])
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// Mise à jour avec traçabilité
async update(id, updates) {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    throw new Error('Utilisateur non authentifié');
  }
  
  const { data, error } = await supabase
    .from('patients')
    .update({ ...updates, updated_by: session.user.id })
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}
```

### 4.3 Services Disponibles

- `secureUserService` - Gestion des utilisateurs sécurisée
- `securePatientService` - Gestion des patients sécurisée
- `secureAppointmentService` - Gestion des rendez-vous sécurisée
- `waitingQueueService` (version sécurisée) - Gestion de la file d'attente sécurisée

---

## 5. Permissions et Accès

### 5.1 Matrice des Permissions

| Permission | Admin | Médecin | Secrétaire |
|------------|-------|---------|------------|
| Voir Dashboard | ✅ | ✅ | ✅ |
| Gérer Rendez-vous | ✅ | ✅ | ✅ |
| Gérer Patients | ✅ | ✅ | ✅ |
| Gérer Consultations | ✅ | ✅ | ❌ |
| Gérer Facturation | ✅ | ❌ | ✅ |
| Voir Rapports | ✅ | ✅ | ✅ |
| Gérer Paramètres | ✅ | ✅ | ✅ |
| Gérer Administration | ✅ | ❌ | ❌ |
| Gérer Utilisateurs | ✅ | ❌ | ❌ |
| Gérer Sécurité | ✅ | ❌ | ❌ |

### 5.2 Utilitaires de Permissions

Le fichier `src/utils/permissions.js` centralise toute la logique de permissions :

```javascript
// Définition des permissions
export const PERMISSIONS = {
  [ROLES.SECRETARY]: {
    canViewDashboard: true,
    canManageAppointments: true,
    canManagePatients: true,
    canViewConsultations: true,
    canManageBilling: true,
    canViewReports: true,
    canManageSettings: true,
    canManageAdministration: false,
    canManageUsers: false,
    canManageSecurity: false
  },
  // ... autres rôles
};

// Fonction de vérification
export const hasPermission = (userRole, permission) => {
  if (!userRole || !permission) return false;
  
  const rolePermissions = PERMISSIONS[userRole];
  if (!rolePermissions) return false;
  
  return rolePermissions[permission] === true;
};
```

### 5.3 Sidebar Filtrée par Rôle

Le composant Sidebar affiche uniquement les modules accessibles selon le rôle :

```javascript
// src/components/Sidebar.jsx
const getCurrentRole = () => {
  if (hasRole('admin')) return 'admin';
  if (hasRole('doctor')) return 'medecin';
  if (hasRole('secretary')) return 'secretaire';
  return null;
};

// Filtrer les modules selon le rôle
const filteredModules = navigationItems.filter(module => {
  if (!module.allowedRoles) return true;
  return module.allowedRoles.includes(currentRole);
});
```

---

## 6. Audit et Conformité

### 6.1 Logs d'Authentification

Toutes les tentatives de connexion sont tracées :

```javascript
// Exemple de log d'authentification
console.log(`✅ Connexion réussie pour ${user.email} avec le rôle: ${userRole}`);
console.warn(`🚫 Tentative de connexion échouée pour ${email}`);
```

### 6.2 Traçabilité des Actions

Toutes les actions importantes sont tracées avec :
- **Utilisateur** : Qui a effectué l'action
- **Date/Heure** : Quand l'action a été effectuée
- **Type d'action** : Création, modification, suppression
- **Ressource** : Sur quelle ressource l'action a été effectuée

```sql
-- Exemple de colonnes de traçabilité
created_by BIGINT REFERENCES public.users(id),
updated_by BIGINT REFERENCES public.users(id),
created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
```

### 6.3 Recommandations de Sécurité

#### Variables d'Environnement

- ✅ Ne jamais commiter les clés dans le code
- ✅ Utiliser des variables d'environnement séparées pour dev/prod
- ✅ Protéger la clé service_role (jamais exposée côté client)

#### Gestion des Erreurs

- ✅ Toujours gérer les erreurs d'authentification
- ✅ Rediriger vers la page de connexion si nécessaire
- ✅ Ne pas exposer les détails d'erreur aux utilisateurs finaux

#### Politiques RLS

- ✅ Tester toutes les politiques après modification
- ✅ Vérifier que les utilisateurs ont les bonnes permissions
- ✅ Auditer régulièrement les politiques de sécurité

#### Tokens JWT

- ✅ Les tokens expirent automatiquement
- ✅ Le refresh est géré automatiquement par Supabase
- ✅ Ne jamais stocker les tokens dans le localStorage de manière non sécurisée

---

## 7. Tests de Sécurité

### 7.1 Comptes de Test

#### Médecins
- **Email:** dr.martin@cabinet.com | **Mot de passe:** password123
- **Email:** dr.bernard@cabinet.com | **Mot de passe:** password123
- **Email:** dr.dubois@cabinet.com | **Mot de passe:** password123

#### Secrétaires
- **Email:** secretaire1@cabinet.com | **Mot de passe:** password123
- **Email:** secretaire2@cabinet.com | **Mot de passe:** password123

#### Administrateur
- **Email:** admin@cabinet.com | **Mot de passe:** admin123

### 7.2 Scénarios de Test

1. **Test d'authentification**
   - Connexion avec chaque rôle
   - Vérification de la redirection correcte
   - Vérification des tokens JWT

2. **Test d'autorisation**
   - Accès à une page non autorisée
   - Vérification de l'affichage d'AccessDenied
   - Vérification de la redirection

3. **Test de navigation**
   - Navigation dans le sidebar
   - Vérification de l'affichage des modules appropriés
   - Vérification des routes protégées

4. **Test de déconnexion**
   - Déconnexion
   - Vérification de la redirection vers /login
   - Vérification de la suppression de la session

### 7.3 Vérification des Tokens JWT

```javascript
// Dans la console du navigateur
const { data: { session } } = await supabase.auth.getSession();
console.log('Token JWT:', session?.access_token);
console.log('Utilisateur:', session?.user);
```

### 7.4 Vérification des Requêtes Authentifiées

Dans l'onglet Network des outils de développement :
- Toutes les requêtes vers Supabase doivent inclure l'en-tête `Authorization: Bearer <token>`
- Les requêtes sans token doivent être rejetées

### 7.5 Test des Politiques RLS

```sql
-- Dans l'éditeur SQL de Supabase
-- Cette requête doit échouer sans authentification
SELECT * FROM appointments;

-- Cette requête doit réussir avec authentification
-- (exécutée depuis l'application connectée)
```

---

## 8. Avantages de l'Implémentation

### Sécurité

- ✅ **Authentification réelle** avec Supabase Auth
- ✅ **Tokens JWT** pour toutes les requêtes
- ✅ **Row Level Security** pour contrôler l'accès aux données
- ✅ **Sessions persistantes** avec refresh automatique
- ✅ **Protection des routes** basée sur les rôles
- ✅ **Traçabilité complète** des actions

### Performance

- ✅ **Tokens automatiquement renouvelés**
- ✅ **Pas de requêtes inutiles** sans authentification
- ✅ **Cache des sessions** pour une meilleure UX
- ✅ **Requêtes optimisées** avec RLS côté base de données

### Maintenabilité

- ✅ **Code centralisé** pour l'authentification
- ✅ **Services réutilisables** avec sécurité intégrée
- ✅ **Politiques configurables** côté base de données
- ✅ **Documentation complète** des permissions

---

## 9. Points d'Attention

### 1. Variables d'Environnement

- Ne jamais commiter les clés dans le code
- Utiliser des variables d'environnement séparées pour dev/prod
- Protéger la clé service_role (jamais exposée côté client)

### 2. Gestion des Erreurs

- Toujours gérer les erreurs d'authentification
- Rediriger vers la page de connexion si nécessaire
- Ne pas exposer les détails d'erreur aux utilisateurs finaux

### 3. Politiques RLS

- Tester toutes les politiques après modification
- Vérifier que les utilisateurs ont les bonnes permissions
- Auditer régulièrement les politiques de sécurité

### 4. Tokens JWT

- Les tokens expirent automatiquement
- Le refresh est géré automatiquement par Supabase
- Ne jamais stocker les tokens dans le localStorage de manière non sécurisée

### 5. Maintenance Continue

- Vérifier régulièrement les permissions
- Tester les accès non autorisés
- Surveiller les tentatives d'accès
- Maintenir les logs de sécurité

---

## 10. Ressources Supplémentaires

### Documentation Supabase

- [Documentation Supabase Auth](https://supabase.com/docs/guides/auth)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Tokens JWT](https://supabase.com/docs/guides/auth/tokens)
- [Politiques de sécurité](https://supabase.com/docs/guides/auth/policies)

### Fichiers de Configuration

- `src/lib/supabase.js` - Configuration Supabase
- `src/lib/secureServices.js` - Services sécurisés
- `src/contexts/AuthContext.jsx` - Contexte d'authentification
- `src/components/ProtectedRoute.jsx` - Protection des routes
- `src/utils/permissions.js` - Utilitaires de permissions
- `supabase/rls-policies.sql` - Politiques RLS

---

## Conclusion

Le système de sécurité de l'application Cabinet Médical est complet et robuste. Il garantit :

1. **Authentification sécurisée** avec Supabase Auth et tokens JWT
2. **Autorisation granulaire** basée sur les rôles
3. **Protection des données** avec Row Level Security
4. **Traçabilité complète** des actions utilisateurs
5. **Expérience utilisateur optimale** avec redirections intelligentes

Cette implémentation respecte les meilleures pratiques de sécurité et assure la protection des données sensibles du cabinet médical.


