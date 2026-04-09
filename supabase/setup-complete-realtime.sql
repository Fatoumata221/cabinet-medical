-- Configuration complète pour TOUS les realtime de l'application
-- Exécuter dans l'éditeur SQL de Supabase

-- ==================== CONFIGURATION DE BASE ====================

-- 1. Activer l'extension realtime
CREATE EXTENSION IF NOT EXISTS realtime;

-- 2. Supprimer les anciennes publications
DROP PUBLICATION IF EXISTS supabase_realtime;

-- 3. Créer une publication realtime complète
CREATE PUBLICATION supabase_realtime FOR ALL TABLES;

-- 4. Ajouter toutes les tables importantes
ALTER PUBLICATION supabase_realtime ADD TABLE waiting_queue;
ALTER PUBLICATION supabase_realtime ADD TABLE appointments;
ALTER PUBLICATION supabase_realtime ADD TABLE patients;
ALTER PUBLICATION supabase_realtime ADD TABLE users;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications_realtime;
ALTER PUBLICATION supabase_realtime ADD TABLE billing;

-- ==================== OPTIMISATION WAL ====================

-- 5. Configurer les paramètres WAL pour optimiser realtime
ALTER SYSTEM SET wal_buffers = '16MB';
ALTER SYSTEM SET max_wal_size = '1GB';
ALTER SYSTEM SET min_wal_size = '80MB';
ALTER SYSTEM SET wal_level = 'logical';
ALTER SYSTEM SET max_replication_slots = 20;
ALTER SYSTEM SET max_wal_senders = 20;

-- ==================== ROW LEVEL SECURITY ====================

-- 6. Activer RLS sur toutes les tables
ALTER TABLE waiting_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications_realtime ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing ENABLE ROW LEVEL SECURITY;

-- ==================== POLITIQUES RLS ====================

-- 7. Supprimer les anciennes politiques
DROP POLICY IF EXISTS "Enable realtime read for authenticated users" ON waiting_queue;
DROP POLICY IF EXISTS "Enable realtime read for authenticated users" ON appointments;
DROP POLICY IF EXISTS "Enable realtime read for authenticated users" ON patients;
DROP POLICY IF EXISTS "Enable realtime read for authenticated users" ON users;
DROP POLICY IF EXISTS "Enable realtime read for authenticated users" ON notifications_realtime;
DROP POLICY IF EXISTS "Enable realtime read for authenticated users" ON billing;

-- 8. Créer des politiques RLS optimisées pour realtime

-- Politique pour waiting_queue
CREATE POLICY "Enable realtime access for authenticated users" ON waiting_queue
    FOR ALL USING (auth.role() = 'authenticated');

-- Politique pour appointments
CREATE POLICY "Enable realtime access for authenticated users" ON appointments
    FOR ALL USING (auth.role() = 'authenticated');

-- Politique pour patients
CREATE POLICY "Enable realtime access for authenticated users" ON patients
    FOR ALL USING (auth.role() = 'authenticated');

-- Politique pour users
CREATE POLICY "Enable realtime access for authenticated users" ON users
    FOR ALL USING (auth.role() = 'authenticated');

-- Politique pour notifications_realtime
CREATE POLICY "Enable realtime access for authenticated users" ON notifications_realtime
    FOR ALL USING (auth.role() = 'authenticated');

-- Politique pour billing
CREATE POLICY "Enable realtime access for authenticated users" ON billing
    FOR ALL USING (auth.role() = 'authenticated');

-- ==================== PERMISSIONS ====================

-- 9. Accorder les permissions pour realtime
GRANT SELECT ON waiting_queue TO authenticated;
GRANT SELECT ON appointments TO authenticated;
GRANT SELECT ON patients TO authenticated;
GRANT SELECT ON users TO authenticated;
GRANT SELECT ON notifications_realtime TO authenticated;
GRANT SELECT ON billing TO authenticated;

-- 10. Accorder les permissions pour les opérations CRUD
GRANT INSERT, UPDATE, DELETE ON waiting_queue TO authenticated;
GRANT INSERT, UPDATE, DELETE ON appointments TO authenticated;
GRANT INSERT, UPDATE, DELETE ON patients TO authenticated;
GRANT INSERT, UPDATE, DELETE ON users TO authenticated;
GRANT INSERT, UPDATE, DELETE ON notifications_realtime TO authenticated;
GRANT INSERT, UPDATE, DELETE ON billing TO authenticated;

