-- Fonction RPC pour que le médecin termine une consultation
-- Date: 2026-07-01
-- Description: Cette fonction change le statut du patient de 'en_consultation' à 'termine'
-- et enregistre l'heure de fin de consultation

CREATE OR REPLACE FUNCTION medecin_termine_consultation(
    p_waiting_queue_id bigint,
    p_medecin_id bigint
)
RETURNS jsonb AS $$
DECLARE
    v_patient_id bigint;
    v_patient_name text;
    v_message text;
BEGIN
    -- Récupérer les informations du patient dans la file d'attente
    SELECT wq.patient_id, p.nom, p.prenom
    INTO v_patient_id, v_patient_name
    FROM public.waiting_queue wq
    JOIN public.patients p ON wq.patient_id = p.id
    WHERE wq.id = p_waiting_queue_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Patient non trouvé dans la file d''attente: %', p_waiting_queue_id;
    END IF;

    -- Mettre à jour le statut du patient à 'termine'
    UPDATE public.waiting_queue
    SET
        status = 'termine',
        consultation_ended_at = now(),
        updated_at = now()
    WHERE id = p_waiting_queue_id;

    v_patient_name := COALESCE(v_patient_name, 'Patient inconnu');

    -- Retourner un message de succès
    RETURN jsonb_build_object(
        'success', true,
        'message', 'Consultation terminée avec succès',
        'patient_id', v_patient_id,
        'waiting_queue_id', p_waiting_queue_id,
        'patient_name', v_patient_name
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Accorder les permissions nécessaires
GRANT EXECUTE ON FUNCTION medecin_termine_consultation(bigint, bigint) TO authenticated;
GRANT EXECUTE ON FUNCTION medecin_termine_consultation(bigint, bigint) TO anon;
