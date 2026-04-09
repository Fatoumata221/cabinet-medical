-- Script complet pour corriger tous les problèmes de colonnes
-- Exécuter dans l'éditeur SQL de Supabase

-- ===== ÉTAPE 1: VÉRIFICATION INITIALE =====
DO $$
BEGIN
    RAISE NOTICE '🔍 Vérification de la structure actuelle...';
END $$;

-- Vérifier la structure actuelle
SELECT 
    'Structure actuelle' as info,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'appointments'
ORDER BY ordinal_position;

-- ===== ÉTAPE 2: AJOUTER LA COLONNE PRIORITE =====
DO $$
BEGIN
    -- Vérifier si la colonne priorite existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'appointments' 
        AND column_name = 'priorite'
    ) THEN
        RAISE NOTICE '📝 Ajout de la colonne priorite...';
        
        -- Ajouter la colonne
        ALTER TABLE public.appointments 
        ADD COLUMN priorite character varying DEFAULT 'normale'::character varying;
        
        -- Ajouter la contrainte
        ALTER TABLE public.appointments 
        ADD CONSTRAINT appointments_priorite_check 
        CHECK (priorite::text = ANY (ARRAY['normale'::character varying, 'urgente'::character varying, 'tres_urgente'::character varying]::text[]));
        
        -- Mettre à jour les données existantes
        UPDATE public.appointments 
        SET priorite = 'normale' 
        WHERE priorite IS NULL;
        
        RAISE NOTICE '✅ Colonne priorite ajoutée avec succès';
    ELSE
        RAISE NOTICE '✅ Colonne priorite existe déjà';
    END IF;
END $$;

-- ===== ÉTAPE 3: AJOUTER LES COLONNES D'AUDIT =====
DO $$
BEGIN
    -- Ajouter created_by si elle n'existe pas
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'appointments' 
        AND column_name = 'created_by'
    ) THEN
        RAISE NOTICE '📝 Ajout de la colonne created_by...';
        ALTER TABLE public.appointments 
        ADD COLUMN created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;
        RAISE NOTICE '✅ Colonne created_by ajoutée';
    ELSE
        RAISE NOTICE '✅ Colonne created_by existe déjà';
    END IF;
    
    -- Ajouter updated_by si elle n'existe pas
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'appointments' 
        AND column_name = 'updated_by'
    ) THEN
        RAISE NOTICE '📝 Ajout de la colonne updated_by...';
        ALTER TABLE public.appointments 
        ADD COLUMN updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;
        RAISE NOTICE '✅ Colonne updated_by ajoutée';
    ELSE
        RAISE NOTICE '✅ Colonne updated_by existe déjà';
    END IF;
END $$;

-- Ajouter les colonnes d'audit pour patients
DO $$
BEGIN
    -- Ajouter created_by si elle n'existe pas
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'patients' 
        AND column_name = 'created_by'
    ) THEN
        RAISE NOTICE '📝 Ajout de la colonne created_by à patients...';
        ALTER TABLE public.patients 
        ADD COLUMN created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;
        RAISE NOTICE '✅ Colonne created_by ajoutée à patients';
    ELSE
        RAISE NOTICE '✅ Colonne created_by existe déjà dans patients';
    END IF;
    
    -- Ajouter updated_by si elle n'existe pas
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'patients' 
        AND column_name = 'updated_by'
    ) THEN
        RAISE NOTICE '📝 Ajout de la colonne updated_by à patients...';
        ALTER TABLE public.patients 
        ADD COLUMN updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;
        RAISE NOTICE '✅ Colonne updated_by ajoutée à patients';
    ELSE
        RAISE NOTICE '✅ Colonne updated_by existe déjà dans patients';
    END IF;
END $$;

-- Ajouter la colonne added_by pour waiting_queue
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'waiting_queue' 
        AND column_name = 'added_by'
    ) THEN
        RAISE NOTICE '📝 Ajout de la colonne added_by à waiting_queue...';
        ALTER TABLE public.waiting_queue 
        ADD COLUMN added_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;
        RAISE NOTICE '✅ Colonne added_by ajoutée à waiting_queue';
    ELSE
        RAISE NOTICE '✅ Colonne added_by existe déjà dans waiting_queue';
    END IF;
END $$;

-- ===== ÉTAPE 4: CRÉER LES INDEX =====
CREATE INDEX IF NOT EXISTS idx_appointments_created_by ON public.appointments(created_by);
CREATE INDEX IF NOT EXISTS idx_appointments_updated_by ON public.appointments(updated_by);
CREATE INDEX IF NOT EXISTS idx_appointments_priorite ON public.appointments(priorite);
CREATE INDEX IF NOT EXISTS idx_patients_created_by ON public.patients(created_by);
CREATE INDEX IF NOT EXISTS idx_patients_updated_by ON public.patients(updated_by);
CREATE INDEX IF NOT EXISTS idx_waiting_queue_added_by ON public.waiting_queue(added_by);

-- ===== ÉTAPE 5: VÉRIFICATION FINALE =====
DO $$
BEGIN
    RAISE NOTICE '🔍 Vérification finale...';
END $$;

-- Afficher la structure finale
SELECT 
    'Structure finale' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'appointments'
ORDER BY ordinal_position;

-- Vérifier les données
SELECT 
    'Données' as info,
    COUNT(*) as total_appointments,
    COUNT(priorite) as with_priorite,
    COUNT(created_by) as with_created_by,
    COUNT(updated_by) as with_updated_by
FROM public.appointments;

-- Afficher quelques exemples
SELECT 
    'Exemples' as info,
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







