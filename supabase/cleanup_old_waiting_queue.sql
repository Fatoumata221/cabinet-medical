-- Fonction pour nettoyer les anciennes entrées de waiting_queue
-- Cette fonction supprime ou marque comme terminées les entrées de waiting_queue
-- dont le rendez-vous est terminé, annulé ou largement dépassé
-- Cette fonction nettoie TOUS les cabinets (pas de filtre cabinet_id pour le nettoyage global)

CREATE OR REPLACE FUNCTION cleanup_old_waiting_queue()
RETURNS jsonb AS $$
DECLARE
    v_cleaned_count INTEGER;
    v_message TEXT;
BEGIN
    -- Marquer comme 'termine' les entrées dont le rendez-vous est terminé/annulé/reporté
    UPDATE public.waiting_queue wq
    SET
        status = 'termine',
        updated_at = now()
    FROM public.appointments a
    WHERE wq.appointment_id = a.id
    AND wq.status IN ('waiting', 'en_attente', 'present', 'arrive', 'authorized', 'called', 'appele', 'en_route', 'medecin_pret')
    AND a.statut IN ('termine', 'annule', 'reporte', 'absent', 'cancelled');

    GET DIAGNOSTICS v_cleaned_count = ROW_COUNT;

    -- Marquer comme 'termine' les entrées sans rendez-vous créées il y a plus de 24h
    UPDATE public.waiting_queue
    SET
        status = 'termine',
        updated_at = now()
    WHERE appointment_id IS NULL
    AND status IN ('waiting', 'en_attente', 'present', 'arrive', 'authorized', 'called', 'appele', 'en_route', 'medecin_pret')
    AND created_at < now() - interval '24 hours';

    GET DIAGNOSTICS v_cleaned_count = v_cleaned_count + ROW_COUNT;

    -- Marquer comme 'termine' les entrées avec rendez-vous dépassé de plus de 4h
    UPDATE public.waiting_queue wq
    SET
        status = 'termine',
        updated_at = now()
    FROM public.appointments a
    WHERE wq.appointment_id = a.id
    AND wq.status IN ('waiting', 'en_attente', 'present', 'arrive', 'authorized', 'called', 'appele', 'en_route', 'medecin_pret')
    AND a.date_heure < now() - interval '4 hours'
    AND a.statut NOT IN ('termine', 'annule', 'reporte', 'absent', 'cancelled');

    GET DIAGNOSTICS v_cleaned_count = v_cleaned_count + ROW_COUNT;

    v_message := format('Nettoyage terminé: %d entrées marquées comme terminées', v_cleaned_count);

    RETURN jsonb_build_object(
        'success', true,
        'message', v_message,
        'cleaned_count', v_cleaned_count
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Accorder les permissions nécessaires
GRANT EXECUTE ON FUNCTION cleanup_old_waiting_queue() TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_old_waiting_queue() TO anon;

RAISE NOTICE '✅ Fonction RPC cleanup_old_waiting_queue créée avec succès';

-- Créer une fonction pour exécuter le nettoyage automatiquement pour un cabinet spécifique
CREATE OR REPLACE FUNCTION cleanup_old_waiting_queue_for_cabinet(p_cabinet_id BIGINT)
RETURNS jsonb AS $$
DECLARE
    v_cleaned_count INTEGER;
    v_message TEXT;
BEGIN
    -- Marquer comme 'termine' les entrées dont le rendez-vous est terminé/annulé/reporté
    UPDATE public.waiting_queue wq
    SET
        status = 'termine',
        updated_at = now()
    FROM public.appointments a
    WHERE wq.appointment_id = a.id
    AND wq.status IN ('waiting', 'en_attente', 'present', 'arrive', 'authorized', 'called', 'appele', 'en_route', 'medecin_pret')
    AND a.statut IN ('termine', 'annule', 'reporte', 'absent', 'cancelled')
    AND wq.cabinet_id = p_cabinet_id;

    GET DIAGNOSTICS v_cleaned_count = ROW_COUNT;

    -- Marquer comme 'termine' les entrées sans rendez-vous créées il y a plus de 24h
    UPDATE public.waiting_queue
    SET
        status = 'termine',
        updated_at = now()
    WHERE appointment_id IS NULL
    AND status IN ('waiting', 'en_attente', 'present', 'arrive', 'authorized', 'called', 'appele', 'en_route', 'medecin_pret')
    AND created_at < now() - interval '24 hours'
    AND cabinet_id = p_cabinet_id;

    GET DIAGNOSTICS v_cleaned_count = v_cleaned_count + ROW_COUNT;

    -- Marquer comme 'termine' les entrées avec rendez-vous dépassé de plus de 4h
    UPDATE public.waiting_queue wq
    SET
        status = 'termine',
        updated_at = now()
    FROM public.appointments a
    WHERE wq.appointment_id = a.id
    AND wq.status IN ('waiting', 'en_attente', 'present', 'arrive', 'authorized', 'called', 'appele', 'en_route', 'medecin_pret')
    AND a.date_heure < now() - interval '4 hours'
    AND a.statut NOT IN ('termine', 'annule', 'reporte', 'absent', 'cancelled')
    AND wq.cabinet_id = p_cabinet_id;

    GET DIAGNOSTICS v_cleaned_count = v_cleaned_count + ROW_COUNT;

    v_message := format('Nettoyage terminé pour cabinet %d: %d entrées marquées comme terminées', p_cabinet_id, v_cleaned_count);

    RETURN jsonb_build_object(
        'success', true,
        'message', v_message,
        'cabinet_id', p_cabinet_id,
        'cleaned_count', v_cleaned_count
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Accorder les permissions nécessaires
GRANT EXECUTE ON FUNCTION cleanup_old_waiting_queue_for_cabinet(BIGINT) TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_old_waiting_queue_for_cabinet(BIGINT) TO anon;

RAISE NOTICE '✅ Fonction RPC cleanup_old_waiting_queue_for_cabinet créée avec succès';

-- Créer une fonction pour exécuter le nettoyage automatiquement (à appeler via cron ou job)
CREATE OR REPLACE FUNCTION auto_cleanup_waiting_queue()
RETURNS void AS $$
BEGIN
    PERFORM cleanup_old_waiting_queue();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION auto_cleanup_waiting_queue() TO authenticated;
GRANT EXECUTE ON FUNCTION auto_cleanup_waiting_queue() TO anon;

RAISE NOTICE '✅ Fonction RPC auto_cleanup_waiting_queue créée avec succès';
