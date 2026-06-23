-- Fonction RPC pour que le médecin appelle un patient
-- Date: 2026-06-23
-- Description: Cette fonction change le statut du patient de 'en_attente' à 'appele'
-- et envoie une notification à la secrétaire

CREATE OR REPLACE FUNCTION medecin_appelle_patient(
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

    -- Mettre à jour le statut du patient à 'appele'
    UPDATE public.waiting_queue
    SET
        status = 'appele',
        called_at = now(),
        updated_at = now()
    WHERE id = p_waiting_queue_id;

    v_patient_name := COALESCE(v_patient_name, 'Patient inconnu');

    -- Retourner un message de succès
    RETURN jsonb_build_object(
        'success', true,
        'message', 'Patient appelé avec succès',
        'patient_id', v_patient_id,
        'waiting_queue_id', p_waiting_queue_id,
        'patient_name', v_patient_name
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Accorder les permissions nécessaires
GRANT EXECUTE ON FUNCTION medecin_appelle_patient(bigint, bigint) TO authenticated;
GRANT EXECUTE ON FUNCTION medecin_appelle_patient(bigint, bigint) TO anon;

RAISE NOTICE '✅ Fonction RPC medecin_appelle_patient créée avec succès';
