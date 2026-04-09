-- Script pour vérifier et corriger la configuration Supabase Realtime
-- pour la table notifications_realtime

-- ===== VÉRIFICATION DE LA CONFIGURATION REALTIME =====

-- Vérifier si la table notifications_realtime existe
SELECT 
  schemaname, 
  tablename, 
  hasindexes, 
  hasrules, 
  hastriggers 
FROM pg_tables 
WHERE tablename = 'notifications_realtime';

-- Vérifier les politiques RLS
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
WHERE tablename = 'notifications_realtime';

-- Vérifier si Realtime est activé pour la table
SELECT 
  schemaname,
  tablename,
  enabled
FROM pg_publication_tables 
WHERE tablename = 'notifications_realtime';

-- ===== ACTIVATION DE REALTIME POUR LA TABLE =====

-- Activer Realtime pour la table notifications_realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications_realtime;

-- ===== VÉRIFICATION DES TRIGGERS =====

-- Vérifier les triggers existants
SELECT 
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'notifications_realtime';

-- ===== CRÉATION D'UN TRIGGER POUR LES NOTIFICATIONS =====

-- Fonction trigger pour notifier les changements
CREATE OR REPLACE FUNCTION notify_realtime_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Notifier les changements via Realtime
  PERFORM pg_notify('realtime_changes', json_build_object(
    'table', TG_TABLE_NAME,
    'action', TG_OP,
    'old', CASE WHEN TG_OP = 'DELETE' THEN row_to_json(OLD) ELSE NULL END,
    'new', CASE WHEN TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN row_to_json(NEW) ELSE NULL END
  )::text);
  
  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger si il n'existe pas
DROP TRIGGER IF EXISTS notifications_realtime_trigger ON public.notifications_realtime;
CREATE TRIGGER notifications_realtime_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.notifications_realtime
  FOR EACH ROW EXECUTE FUNCTION notify_realtime_changes();

-- ===== VÉRIFICATION FINALE =====

-- Vérifier que tout est configuré correctement
SELECT 
  'Table exists' as check_type,
  CASE WHEN EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'notifications_realtime') 
       THEN 'OK' ELSE 'ERROR' END as status
UNION ALL
SELECT 
  'RLS enabled' as check_type,
  CASE WHEN EXISTS (SELECT 1 FROM pg_class WHERE relname = 'notifications_realtime' AND relrowsecurity = true) 
       THEN 'OK' ELSE 'ERROR' END as status
UNION ALL
SELECT 
  'Realtime enabled' as check_type,
  CASE WHEN EXISTS (SELECT 1 FROM pg_publication_tables WHERE tablename = 'notifications_realtime') 
       THEN 'OK' ELSE 'ERROR' END as status
UNION ALL
SELECT 
  'Trigger exists' as check_type,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.triggers WHERE event_object_table = 'notifications_realtime') 
       THEN 'OK' ELSE 'ERROR' END as status;


