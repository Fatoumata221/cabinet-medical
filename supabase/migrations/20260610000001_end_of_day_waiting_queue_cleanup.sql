-- Migration: Nettoyage automatique de la salle d'attente en fin de journée
-- Cette migration ajoute une fonction pour supprimer automatiquement les patients de la salle d'attente en fin de journée

-- 1. Ajouter un statut "non_vu" pour les patients non vus en fin de journée
ALTER TABLE public.waiting_queue 
DROP CONSTRAINT IF EXISTS waiting_queue_status_check;

ALTER TABLE public.waiting_queue 
ADD CONSTRAINT waiting_queue_status_check 
CHECK (status IN (
  'waiting',       -- En attente
  'en_attente',    -- En attente de confirmation
  'present',       -- Patient présent
  'arrive',        -- Patient arrivé
  'called',        -- Patient appelé
  'appele',        -- Patient appelé (variante)
  'medecin_pret',  -- Médecin prêt
  'en_route',      -- Patient en route
  'authorized',    -- Patient autorisé
  'in_consultation', -- En consultation
  'en_consultation', -- En consultation (variante)
  'entre',         -- Patient entré
  'finished',      -- Terminé
  'termine',       -- Terminé (variante)
  'absent',        -- Patient absent
  'reporte',       -- Rendez-vous reporté
  'annule',        -- Annulé
  'cancelled',     -- Annulé (variante)
  'non_vu'         -- Patient non vu en fin de journée
));

-- 2. Ajouter des colonnes pour la traçabilité
ALTER TABLE public.waiting_queue 
ADD COLUMN IF NOT EXISTS removed_at_end_of_day BOOLEAN DEFAULT FALSE;

ALTER TABLE public.waiting_queue 
ADD COLUMN IF NOT EXISTS removal_reason TEXT;

ALTER TABLE public.waiting_queue 
ADD COLUMN IF NOT EXISTS removal_timestamp TIMESTAMP WITH TIME ZONE;

-- 3. Créer une fonction pour nettoyer la salle d'attente en fin de journée
CREATE OR REPLACE FUNCTION public.cleanup_waiting_queue_end_of_day()
RETURNS TABLE(
  patients_traites INTEGER,
  patients_non_vus INTEGER,
  patients_absents INTEGER,
  patients_reportes INTEGER
) AS $$
DECLARE
  v_patients_traites INTEGER := 0;
  v_patients_non_vus INTEGER := 0;
  v_patients_absents INTEGER := 0;
  v_patients_reportes INTEGER := 0;
  v_cabinet_heure_fermeture TIME;
  v_heure_actuelle TIME;
  v_date_limite TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Récupérer l'heure de fermeture du cabinet (défaut: 20:00)
  SELECT COALESCE(heure_fermeture, '20:00'::TIME)
  INTO v_cabinet_heure_fermeture
  FROM public.parametres_cabinet
  LIMIT 1;
  
  v_heure_actuelle := CURRENT_TIME;
  
  -- Définir la date limite: si l'heure actuelle est après la fermeture, traiter les patients d'aujourd'hui
  -- Sinon, traiter les patients d'hier
  IF v_heure_actuelle >= v_cabinet_heure_fermeture THEN
    v_date_limite := CURRENT_DATE;
  ELSE
    v_date_limite := CURRENT_DATE - INTERVAL '1 day';
  END IF;
  
  -- Marquer comme "non_vu" les patients encore en attente avec un RDV dépassé
  UPDATE public.waiting_queue
  SET 
    status = 'non_vu',
    removed_at_end_of_day = TRUE,
    removal_reason = 'Non vu en fin de journée - RDV dépassé',
    removal_timestamp = NOW(),
    updated_at = NOW()
  WHERE 
    status IN ('waiting', 'en_attente', 'present', 'arrive', 'called', 'in_consultation')
    AND removed_at_end_of_day = FALSE
    AND created_at < v_date_limite + INTERVAL '1 day'
    AND (
      -- Cas 1: Patient avec rendez-vous dépassé
      EXISTS (
        SELECT 1 FROM public.appointments a
        WHERE a.id = waiting_queue.appointment_id
        AND a.date_heure < NOW() - INTERVAL '1 hour'
      )
      OR
      -- Cas 2: Patient sans rendez-vous mais présent depuis longtemps (plus de 8h)
      (appointment_id IS NULL AND arrived_at < NOW() - INTERVAL '8 hours')
    );
  
  GET DIAGNOSTICS v_patients_non_vus = ROW_COUNT;
  v_patients_traites := v_patients_traites + v_patients_non_vus;
  
  -- Marquer comme "absent" les patients qui avaient un rendez-vous mais ne se sont jamais présentés
  UPDATE public.waiting_queue
  SET 
    status = 'absent',
    removed_at_end_of_day = TRUE,
    removal_reason = 'Absent - RDV dépassé sans présentation',
    removal_timestamp = NOW(),
    updated_at = NOW()
  WHERE 
    status IN ('waiting', 'en_attente', 'called', 'in_consultation')
    AND removed_at_end_of_day = FALSE
    AND appointment_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.appointments a
      WHERE a.id = waiting_queue.appointment_id
      AND a.date_heure < NOW() - INTERVAL '2 hours'
    );
  
  GET DIAGNOSTICS v_patients_absents = ROW_COUNT;
  v_patients_traites := v_patients_traites + v_patients_absents;
  
  -- Retourner les statistiques
  RETURN QUERY SELECT 
    v_patients_traites,
    v_patients_non_vus,
    v_patients_absents,
    v_patients_reportes;
