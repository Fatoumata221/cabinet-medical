# Cabinet Médical - Application de Gestion

## 🏥 Vue d'ensemble

Application de gestion complète pour cabinet médical développée avec React 19, TypeScript, Tailwind CSS et Supabase.

## 🚀 Technologies utilisées

- **Frontend** : React 19, TypeScript, Tailwind CSS, Framer Motion
- **Backend** : Supabase (PostgreSQL, Auth, Real-time)
- **Icons** : Heroicons, Lucide React
- **Routing** : React Router DOM

## 📁 Structure du projet

```
src/
├── components/          # Composants réutilisables
│   ├── Layout.jsx      # Layout principal
│   ├── Sidebar.jsx     # Navigation latérale
│   └── Calendar.jsx    # Composant calendrier
├── pages/              # Pages de l'application
│   ├── facturation/    # Module Facturation
│   │   ├── Actes.jsx           # Gestion des actes médicaux
│   │   ├── Examens.jsx         # Gestion des examens
│   │   ├── Labo.jsx            # Gestion des analyses labo
│   │   ├── Pharmacie.jsx       # Gestion des prescriptions
│   │   └── Factures.jsx        # Gestion des factures
│   ├── consultation/   # Module Consultation
│   ├── rendez-vous/    # Module Rendez-vous
│   ├── parametrage/    # Module Paramétrage
│   ├── administration/ # Module Administration
│   ├── Dashboard.jsx   # Tableau de bord
│   └── Login.jsx       # Page de connexion
├── contexts/           # Contextes React
│   └── AuthContext.jsx # Gestion de l'authentification
└── lib/               # Bibliothèques et configurations
    └── supabase.js    # Configuration Supabase
```

## 🎯 Modules fonctionnels

### 1. **Module Facturation** ✅
- **Actes** : Gestion des actes médicaux et tarifs
- **Examens** : Gestion des examens prescrits
- **Labo** : Gestion des analyses de laboratoire
- **Pharmacie** : Gestion des prescriptions pharmaceutiques
- **Factures** : Génération et gestion des factures

### 2. **Module Consultation** 🔄
- Gestion des consultations
- Détails des consultations

### 3. **Module Rendez-vous** 🔄
- Prise de rendez-vous
- Gestion de la salle d'attente
- Rappels SMS

### 4. **Module Paramétrage** 🔄
- Gestion des médecins
- Gestion des spécialités
- Configuration des tarifs

### 5. **Module Administration** 🔄
- Gestion des utilisateurs
- Configuration du cabinet

## 🔐 Authentification et rôles

- **Admin** : Accès complet à toutes les fonctionnalités
- **Médecin** : Accès aux modules médicaux et facturation
- **Secrétaire** : Accès aux modules de gestion et facturation

## 🎨 Interface utilisateur

- Design moderne avec Tailwind CSS
- Animations fluides avec Framer Motion
- Interface responsive
- Navigation intuitive avec sidebar

## 📊 Base de données

Base de données PostgreSQL sur Supabase avec :
- Tables pour patients, consultations, factures
- Politiques de sécurité (RLS)
- Triggers pour automatisation
- Vues pour les rapports

## 🚀 Installation et démarrage

```bash
# Installation des dépendances
npm install

# Démarrage en mode développement
npm run dev

# Build pour production
npm run build
```

## 🔧 Configuration

1. Configurer les variables d'environnement Supabase
2. Importer les migrations SQL
3. Configurer les politiques RLS

## 📝 Notes de développement

- Projet nettoyé et optimisé
- Suppression des fichiers obsolètes
- Structure modulaire et maintenable
- Code TypeScript avec types stricts

## 🎯 Prochaines étapes

- [ ] Finaliser le module Consultation
- [ ] Compléter le module Rendez-vous
- [ ] Ajouter des rapports et statistiques
- [ ] Tests automatisés
- [ ] Documentation API



