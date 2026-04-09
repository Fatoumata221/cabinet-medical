-- Fix: Créer une fonction RPC pour récupérer un utilisateur par username (pour l'authentification)
-- Date: 2026-02-03
-- Description: Fonction sécurisée pour récupérer les données utilisateur lors de la connexion

-- Supprimer l'ancienne fonction si elle existe
DROP FUNCTION IF EXISTS public.get_user_by_username(TEXT);

-- Fonction pour récupérer un utilisateur par username
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

-- Donner les permissions d'exécution à tous (anonyme et authentifié)
GRANT EXECUTE ON FUNCTION public.get_user_by_username(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.get_user_by_username(TEXT) TO authenticated;

-- Commentaire sur la fonction
COMMENT ON FUNCTION public.get_user_by_username(TEXT) IS 'Fonction pour récupérer les données d''un utilisateur actif par username. Utilise SECURITY DEFINER pour contourner RLS.';