END;
$$ LANGUAGE plpgsql;

-- 4. Créer une fonction pour marquer manuellement un patient comme non vu
CREATE OR REPLACE FUNCTION public.mark_patient_as_not_seen(
  p_waiting_queue_id BIGINT,
  p_reason TEXT DEFAULT 'Non vu - Marqué manuellement'
) RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.waiting_queue
  SET 
    status = 'non_vu',
    removed_at_end_of_day = TRUE,
    removal_reason = p_reason,
    removal_timestamp = NOW(),
    updated_at = NOW()
  WHERE id = p_waiting_queue_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- 5. Créer une vue pour les patients non vus
CREATE OR REPLACE VIEW waiting_queue_non_vus AS
SELECT 
  wq.id,
  wq.patient_id,
  wq.medecin_id,
  wq.appointment_id,
  wq.status,
  wq.removal_reason,
  wq.removal_timestamp,
  p.nom as patient_nom,
  p.prenom as patient_prenom,
  u.nom as medecin_nom,
  u.prenom as medecin_prenom,
  a.date_heure as appointment_date,
  a.motif as appointment_motif
FROM public.waiting_queue wq
JOIN public.patients p ON wq.patient_id = p.id
JOIN public.users u ON wq.medecin_id = u.id
LEFT JOIN public.appointments a ON wq.appointment_id = a.id
WHERE 
  wq.status = 'non_vu'
  AND wq.removed_at_end_of_day = TRUE
ORDER BY wq.removal_timestamp DESC;

-- 6. Ajouter des commentaires pour documentation
COMMENT ON COLUMN public.waiting_queue.removed_at_end_of_day IS 'Indique si le patient a été retiré de la file d''attente en fin de journée';
COMMENT ON COLUMN public.waiting_queue.removal_reason IS 'Raison du retrait de la file d''attente';
COMMENT ON COLUMN public.waiting_queue.removal_timestamp IS 'Date et heure du retrait de la file d''attente';
COMMENT ON COLUMN public.waiting_queue.status IS 'Statut du patient dans la file d''attente';
COMMENT ON FUNCTION public.cleanup_waiting_queue_end_of_day() IS 'Fonction exécutée automatiquement en fin de journée pour nettoyer la salle d''attente';
COMMENT ON FUNCTION public.mark_patient_as_not_seen(BIGINT, TEXT) IS 'Fonction pour marquer manuellement un patient comme non vu';
COMMENT ON VIEW waiting_queue_non_vus IS 'Vue des patients marqués comme non vus en fin de journée';

-- 7. Test: Afficher les patients qui seraient traités
-- (Commenté par défaut, à décommenter pour tester)
-- SELECT * FROM waiting_queue_non_vus;
