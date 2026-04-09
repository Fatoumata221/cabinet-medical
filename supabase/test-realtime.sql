-- Script simple pour tester les abonnements realtime
-- Exécuter dans l'éditeur SQL de Supabase

-- 1. Vérifier que les tables existent et ont des données
SELECT 'waiting_queue' as table_name, COUNT(*) as count FROM waiting_queue
UNION ALL
SELECT 'appointments' as table_name, COUNT(*) as count FROM appointments
UNION ALL
SELECT 'patients' as table_name, COUNT(*) as count FROM patients
UNION ALL
SELECT 'users' as table_name, COUNT(*) as count FROM users;

-- 2. Tester une insertion dans waiting_queue pour déclencher realtime
INSERT INTO waiting_queue (patient_id, medecin_id, status, priorite, motif)
VALUES (
  (SELECT id FROM patients LIMIT 1),
  (SELECT id FROM users WHERE role = 'doctor' LIMIT 1),
  'waiting',
  'normale',
  'Test realtime'
);

-- 3. Vérifier que l'insertion a fonctionné
SELECT * FROM waiting_queue ORDER BY created_at DESC LIMIT 1;

-- 4. Mettre à jour le statut pour tester les mises à jour realtime
UPDATE waiting_queue 
SET status = 'in_consultation', updated_at = NOW()
WHERE motif = 'Test realtime'
ORDER BY created_at DESC 
LIMIT 1;

-- 5. Vérifier la mise à jour
SELECT * FROM waiting_queue WHERE motif = 'Test realtime' ORDER BY created_at DESC LIMIT 1;

-- 6. Nettoyer le test
DELETE FROM waiting_queue WHERE motif = 'Test realtime';

-- 7. Vérifier le nettoyage
SELECT COUNT(*) as remaining_test_records FROM waiting_queue WHERE motif = 'Test realtime';




