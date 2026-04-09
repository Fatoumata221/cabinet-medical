-- Script pour corriger les permissions realtime pour les abonnements
-- Exécuter dans l'éditeur SQL de Supabase

-- 1. Vérifier si les extensions realtime sont activées
SELECT * FROM pg_extension WHERE extname = 'realtime';

-- 2. Activer l'extension realtime si elle n'est pas activée
CREATE EXTENSION IF NOT EXISTS realtime;

-- 3. Vérifier les publications realtime
SELECT * FROM pg_publication WHERE pubname = 'supabase_realtime';

-- 4. Créer la publication realtime si elle n'existe pas
CREATE PUBLICATION supabase_realtime FOR ALL TABLES;

-- 5. Ajouter les tables spécifiques à la publication realtime
ALTER PUBLICATION supabase_realtime ADD TABLE waiting_queue;
ALTER PUBLICATION supabase_realtime ADD TABLE appointments;
ALTER PUBLICATION supabase_realtime ADD TABLE patients;
ALTER PUBLICATION supabase_realtime ADD TABLE users;

-- 6. Vérifier les politiques RLS pour waiting_queue
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'waiting_queue';

-- 7. Vérifier les politiques RLS pour appointments
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'appointments';

-- 8. Créer des politiques RLS permissives pour les abonnements realtime
-- Politique pour waiting_queue - permettre la lecture à tous les utilisateurs authentifiés
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON waiting_queue;
CREATE POLICY "Enable read access for authenticated users" ON waiting_queue
    FOR SELECT USING (auth.role() = 'authenticated');

-- Politique pour appointments - permettre la lecture à tous les utilisateurs authentifiés
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON appointments;
CREATE POLICY "Enable read access for authenticated users" ON appointments
    FOR SELECT USING (auth.role() = 'authenticated');

-- 9. Vérifier que RLS est activé sur les tables
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('waiting_queue', 'appointments', 'patients', 'users')
AND schemaname = 'public';

-- 10. Activer RLS si ce n'est pas fait
ALTER TABLE waiting_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 11. Vérifier les permissions sur les tables
SELECT 
    table_name,
    privilege_type,
    grantee
FROM information_schema.table_privileges 
WHERE table_name IN ('waiting_queue', 'appointments', 'patients', 'users')
AND table_schema = 'public';

-- 12. Accorder les permissions nécessaires pour realtime
GRANT SELECT ON waiting_queue TO authenticated;
GRANT SELECT ON appointments TO authenticated;
GRANT SELECT ON patients TO authenticated;
GRANT SELECT ON users TO authenticated;

-- 13. Vérifier la configuration realtime
SELECT * FROM realtime.subscription;

