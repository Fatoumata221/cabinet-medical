# 🏥 Améliorations de la Salle d'Attente

## 📋 Description des Améliorations

### 1. Grisage Immédiat des Patients en Retard

**Fonctionnalité:** Dès que l'heure du rendez-vous d'un patient est dépassée et qu'il n'a pas été introduit, son entrée dans la liste est grisée (opacité réduite, texte secondaire) pour signaler visuellement qu'il est en retard.

**Comportement:**
- Opacité réduite à 60%
- Bordure grise au lieu de la bordure normale
- Texte en gris au lieu de noir
- Badge "En retard" avec icône horloge
- Affichage de l'heure du RDV prévu
- Transition fluide pour l'effet visuel

### 2. Suppression Automatique en Fin de Journée

**Fonctionnalité:** À la fermeture (ex. 20h00 ou heure paramétrable), tous les patients encore présents dans la salle d'attente avec un RDV dépassé sont automatiquement retirés de la liste. Un statut "Non vu" est conservé pour traçabilité.

**Comportement:**
- Exécution automatique à l'heure de fermeture du cabinet
- Marquage comme "non_vu" pour les patients non vus
- Marquage comme "absent" pour les patients avec RDV dépassé sans présentation
- Conservation de la raison du retrait
- Horodatage du retrait
- Vue de traçabilité des patients non vus

## 🔧 Implémentation Technique

### 1. Grisage Visuel (Frontend)

**Fichier modifié:** `src/components/introduction/WaitingQueueItem.jsx`

**Fonction ajoutée:**
```javascript
const isAppointmentOverdue = () => {
  if (!item.appointment?.date_heure) return false;
  const appointmentTime = new Date(item.appointment.date_heure);
  const now = new Date();
  return appointmentTime < now && !['present', 'called', 'medecin_pret', 'en_route', 'in_consultation'].includes(item.status);
};
```

**Styles appliqués:**
- Opacité: `opacity-60`
- Bordure: `border-gray-300 bg-gray-100`
- Texte: `text-gray-500` pour le nom, `text-gray-400` pour les détails
- Badge: `bg-red-100 text-red-700` avec icône Clock

### 2. Nettoyage Automatique (Backend)

**Fichier créé:** `supabase/migrations/20260610000001_end_of_day_waiting_queue_cleanup.sql`

**Fonction PostgreSQL:** `cleanup_waiting_queue_end_of_day()`

**Statuts ajoutés:**
- `non_vu` - Patient non vu en fin de journée
- Colonnes de traçabilité:
  - `removed_at_end_of_day` - Indicateur de retrait automatique
  - `removal_reason` - Raison du retrait
  - `removal_timestamp` - Horodatage du retrait

**Logique de traitement:**
1. Marquer comme "non_vu" les patients en attente avec RDV dépassé
2. Marquer comme "absent" les patients avec RDV dépassé sans présentation
3. Conserver les métadonnées de traçabilité
4. Utiliser l'heure de fermeture paramétrée (défaut: 20:00)

### 3. Cron Job

**Fichier créé:** `supabase/setup_end_of_day_cron_job.sql`

**Configuration:**
- Exécution: Tous les jours à 20:00
- Extension: pg_cron
- Nom du job: `cleanup-waiting-queue-end-of-day`

### 4. Vue de Traçabilité

**Vue créée:** `waiting_queue_non_vus`

**Contenu:**
- Liste des patients marqués comme non vus
- Informations patient, médecin, rendez-vous
- Raison du retrait
- Horodatage du retrait

## 🚀 Instructions de Déploiement

### Étape 1: Appliquer la Migration Frontend

```bash
# Le fichier WaitingQueueItem.jsx a déjà été modifié
# Aucune action supplémentaire nécessaire
```

### Étape 2: Appliquer la Migration SQL

```bash
# Via Supabase CLI
supabase db push

# Ou via psql
psql -h your-host -U your-user -d your-db -f supabase/migrations/20260610000001_end_of_day_waiting_queue_cleanup.sql
```

### Étape 3: Configurer le Cron Job

```bash
# Via psql
psql -h your-host -U your-user -d your-db -f supabase/setup_end_of_day_cron_job.sql
```

### Étape 4: Tester la Solution

```bash
# Exécuter le script de test
psql -h your-host -U your-user -d your-db -f supabase/test_waiting_queue_cleanup.sql
```

## 🧪 Tests

### Test du Grisage Visuel

