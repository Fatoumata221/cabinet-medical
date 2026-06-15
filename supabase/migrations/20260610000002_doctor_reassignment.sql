-- Migration: Réassignation de médecin pour les patients appelés
-- Cette migration ajoute les fonctions nécessaires pour réassigner un patient à un autre médecin

-- 1. Ajouter une colonne pour suivre les réassignations de médecin
ALTER TABLE public.waiting_queue 
ADD COLUMN IF NOT EXISTS original_medecin_id BIGINT REFERENCES public.users(id) ON DELETE SET NULL;

ALTER TABLE public.waiting_queue 
ADD COLUMN IF NOT EXISTS reassignment_reason TEXT;

ALTER TABLE public.waiting_queue 
ADD COLUMN IF NOT EXISTS reassignment_timestamp TIMESTAMP WITH TIME ZONE;

-- 2. Créer une fonction pour réassigner un patient à un autre médecin
CREATE OR REPLACE FUNCTION public.reassign_patient_to_doctor(
  p_waiting_queue_id BIGINT,
  p_new_medecin_id BIGINT,
  p_reason TEXT DEFAULT 'Médecin indisponible'
) RETURNS BOOLEAN AS $$
DECLARE
  v_waiting_queue RECORD;
  v_new_medecin RECORD;
  v_original_medecin RECORD;
BEGIN
  -- Récupérer les informations de la file d'attente
  SELECT * INTO v_waiting_queue
  FROM public.waiting_queue
  WHERE id = p_waiting_queue_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Patient non trouvé dans la file d''attente';
  END IF;
  
  -- Récupérer les informations du nouveau médecin
  SELECT * INTO v_new_medecin
  FROM public.users
  WHERE id = p_new_medecin_id AND role = 'medecin' AND actif = TRUE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Nouveau médecin non trouvé ou non actif';
  END IF;
  
  -- Sauvegarder l'ancien médecin si ce n'est pas déjà fait
  IF v_waiting_queue.original_medecin_id IS NULL THEN
    UPDATE public.waiting_queue
    SET original_medecin_id = v_waiting_queue.medecin_id
    WHERE id = p_waiting_queue_id;
  END IF;
  
  -- Réassigner le patient au nouveau médecin
  UPDATE public.waiting_queue
  SET 
    medecin_id = p_new_medecin_id,
    reassignment_reason = p_reason,
    reassignment_timestamp = NOW(),
    updated_at = NOW()
  WHERE id = p_waiting_queue_id;
  
  -- Mettre à jour le rendez-vous associé si présent
  IF v_waiting_queue.appointment_id IS NOT NULL THEN
    UPDATE public.appointments
    SET 
      medecin_id = p_new_medecin_id,
      updated_at = NOW()
    WHERE id = v_waiting_queue.appointment_id;
  END IF;
  
  -- Créer une notification pour le nouveau médecin
  INSERT INTO public.notifications_realtime (
    user_id,
    type_notification,
    titre,
    message,
    priorite,
    data
  ) VALUES (
    p_new_medecin_id,
    'patient_reassigned',
    'Patient réassigné',
    'Un patient vous a été réassigné. Veuillez consulter votre file d''attente.',
    'normale',
    jsonb_build_object(
      'waiting_queue_id', p_waiting_queue_id,
      'patient_id', v_waiting_queue.patient_id,
      'original_medecin_id', v_waiting_queue.medecin_id,
      'reason', p_reason
    )
  );
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- 3. Créer une fonction pour récupérer les médecins disponibles pour une spécialité
CREATE OR REPLACE FUNCTION public.get_available_doctors_by_speciality(
  p_specialite_id INTEGER DEFAULT NULL
) RETURNS TABLE(
  id BIGINT,
  nom TEXT,
  prenom TEXT,
  specialite TEXT,
  specialite_id INTEGER,
  actif BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.nom,
    u.prenom,
    s.nom as specialite,
    s.id as specialite_id,
    u.actif
  FROM public.users u
  LEFT JOIN public.specialites s ON u.specialite_id = s.id
  WHERE 
    u.role = 'medecin'
    AND u.actif = TRUE
    AND (p_specialite_id IS NULL OR u.specialite_id = p_specialite_id)
  ORDER BY u.prenom, u.nom;
END;
$$ LANGUAGE plpgsql;

-- 4. Créer une vue pour les patients avec médecin indisponible
CREATE OR REPLACE VIEW waiting_queue_doctor_unavailable AS
SELECT 
  wq.id,
  wq.patient_id,
  wq.medecin_id,
  wq.appointment_id,
  wq.status,
  p.nom as patient_nom,
  p.prenom as patient_prenom,
  u.nom as medecin_nom,
  u.prenom as medecin_prenom,
  u.actif as medecin_actif,
  u.specialite_id,
  s.nom as specialite_nom,
  CASE 
    WHEN u.actif = FALSE THEN 'Médecin inactif'
    ELSE 'Médecin actif'
  END as medecin_status
FROM public.waiting_queue wq
JOIN public.patients p ON wq.patient_id = p.id
JOIN public.users u ON wq.medecin_id = u.id
LEFT JOIN public.specialites s ON u.specialite_id = s.id
WHERE 
  wq.status IN ('appele', 'called', 'waiting', 'en_attente')
  AND wq.removed_at_end_of_day = FALSE
  AND u.actif = FALSE;

-- 5. Ajouter des commentaires pour documentation
COMMENT ON COLUMN public.waiting_queue.original_medecin_id IS 'ID du médecin original avant réassignation';
COMMENT ON COLUMN public.waiting_queue.reassignment_reason IS 'Raison de la réassignation';
COMMENT ON COLUMN public.waiting_queue.reassignment_timestamp IS 'Date et heure de la réassignation';
COMMENT ON FUNCTION public.reassign_patient_to_doctor(BIGINT, BIGINT, TEXT) IS 'Réassigne un patient à un autre médecin';
COMMENT ON FUNCTION public.get_available_doctors_by_speciality(INTEGER) IS 'Récupère les médecins disponibles par spécialité';
COMMENT ON VIEW waiting_queue_doctor_unavailable IS 'Vue des patients avec médecin indisponible';

-- 6. Test: Afficher les patients avec médecin indisponible
-- (Commenté par défaut, à décommenter pour tester)
-- SELECT * FROM waiting_queue_doctor_unavailable;
