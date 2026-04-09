-- Script simple pour ajouter appointment_id à waiting_queue
-- À exécuter dans Supabase SQL Editor
-- ============================================================================

-- 1. Ajouter la colonne appointment_id si elle n'existe pas
ALTER TABLE waiting_queue 
ADD COLUMN IF NOT EXISTS appointment_id bigint REFERENCES appointments(id);

-- 2. Créer un index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_waiting_queue_appointment_id 
ON waiting_queue(appointment_id);

-- 3. Lier les entrées existantes aux appointments du jour
UPDATE waiting_queue wq
SET appointment_id = a.id
FROM appointments a
WHERE wq.patient_id = a.patient_id
  AND wq.medecin_id = a.medecin_id
  AND DATE(a.date_heure) = CURRENT_DATE
  AND wq.appointment_id IS NULL;

-- 4. Vérifier le résultat
SELECT 
  wq.id,
  wq.patient_id,
  wq.appointment_id,
  a.date_heure as rdv_heure,
  wq.created_at as ajout_file_attente
FROM waiting_queue wq
LEFT JOIN appointments a ON a.id = wq.appointment_id
WHERE wq.medecin_id IN (SELECT id FROM medecins LIMIT 1)
ORDER BY a.date_heure;


