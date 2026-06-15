-- Configuration du cron job horaire pour la mise à jour des rendez-vous passés
-- Ce script configure pg_cron pour exécuter la mise à jour toutes les heures

-- 1. Activer l'extension pg_cron si elle n'est pas déjà activée
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 2. Planifier l'exécution horaire de la mise à jour des rendez-vous passés
-- Exécute la fonction toutes les heures à la minute 0
SELECT cron.schedule(
  'update-past-appointments-hourly',
  '0 * * * *',  -- Toutes les heures à la minute 0
  $$SELECT * FROM public.update_past_appointments_status();$$
);

-- 3. Vérifier la configuration du cron job
SELECT * FROM cron.job WHERE jobname = 'update-past-appointments-hourly';

-- 4. Pour tester immédiatement la mise à jour (optionnel)
-- SELECT * FROM public.update_past_appointments_now();

-- 5. Pour supprimer le cron job si nécessaire (optionnel)
-- SELECT cron.unschedule('update-past-appointments-hourly');
