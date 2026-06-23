-- Migration pour ajouter la colonne status à la table appointments
-- Date: 2026-06-22
-- Description: Ajout de la colonne status pour compatibilité avec le code frontend

-- Ajouter la colonne status si elle n'existe pas
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS status character varying DEFAULT 'confirmé';

-- Ajouter la contrainte CHECK pour status
ALTER TABLE public.appointments DROP CONSTRAINT IF EXISTS appointments_status_check;
ALTER TABLE public.appointments ADD CONSTRAINT appointments_status_check CHECK (status::text = ANY (ARRAY['confirmé'::character varying, 'arrivé'::character varying, 'en_attente'::character varying, 'annulé'::character varying, 'terminé'::character varying]::text[]));

-- Créer un index pour optimiser les requêtes sur status
CREATE INDEX IF NOT EXISTS idx_appointments_status ON public.appointments(status);

-- Synchroniser les valeurs existantes de statut vers status
UPDATE public.appointments 
SET status = CASE 
    WHEN statut = 'confirme' THEN 'confirmé'
    WHEN statut = 'en_attente' THEN 'en_attente'
    WHEN statut = 'annule' THEN 'annulé'
    WHEN statut = 'termine' THEN 'terminé'
    ELSE statut
END
WHERE status IS NULL OR status = '';

RAISE NOTICE '✅ Migration terminée avec succès!';
RAISE NOTICE '📋 Colonne ajoutée:';
RAISE NOTICE '   - appointments: status';
