-- Fonction RPC pour que le médecin termine une consultation
-- Date: 2026-06-23
-- Description: Cette fonction change le statut du patient de 'en_consultation' à 'termine'
-- et enregistre l'heure de fin de consultation
-- Cette fonction vérifie que le médecin appartient au bon cabinet

CREATE OR REPLACE FUNCTION medecin_termine_consultation(
    p_waiting_queue_id bigint,
    p_medecin_id bigint
)
RETURNS jsonb AS $$
DECLARE
    v_patient_id bigint;
    v_patient_name text;
    v_appointment_id bigint;
    v_cabinet_id bigint;
    v_medecin_cabinet_id bigint;
    v_message text;
BEGIN
    -- Récupérer les informations du patient dans la file d'attente
    SELECT wq.patient_id, p.nom, p.prenom, wq.appointment_id, wq.cabinet_id
    INTO v_patient_id, v_patient_name, v_appointment_id, v_cabinet_id
    FROM public.waiting_queue wq
    JOIN public.patients p ON wq.patient_id = p.id
    WHERE wq.id = p_waiting_queue_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Patient non trouvé dans la file d''attente: %', p_waiting_queue_id;
    END IF;

    -- Vérifier que le médecin appartient au même cabinet que la waiting_queue
    SELECT cabinet_id INTO v_medecin_cabinet_id
    FROM public.users
    WHERE id = p_medecin_id;

    IF v_medecin_cabinet_id IS NULL THEN
        RAISE EXCEPTION 'Médecin non trouvé: %', p_medecin_id;
    END IF;

    IF v_cabinet_id != v_medecin_cabinet_id THEN
        RAISE EXCEPTION 'Le médecin n''appartient pas au même cabinet que la file d''attente: Médecin cabinet=%, Waiting queue cabinet=%', v_medecin_cabinet_id, v_cabinet_id;
    END IF;

    -- Mettre à jour le statut du patient à 'termine'
    UPDATE public.waiting_queue
    SET
        status = 'termine',
        consultation_ended_at = now(),
        updated_at = now()
    WHERE id = p_waiting_queue_id
    AND cabinet_id = v_cabinet_id;

    -- Mettre à jour le statut du rendez-vous correspondant s'il existe
    IF v_appointment_id IS NOT NULL THEN
        UPDATE public.appointments
        SET
            statut = 'termine',
            updated_at = now()
        WHERE id = v_appointment_id
        AND cabinet_id = v_cabinet_id;
    END IF;

    v_patient_name := COALESCE(v_patient_name, 'Patient inconnu');

    -- Retourner un message de succès
    RETURN jsonb_build_object(
        'success', true,
        'message', 'Consultation terminée avec succès',
        'patient_id', v_patient_id,
        'waiting_queue_id', p_waiting_queue_id,
        'appointment_id', v_appointment_id,
        'cabinet_id', v_cabinet_id,
        'patient_name', v_patient_name
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Accorder les permissions nécessaires
GRANT EXECUTE ON FUNCTION medecin_termine_consultation(bigint, bigint) TO authenticated;
GRANT EXECUTE ON FUNCTION medecin_termine_consultation(bigint, bigint) TO anon;

RAISE NOTICE '✅ Fonction RPC medecin_termine_consultation créée avec succès';
