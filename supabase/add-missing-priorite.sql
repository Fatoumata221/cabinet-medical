-- Script pour ajouter uniquement la colonne priorite manquante
-- Exécuter dans l'éditeur SQL de Supabase

-- Vérifier si la colonne priorite existe déjà
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'appointments' 
        AND column_name = 'priorite'
    ) THEN
        RAISE NOTICE '📝 Ajout de la colonne priorite...';
        
        -- Ajouter la colonne priorite
        ALTER TABLE public.appointments 
        ADD COLUMN priorite character varying DEFAULT 'normale'::character varying;
        
        -- Ajouter la contrainte de vérification
        ALTER TABLE public.appointments 
        ADD CONSTRAINT appointments_priorite_check 
        CHECK (priorite::text = ANY (ARRAY['normale'::character varying, 'urgente'::character varying, 'tres_urgente'::character varying]::text[]));
        
        -- Mettre à jour les données existantes
        UPDATE public.appointments 
        SET priorite = 'normale' 
        WHERE priorite IS NULL;
        
        -- Créer l'index pour les performances
        CREATE INDEX IF NOT EXISTS idx_appointments_priorite ON public.appointments(priorite);
        
        RAISE NOTICE '✅ Colonne priorite ajoutée avec succès !';
    ELSE
        RAISE NOTICE '✅ Colonne priorite existe déjà';
    END IF;
END $$;

-- Vérifier la structure finale
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'appointments'
    AND column_name IN ('priorite', 'created_by', 'updated_by')
ORDER BY column_name;

-- Vérifier quelques données
SELECT 
    id,
    patient_id,
    medecin_id,
    date_heure,
    motif,
    statut,
    duree,
    priorite,
    created_by IS NOT NULL as has_created_by,
    updated_by IS NOT NULL as has_updated_by
FROM public.appointments 
LIMIT 3;







