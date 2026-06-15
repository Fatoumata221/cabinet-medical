# 🔄 Réassignation de Médecin

## 📋 Description de la Fonctionnalité

La fonctionnalité de réassignation de médecin permet à la secrétaire de réassigner un patient à un autre médecin disponible lorsque le médecin assigné est indisponible et que le patient a le statut 'Patient appelé'.

### Cas d'utilisation

- Un médecin devient indisponible (urgence, absence, etc.)
- Un patient a été appelé mais le médecin ne peut pas le recevoir
- La secrétaire doit trouver un autre médecin disponible pour prendre en charge le patient

## 🔧 Implémentation Technique

### 1. Base de Données (PostgreSQL)

**Fichier:** `supabase/migrations/20260610000002_doctor_reassignment.sql`

**Colonnes ajoutées à la table `waiting_queue`:**
- `original_medecin_id` - ID du médecin original avant réassignation
- `reassignment_reason` - Raison de la réassignation
- `reassignment_timestamp` - Date et heure de la réassignation

**Fonctions PostgreSQL:**
- `reassign_patient_to_doctor(p_waiting_queue_id, p_new_medecin_id, p_reason)` - Réassigne un patient à un autre médecin
- `get_available_doctors_by_speciality(p_specialite_id)` - Récupère les médecins disponibles par spécialité

**Vue créée:**
- `waiting_queue_doctor_unavailable` - Vue des patients avec médecin indisponible

### 2. Frontend - Composant WaitingQueueItem

**Fichier:** `src/components/introduction/WaitingQueueItem.jsx`

**Fonctionnalités ajoutées:**
- Détection automatique des médecins indisponibles
- Badge "Médecin indisponible" pour les patients concernés
- Bouton "Réassigner" pour les patients avec médecin indisponible et statut 'appele'/'called'
- Bordure rouge et fond rouge clair pour les patients concernés

**Logique de détection:**
```javascript
const isDoctorUnavailableAndPatientCalled = () => {
  const isPatientCalled = ['appele', 'called'].includes(item.status);
  const isDoctorUnavailable = item.medecin?.actif === false;
  return isPatientCalled && isDoctorUnavailable;
};
```

### 3. Frontend - Modal de Réassignation

**Fichier:** `src/components/secretary/DoctorReassignModal.jsx`

**Fonctionnalités:**
- Liste des médecins disponibles de la même spécialité
- Sélection du nouveau médecin
- Choix de la raison de réassignation
- Notification automatique du patient
- Notification automatique du nouveau médecin

**Raisons de réassignation:**
- Médecin indisponible
- Urgence médicale
- Demande du patient
- Autre

### 4. Frontend - Service

**Fichier:** `src/services/doctorService.js`

**Fonctions ajoutées:**
- `reassignPatientToDoctor(waitingQueueId, newMedecinId, reason)` - Réassigne un patient
- `getAvailableDoctorsBySpeciality(specialiteId)` - Récupère les médecins disponibles
- `getPatientsWithUnavailableDoctor()` - Récupère les patients avec médecin indisponible

### 5. Frontend - Intégration

**Fichiers modifiés:**
- `src/components/secretary/GlobalWaitingQueue.jsx` - Intégration de la modal
- `src/pages/IntroductionPatientPage.jsx` - Intégration de la modal et passage de la fonction onReassign

## 🚀 Instructions de Déploiement

### Étape 1: Appliquer la Migration SQL

```bash
# Via Supabase CLI
supabase db push

# Ou via psql
psql -h your-host -U your-user -d your-db -f supabase/migrations/20260610000002_doctor_reassignment.sql
```

### Étape 2: Vérifier la Migration

```sql
-- Vérifier les nouvelles colonnes
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'waiting_queue' 
AND column_name IN ('original_medecin_id', 'reassignment_reason', 'reassignment_timestamp');

-- Vérifier les fonctions
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%reassign%';

-- Vérifier la vue
SELECT * FROM information_schema.views 
WHERE table_name = 'waiting_queue_doctor_unavailable';
```

### Étape 3: Tester la Fonctionnalité

1. **Créer un test:**
   - Créer un patient
   - L'ajouter à la file d'attente
   - Le marquer comme "appelé"
   - Désactiver le médecin assigné

2. **Vérifier l'affichage:**
   - Le badge "Médecin indisponible" doit apparaître
   - Le bouton "Réassigner" doit être visible
   - La bordure doit être rouge

3. **Tester la réassignation:**
   - Cliquer sur "Réassigner"
   - Sélectionner un nouveau médecin
   - Choisir une raison
   - Confirmer

4. **Vérifier les notifications:**
   - Le patient doit être notifié
   - Le nouveau médecin doit être notifié
   - La file d'attente doit être mise à jour

## 📊 Résultats Attendus

### Avant la Réassignation
- Patient avec médecin indisponible
- Statut: "Patient appelé"
- Badge: "Médecin indisponible"
- Bouton: "Réassigner" visible

### Après la Réassignation
- Patient réassigné au nouveau médecin
- Statut: inchangé ("Patient appelé")
- Médecin: nouveau médecin
- Historique: médecin original conservé
- Notifications: envoyées au patient et au nouveau médecin

## 🔧 Maintenance

### Surveillance des Réassignations

```sql
-- Voir les patients réassignés
SELECT 
  wq.id,
  p.nom as patient_nom,
  p.prenom as patient_prenom,
  u_old.nom as ancien_medecin_nom,
  u_old.prenom as ancien_medecin_prenom,
  u_new.nom as nouveau_medecin_nom,
  u_new.prenom as nouveau_medecin_prenom,
  wq.reassignment_reason,
  wq.reassignment_timestamp
FROM public.waiting_queue wq
JOIN public.patients p ON wq.patient_id = p.id
JOIN public.users u_old ON wq.original_medecin_id = u_old.id
JOIN public.users u_new ON wq.medecin_id = u_new.id
WHERE wq.original_medecin_id IS NOT NULL
ORDER BY wq.reassignment_timestamp DESC;
```

### Voir les Patients avec Médecin Indisponible

```sql
SELECT * FROM waiting_queue_doctor_unavailable;
```

### Réassignation Manuelle

```sql
-- Réassigner manuellement un patient
SELECT public.reassign_patient_to_doctor(
  p_waiting_queue_id => 123,
  p_new_medecin_id => 456,
  p_reason => 'Test manuel'
);
```

## 📝 Notes

- La réassignation conserve l'historique du médecin original
- Les notifications sont automatiques
- Le système privilégie les médecins de la même spécialité
- La raison de réassignation est traçable
- Le patient est notifié du changement de médecin

## 🎯 Avantages

- **Flexibilité:** Permet de gérer les imprévus
- **Traçabilité:** Historique complet des réassignations
- **Automatisation:** Notifications automatiques
- **Expérience utilisateur:** Interface intuitive
- **Performance:** Fonctions PostgreSQL optimisées
- **Sécurité:** Contrôle d'accès via RLS

## 📞 Support

En cas de problème:
1. Vérifier que la migration a été appliquée
2. Vérifier que les fonctions PostgreSQL existent
3. Vérifier que le médecin assigné est bien inactif
4. Consulter les logs Supabase pour les erreurs
5. Vérifier que les notifications sont activées

## 🔒 Sécurité

- La fonction `reassign_patient_to_doctor` utilise RLS
- Seuls les utilisateurs avec le rôle approprié peuvent réassigner
- Les notifications sont sécurisées
- L'historique est conservé pour audit

---

**Date de création:** 10 Juin 2026  
**Version:** 1.0  
**Statut:** ✅ Prêt pour déploiement
