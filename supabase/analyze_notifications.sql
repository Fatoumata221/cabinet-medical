-- Script d'analyse des tables de notifications
-- Exécutez ce script dans le dashboard Supabase pour voir la structure actuelle

-- 1. Lister toutes les tables de notifications
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public'
AND table_name LIKE '%notification%'
ORDER BY table_name;

-- 2. Structure de notifications_medecin_secretaire
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications_medecin_secretaire' AND table_schema = 'public') THEN
    RAISE NOTICE '=== Structure de notifications_medecin_secretaire ===';
  ELSE
    RAISE NOTICE 'Table notifications_medecin_secretaire n''existe pas';
  END IF;
END $$;

SELECT 
    'notifications_medecin_secretaire' as table_name,
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'notifications_medecin_secretaire' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Structure de notifications_realtime
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications_realtime' AND table_schema = 'public') THEN
    RAISE NOTICE '=== Structure de notifications_realtime ===';
  ELSE
    RAISE NOTICE 'Table notifications_realtime n''existe pas';
  END IF;
END $$;

SELECT 
    'notifications_realtime' as table_name,
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'notifications_realtime' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. Structure de realtime_notifications
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'realtime_notifications' AND table_schema = 'public') THEN
    RAISE NOTICE '=== Structure de realtime_notifications ===';
  ELSE
    RAISE NOTICE 'Table realtime_notifications n''existe pas';
  END IF;
END $$;

SELECT 
    'realtime_notifications' as table_name,
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'realtime_notifications' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 5. Vérifier si tenant_id existe dans ces tables
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_schema = 'public'
AND table_name LIKE '%notification%'
AND column_name = 'tenant_id';

-- 6. Compter les enregistrements dans chaque table (avec gestion d'erreur)
DO $$
BEGIN
  RAISE NOTICE '=== Comptage des enregistrements ===';
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications_medecin_secretaire' AND table_schema = 'public') THEN
    EXECUTE 'SELECT COUNT(*) FROM notifications_medecin_secretaire';
  END IF;
END $$;

-- 7. Vérifier les politiques RLS sur les tables de notifications
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
WHERE tablename LIKE '%notification%'
ORDER BY tablename, policyname;
