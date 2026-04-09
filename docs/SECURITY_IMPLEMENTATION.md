# 🔐 Implémentation de la Sécurité avec Supabase Auth

## 🎯 **Problème identifié**

L'application utilisait **uniquement la clé anonyme** pour toutes les requêtes, ce qui présente des risques de sécurité majeurs :

- ❌ **Pas d'authentification réelle**
- ❌ **Pas de tokens JWT**
- ❌ **Pas de Row Level Security (RLS)**
- ❌ **Accès non contrôlé aux données**

## ✅ **Solution implémentée**

### 1. **Authentification Supabase complète**

#### Configuration du client Supabase
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

#### Fonctions d'authentification
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

### 2. **Contexte d'authentification sécurisé**

#### AuthContext avec Supabase Auth
```javascript
// src/contexts/AuthContext.jsx
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [session, setSession] = useState(null);

  // Écouter les changements d'authentification
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setCurrentUser(session?.user || null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);
};
```

### 3. **Services sécurisés avec tokens JWT**

#### Services avec authentification obligatoire
```javascript
// src/lib/secureServices.js
export const secureAppointmentService = {
  async getAll() {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('Utilisateur non authentifié');
    }
    
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .order('date_heure', { ascending: true });
    
    if (error) throw error;
    return data;
  }
};
```

### 4. **Row Level Security (RLS)**

#### Politiques de sécurité dans Supabase
```sql
-- Activer RLS sur toutes les tables
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Politique pour les utilisateurs authentifiés
CREATE POLICY "Users can view all appointments" ON public.appointments
  FOR SELECT USING (auth.role() = 'authenticated');

-- Politique spéciale pour les médecins
CREATE POLICY "Doctors can view own appointments" ON public.appointments
  FOR SELECT USING (
    auth.uid() = medecin_id AND 
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'doctor'
    )
  );
```

## 🚀 **Comment utiliser la sécurité**

### 1. **Configuration initiale**

```bash
# 1. Configurer les variables d'environnement
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# 2. Appliquer les politiques RLS
# Copier le contenu de supabase/rls-policies.sql dans l'éditeur SQL de Supabase

# 3. Créer les utilisateurs avec authentification
npm run create-auth-users

# 4. Tester la connexion
npm run test-connection
```

### 2. **Utilisation dans les composants**

```javascript
// Utiliser le contexte d'authentification
import { useAuth } from '../contexts/AuthContext';

function MyComponent() {
  const { currentUser, login, logout, isAuthenticated } = useAuth();

  // Vérifier l'authentification
  if (!isAuthenticated()) {
    return <div>Veuillez vous connecter</div>;
  }

  return (
    <div>
      <p>Bienvenue {currentUser?.email}</p>
      <button onClick={logout}>Déconnexion</button>
    </div>
  );
}
```

### 3. **Utilisation des services sécurisés**

```javascript
// Utiliser les services avec authentification
import { secureAppointmentService } from '../lib/secureServices';

async function loadAppointments() {
  try {
    const appointments = await secureAppointmentService.getAll();
    // Les données sont récupérées avec le token JWT
    console.log('Rendez-vous:', appointments);
  } catch (error) {
    if (error.message === 'Utilisateur non authentifié') {
      // Rediriger vers la page de connexion
      navigate('/login');
    }
  }
}
```

## 🔑 **Identifiants de test**

Après avoir exécuté `npm run create-auth-users`, vous pouvez utiliser :

### Médecins
- **Email:** dr.martin@cabinet.com | **Mot de passe:** password123
- **Email:** dr.bernard@cabinet.com | **Mot de passe:** password123
- **Email:** dr.dubois@cabinet.com | **Mot de passe:** password123

### Secrétaires
- **Email:** secretaire1@cabinet.com | **Mot de passe:** password123
- **Email:** secretaire2@cabinet.com | **Mot de passe:** password123

### Administrateur
- **Email:** admin@cabinet.com | **Mot de passe:** admin123

## 🔍 **Vérification de la sécurité**

### 1. **Vérifier les tokens JWT**

Dans la console du navigateur (F12) :
```javascript
// Vérifier la session
const { data: { session } } = await supabase.auth.getSession();
console.log('Token JWT:', session?.access_token);

// Vérifier l'utilisateur
const { data: { user } } = await supabase.auth.getUser();
console.log('Utilisateur:', user);
```

### 2. **Vérifier les requêtes authentifiées**

Dans l'onglet Network des outils de développement :
- Toutes les requêtes vers Supabase doivent inclure l'en-tête `Authorization: Bearer <token>`
- Les requêtes sans token doivent être rejetées

### 3. **Tester les politiques RLS**

```sql
-- Dans l'éditeur SQL de Supabase
-- Cette requête doit échouer sans authentification
SELECT * FROM appointments;

-- Cette requête doit réussir avec authentification
-- (exécutée depuis l'application connectée)
```

## 🛡️ **Avantages de cette implémentation**

### Sécurité
- ✅ **Authentification réelle** avec Supabase Auth
- ✅ **Tokens JWT** pour toutes les requêtes
- ✅ **Row Level Security** pour contrôler l'accès aux données
- ✅ **Sessions persistantes** avec refresh automatique

### Performance
- ✅ **Tokens automatiquement renouvelés**
- ✅ **Pas de requêtes inutiles** sans authentification
- ✅ **Cache des sessions** pour une meilleure UX

### Maintenabilité
- ✅ **Code centralisé** pour l'authentification
- ✅ **Services réutilisables** avec sécurité intégrée
- ✅ **Politiques configurables** côté base de données

## 🚨 **Points d'attention**

### 1. **Variables d'environnement**
- Ne jamais commiter les clés dans le code
- Utiliser des variables d'environnement séparées pour dev/prod

### 2. **Gestion des erreurs**
- Toujours gérer les erreurs d'authentification
- Rediriger vers la page de connexion si nécessaire

### 3. **Politiques RLS**
- Tester toutes les politiques après modification
- Vérifier que les utilisateurs ont les bonnes permissions

### 4. **Tokens JWT**
- Les tokens expirent automatiquement
- Le refresh est géré automatiquement par Supabase

## 📚 **Ressources supplémentaires**

- [Documentation Supabase Auth](https://supabase.com/docs/guides/auth)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Tokens JWT](https://supabase.com/docs/guides/auth/tokens)
- [Politiques de sécurité](https://supabase.com/docs/guides/auth/policies)







