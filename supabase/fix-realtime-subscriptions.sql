-- Script pour corriger les abonnements Realtime qui se ferment
-- Exécuter dans l'éditeur SQL de Supabase

-- 1. Vérifier la publication actuelle
SELECT 
    pubname,
    puballtables,
    pubinsert,
    pubupdate,
    pubdelete,
    pubtruncate
FROM pg_publication 
WHERE pubname = 'supabase_realtime';

-- 2. Vérifier quelles tables sont dans la publication
SELECT 
    schemaname,
    tablename
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime';

-- 3. Ajouter les tables manquantes à la publication Realtime
-- (Ces commandes peuvent échouer si les tables sont déjà ajoutées, c'est normal)
DO $$
BEGIN
    -- Ajouter waiting_queue si pas déjà présent
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE waiting_queue;
        RAISE NOTICE 'Table waiting_queue ajoutée à la publication Realtime';
    EXCEPTION
        WHEN duplicate_object THEN
            RAISE NOTICE 'Table waiting_queue déjà dans la publication Realtime';
    END;
    
    -- Ajouter notifications_realtime si pas déjà présent
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE notifications_realtime;
        RAISE NOTICE 'Table notifications_realtime ajoutée à la publication Realtime';
    EXCEPTION
        WHEN duplicate_object THEN
            RAISE NOTICE 'Table notifications_realtime déjà dans la publication Realtime';
    END;
    
    -- Ajouter appointments si pas déjà présent
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE appointments;
        RAISE NOTICE 'Table appointments ajoutée à la publication Realtime';
    EXCEPTION
        WHEN duplicate_object THEN
            RAISE NOTICE 'Table appointments déjà dans la publication Realtime';
    END;
    
    -- Ajouter patients si pas déjà présent
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE patients;
        RAISE NOTICE 'Table patients ajoutée à la publication Realtime';
    EXCEPTION
        WHEN duplicate_object THEN
            RAISE NOTICE 'Table patients déjà dans la publication Realtime';
    END;
END $$;

-- 4. Vérifier que les tables sont bien dans la publication
SELECT 
    schemaname,
    tablename
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime'
ORDER BY tablename;

-- 5. Vérifier les permissions sur les tables
SELECT 
    table_name,
    privilege_type,
    grantee
FROM information_schema.table_privileges 
WHERE table_name IN ('waiting_queue', 'notifications_realtime', 'appointments', 'patients')
AND grantee IN ('authenticated', 'anon', 'service_role')
ORDER BY table_name, privilege_type;

-- 6. Vérifier que RLS est activé sur toutes les tables
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('waiting_queue', 'notifications_realtime', 'appointments', 'patients')
ORDER BY tablename;

-- 7. Activer RLS si nécessaire (peut échouer si déjà activé, c'est normal)
DO $$
BEGIN
    BEGIN
        ALTER TABLE waiting_queue ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'RLS activé sur waiting_queue';
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE 'RLS déjà activé sur waiting_queue ou erreur: %', SQLERRM;
    END;
    
    BEGIN
        ALTER TABLE notifications_realtime ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'RLS activé sur notifications_realtime';
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE 'RLS déjà activé sur notifications_realtime ou erreur: %', SQLERRM;
    END;
    
    BEGIN
        ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'RLS activé sur appointments';
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE 'RLS déjà activé sur appointments ou erreur: %', SQLERRM;
    END;
    
    BEGIN
        ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'RLS activé sur patients';
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE 'RLS déjà activé sur patients ou erreur: %', SQLERRM;
    END;
END $$;

-- 8. Vérifier les triggers sur les tables (importants pour Realtime)
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table IN ('waiting_queue', 'notifications_realtime', 'appointments', 'patients')
ORDER BY event_object_table, trigger_name;

-- 9. Test de connexion Realtime - insérer un enregistrement de test
DO $$
DECLARE
    test_id uuid;
    user_id_val uuid;
BEGIN
    -- Récupérer l'ID utilisateur actuel
    SELECT auth.uid() INTO user_id_val;
    
    IF user_id_val IS NOT NULL THEN
        -- Insérer un enregistrement de test dans notifications_realtime
        INSERT INTO notifications_realtime (type_notification, user_id, data, created_at)
        VALUES ('test_realtime', user_id_val, '{"test": true, "timestamp": "' || now() || '"}'::jsonb, now())
        RETURNING id INTO test_id;
        
        RAISE NOTICE 'Test Realtime réussi - ID: %', test_id;
        
        -- Nettoyer l'enregistrement de test
        DELETE FROM notifications_realtime WHERE id = test_id;
        RAISE NOTICE 'Enregistrement de test nettoyé';
    ELSE
        RAISE NOTICE 'Aucun utilisateur authentifié - test Realtime ignoré';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Erreur test Realtime: %', SQLERRM;
END $$;

-- 10. Résumé final de la configuration
SELECT 
    'Configuration Realtime' as summary,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') 
        THEN 'Publication Realtime: OK' 
        ELSE 'Publication Realtime: MANQUANTE' 
    END as publication_status,
    (SELECT COUNT(*) FROM pg_publication_tables WHERE pubname = 'supabase_realtime') as tables_in_publication,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'waiting_queue' AND rowsecurity = true) 
        THEN 'RLS waiting_queue: OK' 
        ELSE 'RLS waiting_queue: DÉSACTIVÉ' 
    END as rls_waiting_queue,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'notifications_realtime' AND rowsecurity = true) 
        THEN 'RLS notifications_realtime: OK' 
        ELSE 'RLS notifications_realtime: DÉSACTIVÉ' 
    END as rls_notifications;


