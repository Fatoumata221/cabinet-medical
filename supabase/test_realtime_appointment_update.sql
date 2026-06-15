-- Script de test pour la mise à jour en temps réel des rendez-vous passés
-- Ce script permet de tester la fonctionnalité avant déploiement

-- 1. Vérifier les rendez-vous qui seraient mis à jour
SELECT 
  'Rendez-vous passés à mettre à jour:' as info;
  
SELECT * FROM rendez_vous_passes_a_mettre_a_jour;

-- 2. Afficher les statistiques actuelles avant mise à jour
SELECT 
  'Statistiques actuelles des rendez-vous:' as info;

SELECT 
  statut,
  COUNT(*) as nombre,
  MIN(date_heure) as date_min,
  MAX(date_heure) as date_max
FROM public.appointments
WHERE statut IN ('confirme', 'en_attente')
GROUP BY statut;

-- 3. Tester la fonction de mise à jour immédiate
SELECT 
  'Test de la fonction de mise à jour:' as info;

SELECT * FROM public.update_past_appointments_now();

-- 4. Vérifier les rendez-vous après mise à jour
SELECT 
  'Rendez-vous après mise à jour:' as info;

SELECT 
  statut,
  COUNT(*) as nombre,
  MIN(date_heure) as date_min,
  MAX(date_heure) as date_max
FROM public.appointments
WHERE statut IN ('confirme', 'en_attente', 'absent')
  AND traite_automatiquement = TRUE
GROUP BY statut;

-- 5. Vérifier qu'il n'y a plus de rendez-vous passés en statut actif
SELECT 
  'Vérification finale - rendez-vous passés encore actifs:' as info;

SELECT 
  a.id,
  a.date_heure,
  p.nom as patient_nom,
  p.prenom as patient_prenom,
  a.statut,
  a.motif,
  EXTRACT(EPOCH FROM (NOW() - a.date_heure)) / 3600 as heures_ecoulees
FROM public.appointments a
JOIN public.patients p ON a.patient_id = p.id
WHERE 
  a.statut IN ('confirme', 'en_attente')
  AND a.traite_automatiquement = FALSE
  AND a.date_heure < NOW() - INTERVAL '1 hour';

-- 6. Si des rendez-vous sont encore trouvés, ils devraient être mis à jour manuellement
-- (décommenter pour exécuter)
-- UPDATE public.appointments
-- SET 
--   statut = 'absent',
--   traite_automatiquement = TRUE,
--   date_traitement_automatique = NOW(),
--   updated_at = NOW()
-- WHERE 
--   statut IN ('confirme', 'en_attente')
--   AND date_heure < NOW() - INTERVAL '1 hour'
--   AND traite_automatiquement = FALSE
--   AND id NOT IN (
--     SELECT DISTINCT appointment_id 
--     FROM public.consultations 
--     WHERE appointment_id IS NOT NULL
--   );
