# Phase 1 - Module Reporting : Statistiques et Rapports

## 📋 Vue d'ensemble

La **Phase 1** du module Reporting met en place l'infrastructure complète pour les statistiques et rapports du cabinet médical. Cette phase fournit des vues de données optimisées, des fonctions de rapports avancés et une interface utilisateur moderne pour l'analyse des données.

## 🎯 Objectifs de la Phase 1

### Fonctionnalités principales
- **Statistiques de consultations** : Par spécialité, par médecin, durée moyenne
- **Statistiques d'actes** : Par type d'acte, tarifs, montants totaux
- **Statistiques de certificats** : Par type, nombre, durée
- **Statistiques financières** : Chiffre d'affaires, montants payés, restants
- **Rapports avancés** : Fonctions pour analyses personnalisées
- **Interface utilisateur** : Dashboard interactif avec graphiques

## 🗄️ Structure de la base de données

### Vues de statistiques de consultations

#### `statistiques_consultations_specialites`
```sql
-- Consultations par spécialité
SELECT 
    s.id as specialite_id,
    s.nom as nom_specialite,
    COUNT(c.id) as nombre_consultations,
    COUNT(DISTINCT c.patient_id) as nombre_patients_uniques,
    AVG(EXTRACT(EPOCH FROM (c.date_fin - c.date_debut))/60) as duree_moyenne_minutes,
    MIN(c.date_debut) as premiere_consultation,
    MAX(c.date_debut) as derniere_consultation
FROM specialites s
LEFT JOIN medecins m ON s.id = m.specialite_id
LEFT JOIN consultations c ON m.id = c.medecin_id
GROUP BY s.id, s.nom
```

#### `statistiques_consultations_medecins`
```sql
-- Consultations par médecin
SELECT 
    m.id as medecin_id,
    m.nom as nom_medecin,
    m.prenom as prenom_medecin,
    s.nom as specialite,
    COUNT(c.id) as nombre_consultations,
    COUNT(DISTINCT c.patient_id) as nombre_patients_uniques,
    AVG(EXTRACT(EPOCH FROM (c.date_fin - c.date_debut))/60) as duree_moyenne_minutes,
    MIN(c.date_debut) as premiere_consultation,
    MAX(c.date_debut) as derniere_consultation
FROM medecins m
LEFT JOIN specialites s ON m.specialite_id = s.id
LEFT JOIN consultations c ON m.id = c.medecin_id
GROUP BY m.id, m.nom, m.prenom, s.nom
```

### Vues de statistiques d'actes

#### `statistiques_actes_types`
```sql
-- Actes par type d'acte
SELECT 
    ta.id as type_acte_id,
    ta.nom as nom_type_acte,
    ta.tarif as tarif_defaut,
    s.nom as specialite,
    COUNT(a.id) as nombre_actes,
    COUNT(DISTINCT a.consultation_id) as nombre_consultations,
    COUNT(DISTINCT c.patient_id) as nombre_patients,
    AVG(a.tarif) as tarif_moyen,
    SUM(a.tarif) as montant_total,
    AVG(EXTRACT(EPOCH FROM (c.date_fin - c.date_debut))/60) as duree_moyenne_consultation_minutes
FROM types_actes ta
LEFT JOIN specialites s ON ta.specialite_id = s.id
LEFT JOIN actes a ON ta.id = a.type_acte_id
LEFT JOIN consultations c ON a.consultation_id = c.id
GROUP BY ta.id, ta.nom, ta.tarif, s.nom
```

### Vues de statistiques de certificats

#### `statistiques_certificats`
```sql
-- Certificats médicaux
SELECT 
    tc.id as type_certificat_id,
    tc.nom as nom_type_certificat,
    tc.duree_defaut as duree_defaut_jours,
    COUNT(c.id) as nombre_certificats,
    COUNT(DISTINCT c.patient_id) as nombre_patients,
    COUNT(DISTINCT c.medecin_id) as nombre_medecins,
    AVG(EXTRACT(EPOCH FROM (c.date_fin - c.date_debut))/60) as duree_moyenne_consultation_minutes,
    MIN(c.date_debut) as premiere_consultation,
    MAX(c.date_debut) as derniere_consultation
FROM types_certificats tc
LEFT JOIN certificats_medicaux cm ON tc.id = cm.type_certificat_id
LEFT JOIN consultations c ON cm.consultation_id = c.id
GROUP BY tc.id, tc.nom, tc.duree_defaut
```

### Vues de statistiques financières

