# Tableau de Bord Secrétaire

## Vue d'ensemble

Le tableau de bord secrétaire est une interface spécialisée conçue pour les secrétaires de cabinet médical. Il leur permet de gérer efficacement les rendez-vous, la file d'attente et la facturation pour plusieurs médecins.

## Fonctionnalités principales

### 1. Gestion des Rendez-vous
- **Vue d'ensemble** : Affichage de tous les rendez-vous avec filtrage par médecin
- **Filtrage** : Possibilité de filtrer par médecin spécifique ou voir tous les médecins
- **Recherche** : Recherche rapide de patients par nom
- **Statuts** : Visualisation des statuts (confirmé, en attente, annulé)
- **Actions** : Modification et gestion des rendez-vous

### 2. File d'Attente
- **Vue en temps réel** : Affichage des patients en attente pour aujourd'hui
- **Numérotation** : Numérotation automatique des patients dans la file
- **Informations patient** : Nom, médecin, heure de rendez-vous, téléphone
- **Actions rapides** : Validation et consultation des dossiers patients
- **Design moderne** : Interface avec animations et couleurs distinctives

### 3. Facturation
- **Gestion complète** : Création, modification et suivi des factures
- **Informations patient** : Détails complets du patient sortant de consultation
- **Ordonnances** : Affichage et gestion des ordonnances prescrites
- **Services** : Liste des services facturés avec prix
- **Impression** : Fonctionnalité d'impression des factures
- **Statuts** : Suivi des paiements (en attente, payé, annulé)

## Architecture technique

### Composants principaux

#### `SecretaryDashboard.jsx`
- Composant principal du tableau de bord
- Gestion des onglets et de la navigation
- Filtrage et recherche des données
- État global de l'application

#### `AppointmentsTab`
- Affichage et gestion des rendez-vous
- Filtrage par médecin et statut
- Actions de modification

#### `WaitingQueueTab`
- File d'attente en temps réel
- Numérotation automatique
- Actions de validation

#### `BillingTab`
- Gestion de la facturation
- Affichage des ordonnances
- Fonctionnalités d'impression

### Services utilisés

#### `billingService`
```javascript
// Récupérer toutes les factures
async getAll()

// Créer une nouvelle facture
async create(billingData)

// Marquer comme payée
async markAsPaid(id)

// Générer numéro de facture
async generateInvoiceNumber()
```

#### `appointmentService`
```javascript
// Récupérer tous les rendez-vous
async getAll()

// Filtrer par médecin
async getByDoctor(medecinId)
```

#### `patientService`
```javascript
// Récupérer tous les patients
async getAll()

// Rechercher par nom
async searchByName(searchTerm)
```

## Base de données

### Table `billing`
```sql
CREATE TABLE billing (
    id UUID PRIMARY KEY,
    numero_facture VARCHAR(50) UNIQUE,
    patient_id UUID REFERENCES patients(id),
    medecin_id UUID REFERENCES users(id),
    date_creation TIMESTAMP,
    date_paiement TIMESTAMP,
    montant_total DECIMAL(10,2),
    statut VARCHAR(20),
    ordonnance TEXT,
    services JSONB,
    -- ... autres champs
);
```

### Politiques de sécurité (RLS)
- **Secrétaires** : Accès complet à toutes les factures
- **Médecins** : Accès uniquement à leurs propres factures
- **Admins** : Accès complet à toutes les données

## Interface utilisateur

### Design System
- **Couleurs** : Palette bleue professionnelle
- **Animations** : Transitions fluides avec Framer Motion
- **Responsive** : Adaptation mobile et desktop
- **Accessibilité** : Contraste et navigation clavier

### Composants UI
- **Onglets** : Navigation entre les sections
- **Cartes** : Affichage des informations
- **Boutons d'action** : Actions rapides
- **Filtres** : Sélection et recherche
- **Statuts** : Indicateurs visuels

## Workflow secrétaire

### 1. Accueil et vue d'ensemble
- Connexion avec rôle secrétaire
- Redirection automatique vers `/secretary-dashboard`
- Vue d'ensemble des activités du jour

### 2. Gestion des rendez-vous
- Consultation de l'agenda
- Filtrage par médecin
- Modification des rendez-vous
- Ajout de nouveaux rendez-vous

### 3. File d'attente
- Surveillance en temps réel
- Numérotation des patients
- Validation des présences
- Gestion des urgences

### 4. Facturation
- Récupération des informations de consultation
- Création des factures
- Gestion des ordonnances
- Impression et suivi des paiements

## Sécurité et permissions

### Rôles et accès
- **Secrétaire** : Accès complet au tableau de bord
- **Médecin** : Accès limité (non autorisé)
- **Admin** : Accès complet (supervision)

### Données sensibles
- Chiffrement des données médicales
- Logs d'audit pour toutes les actions
- Contrôle d'accès basé sur les rôles

## Tests et validation

### Script de test
```bash
node scripts/test-secretary-dashboard.js
```

### Points de validation
- Création de la table billing
- Données de test
- Fonctionnalités de filtrage
- Recherche de patients
- Gestion des factures

## Déploiement

### Prérequis
- Base de données Supabase configurée
- Tables `users`, `patients`, `appointments` existantes
- Rôles et permissions configurés

### Installation
1. Exécuter le script SQL de création de table
2. Vérifier les services et composants
3. Tester les fonctionnalités
4. Déployer l'application

## Maintenance

### Surveillance
- Logs d'erreurs
- Performance des requêtes
- Utilisation des ressources

### Mises à jour
- Ajout de nouvelles fonctionnalités
- Amélioration de l'interface
- Optimisation des performances

## Support et documentation

### Ressources
- Documentation technique
- Guides utilisateur
- Scripts de test
- Exemples d'utilisation

### Contact
- Support technique
- Formation utilisateur
- Maintenance préventive

