-- Ajouter une contrainte d'unicité pour empêcher les doublons de rendez-vous
-- Règle métier : Un patient ne peut avoir qu'un seul rendez-vous par jour avec un médecin spécifique
-- Date: 2026-06-23

-- Supprimer d'abord l'index s'il existe
DROP INDEX IF EXISTS idx_appointments_patient_medecin_date;

-- Créer un index unique sur une expression (patient_id, medecin_id, DATE(date_heure))
-- L'index avec WHERE permet d'ignorer les rendez-vous annulés ou reportés
-- Cela permet de reprogrammer un rendez-vous annulé le même jour
CREATE UNIQUE INDEX idx_appointments_patient_medecin_date
ON public.appointments (patient_id, medecin_id, DATE(date_heure))
WHERE statut NOT IN ('annule', 'reporte');

RAISE NOTICE '✅ Index d''unicité ajouté avec succès';