1. Créer un rendez-vous avec une heure passée
2. Ajouter le patient à la salle d'attente
3. Vérifier que l'entrée est grisée
4. Vérifier le badge "En retard"
5. Vérifier l'affichage de l'heure du RDV

### Test du Nettoyage Automatique

```sql
-- Voir les patients qui seraient traités
SELECT * FROM waiting_queue_non_vus;

-- Exécuter la fonction manuellement
SELECT * FROM public.cleanup_waiting_queue_end_of_day();

-- Vérifier les résultats
SELECT * FROM waiting_queue_non_vus;
```

### Test du Cron Job

```sql
-- Vérifier que le cron job est actif
SELECT * FROM cron.job WHERE jobname = 'cleanup-waiting-queue-end-of-day';
```

## 📊 Résultats Attendus

### Avant les Améliorations
- Patients en retard visibles normalement dans la liste
- Pas de distinction visuelle pour les patients en retard
- Patients restent indéfiniment dans la salle d'attente
- Pas de traçabilité des patients non vus

### Après les Améliorations
- Patients en retard immédiatement grisés
- Badge "En retard" visible
- Heure du RDV affichée
- Nettoyage automatique en fin de journée
- Statut "non_vu" pour traçabilité
- Vue de surveillance des patients non vus
- Conservation de l'historique complet

## 🔧 Maintenance

### Surveillance

```sql
-- Vérifier les patients actuellement en attente avec RDV dépassé
SELECT 
  wq.id,
  p.nom as patient_nom,
  p.prenom as patient_prenom,
  a.date_heure as appointment_date,
  EXTRACT(EPOCH FROM (NOW() - a.date_heure)) / 3600 as heures_ecoulees
FROM public.waiting_queue wq
JOIN public.patients p ON wq.patient_id = p.id
LEFT JOIN public.appointments a ON wq.appointment_id = a.id
WHERE 
  wq.status IN ('waiting', 'en_attente', 'present', 'arrive')
  AND a.date_heure < NOW() - INTERVAL '1 hour';

-- Vérifier les patients non vus
SELECT * FROM waiting_queue_non_vus;
```

### Gestion du Cron Job

```sql
-- Désactiver le cron job si nécessaire
SELECT cron.unschedule('cleanup-waiting-queue-end-of-day');

-- Modifier l'heure de fermeture (par exemple à 21:00)
SELECT cron.unschedule('cleanup-waiting-queue-end-of-day');
SELECT cron.schedule(
  'cleanup-waiting-queue-end-of-day',
  '0 21 * * *',
  $$SELECT * FROM public.cleanup_waiting_queue_end_of_day();$$
);
```

### Ajustement de l'Heure de Fermeture

```sql
-- Modifier l'heure de fermeture dans les paramètres du cabinet
UPDATE public.parametres_cabinet
SET heure_fermeture = '21:00'::TIME;
```

### Marquage Manuel comme Non Vu

```sql
-- Marquer manuellement un patient comme non vu
SELECT public.mark_patient_as_not_seen(
  p_waiting_queue_id => 123,
  p_reason => 'Patient absent après appel'
);
```

## 📝 Notes

- Le grisage visuel est immédiat et automatique
- Le nettoyage automatique s'exécute à l'heure de fermeture paramétrée
- Les patients non vus sont conservés dans la base de données pour traçabilité
- La vue `waiting_queue_non_vus` permet de consulter l'historique
- Le système est compatible avec le nettoyage automatique des rendez-vous existant

## 🎯 Avantages

- **Visibilité améliorée:** Identification immédiate des patients en retard
- **Expérience utilisateur:** Interface plus claire et informative
- **Maintenance automatisée:** Nettoyage automatique en fin de journée
- **Traçabilité complète:** Historique des patients non vus conservé
- **Flexibilité:** Heure de fermeture paramétrable
- **Performance:** Cron job optimisé pour l'exécution

## 📞 Support

En cas de problème:
1. Vérifier que le cron job est actif: `SELECT * FROM cron.job;`
2. Tester manuellement: `SELECT * FROM public.cleanup_waiting_queue_end_of_day();`
3. Consulter les logs Supabase pour les erreurs
4. Vérifier que l'extension pg_cron est activée: `SELECT * FROM pg_extension WHERE extname = 'pg_cron';`
5. Vérifier l'heure de fermeture configurée: `SELECT heure_fermeture FROM parametres_cabinet;`

---

**Date de création:** 10 Juin 2026  
**Version:** 1.0  
**Statut:** ✅ Prêt pour déploiement
