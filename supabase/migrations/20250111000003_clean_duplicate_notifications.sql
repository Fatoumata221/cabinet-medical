-- Migration pour nettoyer les notifications dupliquées et mal attribuées
-- Date: 2025-01-11

-- Supprimer les notifications de type "consultation_ended" et "patient_ready" 
-- qui ont été envoyées aux médecins (elles doivent aller uniquement aux secrétaires)
DELETE FROM public.notifications_medecin_secretaire
WHERE type_notification IN ('consultation_ended', 'patient_ready');

-- Note: Ces notifications seront recréées correctement par le système
-- Les médecins ne doivent recevoir QUE:
-- - patient_on_way (patient en route)
-- - doctor_request / demande_autorisation (demande d'introduction patient)

-- Les secrétaires reçoivent:
-- - patient_ready (médecin prêt à recevoir)
-- - consultation_ended (consultation terminée)
-- - Toutes les autres notifications
