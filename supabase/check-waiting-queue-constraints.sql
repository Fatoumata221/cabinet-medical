-- Vérifier les contraintes CHECK sur la table waiting_queue
SELECT 
    tc.constraint_name,
    cc.check_clause
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc 
    ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'waiting_queue' 
    AND tc.table_schema = 'public'
    AND tc.constraint_type = 'CHECK';
