-- Vérifier les entrées dans waiting_queue qui n'ont pas de appointment_id
SELECT 
  'Entrées sans appointment_id' as type,
  COUNT(*) as count
FROM waiting_queue
WHERE appointment_id IS NULL
AND created_at >= CURRENT_DATE;

-- Vérifier les entrées dans waiting_queue avec appointment_id mais statut_arrivee != 'arrive'
SELECT 
  wq.id,
  wq.patient_id,
  wq.medecin_id,
  wq.appointment_id,
  wq.status,
  a.statut_arrivee,
  a.statut,
  a.date_heure
FROM waiting_queue wq
LEFT JOIN appointments a ON wq.appointment_id = a.id
WHERE wq.appointment_id IS NOT NULL
AND (a.statut_arrivee IS NULL OR a.statut_arrivee != 'arrive')
AND wq.created_at >= CURRENT_DATE;

-- Nettoyer les entrées sans appointment_id (optionnel - commenter si vous voulez juste vérifier)
-- DELETE FROM waiting_queue
-- WHERE appointment_id IS NULL
-- AND created_at >= CURRENT_DATE;
