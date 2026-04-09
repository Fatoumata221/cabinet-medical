-- Migration pour s'assurer que toutes les colonnes nécessaires existent dans consultations
-- Date: 2025-01-11

-- Ajouter notes_generales si elle n'existe pas
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'consultations' 
        AND column_name = 'notes_generales'
    ) THEN
        ALTER TABLE consultations ADD COLUMN notes_generales TEXT;
        RAISE NOTICE 'Colonne notes_generales ajoutée';
    ELSE
        RAISE NOTICE 'Colonne notes_generales existe déjà';
    END IF;
END $$;

-- Ajouter motif_consultation si elle n'existe pas
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'consultations' 
        AND column_name = 'motif_consultation'
    ) THEN
        ALTER TABLE consultations ADD COLUMN motif_consultation TEXT;
        RAISE NOTICE 'Colonne motif_consultation ajoutée';
    ELSE
        RAISE NOTICE 'Colonne motif_consultation existe déjà';
    END IF;
END $$;

-- Vérifier que toutes les colonnes nécessaires existent
DO $$
DECLARE
    missing_columns TEXT[];
BEGIN
    -- Vérifier les colonnes requises
    SELECT ARRAY_AGG(col) INTO missing_columns
    FROM (
        SELECT 'id' AS col
        UNION SELECT 'patient_id'
        UNION SELECT 'medecin_id'
        UNION SELECT 'date_consultation'
        UNION SELECT 'motif_consultation'
        UNION SELECT 'statut'
        UNION SELECT 'notes_generales'
        UNION SELECT 'created_at'
        UNION SELECT 'updated_at'
    ) required_cols
    WHERE NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'consultations'
        AND column_name = required_cols.col
    );
    
    IF missing_columns IS NOT NULL THEN
        RAISE WARNING 'Colonnes manquantes dans consultations: %', missing_columns;
    ELSE
        RAISE NOTICE 'Toutes les colonnes requises existent dans consultations';
    END IF;
END $$;
