-- Configuration du cron job de fin de journée pour le nettoyage de la salle d'attente
-- Ce script configure pg_cron pour exécuter le nettoyage à l'heure de fermeture du cabinet

-- 1. Activer l'extension pg_cron si elle n'est pas déjà activée
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 2. Planifier l'exécution du nettoyage de la salle d'attente à l'heure de fermeture (20:00 par défaut)
-- Exécute la fonction tous les jours à 20:00
SELECT cron.schedule(
  'cleanup-waiting-queue-end-of-day',
  '0 20 * * *',  -- Tous les jours à 20:00
  $$SELECT * FROM public.cleanup_waiting_queue_end_of_day();$$
);

-- 3. Vérifier la configuration du cron job
SELECT * FROM cron.job WHERE jobname = 'cleanup-waiting-queue-end-of-day';

-- 4. Pour tester immédiatement la fonction (optionnel)
-- SELECT * FROM public.cleanup_waiting_queue_end_of_day();

-- 5. Pour modifier l'heure de fermeture (par exemple à 21:00)
-- D'abord supprimer l'ancien cron job
-- SELECT cron.unschedule('cleanup-waiting-queue-end-of-day');
-- Puis créer un nouveau avec la nouvelle heure
-- SELECT cron.schedule(
--   'cleanup-waiting-queue-end-of-day',
--   '0 21 * * *',  -- Tous les jours à 21:00
--   $$SELECT * FROM public.cleanup_waiting_queue_end_of_day();$$
-- );

-- 6. Pour supprimer le cron job si nécessaire (optionnel)
-- SELECT cron.unschedule('cleanup-waiting-queue-end-of-day');
