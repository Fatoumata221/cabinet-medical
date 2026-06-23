-- Fonction RPC pour que la secrétaire confirme la présence d'un patient et l'ajoute à la file d'attente
-- Date: 2026-06-23
-- Description: Cette fonction marque le patient comme arrivé (statut='arrive', statut_arrivee='arrive')
-- ET l'ajoute à la file d'attente avec le statut 'en_attente' en une seule action
-- Le patient doit être au statut 'confirme' pour pouvoir confirmer sa présence

-- Supprimer d'abord l'ancienne version avec uuid pour éviter les conflits
DROP FUNCTION IF EXISTS public.secretaire_confirme_patient_presence(uuid, uuid) CASCADE;

CREATE OR REPLACE FUNCTION secretaire_confirme_patient_presence(
    p_appointment_id bigint,
    p_secretaire_id uuid
)
RETURNS jsonb AS $$
DECLARE
    v_patient_id bigint;
    v_medecin_id bigint;
    v_date_heure timestamp with time zone;
    v_existing_queue_id bigint;
    v_max_order_position bigint;
    v_message text;
    v_current_statut text;
    v_current_statut_arrivee text;
BEGIN
    -- Récupérer les informations du rendez-vous
    SELECT patient_id, medecin_id, date_heure, statut, statut_arrivee
    INTO v_patient_id, v_medecin_id, v_date_heure, v_current_statut, v_current_statut_arrivee
    FROM public.appointments
    WHERE id = p_appointment_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Rendez-vous non trouvé: %', p_appointment_id;
    END IF;

    -- Vérifier que le rendez-vous est au statut 'confirme'
    IF v_current_statut != 'confirme' THEN
        RAISE EXCEPTION 'Le rendez-vous doit être au statut "confirme" pour confirmer la présence. Statut actuel: %', v_current_statut;
    END IF;

    -- Vérifier que le patient n'est pas déjà marqué comme arrivé
    IF v_current_statut_arrivee = 'arrive' THEN
        RAISE EXCEPTION 'Ce patient a déjà été confirmé présent';
    END IF;

    -- Marquer le patient comme arrivé dans le rendez-vous
    UPDATE public.appointments
    SET
        statut = 'arrive',
        statut_arrivee = 'arrive',
        heure_arrivee = now()
    WHERE id = p_appointment_id;

    -- Vérifier si le patient est déjà dans la file d'attente pour ce médecin
    SELECT id INTO v_existing_queue_id
    FROM public.waiting_queue
    WHERE patient_id = v_patient_id
    AND medecin_id = v_medecin_id
    AND status IN ('waiting', 'present', 'in_consultation')
    LIMIT 1;

    IF v_existing_queue_id IS NOT NULL THEN
        -- Le patient est déjà dans la file d'attente, mettre à jour le statut
        UPDATE public.waiting_queue
        SET
            status = 'waiting',
            arrived_at = now(),
            appointment_id = p_appointment_id
        WHERE id = v_existing_queue_id;

        v_message := 'Patient déjà dans la file d''attente, statut mis à jour à "waiting"';
    ELSE
        -- Ajouter le patient à la file d'attente
        -- Récupérer la position maximale actuelle
        SELECT COALESCE(MAX(order_position), 0) INTO v_max_order_position
        FROM public.waiting_queue
        WHERE medecin_id = v_medecin_id;

        INSERT INTO public.waiting_queue (
            patient_id,
            medecin_id,
            appointment_id,
            order_position,
            status,
            arrived_at,
            priority
        )
        VALUES (
            v_patient_id,
            v_medecin_id,
            p_appointment_id,
            v_max_order_position + 1,
            'waiting',
            now(),
            'normale'
        );

        v_message := 'Patient confirmé présent et ajouté à la file d''attente';
    END IF;

    -- Retourner un message de succès
    RETURN jsonb_build_object(
        'success', true,
        'message', v_message,
        'patient_id', v_patient_id,
        'medecin_id', v_medecin_id,
        'appointment_id', p_appointment_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Accorder les permissions nécessaires
GRANT EXECUTE ON FUNCTION secretaire_confirme_patient_presence(bigint, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION secretaire_confirme_patient_presence(bigint, uuid) TO anon;

RAISE NOTICE '✅ Fonction RPC secretaire_confirme_patient_presence créée avec succès';