-- ==================== INDEX POUR PERFORMANCE ====================

-- 11. Créer des index pour optimiser les requêtes realtime

-- Index pour waiting_queue
CREATE INDEX IF NOT EXISTS idx_waiting_queue_medecin_id ON waiting_queue(medecin_id);
CREATE INDEX IF NOT EXISTS idx_waiting_queue_status ON waiting_queue(status);
CREATE INDEX IF NOT EXISTS idx_waiting_queue_created_at ON waiting_queue(created_at);
CREATE INDEX IF NOT EXISTS idx_waiting_queue_patient_id ON waiting_queue(patient_id);

-- Index pour appointments
CREATE INDEX IF NOT EXISTS idx_appointments_medecin_id ON appointments(medecin_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date_heure ON appointments(date_heure);
CREATE INDEX IF NOT EXISTS idx_appointments_patient_id ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_statut ON appointments(statut);

-- Index pour patients
CREATE INDEX IF NOT EXISTS idx_patients_nom ON patients(nom);
CREATE INDEX IF NOT EXISTS idx_patients_prenom ON patients(prenom);
CREATE INDEX IF NOT EXISTS idx_patients_numero_dossier ON patients(numero_dossier);

-- Index pour users
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_nom ON users(nom);

-- Index pour notifications_realtime
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications_realtime(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_lu ON notifications_realtime(lu);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications_realtime(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications_realtime(type_notification);

-- Index pour billing
CREATE INDEX IF NOT EXISTS idx_billing_patient_id ON billing(patient_id);
CREATE INDEX IF NOT EXISTS idx_billing_medecin_id ON billing(medecin_id);
CREATE INDEX IF NOT EXISTS idx_billing_date ON billing(date);
CREATE INDEX IF NOT EXISTS idx_billing_statut ON billing(statut);

-- ==================== VÉRIFICATIONS ====================

-- 12. Vérifier la configuration de la publication
SELECT 
    'Configuration publication' as info,
    pubname,
    puballtables,
    pubinsert,
    pubupdate,
    pubdelete
FROM pg_publication 
WHERE pubname = 'supabase_realtime';

-- 13. Vérifier les tables dans la publication
SELECT 
    'Tables dans publication' as info,
    p.pubname,
    pt.tablename
FROM pg_publication p
LEFT JOIN pg_publication_tables pt ON p.pubname = pt.pubname
WHERE p.pubname = 'supabase_realtime'
ORDER BY pt.tablename;

-- 14. Vérifier les politiques RLS
SELECT 
    'Politiques RLS' as info,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename IN ('waiting_queue', 'appointments', 'patients', 'users', 'notifications_realtime', 'billing')
AND schemaname = 'public'
ORDER BY tablename, policyname;

-- 15. Vérifier les permissions
SELECT 
    'Permissions' as info,
    table_name,
    privilege_type,
    grantee
FROM information_schema.table_privileges 
WHERE table_name IN ('waiting_queue', 'appointments', 'patients', 'users', 'notifications_realtime', 'billing')
AND table_schema = 'public'
AND grantee = 'authenticated'
ORDER BY table_name, privilege_type;

-- 16. Vérifier les index créés
SELECT 
    'Index créés' as info,
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename IN ('waiting_queue', 'appointments', 'patients', 'users', 'notifications_realtime', 'billing')
AND schemaname = 'public'
ORDER BY tablename, indexname;

-- 17. Vérifier la configuration WAL
SELECT 
    'Configuration WAL' as info,
    name,
    setting,
    unit,
    context
FROM pg_settings 
WHERE name IN ('wal_level', 'max_replication_slots', 'max_wal_senders', 'wal_buffers', 'max_wal_size', 'min_wal_size')
ORDER BY name;

-- ==================== MESSAGE DE CONFIRMATION ====================

SELECT 
    'Configuration terminée' as status,
    'Tous les realtime sont maintenant configurés' as message,
    NOW() as timestamp;




