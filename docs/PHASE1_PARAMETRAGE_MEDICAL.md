# Phase 1 - Paramétrage Médical

## 📋 Vue d'ensemble

La **Phase 1** du module Paramétrage ajoute les tables de référence médicale essentielles pour la gestion des consultations et des examens médicaux.

## 🎯 Objectifs

- ✅ Créer les tables de référence médicale manquantes
- ✅ Implémenter les pages de gestion CRUD
- ✅ Intégrer les nouvelles fonctionnalités au système de navigation
- ✅ Fournir des données de référence pré-remplies
- ✅ Assurer la sécurité avec RLS (Row Level Security)

## 🗄️ Tables créées

### 1. **constantes**
Table des constantes médicales pouvant être mesurées lors de la consultation.

**Structure :**
- `id` (bigint, PK)
- `nom` (varchar, NOT NULL)
- `description` (text)
- `unite` (varchar) - ex: mmHg, °C, kg
- `valeur_min` (numeric) - valeur minimale possible
- `valeur_max` (numeric) - valeur maximale possible
- `valeur_normale_min` (numeric) - valeur normale minimale
- `valeur_normale_max` (numeric) - valeur normale maximale
- `categorie` (varchar) - cardiovasculaire, respiratoire, etc.
- `ordre_affichage` (integer) - ordre d'affichage
- `actif` (boolean) - statut actif/inactif
- `created_at`, `updated_at`, `created_by`, `updated_by`

### 2. **signes_cliniques**
Table des signes cliniques pouvant être constatés lors de la consultation.

**Structure :**
- `id` (bigint, PK)
- `nom` (varchar, NOT NULL)
- `description` (text)
- `categorie` (varchar) - générale, cardiovasculaire, etc.
- `type_signe` (varchar) - observation, palpation, percussion, auscultation
- `localisation` (varchar) - thorax, abdomen, membres, etc.
- `ordre_affichage` (integer)
- `actif` (boolean)
- `created_at`, `updated_at`, `created_by`, `updated_by`

### 3. **appareils**
Table des appareils d'examen pour lesquels il est possible de faire une consultation.

**Structure :**
- `id` (bigint, PK)
- `nom` (varchar, NOT NULL)
- `description` (text)
- `specialite_id` (bigint, FK) - lien vers spécialités
- `ordre_affichage` (integer)
- `actif` (boolean)
- `created_at`, `updated_at`, `created_by`, `updated_by`

### 4. **constats_appareils**
Table des constats possibles pour chaque appareil.

**Structure :**
- `id` (bigint, PK)
- `appareil_id` (bigint, FK) - lien vers appareils
- `nom` (varchar, NOT NULL)
- `description` (text)
- `type_constat` (varchar) - normal, anormal, pathologique
- `ordre_affichage` (integer)
- `actif` (boolean)
- `created_at`, `updated_at`, `created_by`, `updated_by`

### 5. **diagnostics**
Table des diagnostics possibles avec codes CIM-10.

**Structure :**
- `id` (bigint, PK)
- `nom` (varchar, NOT NULL)
- `description` (text)
- `code_cim` (varchar) - code CIM-10
- `specialite_id` (bigint, FK) - lien vers spécialités
- `niveau_gravite` (varchar) - léger, modéré, grave, critique
- `ordre_affichage` (integer)
- `actif` (boolean)
- `created_at`, `updated_at`, `created_by`, `updated_by`

## 🎨 Pages créées

### 1. **Constantes Médicales** (`/parametrage/constantes`)
- Gestion complète des constantes médicales
- Filtrage par catégorie
- Validation des valeurs min/max
- Interface intuitive avec formulaires

### 2. **Signes Cliniques** (`/parametrage/signes-cliniques`)
- Gestion des signes cliniques
- Filtrage par catégorie et type
- Classification par localisation
- Interface adaptée aux besoins médicaux

### 3. **Appareils d'Examen** (`/parametrage/appareils`)
- Gestion des appareils d'examen
- Association avec les spécialités
- Interface de gestion complète

### 4. **Diagnostics** (`/parametrage/diagnostics`)
- Gestion des diagnostics
- Intégration des codes CIM-10
- Classification par niveau de gravité
- Association avec les spécialités

## 🔒 Sécurité

### RLS (Row Level Security)
Toutes les tables ont RLS activé avec les politiques suivantes :

