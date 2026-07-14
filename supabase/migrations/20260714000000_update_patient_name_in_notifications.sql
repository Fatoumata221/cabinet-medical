-- Migration pour mettre à jour les fonctions RPC afin d'afficher le nom complet (prénom + nom)
-- dans les notifications de demande d'introduction et autres notifications patient
-- Date: 2026-07-14

-- Mise à jour de la fonction medecin_appelle_patient
CREATE OR REPLACE FUNCTION medecin_appelle_patient(
    p_waiting_queue_id bigint,
    p_medecin_id bigint
)
RETURNS jsonb AS $$
DECLARE
    v_patient_id bigint;
    v_patient_prenom text;
    v_patient_nom text;
    v_patient_name text;
    v_message text;
BEGIN
    -- Récupérer les informations du patient dans la file d'attente
    SELECT wq.patient_id, p.prenom, p.nom
    INTO v_patient_id, v_patient_prenom, v_patient_nom
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

    -- Construire le nom complet (prénom + nom)
    v_patient_name := TRIM(COALESCE(v_patient_prenom, '') || ' ' || COALESCE(v_patient_nom, ''));
    IF v_patient_name = '' THEN
        v_patient_name := 'Patient inconnu';
    END IF;

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

-- Mise à jour de la fonction medecin_termine_consultation
CREATE OR REPLACE FUNCTION medecin_termine_consultation(
    p_waiting_queue_id bigint,
    p_medecin_id bigint
)
RETURNS jsonb AS $$
DECLARE
    v_patient_id bigint;
    v_patient_prenom text;
    v_patient_nom text;
    v_patient_name text;
    v_appointment_id bigint;
    v_cabinet_id bigint;
    v_medecin_cabinet_id bigint;
    v_message text;
BEGIN
    -- Récupérer les informations du patient dans la file d'attente
    SELECT wq.patient_id, p.prenom, p.nom, wq.appointment_id, wq.cabinet_id
    INTO v_patient_id, v_patient_prenom, v_patient_nom, v_appointment_id, v_cabinet_id
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

    -- Construire le nom complet (prénom + nom)
    v_patient_name := TRIM(COALESCE(v_patient_prenom, '') || ' ' || COALESCE(v_patient_nom, ''));
    IF v_patient_name = '' THEN
        v_patient_name := 'Patient inconnu';
    END IF;

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

-- Mise à jour de la fonction secretaire_envoie_patient
DROP FUNCTION IF EXISTS public.secretaire_envoie_patient(bigint, uuid) CASCADE;
DROP FUNCTION IF EXISTS public.secretaire_envoie_patient(bigint, bigint) CASCADE;

CREATE OR REPLACE FUNCTION secretaire_envoie_patient(
    p_waiting_queue_id bigint,
    p_secretaire_id bigint
)
RETURNS jsonb AS $$
DECLARE
    v_patient_id bigint;
    v_medecin_id bigint;
    v_patient_prenom text;
    v_patient_nom text;
    v_patient_name text;
    v_message text;
BEGIN
    -- Récupérer les informations du patient dans la file d'attente
    SELECT wq.patient_id, wq.medecin_id, p.prenom, p.nom
    INTO v_patient_id, v_medecin_id, v_patient_prenom, v_patient_nom
    FROM public.waiting_queue wq
    JOIN public.patients p ON wq.patient_id = p.id
    WHERE wq.id = p_waiting_queue_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Patient non trouvé dans la file d''attente: %', p_waiting_queue_id;
    END IF;

    -- Mettre à jour le statut du patient à 'en_consultation'
    UPDATE public.waiting_queue
    SET
        status = 'en_consultation',
        consultation_started_at = now(),
        updated_at = now()
    WHERE id = p_waiting_queue_id;

    -- Construire le nom complet (prénom + nom)
    v_patient_name := TRIM(COALESCE(v_patient_prenom, '') || ' ' || COALESCE(v_patient_nom, ''));
    IF v_patient_name = '' THEN
        v_patient_name := 'Patient inconnu';
    END IF;

    -- Retourner un message de succès
    RETURN jsonb_build_object(
        'success', true,
        'message', 'Patient envoyé dans le cabinet avec succès',
        'patient_id', v_patient_id,
        'medecin_id', v_medecin_id,
        'waiting_queue_id', p_waiting_queue_id,
        'patient_name', v_patient_name
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Accorder les permissions nécessaires
GRANT EXECUTE ON FUNCTION medecin_appelle_patient(bigint, bigint) TO authenticated;
GRANT EXECUTE ON FUNCTION medecin_appelle_patient(bigint, bigint) TO anon;
GRANT EXECUTE ON FUNCTION medecin_termine_consultation(bigint, bigint) TO authenticated;
GRANT EXECUTE ON FUNCTION medecin_termine_consultation(bigint, bigint) TO anon;
GRANT EXECUTE ON FUNCTION secretaire_envoie_patient(bigint, bigint) TO authenticated;
GRANT EXECUTE ON FUNCTION secretaire_envoie_patient(bigint, bigint) TO anon;
