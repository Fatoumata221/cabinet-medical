-- Script pour vérifier les fonctions dupliquées dans la base de données
-- Date: 2026-06-19
-- Description: Identifie toutes les fonctions qui ont plusieurs versions avec des signatures différentes

-- Trouver toutes les fonctions qui ont des signatures multiples
SELECT 
    proname as function_name,
    count(*) as version_count,
    string_agg(pg_get_function_arguments(oid), ', ') as all_signatures
FROM pg_proc 
WHERE pronamespace = 'public'::regnamespace
GROUP BY proname
HAVING count(*) > 1
ORDER BY proname;

-- Afficher les détails de chaque fonction dupliquée
SELECT 
    p.proname as function_name,
    pg_get_function_arguments(p.oid) as arguments,
    pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
WHERE p.pronamespace = 'public'::regnamespace
AND p.proname IN (
    SELECT proname 
    FROM pg_proc 
    WHERE pronamespace = 'public'::regnamespace
    GROUP BY proname 
    HAVING count(*) > 1
)
ORDER BY p.proname, p.oid;
