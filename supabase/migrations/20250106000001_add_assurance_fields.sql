-- Migration pour ajouter les champs d'assurance à la table patients
-- Date: 2025-01-06
-- Description: Ajout des colonnes nom_assurance et numero_assurance pour gérer les assurances privées

-- ===== AJOUTER LES COLONNES D'ASSURANCE À LA TABLE PATIENTS =====
DO $$
BEGIN
    -- Ajouter nom_assurance si elle n'existe pas
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'patients' 
        AND column_name = 'nom_assurance'
    ) THEN
        ALTER TABLE public.patients ADD COLUMN nom_assurance character varying;
        RAISE NOTICE '✅ Colonne nom_assurance ajoutée à la table patients';
    ELSE
        RAISE NOTICE '⚠️ Colonne nom_assurance existe déjà';
    END IF;

    -- Ajouter numero_assurance si elle n'existe pas
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'patients' 
        AND column_name = 'numero_assurance'
    ) THEN
        ALTER TABLE public.patients ADD COLUMN numero_assurance character varying;
        RAISE NOTICE '✅ Colonne numero_assurance ajoutée à la table patients';
    ELSE
        RAISE NOTICE '⚠️ Colonne numero_assurance existe déjà';
    END IF;
END $$;

-- ===== COMMENTAIRES SUR LES COLONNES =====
COMMENT ON COLUMN public.patients.nom_assurance IS 'Nom de la compagnie d''assurance privée du patient';
COMMENT ON COLUMN public.patients.numero_assurance IS 'Numéro de police d''assurance du patient';

-- ===== AFFICHER UN MESSAGE DE CONFIRMATION =====
DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ Migration terminée avec succès !';
    RAISE NOTICE '   - nom_assurance: VARCHAR';
    RAISE NOTICE '   - numero_assurance: VARCHAR';
    RAISE NOTICE '========================================';
END $$;

