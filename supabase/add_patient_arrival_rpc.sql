-- Fonction RPC pour que la secrétaire marque un patient comme arrivé
-- Date: 2026-06-19
-- Description: Cette fonction met à jour le statut d'arrivée du rendez-vous SANS ajouter le patient à la file d'attente
-- Le patient ne sera ajouté à la file d'attente que lors de la confirmation de présence

CREATE OR REPLACE FUNCTION secretaire_marque_patient_arrive(
    p_appointment_id bigint,
    p_secretaire_id uuid
)
RETURNS jsonb AS $$
DECLARE
    v_patient_id bigint;
    v_medecin_id bigint;
    v_date_heure timestamp with time zone;
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
    -- NE PAS ajouter le patient à la file d'attente - cela se fera lors de la confirmation de présence
    UPDATE public.appointments
    SET
        statut_arrivee = 'arrive',
        heure_arrivee = now()
    WHERE id = p_appointment_id;

    v_message := 'Patient marqué comme arrivé. Confirmez sa présence pour l''ajouter à la salle d''attente.';

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
GRANT EXECUTE ON FUNCTION secretaire_marque_patient_arrive(bigint, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION secretaire_marque_patient_arrive(bigint, uuid) TO anon;

RAISE NOTICE '✅ Fonction RPC secretaire_marque_patient_arrive créée avec succès';