#### `statistiques_finances_specialites`
```sql
-- Finances par spécialité
SELECT 
    s.id as specialite_id,
    s.nom as nom_specialite,
    COUNT(c.id) as nombre_consultations,
    SUM(COALESCE(f.montant_total, 0)) as montant_total_consultations,
    AVG(COALESCE(f.montant_total, 0)) as montant_moyen_consultation,
    SUM(COALESCE(f.montant_paye, 0)) as montant_total_paye,
    SUM(COALESCE(f.montant_total, 0) - COALESCE(f.montant_paye, 0)) as montant_restant_a_payer
FROM specialites s
LEFT JOIN medecins m ON s.id = m.specialite_id
LEFT JOIN consultations c ON m.id = c.medecin_id
LEFT JOIN factures f ON c.id = f.consultation_id
GROUP BY s.id, s.nom
```

#### `statistiques_finances_medecins`
```sql
-- Finances par médecin
SELECT 
    m.id as medecin_id,
    m.nom as nom_medecin,
    m.prenom as prenom_medecin,
    s.nom as specialite,
    COUNT(c.id) as nombre_consultations,
    SUM(COALESCE(f.montant_total, 0)) as montant_total_consultations,
    AVG(COALESCE(f.montant_total, 0)) as montant_moyen_consultation,
    SUM(COALESCE(f.montant_paye, 0)) as montant_total_paye,
    SUM(COALESCE(f.montant_total, 0) - COALESCE(f.montant_paye, 0)) as montant_restant_a_payer
FROM medecins m
LEFT JOIN specialites s ON m.specialite_id = s.id
LEFT JOIN consultations c ON m.id = c.medecin_id
LEFT JOIN factures f ON c.id = f.consultation_id
GROUP BY m.id, m.nom, m.prenom, s.nom
```

#### `statistiques_finances_actes`
```sql
-- Finances par type d'acte
SELECT 
    ta.id as type_acte_id,
    ta.nom as nom_type_acte,
    ta.tarif as tarif_defaut,
    s.nom as specialite,
    COUNT(a.id) as nombre_actes,
    SUM(a.tarif) as montant_total_actes,
    AVG(a.tarif) as tarif_moyen,
    COUNT(DISTINCT a.consultation_id) as nombre_consultations,
    COUNT(DISTINCT c.patient_id) as nombre_patients
FROM types_actes ta
LEFT JOIN specialites s ON ta.specialite_id = s.id
LEFT JOIN actes a ON ta.id = a.type_acte_id
LEFT JOIN consultations c ON a.consultation_id = c.id
GROUP BY ta.id, ta.nom, ta.tarif, s.nom
```

## 🔧 Fonctions de rapports avancés

### `get_statistiques_periode(date_debut, date_fin)`
Fonction qui retourne toutes les statistiques pour une période donnée :
- Consultations par spécialité
- Consultations par médecin
- Actes par type
- Certificats médicaux
- Finances par spécialité
- Finances par médecin
- Finances par type d'acte

### `get_resume_global(date_debut, date_fin)`
Fonction qui retourne un résumé global avec :
- Total consultations
- Total patients
- Total actes
- Total factures
- Chiffre d'affaires
- Montant payé
- Montant restant

## 🎨 Interface utilisateur

### Page Reporting (`/reporting`)

#### Fonctionnalités principales
- **Filtres de date** : Sélection de période personnalisée
- **Onglets thématiques** : Résumé, Consultations, Actes, Certificats, Finances
- **Graphiques interactifs** : Barres, secteurs, lignes avec Recharts
- **Tableaux détaillés** : Données complètes avec tri et filtrage
- **Métriques en temps réel** : Actualisation automatique des données

#### Composants de l'interface
- **Dashboard principal** : Vue d'ensemble avec métriques clés
- **Graphiques responsifs** : Adaptation automatique à la taille d'écran
- **Filtres avancés** : Sélection de période et actualisation
- **Navigation par onglets** : Organisation thématique des données
- **Formatage des données** : Montants en XOF, durées formatées

#### Types de visualisations
1. **Graphiques en barres** : Pour les comparaisons quantitatives
2. **Graphiques en secteurs** : Pour les répartitions en pourcentage
3. **Tableaux de données** : Pour les détails complets
4. **Métriques en cartes** : Pour les indicateurs clés

## 🔐 Sécurité et permissions

### Politiques RLS (Row Level Security)
Toutes les vues de statistiques sont accessibles en lecture seule pour tous les utilisateurs authentifiés :
- **Médecins** : Peuvent voir leurs propres statistiques
- **Secrétaires** : Peuvent voir toutes les statistiques
- **Administrateurs** : Accès complet à toutes les données

## 📊 Métriques disponibles

### Statistiques de consultations
- **Nombre de consultations** : Par spécialité, par médecin
- **Patients uniques** : Nombre de patients différents
- **Durée moyenne** : Temps moyen des consultations
- **Période d'activité** : Première et dernière consultation

