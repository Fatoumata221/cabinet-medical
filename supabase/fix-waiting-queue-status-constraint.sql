-- Corriger la contrainte CHECK pour les statuts de waiting_queue
-- Ajouter les statuts manquants: 'called' et 'absent'

-- 1. Supprimer l'ancienne contrainte
ALTER TABLE public.waiting_queue 
DROP CONSTRAINT IF EXISTS waiting_queue_status_check;

-- 2. Ajouter la nouvelle contrainte avec tous les statuts
ALTER TABLE public.waiting_queue 
ADD CONSTRAINT waiting_queue_status_check 
CHECK (status IN (
    'waiting',           -- En attente
    'called',            -- Appelé
    'present',           -- Présent
    'in_consultation',   -- En consultation
    'finished',          -- Terminé
    'absent',            -- Absent
    'late',              -- En retard
    'emergency'          -- Urgence
));

-- 3. Vérifier que la contrainte a été appliquée
SELECT 
    tc.constraint_name,
    cc.check_clause
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc 
    ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'waiting_queue' 
    AND tc.table_schema = 'public'
    AND tc.constraint_type = 'CHECK';
