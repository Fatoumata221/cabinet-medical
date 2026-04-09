-- Fix: Créer/Recréer la fonction RPC publique pour rechercher les usernames
-- Date: 2026-02-03
-- Description: Fonction publique pour l'autocomplétion des usernames dans le formulaire de login
--              Cette fonction contourne les politiques RLS en utilisant SECURITY DEFINER

-- Supprimer l'ancienne fonction si elle existe
DROP FUNCTION IF EXISTS public.search_usernames(TEXT);

-- Recréer la fonction pour rechercher les usernames (publique pour l'autocomplétion)
-- SECURITY DEFINER permet d'exécuter la fonction avec les permissions du créateur (bypasse RLS)
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

-- Donner les permissions d'exécution à tous (anonyme et authentifié)
GRANT EXECUTE ON FUNCTION public.search_usernames(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.search_usernames(TEXT) TO authenticated;

-- Commentaire sur la fonction
COMMENT ON FUNCTION public.search_usernames(TEXT) IS 'Fonction publique pour rechercher les usernames actifs pour l''autocomplétion dans le formulaire de login. Utilise SECURITY DEFINER pour contourner les politiques RLS.';
