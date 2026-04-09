-- Migration: Créer une fonction RPC publique pour rechercher les usernames
-- Date: 2025-01-16
-- Description: Fonction publique pour l'autocomplétion des usernames dans le formulaire de login

-- Fonction pour rechercher les usernames (publique pour l'autocomplétion)
CREATE OR REPLACE FUNCTION public.search_usernames(search_term TEXT)
RETURNS TABLE (
  username VARCHAR,
  nom VARCHAR,
  prenom VARCHAR,
  role VARCHAR
) AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Donner les permissions d'exécution à tous (anonyme)
GRANT EXECUTE ON FUNCTION public.search_usernames(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.search_usernames(TEXT) TO authenticated;

-- Commentaire sur la fonction
COMMENT ON FUNCTION public.search_usernames(TEXT) IS 'Fonction publique pour rechercher les usernames actifs pour l''autocomplétion dans le formulaire de login';

