-- Script pour ajouter les colonnes d'audit aux autres tables
-- Exécuter dans l'éditeur SQL de Supabase

-- ===== AJOUTER LES COLONNES D'AUDIT À LA TABLE PATIENTS =====
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
        CREATE INDEX IF NOT EXISTS idx_patients_created_by ON public.patients(created_by);
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
        CREATE INDEX IF NOT EXISTS idx_patients_updated_by ON public.patients(updated_by);
        RAISE NOTICE '✅ Colonne updated_by ajoutée à patients';
    ELSE
        RAISE NOTICE '✅ Colonne updated_by existe déjà dans patients';
    END IF;
END $$;

-- ===== AJOUTER LA COLONNE ADDED_BY À LA TABLE WAITING_QUEUE =====
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
        CREATE INDEX IF NOT EXISTS idx_waiting_queue_added_by ON public.waiting_queue(added_by);
        RAISE NOTICE '✅ Colonne added_by ajoutée à waiting_queue';
    ELSE
        RAISE NOTICE '✅ Colonne added_by existe déjà dans waiting_queue';
    END IF;
END $$;

-- ===== VÉRIFICATION FINALE =====
SELECT 
    'Vérification finale' as info,
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name IN ('appointments', 'patients', 'waiting_queue')
    AND column_name IN ('created_by', 'updated_by', 'added_by', 'priorite')
ORDER BY table_name, column_name;