### Statistiques d'actes
- **Nombre d'actes** : Par type d'acte
- **Tarifs** : Tarif par défaut et tarif moyen
- **Montants totaux** : Revenus générés par type d'acte
- **Consultations associées** : Nombre de consultations avec actes

### Statistiques de certificats
- **Nombre de certificats** : Par type de certificat
- **Patients concernés** : Nombre de patients ayant reçu des certificats
- **Médecins prescripteurs** : Nombre de médecins prescrivant des certificats
- **Durée par défaut** : Durée standard des certificats

### Statistiques financières
- **Chiffre d'affaires** : Par spécialité, par médecin, par type d'acte
- **Montants payés** : Somme des paiements effectués
- **Montants restants** : Somme des montants non payés
- **Montant moyen** : Montant moyen par consultation

## 🚀 Scripts de déploiement

### Migration
```bash
npm run migrate:reporting:phase1
```

### Tests
```bash
npm run test:reporting:phase1
```

## 📈 Optimisations de performance

### Index créés
- `idx_consultations_date_debut` : Optimise les requêtes par date
- `idx_consultations_date_fin` : Optimise les calculs de durée
- `idx_consultations_medecin_id` : Optimise les jointures avec médecins
- `idx_consultations_patient_id` : Optimise les comptages de patients
- `idx_actes_consultation_id` : Optimise les jointures avec consultations
- `idx_actes_type_acte_id` : Optimise les groupements par type d'acte
- `idx_factures_consultation_id` : Optimise les jointures financières
- `idx_factures_date_facture` : Optimise les requêtes par date de facture
- `idx_factures_statut_paiement` : Optimise les filtres de paiement
- `idx_certificats_consultation_id` : Optimise les jointures de certificats
- `idx_certificats_type_certificat_id` : Optimise les groupements de certificats

## 🔄 Intégration avec les autres modules

### Module Consultation
- **Données source** : Consultations, durées, patients
- **Médecins** : Spécialités, performances

### Module Facturation
- **Données financières** : Factures, paiements, montants
- **Actes** : Types, tarifs, revenus

### Module Paramétrage
- **Référentiels** : Spécialités, types d'actes, types de certificats
- **Médecins** : Informations de base

## 🎯 Prochaines étapes

### Améliorations possibles
1. **Export de données** : PDF, Excel, CSV
2. **Rapports personnalisés** : Création de rapports sur mesure
3. **Alertes et notifications** : Seuils et alertes automatiques
4. **Tendances temporelles** : Évolution dans le temps
5. **Comparaisons** : Périodes comparatives

### Intégrations futures
- **API externe** : Intégration avec d'autres systèmes
- **Tableaux de bord** : Dashboards personnalisés par rôle
- **Métriques avancées** : KPIs et indicateurs de performance
- **Prédictions** : Analyses prédictives

## ✅ Validation et tests

### Tests automatisés
- ✅ Création des vues de statistiques
- ✅ Fonctions de rapports avancés
- ✅ Index de performance
- ✅ Politiques RLS
- ✅ Accès aux données
- ✅ Formatage des données

### Tests manuels
- ✅ Interface utilisateur responsive
- ✅ Filtres de date fonctionnels
- ✅ Navigation par onglets
- ✅ Graphiques interactifs
- ✅ Actualisation des données
- ✅ Formatage des montants et durées

## 📝 Notes techniques

### Technologies utilisées
- **Recharts** : Bibliothèque de graphiques React
- **Tailwind CSS** : Styles et responsive design
- **Supabase** : Base de données et API
- **PostgreSQL** : Vues et fonctions avancées

### Optimisations
- **Vues matérialisées** : Pour les requêtes complexes
- **Index composites** : Pour les requêtes fréquentes
- **Pagination** : Pour les grandes listes
- **Cache** : Mise en cache des statistiques

### Limitations actuelles
- Pas d'export de données
- Pas de rapports personnalisés
- Pas de tendances temporelles
- Pas d'alertes automatiques

### Compatibilité
- **Supabase** : Compatible avec la version actuelle
- **React** : Compatible avec React 19
- **TypeScript** : Types définis
- **Tailwind CSS** : Styles cohérents

---

**Phase 1 - Module Reporting : Statistiques et Rapports** ✅ **TERMINÉE**

Le module Reporting est maintenant **opérationnel** avec :
- ✅ Vues de statistiques complètes
- ✅ Fonctions de rapports avancés
- ✅ Interface utilisateur moderne
- ✅ Graphiques interactifs
- ✅ Optimisations de performance
- ✅ Sécurité et permissions

**Prochaines phases possibles :**
- Phase 2 : Export et rapports personnalisés
- Phase 3 : Alertes et notifications
- Phase 4 : Analyses prédictives
- Phase 5 : Intégrations avancées

**🎉 Tous les modules principaux sont maintenant développés !**
