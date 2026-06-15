# 🐛 Correction du Bug: Rendez-vous Passés Restent Actifs

## 📋 Description du Bug

Dans SunuCare, certains rendez-vous restent dans le statut "waiting" ou "confirmed" même après leur date/heure de passage. Cela est incorrect car un rendez-vous passé ne doit plus rester actif dans la file d'attente des patients.

## 🔍 Analyse du Problème

### Système Actuel
- Le système actuel dispose d'une fonction `cleanup_appointments_end_of_day()` qui s'exécute **une fois par jour à 20h30**
- Cette fonction ne traite que les rendez-vous avant une date limite basée sur l'heure de fermeture du cabinet
- **Problème:** Les rendez-vous passés pendant la journée ne sont pas automatiquement mis à jour

### Impact
- Les rendez-vous passés restent visibles dans la file d'attente
- Les médecins et secrétaires voient des rendez-vous qui ne sont plus valides
- Confusion dans la gestion de la file d'attente

## ✅ Solution Implémentée

### 1. Fonction PostgreSQL de Mise à Jour en Temps Réel

**Fichier:** `supabase/migrations/20260610000000_realtime_appointment_status_update.sql`

**Fonction:** `update_past_appointments_status()`

**Comportement:**
- Marque comme "absent" les rendez-vous passés (plus de 1 heure après l'heure prévue)
- Exclut les rendez-vous qui ont une consultation associée
- Met à jour les métadonnées de traitement automatique
- Peut être appelée manuellement ou via un cron job

### 2. Cron Job Horaire

**Fichier:** `supabase/setup_hourly_cron_job.sql`

**Configuration:**
- Exécute la fonction toutes les heures à la minute 0
- Utilise l'extension pg_cron de Supabase
- Planification: `0 * * * *` (toutes les heures)

### 3. Vue de Surveillance

**Vue:** `rendez_vous_passes_a_mettre_a_jour`

**Contenu:**
- Liste des rendez-vous passés qui doivent être mis à jour
- Informations sur le patient, médecin, et heures écoulées
- Statut de mise à jour

## 🚀 Instructions de Déploiement

### Étape 1: Appliquer la Migration

```bash
# Via Supabase CLI
supabase db push

# Ou via psql
psql -h your-host -U your-user -d your-db -f supabase/migrations/20260610000000_realtime_appointment_status_update.sql
```

### Étape 2: Configurer le Cron Job

```bash
# Via psql
psql -h your-host -U your-user -d your-db -f supabase/setup_hourly_cron_job.sql
```

### Étape 3: Tester la Solution

```bash
# Exécuter le script de test
psql -h your-host -U your-user -d your-db -f supabase/test_realtime_appointment_update.sql
```

### Étape 4: Vérifier le Cron Job

```sql
-- Vérifier que le cron job est actif
SELECT * FROM cron.job WHERE jobname = 'update-past-appointments-hourly';
```

## 🧪 Tests

### Test Manuel

```sql
-- Voir les rendez-vous qui seraient mis à jour
SELECT * FROM rendez_vous_passes_a_mettre_a_jour;

-- Exécuter la mise à jour immédiatement
SELECT * FROM public.update_past_appointments_now();

-- Vérifier les résultats
SELECT 
  statut,
  COUNT(*) as nombre
FROM public.appointments
WHERE statut IN ('confirme', 'en_attente', 'absent')
  AND traite_automatiquement = TRUE
GROUP BY statut;
```

### Test Automatisé

Le script `test_realtime_appointment_update.sql` effectue les tests suivants:
1. Vérifie les rendez-vous passés à mettre à jour
2. Affiche les statistiques actuelles
3. Exécute la fonction de mise à jour
4. Vérifie les résultats après mise à jour
5. Confirme qu'il n'y a plus de rendez-vous passés en statut actif

## 📊 Résultats Attendus

### Avant la Correction
- Rendez-vous passés restent en statut "confirme" ou "en_attente"
- File d'attente contient des rendez-vous invalides
- Confusion pour les utilisateurs

### Après la Correction
- Rendez-vous passés automatiquement marqués comme "absent" après 1 heure
- File d'attente ne contient que des rendez-vous valides
- Mise à jour automatique toutes les heures
- Vue de surveillance pour vérifier le statut

## 🔧 Maintenance

### Surveillance

```sql
-- Vérifier les rendez-vous passés encore actifs
SELECT * FROM rendez_vous_passes_a_mettre_a_jour;

-- Vérifier les statistiques de mise à jour
SELECT * FROM public.update_past_appointments_status();
```

### Gestion du Cron Job

```sql
-- Désactiver le cron job si nécessaire
SELECT cron.unschedule('update-past-appointments-hourly');

-- Réactiver le cron job
SELECT cron.schedule(
  'update-past-appointments-hourly',
  '0 * * * *',
  $$SELECT * FROM public.update_past_appointments_status();$$
);
```

### Ajustement du Délai

Si vous souhaitez modifier le délai de 1 heure, modifiez la fonction dans la migration:

```sql
-- Pour changer le délai à 30 minutes
AND date_heure < NOW() - INTERVAL '30 minutes'

-- Pour changer le délai à 2 heures
AND date_heure < NOW() - INTERVAL '2 hours'
```

## 📝 Notes

- Le système de nettoyage en fin de journée (20h30) reste actif pour le traitement final
- Le nouveau système horaire complète le système existant pour une mise à jour plus fréquente
- Les rendez-vous avec consultation associée ne sont jamais marqués comme "absent"
- Le champ `traite_automatiquement` permet de suivre les traitements automatiques

## 🎯 Avantages

- **Mise à jour en temps réel:** Les rendez-vous passés sont traités toutes les heures
- **Réduction de la confusion:** La file d'attente ne contient que des rendez-vous valides
- **Surveillance:** Vue pour vérifier les rendez-vous à traiter
- **Flexibilité:** Délai ajustable selon les besoins du cabinet
- **Complémentarité:** Fonctionne avec le système existant de nettoyage en fin de journée

## 📞 Support

En cas de problème:
1. Vérifier que le cron job est actif: `SELECT * FROM cron.job;`
2. Tester manuellement: `SELECT * FROM public.update_past_appointments_now();`
3. Consulter les logs Supabase pour les erreurs
4. Vérifier que l'extension pg_cron est activée: `SELECT * FROM pg_extension WHERE extname = 'pg_cron';`

---

**Date de création:** 10 Juin 2026  
**Version:** 1.0  
**Statut:** ✅ Prêt pour déploiement
