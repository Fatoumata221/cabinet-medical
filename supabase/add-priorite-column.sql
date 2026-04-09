-- Script pour ajouter la colonne priorite manquante
-- Exécuter dans l'éditeur SQL de Supabase

-- 1. Ajouter la colonne priorite à la table appointments
ALTER TABLE public.appointments 
ADD COLUMN priorite character varying DEFAULT 'normale'::character varying;

-- 2. Ajouter la contrainte de vérification pour les valeurs autorisées
ALTER TABLE public.appointments 
ADD CONSTRAINT appointments_priorite_check 
CHECK (priorite::text = ANY (ARRAY['normale'::character varying, 'urgente'::character varying, 'tres_urgente'::character varying]::text[]));

-- 3. Mettre à jour les données existantes avec la valeur par défaut
UPDATE public.appointments 
SET priorite = 'normale' 
WHERE priorite IS NULL;

-- 4. Vérifier que la colonne a été ajoutée
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'appointments'
    AND column_name = 'priorite';

-- 5. Vérifier quelques données
SELECT 
    id,
    patient_id,
    medecin_id,
    date_heure,
    motif,
    statut,
    duree,
    priorite
FROM public.appointments 
LIMIT 5;







