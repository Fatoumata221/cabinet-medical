-- Script pour corriger les problèmes de Realtime
-- Exécuter dans l'éditeur SQL de Supabase

-- 1. Vérifier si Realtime est activé
SELECT * FROM pg_publication WHERE pubname = 'supabase_realtime';

-- 2. Activer Realtime pour les tables nécessaires
ALTER PUBLICATION supabase_realtime ADD TABLE waiting_queue;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications_realtime;
ALTER PUBLICATION supabase_realtime ADD TABLE appointments;
ALTER PUBLICATION supabase_realtime ADD TABLE patients;

-- 3. Vérifier les politiques RLS pour waiting_queue
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'waiting_queue';

-- 4. Vérifier les politiques RLS pour notifications_realtime
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'notifications_realtime';

-- 5. Créer une politique RLS simple pour notifications_realtime si elle n'existe pas
DO $$
BEGIN
    -- Vérifier si la politique existe déjà
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'notifications_realtime' 
        AND policyname = 'Enable all operations for authenticated users'
    ) THEN
        -- Créer la politique
        CREATE POLICY "Enable all operations for authenticated users" ON notifications_realtime
        FOR ALL USING (auth.role() = 'authenticated');
        
        RAISE NOTICE 'Politique RLS créée pour notifications_realtime';
    ELSE
        RAISE NOTICE 'Politique RLS existe déjà pour notifications_realtime';
    END IF;
END $$;

-- 6. Vérifier que RLS est activé
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('waiting_queue', 'notifications_realtime', 'appointments', 'patients');

-- 7. Activer RLS si nécessaire
ALTER TABLE waiting_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications_realtime ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;

-- 8. Vérifier la configuration Realtime
SELECT 
    schemaname,
    tablename,
    hasindexes,
    hasrules,
    hastriggers
FROM pg_tables 
WHERE tablename IN ('waiting_queue', 'notifications_realtime', 'appointments', 'patients');

-- 9. Vérifier les triggers
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table IN ('waiting_queue', 'notifications_realtime', 'appointments', 'patients');

-- 10. Test de connexion Realtime
-- Cette requête devrait retourner des résultats si Realtime fonctionne
SELECT 
    'Realtime Test' as test_name,
    COUNT(*) as waiting_queue_count
FROM waiting_queue;

-- 11. Vérifier les permissions utilisateur
SELECT 
    grantee,
    table_name,
    privilege_type
FROM information_schema.table_privileges 
WHERE table_name IN ('waiting_queue', 'notifications_realtime', 'appointments', 'patients')
AND grantee = 'authenticated';

-- 12. Afficher un résumé de la configuration
SELECT 
    'Configuration Realtime' as summary,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') 
        THEN 'Realtime activé' 
        ELSE 'Realtime désactivé' 
    END as realtime_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'waiting_queue' AND rowsecurity = true) 
        THEN 'RLS activé' 
        ELSE 'RLS désactivé' 
    END as rls_status;
