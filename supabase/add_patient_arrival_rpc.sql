-- Fonction RPC pour que la secrétaire marque un patient comme arrivé
-- Date: 2026-06-19
-- Description: Cette fonction met à jour le statut d'arrivée du patient et l'ajoute à la file d'attente

CREATE OR REPLACE FUNCTION secretaire_marque_patient_arrive(
    p_appointment_id bigint,
    p_secretaire_id bigint
)
RETURNS jsonb AS $$
DECLARE
    v_patient_id bigint;
    v_medecin_id bigint;
    v_date_heure timestamp with time zone;
    v_existing_queue_id bigint;
    v_max_order_position bigint;
    v_message text;
BEGIN
    -- Récupérer les informations du rendez-vous
    SELECT patient_id, medecin_id, date_heure
    INTO v_patient_id, v_medecin_id, v_date_heure
    FROM public.appointments
    WHERE id = p_appointment_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Rendez-vous non trouvé: %', p_appointment_id;
    END IF;
    
    -- Mettre à jour le statut d'arrivée du rendez-vous
    UPDATE public.appointments
    SET 
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
            status = 'present',
            arrived_at = now(),
            appointment_id = p_appointment_id
        WHERE id = v_existing_queue_id;
        
        v_message := 'Patient déjà dans la file d''attente, statut mis à jour à "présent"';
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
            'present',
            now(),
            'normale'
        );
        
        v_message := 'Patient marqué présent et ajouté à la file d''attente';
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
GRANT EXECUTE ON FUNCTION secretaire_marque_patient_arrive(bigint, bigint) TO authenticated;
GRANT EXECUTE ON FUNCTION secretaire_marque_patient_arrive(bigint, bigint) TO anon;

RAISE NOTICE '✅ Fonction RPC secretaire_marque_patient_arrive créée avec succès';
