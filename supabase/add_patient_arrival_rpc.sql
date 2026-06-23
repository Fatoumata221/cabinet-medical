-- Fonction RPC pour que la secrétaire marque un patient comme arrivé
-- Date: 2026-06-19
-- Description: Cette fonction met à jour le statut du rendez-vous de 'confirmé' à 'arrivé'
-- Le patient apparaîtra dans les salles d'attente uniquement après ce changement

CREATE OR REPLACE FUNCTION secretaire_marque_patient_arrive(
    p_appointment_id bigint,
    p_secretaire_id uuid
)
RETURNS jsonb AS $$
DECLARE
    v_patient_id bigint;
    v_medecin_id bigint;
    v_date_heure timestamp with time zone;
    v_current_status text;
    v_message text;
BEGIN
    -- Récupérer les informations du rendez-vous
    SELECT patient_id, medecin_id, date_heure, statut
    INTO v_patient_id, v_medecin_id, v_date_heure, v_current_status
    FROM public.appointments
    WHERE id = p_appointment_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Rendez-vous non trouvé: %', p_appointment_id;
    END IF;

    -- Vérifier que le statut actuel est 'confirme'
    IF v_current_status != 'confirme' THEN
        RAISE EXCEPTION 'Le rendez-vous doit être au statut "confirme" pour être marqué comme arrivé. Statut actuel: %', v_current_status;
    END IF;

    -- Mettre à jour le statut du rendez-vous de 'confirme' à 'arrive'
    UPDATE public.appointments
    SET
        statut = 'arrive',
        statut_arrivee = 'arrive',
        heure_arrivee = now()
    WHERE id = p_appointment_id;

    v_message := 'Patient marqué comme arrivé. Il apparaît maintenant dans les salles d''attente.';

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
