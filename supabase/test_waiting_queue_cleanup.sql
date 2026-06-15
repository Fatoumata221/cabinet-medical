-- Script de test pour le nettoyage automatique de la salle d'attente
-- Ce script permet de tester la fonctionnalité avant déploiement

-- 1. Vérifier les patients actuellement dans la salle d'attente
SELECT 
  'Patients actuellement dans la salle d''attente:' as info;

SELECT 
  wq.id,
  wq.status,
  wq.created_at,
  wq.arrived_at,
  p.nom as patient_nom,
  p.prenom as patient_prenom,
  u.nom as medecin_nom,
  u.prenom as medecin_prenom,
  a.date_heure as appointment_date,
  CASE 
    WHEN a.date_heure < NOW() - INTERVAL '1 hour' THEN 'RDV dépassé'
    WHEN wq.arrived_at < NOW() - INTERVAL '8 hours' THEN 'Présent depuis longtemps'
    ELSE 'Normal'
  END as statut_verification
FROM public.waiting_queue wq
JOIN public.patients p ON wq.patient_id = p.id
JOIN public.users u ON wq.medecin_id = u.id
LEFT JOIN public.appointments a ON wq.appointment_id = a.id
WHERE 
  wq.status IN ('waiting', 'en_attente', 'present', 'arrive')
  AND wq.removed_at_end_of_day = FALSE
ORDER BY wq.created_at ASC;

-- 2. Afficher les statistiques actuelles
SELECT 
  'Statistiques actuelles de la salle d''attente:' as info;

SELECT 
  status,
  COUNT(*) as nombre,
  MIN(created_at) as date_min,
  MAX(created_at) as date_max
FROM public.waiting_queue
WHERE removed_at_end_of_day = FALSE
GROUP BY status;

-- 3. Tester la fonction de nettoyage immédiat
SELECT 
  'Test de la fonction de nettoyage:' as info;

SELECT * FROM public.cleanup_waiting_queue_end_of_day();

-- 4. Vérifier les patients après nettoyage
SELECT 
  'Patients après nettoyage:' as info;

SELECT 
  status,
  COUNT(*) as nombre
FROM public.waiting_queue
WHERE removed_at_end_of_day = TRUE
GROUP BY status;

-- 5. Vérifier les patients marqués comme non vus
SELECT 
  'Patients marqués comme non vus:' as info;

SELECT * FROM waiting_queue_non_vus;

-- 6. Vérifier qu'il n'y a plus de patients en attente avec RDV dépassé
SELECT 
  'Vérification finale - patients encore en attente avec RDV dépassé:' as info;

SELECT 
  wq.id,
  wq.status,
  wq.created_at,
  p.nom as patient_nom,
  p.prenom as patient_prenom,
  a.date_heure as appointment_date,
  EXTRACT(EPOCH FROM (NOW() - a.date_heure)) / 3600 as heures_ecoulees
FROM public.waiting_queue wq
JOIN public.patients p ON wq.patient_id = p.id
LEFT JOIN public.appointments a ON wq.appointment_id = a.id
WHERE 
  wq.status IN ('waiting', 'en_attente', 'present', 'arrive')
  AND wq.removed_at_end_of_day = FALSE
  AND a.date_heure < NOW() - INTERVAL '1 hour';

-- 7. Test: Marquer manuellement un patient comme non vu (optionnel)
-- SELECT public.mark_patient_as_not_seen(
--   p_waiting_queue_id => 123,
--   p_reason => 'Test manuel'
-- );

-- 8. Vérifier l'heure de fermeture configurée
SELECT 
  'Heure de fermeture du cabinet:' as info;

SELECT 
  COALESCE(heure_fermeture, '20:00'::TIME) as heure_fermeture
FROM public.parametres_cabinet
LIMIT 1;
