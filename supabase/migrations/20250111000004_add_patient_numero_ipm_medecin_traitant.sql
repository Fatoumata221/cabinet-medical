-- Migration pour ajouter/vérifier numero_ipm et medecin_traitant_id à la table patients
-- Date: 2025-01-11
-- Description: Ajout des colonnes numero_ipm et medecin_traitant_id si elles n'existent pas

DO $$
BEGIN
    -- Ajouter groupe_sanguin si elle n'existe pas
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'patients' 
        AND column_name = 'groupe_sanguin'
    ) THEN
        ALTER TABLE public.patients ADD COLUMN groupe_sanguin character varying;
        RAISE NOTICE '✅ Colonne groupe_sanguin ajoutée à la table patients';
    ELSE
        RAISE NOTICE 'ℹ️ Colonne groupe_sanguin existe déjà dans la table patients';
    END IF;

    -- Ajouter numero_ipm si elle n'existe pas
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'patients' 
        AND column_name = 'numero_ipm'
    ) THEN
        ALTER TABLE public.patients ADD COLUMN numero_ipm character varying;
        RAISE NOTICE '✅ Colonne numero_ipm ajoutée à la table patients';
    ELSE
        RAISE NOTICE 'ℹ️ Colonne numero_ipm existe déjà dans la table patients';
    END IF;

    -- Ajouter medecin_traitant_id si elle n'existe pas
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'patients' 
        AND column_name = 'medecin_traitant_id'
    ) THEN
        ALTER TABLE public.patients ADD COLUMN medecin_traitant_id bigint REFERENCES public.users(id) ON DELETE SET NULL;
        RAISE NOTICE '✅ Colonne medecin_traitant_id ajoutée à la table patients';
    ELSE
        RAISE NOTICE 'ℹ️ Colonne medecin_traitant_id existe déjà dans la table patients';
    END IF;

    -- Garder aussi medecin_traitant (texte) pour compatibilité
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'patients' 
        AND column_name = 'medecin_traitant'
    ) THEN
        ALTER TABLE public.patients ADD COLUMN medecin_traitant character varying;
        RAISE NOTICE '✅ Colonne medecin_traitant ajoutée à la table patients';
    ELSE
        RAISE NOTICE 'ℹ️ Colonne medecin_traitant existe déjà dans la table patients';
    END IF;
END $$;

-- Créer les index pour optimiser les recherches
CREATE INDEX IF NOT EXISTS idx_patients_groupe_sanguin ON public.patients(groupe_sanguin);
CREATE INDEX IF NOT EXISTS idx_patients_numero_ipm ON public.patients(numero_ipm);
CREATE INDEX IF NOT EXISTS idx_patients_medecin_traitant_id ON public.patients(medecin_traitant_id);

-- Commentaires pour documentation
COMMENT ON COLUMN public.patients.groupe_sanguin IS 'Groupe sanguin du patient (A+, A-, B+, B-, AB+, AB-, O+, O-)';
COMMENT ON COLUMN public.patients.numero_ipm IS 'Numéro IPM/CSS du patient pour la mutuelle';
COMMENT ON COLUMN public.patients.medecin_traitant_id IS 'ID du médecin traitant (référence vers users)';
COMMENT ON COLUMN public.patients.medecin_traitant IS 'Nom du médecin traitant (texte libre pour compatibilité)';