- **Lecture** : Utilisateurs authentifiés
- **Écriture** : Administrateurs uniquement

### Contraintes de validation
- Contraintes NOT NULL sur les champs obligatoires
- Contraintes CHECK pour les valeurs énumérées
- Clés étrangères pour maintenir l'intégrité référentielle

## 📊 Données de référence

### Constantes pré-remplies
- Tension artérielle (systolique/diastolique)
- Fréquence cardiaque
- Température
- Poids et taille
- Fréquence respiratoire
- Saturation en oxygène
- Glycémie
- IMC

### Signes cliniques pré-remplis
- État général
- Conscience
- Coloration cutanée
- Muqueuses
- Œdèmes
- Déformations
- Douleurs à la palpation
- Masses palpables
- Souffles cardiaques
- Râles pulmonaires

### Appareils pré-remplis
- Appareil cardiovasculaire
- Appareil respiratoire
- Appareil digestif
- Appareil locomoteur
- Appareil neurologique
- Appareil génito-urinaire
- Appareil ORL
- Appareil ophtalmologique

### Diagnostics pré-remplis
- Hypertension artérielle (I10)
- Diabète de type 2 (E11)
- Bronchite aiguë (J20)
- Grippe (J10)
- Infarctus du myocarde (I21)
- Pneumonie (J18)
- Appendicite (K35)
- Migraine (G43)
- Dépression (F32)
- Anémie (D50)

## 🚀 Installation et déploiement

### 1. Exécuter la migration
```bash
npm run migrate:phase1
```

### 2. Tester l'installation
```bash
npm run test:phase1
```

### 3. Vérifier dans l'interface web
- Se connecter en tant qu'administrateur
- Aller dans Paramétrage > Constantes Médicales
- Vérifier que les données sont présentes
- Tester les fonctionnalités CRUD

## 🔗 Intégration

### Navigation
Les nouvelles pages sont accessibles via :
- Menu Paramétrage (rôle admin)
- URLs directes avec protection des rôles

### Relations
- **Appareils** ↔ **Spécialités** : Relation optionnelle
- **Diagnostics** ↔ **Spécialités** : Relation optionnelle
- **Constats** ↔ **Appareils** : Relation obligatoire

## 📈 Performance

### Index créés
- `idx_constantes_categorie` - Filtrage par catégorie
- `idx_constantes_ordre` - Tri par ordre d'affichage
- `idx_signes_cliniques_categorie` - Filtrage par catégorie
- `idx_signes_cliniques_type` - Filtrage par type
- `idx_appareils_specialite` - Jointure avec spécialités
- `idx_constats_appareil_id` - Jointure avec appareils
- `idx_constats_type` - Filtrage par type de constat
- `idx_diagnostics_specialite` - Jointure avec spécialités
- `idx_diagnostics_gravite` - Filtrage par gravité

## 🧪 Tests

### Tests automatisés
Le script `test-phase1-parametrage.js` vérifie :
- ✅ Existence des tables
- ✅ Présence des données de référence
- ✅ Relations entre tables
- ✅ Contraintes et validations
- ✅ Performance des requêtes

### Tests manuels
- ✅ Interface utilisateur
- ✅ Fonctionnalités CRUD
- ✅ Filtres et recherche
- ✅ Permissions utilisateur
- ✅ Responsive design

## 🔄 Maintenance

### Sauvegarde
Les données sont sauvegardées automatiquement via Supabase.

### Mise à jour
Pour ajouter de nouvelles données de référence :
1. Modifier le fichier de migration
2. Exécuter `npm run migrate:phase1`
3. Tester avec `npm run test:phase1`

## 📝 Prochaines étapes

### Phase 2 (prévue)
- Table des antécédents
- Table des éléments de synthèse
- Table des médicaments
- Table des certificats médicaux
- Table des types d'actes
- Table des assurances

### Améliorations futures
- Interface drag & drop pour l'ordre d'affichage
- Import/export de données
- Validation avancée des valeurs
- Historique des modifications
- API REST pour intégration externe

## 🆘 Support

En cas de problème :
1. Vérifier les logs de migration
2. Exécuter les tests : `npm run test:phase1`
3. Vérifier les permissions RLS
4. Consulter la documentation Supabase

---

**Version :** 1.0.0  
**Date :** 2025-01-02  
**Auteur :** Équipe de développement  
**Statut :** ✅ Terminé et testé
