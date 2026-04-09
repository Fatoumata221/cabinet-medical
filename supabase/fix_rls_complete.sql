-- =====================================================
-- SCRIPT DE CORRECTION COMPLET POUR LES PROBLÈMES RLS
-- Date: 2026-02-03
-- Description: Correction des politiques RLS et création des fonctions RPC nécessaires
-- =====================================================

-- ===========================
-- PARTIE 1: CORRIGER LES POLITIQUES RLS
-- ===========================

-- Supprimer toutes les anciennes politiques sur users
DROP POLICY IF EXISTS "Accès complet pour tous" ON public.users;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.users;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.users;
DROP POLICY IF EXISTS "Enable update for users based on id" ON public.users;
DROP POLICY IF EXISTS "Enable delete for users based on id" ON public.users;
DROP POLICY IF EXISTS "Users are viewable by everyone" ON public.users;
DROP POLICY IF EXISTS "Users can insert their own data" ON public.users;
DROP POLICY IF EXISTS "Users can update their own data" ON public.users;
DROP POLICY IF EXISTS "Users can delete their own data" ON public.users;

-- Créer des politiques simples et non-récursives
-- Note: Ces politiques NE PERMETTENT PAS l'accès direct en lecture à la table users pour les anonymes
-- L'accès se fera via les fonctions RPC avec SECURITY DEFINER

-- Politique pour lecture (authentifié seulement)
CREATE POLICY "Allow authenticated read access"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (true);

-- Politique pour insertion (authentifié seulement)
CREATE POLICY "Allow authenticated insert"
  ON public.users
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Politique pour mise à jour (authentifié seulement)
CREATE POLICY "Allow authenticated update"
  ON public.users
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Politique pour suppression (authentifié seulement)
CREATE POLICY "Allow authenticated delete"
  ON public.users
  FOR DELETE
  TO authenticated
  USING (true);

-- Activer RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- ===========================
-- PARTIE 2: CRÉER LES FONCTIONS RPC
-- ===========================

-- 2.1: Fonction pour rechercher les usernames (autocomplétion login)
DROP FUNCTION IF EXISTS public.search_usernames(TEXT);

CREATE OR REPLACE FUNCTION public.search_usernames(search_term TEXT)
RETURNS TABLE (
  username VARCHAR,
  nom VARCHAR,
  prenom VARCHAR,
  role VARCHAR
) 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.username,
    u.nom,
    u.prenom,
    u.role
  FROM public.users u
  WHERE 
    u.actif = true
    AND u.username ILIKE '%' || search_term || '%'
  ORDER BY u.username
  LIMIT 10;
END;
$$;

GRANT EXECUTE ON FUNCTION public.search_usernames(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.search_usernames(TEXT) TO authenticated;

COMMENT ON FUNCTION public.search_usernames(TEXT) IS 'Fonction publique pour rechercher les usernames actifs pour l''autocomplétion dans le formulaire de login. Utilise SECURITY DEFINER pour contourner les politiques RLS.';

-- 2.2: Fonction pour récupérer un utilisateur par username (authentification)
DROP FUNCTION IF EXISTS public.get_user_by_username(TEXT);

CREATE OR REPLACE FUNCTION public.get_user_by_username(p_username TEXT)
RETURNS TABLE (
  id BIGINT,
  email VARCHAR,
  username VARCHAR,
  auth_id UUID,
  actif BOOLEAN,
  role VARCHAR
) 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.email,
    u.username,
    u.auth_id,
    u.actif,
    u.role
  FROM public.users u
  WHERE 
    u.username = p_username
    AND u.actif = true
  LIMIT 1;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_by_username(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.get_user_by_username(TEXT) TO authenticated;

COMMENT ON FUNCTION public.get_user_by_username(TEXT) IS 'Fonction pour récupérer les données d''un utilisateur actif par username. Utilise SECURITY DEFINER pour contourner RLS.';

-- ===========================
-- VÉRIFICATION
-- ===========================

-- Vérifier que les fonctions ont été créées
SELECT 
  routine_name,
  routine_type,
  security_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('search_usernames', 'get_user_by_username');

-- Vérifier que les politiques sont en place
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'users' AND schemaname = 'public';
