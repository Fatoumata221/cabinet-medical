-- Vérifier les triggers sur la table paiements
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement,
    action_timing
FROM information_schema.triggers
WHERE event_object_table = 'paiements'
AND trigger_schema = 'public';

-- Vérifier les triggers sur la table factures
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement,
    action_timing
FROM information_schema.triggers
WHERE event_object_table = 'factures'
AND trigger_schema = 'public';
