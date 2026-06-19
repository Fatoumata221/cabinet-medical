-- Script pour supprimer la fonction dupliquée avec le mauvais type de paramètre
-- Date: 2026-06-19
-- Description: Supprime la version obsolète de secretaire_marque_patient_arrive avec p_secretaire_id bigint

-- Supprimer la version avec p_secretaire_id bigint (obsolète)
DROP FUNCTION IF EXISTS public.secretaire_marque_patient_arrive(bigint, bigint);

-- Vérifier qu'il ne reste que la version avec p_secretaire_id uuid
SELECT 
    proname as function_name,
    pg_get_function_arguments(oid) as arguments
FROM pg_proc 
WHERE proname = 'secretaire_marque_patient_arrive'
AND pronamespace = 'public'::regnamespace;

RAISE NOTICE '✅ Fonction dupliquée supprimée. Seule la version avec p_secretaire_id uuid devrait rester.';
