-- =====================================================
-- SCRIPT RAPIDE DE CORRECTION RLS - COPIER-COLLER DANS SUPABASE
-- =====================================================
-- Instructions:
-- 1. Ouvrez: https://supabase.com/dashboard/project/zddaandjckkbidudduum/sql/new
-- 2. Copiez TOUT ce fichier et collez-le dans l'éditeur
-- 3. Cliquez sur "Run" (ou Ctrl+Enter)
-- =====================================================

BEGIN;

-- ÉTAPE 1: Nettoyer les anciennes politiques RLS
DROP POLICY IF EXISTS "Accès complet pour tous" ON public.users;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.users;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.users;
DROP POLICY IF EXISTS "Enable update for users based on id" ON public.users;
DROP POLICY IF EXISTS "Enable delete for users based on id" ON public.users;
DROP POLICY IF EXISTS "Users are viewable by everyone" ON public.users;
DROP POLICY IF EXISTS "Users can insert their own data" ON public.users;
DROP POLICY IF EXISTS "Users can update their own data" ON public.users;
DROP POLICY IF EXISTS "Users can delete their own data" ON public.users;
DROP POLICY IF EXISTS "Allow anonymous read access to active users" ON public.users;
DROP POLICY IF EXISTS "Allow authenticated read access" ON public.users;
DROP POLICY IF EXISTS "Allow authenticated insert" ON public.users;
DROP POLICY IF EXISTS "Allow authenticated update own data" ON public.users;
DROP POLICY IF EXISTS "Allow authenticated update" ON public.users;
DROP POLICY IF EXISTS "Allow authenticated delete" ON public.users;

-- ÉTAPE 2: Créer des politiques RLS simples (pas de récursion)
CREATE POLICY "authenticated_read" ON public.users FOR SELECT TO authenticated USING (true);
CREATE POLICY "authenticated_insert" ON public.users FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "authenticated_update" ON public.users FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_delete" ON public.users FOR DELETE TO authenticated USING (true);

-- ÉTAPE 3: Fonction pour rechercher les usernames (autocomplétion)
DROP FUNCTION IF EXISTS public.search_usernames(TEXT);
CREATE FUNCTION public.search_usernames(search_term TEXT)
RETURNS TABLE (username VARCHAR, nom VARCHAR, prenom VARCHAR, role VARCHAR) 
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT u.username, u.nom, u.prenom, u.role
  FROM public.users u
  WHERE u.actif = true AND u.username ILIKE '%' || search_term || '%'
  ORDER BY u.username
  LIMIT 10;
END;
$$;
GRANT EXECUTE ON FUNCTION public.search_usernames(TEXT) TO anon, authenticated;

-- ÉTAPE 4: Fonction pour récupérer un utilisateur par username (connexion)
DROP FUNCTION IF EXISTS public.get_user_by_username(TEXT);
CREATE FUNCTION public.get_user_by_username(p_username TEXT)
RETURNS TABLE (id BIGINT, email VARCHAR, username VARCHAR, auth_id UUID, actif BOOLEAN, role VARCHAR) 
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT u.id, u.email, u.username, u.auth_id, u.actif, u.role
  FROM public.users u
  WHERE u.username = p_username AND u.actif = true
  LIMIT 1;
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_user_by_username(TEXT) TO anon, authenticated;

COMMIT;

-- =====================================================
-- VÉRIFICATION (optionnel - vous pouvez décommenter pour tester)
-- =====================================================
-- SELECT 'Fonctions créées:' as check_type;
-- SELECT routine_name, security_type FROM information_schema.routines 
-- WHERE routine_schema = 'public' AND routine_name IN ('search_usernames', 'get_user_by_username');

-- SELECT 'Politiques RLS:' as check_type;
-- SELECT policyname, cmd FROM pg_policies WHERE tablename = 'users' AND schemaname = 'public';
