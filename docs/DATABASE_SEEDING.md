# 🌱 Remplissage de la Base de Données

Ce document explique comment remplir votre base de données Supabase avec des données de test pour le cabinet médical.

## 📋 Prérequis

- Base de données Supabase configurée
- Tables créées selon le schéma dans `supabase/migrations/20250101000000_create_tables.sql`
- Accès à l'interface Supabase Dashboard

## 🚀 Méthodes d'exécution

### Méthode 1: Via l'interface Supabase (Recommandée)

1. **Ouvrez votre Dashboard Supabase**
   - Connectez-vous à [supabase.com](https://supabase.com)
   - Sélectionnez votre projet

2. **Accédez à l'éditeur SQL**
   - Cliquez sur "SQL Editor" dans le menu de gauche
   - Cliquez sur "New query"

3. **Exécutez le script**
   - Copiez le contenu du fichier `supabase/seed_data.sql`
   - Collez-le dans l'éditeur SQL
   - Cliquez sur "Run" pour exécuter

### Méthode 2: Via le script Node.js

```bash
# Exécuter le script d'affichage
node scripts/seed-database.js
```

Ce script affichera le contenu SQL et les instructions d'exécution.

## 📊 Données créées

Le script va insérer les données suivantes :

### 👥 Utilisateurs
- **8 médecins** avec différentes spécialités :
  - Médecine générale
  - Cardiologie
  - Dermatologie
  - Pédiatrie
  - Gynécologie
  - Ophtalmologie
  - Orthopédie
  - Neurologie

- **3 secrétaires** pour la gestion administrative
- **1 administrateur** pour la gestion système

### 👤 Patients
- **25 patients** avec informations complètes :
  - Nom, prénom, date de naissance
  - Téléphone et adresse
  - Assurance médicale
  - Groupe sanguin
  - Allergies et antécédents

### 📅 Rendez-vous
- **~150 rendez-vous** répartis sur 30 jours
- Différents types de motifs :
  - Consultation de routine
  - Suivi traitement
  - Examen médical
  - Contrôle tension
  - Vaccination
  - Analyse de sang
  - Échographie
  - Radiographie
  - Consultation urgente
  - Bilan de santé

### 🏥 Consultations
- **~50 consultations terminées** basées sur les rendez-vous passés
- Diagnostics et traitements appropriés
- Notes de consultation

### 💰 Factures
- **~30 factures** pour les consultations
- Différents statuts de paiement (payé, en attente)
- Modes de paiement variés (carte, espèces, chèque)

### 💊 Prescriptions
- **~20 prescriptions** avec différents médicaments
- Posologies et durées de traitement
- Instructions d'utilisation

### ⏳ File d'attente
- **15 entrées** dans la file d'attente pour aujourd'hui
- Différents statuts (en attente, présent, en consultation)
- Priorités normales et urgentes

### 🔔 Notifications
- **~10 notifications** de rappel de rendez-vous
- Notifications pour les secrétaires

## ⚠️ Important

- **Sauvegarde** : Faites une sauvegarde de votre base de données avant d'exécuter le script
- **Environnement** : Assurez-vous d'être sur le bon environnement (développement/test)
- **Doublons** : Le script utilise `ON CONFLICT DO NOTHING` pour éviter les doublons
- **Données réelles** : Ces données sont fictives et ne doivent pas être utilisées en production

## 🔄 Réexécution

Si vous devez réexécuter le script :

1. **Vider les tables** (optionnel) :
```sql
TRUNCATE TABLE public.appointments, public.consultations, 
public.invoices, public.prescriptions, public.waiting_queue, 
public.notifications CASCADE;
```

2. **Réexécuter le script** selon la méthode choisie

## 📈 Vérification

Après l'exécution, vous pouvez vérifier les données avec :

```sql
SELECT 
    'Résumé des données' as info,
    (SELECT COUNT(*) FROM public.users WHERE role = 'doctor') as medecins,
    (SELECT COUNT(*) FROM public.users WHERE role = 'secretary') as secretaires,
    (SELECT COUNT(*) FROM public.patients) as patients,
    (SELECT COUNT(*) FROM public.appointments) as rendez_vous,
    (SELECT COUNT(*) FROM public.consultations) as consultations,
    (SELECT COUNT(*) FROM public.invoices) as factures,
    (SELECT COUNT(*) FROM public.prescriptions) as prescriptions,
    (SELECT COUNT(*) FROM public.waiting_queue) as file_attente,
    (SELECT COUNT(*) FROM public.notifications) as notifications;
```

## 🎯 Utilisation dans l'application

Une fois les données insérées, votre application Calendar devrait :

- Afficher les rendez-vous dans le calendrier
- Permettre la création de nouveaux rendez-vous
- Afficher les patients et médecins dans les listes déroulantes
- Fonctionner avec la file d'attente
- Afficher les notifications

## 🆘 Dépannage

### Erreur de contrainte de clé étrangère
- Vérifiez que toutes les tables existent
- Assurez-vous que les séquences d'ID sont créées

### Erreur de syntaxe SQL
- Vérifiez que vous utilisez PostgreSQL
- Assurez-vous que le script est complet

### Données manquantes
- Vérifiez les logs d'exécution
- Relancez le script si nécessaire

# Guide de résolution des problèmes de base de données

## Problème : Aucun patient ni médecin affiché dans la page des rendez-vous

### Symptômes
- La page des rendez-vous ne liste aucun patient ni médecin
- Les listes déroulantes sont vides
- Aucun rendez-vous n'est affiché
- Erreurs dans la console du navigateur

### Causes possibles

1. **Base de données vide** : Aucune donnée n'a été insérée dans les tables
2. **Problème de connexion** : Les variables d'environnement Supabase ne sont pas configurées
3. **Tables manquantes** : Les tables de la base de données n'existent pas
4. **Permissions** : Les politiques RLS (Row Level Security) bloquent l'accès

### Solutions

#### 1. Vérifier la configuration Supabase

Assurez-vous que votre fichier `.env` contient les bonnes variables :

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

**Où trouver ces valeurs :**
1. Allez sur [supabase.com](https://supabase.com)
2. Ouvrez votre projet
3. Allez dans Settings > API
4. Copiez l'URL et la clé anon/public

#### 2. Exécuter le script de seed

Le script de seed va créer des données de test dans votre base de données :

```bash
# Installer les dépendances si nécessaire
npm install

# Exécuter le script de seed
npm run seed-database
```

**Note :** Vous devez d'abord configurer la variable `SUPABASE_SERVICE_ROLE_KEY` dans votre environnement :

```env
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**Où trouver la service role key :**
1. Dans votre projet Supabase
2. Settings > API
3. Copiez la "service_role" key (attention : gardez-la secrète !)

#### 3. Vérifier les tables

Assurez-vous que les tables suivantes existent dans votre base de données :

- `users` (médecins et secrétaires)
- `patients` (patients)
- `appointments` (rendez-vous)
- `consultations` (consultations)
- `prescriptions` (prescriptions)
- `invoices` (factures)
- `waiting_queue` (file d'attente)

#### 4. Vérifier les politiques RLS

Dans Supabase, allez dans Authentication > Policies et vérifiez que :

1. Les politiques permettent la lecture des données
2. Les utilisateurs anonymes peuvent accéder aux données nécessaires

Exemple de politique pour la table `users` :
```sql
CREATE POLICY "Enable read access for all users" ON public.users
FOR SELECT USING (true);
```

#### 5. Exécuter les migrations

Si les tables n'existent pas, exécutez les migrations :

```bash
# Via l'interface Supabase
# Allez dans SQL Editor et exécutez le contenu de :
# supabase/migrations/20250101000000_create_tables.sql
```

### Diagnostic automatique

La page des rendez-vous inclut maintenant un système de diagnostic automatique qui :

1. ✅ Teste la connexion à Supabase
2. ✅ Vérifie l'existence des tables
3. ✅ Compte les données dans chaque table
4. ✅ Affiche des logs détaillés dans la console
5. ✅ Tente de corriger automatiquement les données manquantes

### Logs de débogage

Ouvrez la console du navigateur (F12) pour voir les logs détaillés :

```
🔍 Début du chargement des données...
📍 URL Supabase: https://your-project-id.supabase.co
🔑 Clé Supabase configurée: true
🔍 Test de connexion à Supabase...
✅ Test de connexion: true
📊 Résumé des données: {doctors: 5, patients: 10, appointments: 15}
```

### Données de test créées

Le script de seed crée :

- **5 médecins** avec différentes spécialités
- **3 secrétaires**
- **10 patients** avec informations complètes
- **10 rendez-vous** de test sur les prochains jours
- **Consultations, prescriptions, factures** associées

### Vérification manuelle

Vous pouvez vérifier manuellement dans Supabase :

1. Allez dans Table Editor
2. Vérifiez que les tables contiennent des données
3. Exécutez des requêtes SQL de test :

```sql
-- Vérifier les médecins
SELECT * FROM users WHERE role = 'doctor';

-- Vérifier les patients
SELECT * FROM patients LIMIT 5;

-- Vérifier les rendez-vous
SELECT * FROM appointments LIMIT 5;
```

### Support

Si le problème persiste :

1. ✅ Vérifiez les logs dans la console du navigateur
2. ✅ Vérifiez les logs dans l'interface Supabase (Logs)
3. ✅ Testez la connexion avec un client Supabase simple
4. ✅ Vérifiez que votre projet Supabase est actif

### Commandes utiles

```bash
# Vérifier la configuration
echo $VITE_SUPABASE_URL
echo $VITE_SUPABASE_ANON_KEY

# Exécuter le seed
npm run seed-database

# Démarrer l'application
npm run dev

# Vérifier les logs
# Ouvrir http://localhost:5173/appointments
# Puis F12 > Console
```
