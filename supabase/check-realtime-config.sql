-- Script pour vérifier la configuration realtime actuelle
-- Exécuter dans l'éditeur SQL de Supabase

-- 1. Vérifier les extensions installées
SELECT 
    'Extensions installées' as info,
    extname,
    extversion
FROM pg_extension 
WHERE extname IN ('realtime', 'supabase_vault');

-- 2. Vérifier les publications
SELECT 
    'Publications' as info,
    pubname,
    puballtables,
    pubinsert,
    pubupdate,
    pubdelete,
    pubtruncate
FROM pg_publication;

-- 3. Vérifier les tables dans les publications
SELECT 
    'Tables dans publications' as info,
    p.pubname,
    pt.tablename
FROM pg_publication p
LEFT JOIN pg_publication_tables pt ON p.pubname = pt.pubname
WHERE p.pubname = 'supabase_realtime';

-- 4. Vérifier RLS sur les tables importantes
SELECT 
    'Configuration RLS' as info,
    schemaname,
    tablename,
    rowsecurity as rls_enabled,
    hasrls
FROM pg_tables 
WHERE tablename IN ('waiting_queue', 'appointments', 'patients', 'users')
AND schemaname = 'public';

-- 5. Vérifier les politiques RLS
SELECT 
    'Politiques RLS' as info,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename IN ('waiting_queue', 'appointments', 'patients', 'users')
AND schemaname = 'public'
ORDER BY tablename, policyname;

-- 6. Vérifier les permissions sur les tables
SELECT 
    'Permissions tables' as info,
    table_name,
    privilege_type,
    grantee,
    is_grantable
FROM information_schema.table_privileges 
WHERE table_name IN ('waiting_queue', 'appointments', 'patients', 'users')
AND table_schema = 'public'
ORDER BY table_name, privilege_type;

-- 7. Vérifier les rôles et permissions
SELECT 
    'Rôles système' as info,
    rolname,
    rolsuper,
    rolinherit,
    rolcreaterole,
    rolcreatedb,
    rolcanlogin
FROM pg_roles 
WHERE rolname IN ('authenticated', 'anon', 'service_role', 'supabase_auth_admin');

-- 8. Vérifier la configuration realtime dans les paramètres
SELECT 
    'Configuration realtime' as info,
    name,
    setting,
    unit,
    context
FROM pg_settings 
WHERE name LIKE '%realtime%' OR name LIKE '%wal%' OR name LIKE '%logical%';

-- 9. Vérifier les abonnements realtime actifs
SELECT 
    'Abonnements realtime' as info,
    subscription_name,
    publication_name,
    enabled
FROM pg_subscription;

-- 10. Vérifier les slots de réplication
SELECT 
    'Slots de réplication' as info,
    slot_name,
    plugin,
    slot_type,
    active,
    xmin,
    catalog_xmin
FROM pg_replication_slots;

