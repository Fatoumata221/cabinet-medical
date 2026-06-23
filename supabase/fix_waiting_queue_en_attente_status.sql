-- Corriger les statuts incohérents dans waiting_queue
-- Les entrées 'en_attente' doivent être 'waiting' pour compatibilité frontend

UPDATE public.waiting_queue
SET status = 'waiting', updated_at = now()
WHERE status = 'en_attente';

-- Vérification
SELECT status, COUNT(*) AS count
FROM public.waiting_queue
WHERE status IN ('waiting', 'en_attente', 'appele', 'called', 'present', 'in_consultation', 'en_consultation')
GROUP BY status
ORDER BY status;
