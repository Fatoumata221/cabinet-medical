-- Script définitif pour corriger les problèmes realtime
-- Exécuter dans l'éditeur SQL de Supabase

-- 1. Vérifier et activer l'extension realtime
CREATE EXTENSION IF NOT EXISTS realtime;

-- 2. Supprimer les anciennes publications si elles existent
DROP PUBLICATION IF EXISTS supabase_realtime;

-- 3. Créer une nouvelle publication realtime
CREATE PUBLICATION supabase_realtime FOR ALL TABLES;

-- 4. Ajouter spécifiquement les tables importantes
ALTER PUBLICATION supabase_realtime ADD TABLE waiting_queue;
ALTER PUBLICATION supabase_realtime ADD TABLE appointments;
ALTER PUBLICATION supabase_realtime ADD TABLE patients;
ALTER PUBLICATION supabase_realtime ADD TABLE users;

-- 5. Vérifier que RLS est activé
ALTER TABLE waiting_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 6. Supprimer les anciennes politiques
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON waiting_queue;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON appointments;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON patients;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON users;

-- 7. Créer des politiques permissives pour realtime
CREATE POLICY "Enable read access for authenticated users" ON waiting_queue
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for authenticated users" ON appointments
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for authenticated users" ON patients
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for authenticated users" ON users
    FOR SELECT USING (auth.role() = 'authenticated');

-- 8. Accorder les permissions nécessaires
GRANT SELECT ON waiting_queue TO authenticated;
GRANT SELECT ON appointments TO authenticated;
GRANT SELECT ON patients TO authenticated;
GRANT SELECT ON users TO authenticated;

-- 9. Vérifier la configuration
SELECT 
    'Configuration finale' as info,
    pubname,
    puballtables
FROM pg_publication 
WHERE pubname = 'supabase_realtime';

-- 10. Vérifier les tables dans la publication
SELECT 
    'Tables dans publication' as info,
    p.pubname,
    pt.tablename
FROM pg_publication p
LEFT JOIN pg_publication_tables pt ON p.pubname = pt.pubname
WHERE p.pubname = 'supabase_realtime';

-- 11. Vérifier les politiques RLS
SELECT 
    'Politiques RLS' as info,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename IN ('waiting_queue', 'appointments', 'patients', 'users')
AND schemaname = 'public'
ORDER BY tablename, policyname;




