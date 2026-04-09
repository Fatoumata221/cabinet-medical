-- Script SQL pour gérer l'ordre de la file d'attente basé sur l'heure des RDV
-- ============================================================================

-- 1. Ajouter une colonne appointment_id à waiting_queue si elle n'existe pas
ALTER TABLE waiting_queue 
ADD COLUMN IF NOT EXISTS appointment_id bigint REFERENCES appointments(id);

-- 2. Créer un index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_waiting_queue_appointment_id 
ON waiting_queue(appointment_id);

-- 3. Créer une fonction pour mettre à jour l'ordre automatiquement
CREATE OR REPLACE FUNCTION update_waiting_queue_order()
RETURNS TRIGGER AS $$
BEGIN
  -- Mettre à jour order_position basé sur l'heure du RDV
  UPDATE waiting_queue wq
  SET order_position = subquery.new_position
  FROM (
    SELECT 
      wq2.id,
      ROW_NUMBER() OVER (
        PARTITION BY wq2.medecin_id 
        ORDER BY 
          -- Priorité d'abord
          CASE 
            WHEN wq2.status = 'in_consultation' THEN 0
            WHEN wq2.status = 'arrive' THEN 1
            WHEN wq2.status = 'present' THEN 2
            ELSE 3
          END,
          -- Puis par heure de RDV (si disponible)
          COALESCE(a.date_heure, wq2.created_at)
      ) as new_position
    FROM waiting_queue wq2
    LEFT JOIN appointments a ON a.id = wq2.appointment_id
    WHERE wq2.medecin_id = NEW.medecin_id
      AND wq2.status IN ('waiting', 'present', 'arrive', 'in_consultation')
  ) AS subquery
  WHERE wq.id = subquery.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Créer un trigger qui s'exécute à chaque modification
DROP TRIGGER IF EXISTS trigger_update_waiting_queue_order ON waiting_queue;
CREATE TRIGGER trigger_update_waiting_queue_order
  AFTER INSERT OR UPDATE ON waiting_queue
  FOR EACH ROW
  EXECUTE FUNCTION update_waiting_queue_order();

-- 5. Script de migration pour lier les entrées existantes aux appointments
UPDATE waiting_queue wq
SET appointment_id = a.id
FROM appointments a
WHERE wq.patient_id = a.patient_id
  AND wq.medecin_id = a.medecin_id
  AND DATE(a.date_heure) = CURRENT_DATE
  AND wq.appointment_id IS NULL;

-- 6. Recalculer l'ordre pour toutes les entrées existantes
WITH ordered_queue AS (
  SELECT 
    wq.id,
    ROW_NUMBER() OVER (
      PARTITION BY wq.medecin_id 
      ORDER BY 
        -- Statut en priorité
        CASE 
          WHEN wq.status = 'in_consultation' THEN 0
          WHEN wq.status = 'arrive' THEN 1
          WHEN wq.status = 'present' THEN 2
          ELSE 3
        END,
        -- Puis par heure de RDV (ou created_at si pas de RDV)
        COALESCE(a.date_heure, wq.created_at)
    ) as new_position
  FROM waiting_queue wq
  LEFT JOIN appointments a ON a.id = wq.appointment_id
  WHERE wq.status IN ('waiting', 'present', 'arrive', 'in_consultation')
)
UPDATE waiting_queue
SET order_position = ordered_queue.new_position
FROM ordered_queue
WHERE waiting_queue.id = ordered_queue.id;

-- 7. Créer une vue pour faciliter les requêtes
CREATE OR REPLACE VIEW v_waiting_queue_ordered AS
SELECT 
  wq.id,
  wq.patient_id,
  wq.medecin_id,
  wq.status,
  wq.order_position,
  wq.arrived_at,
  wq.created_at,
  wq.motif_consultation,
  wq.appointment_id,
  a.date_heure as rdv_date_heure,
  a.motif as rdv_motif,
  p.nom as patient_nom,
  p.prenom as patient_prenom,
  p.telephone as patient_telephone,
  ROW_NUMBER() OVER (
    PARTITION BY wq.medecin_id 
    ORDER BY 
      -- Statut
      CASE 
        WHEN wq.status = 'in_consultation' THEN 0
        WHEN wq.status = 'arrive' THEN 1
        WHEN wq.status = 'present' THEN 2
        ELSE 3
      END,
      -- Heure de RDV (ou created_at si pas de RDV)
      COALESCE(a.date_heure, wq.created_at)
  ) as position_calculated
FROM waiting_queue wq
LEFT JOIN appointments a ON a.id = wq.appointment_id
LEFT JOIN patients p ON p.id = wq.patient_id
WHERE wq.status IN ('waiting', 'present', 'arrive', 'in_consultation');

COMMENT ON VIEW v_waiting_queue_ordered IS 
'Vue de la file d''attente triée automatiquement par heure de RDV';


