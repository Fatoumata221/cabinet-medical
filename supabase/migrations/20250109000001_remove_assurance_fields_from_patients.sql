-- Migration pour supprimer les colonnes nom_assurance et numero_assurance de la table patients
-- Car la relation avec la table assurances existe déjà via assurance_id

-- ===== SUPPRIMER LES COLONNES D'ASSURANCE DE LA TABLE PATIENTS =====

DO $$
BEGIN
    -- Supprimer la colonne nom_assurance si elle existe
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'patients' 
        AND column_name = 'nom_assurance'
    ) THEN
        ALTER TABLE public.patients DROP COLUMN nom_assurance;
        RAISE NOTICE '✅ Colonne nom_assurance supprimée de la table patients';
    ELSE
        RAISE NOTICE 'ℹ️  Colonne nom_assurance n''existe pas dans la table patients';
    END IF;

    -- Supprimer la colonne numero_assurance si elle existe
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'patients' 
        AND column_name = 'numero_assurance'
    ) THEN
        ALTER TABLE public.patients DROP COLUMN numero_assurance;
        RAISE NOTICE '✅ Colonne numero_assurance supprimée de la table patients';
    ELSE
        RAISE NOTICE 'ℹ️  Colonne numero_assurance n''existe pas dans la table patients';
    END IF;
END $$;

-- ===== VÉRIFIER QUE LA COLONNE assurance_id EXISTE =====

DO $$
BEGIN
    -- Ajouter la colonne assurance_id si elle n'existe pas
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'patients' 
        AND column_name = 'assurance_id'
    ) THEN
        ALTER TABLE public.patients ADD COLUMN assurance_id bigint;
        RAISE NOTICE '✅ Colonne assurance_id ajoutée à la table patients';
        
        -- Ajouter la contrainte de clé étrangère
        ALTER TABLE public.patients 
        ADD CONSTRAINT fk_patients_assurance 
        FOREIGN KEY (assurance_id) 
        REFERENCES public.assurances(id) 
        ON DELETE SET NULL;
        
        RAISE NOTICE '✅ Contrainte de clé étrangère ajoutée pour assurance_id';
    ELSE
        RAISE NOTICE 'ℹ️  Colonne assurance_id existe déjà dans la table patients';
    END IF;
END $$;

-- ===== AJOUTER DES COMMENTAIRES =====

COMMENT ON COLUMN public.patients.assurance_id IS 'Référence vers la table assurances (relation avec l''assurance du patient)';

-- ===== RÉSUMÉ DE LA MIGRATION =====

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ Migration terminée avec succès';
    RAISE NOTICE 'Les colonnes nom_assurance et numero_assurance ont été supprimées';
    RAISE NOTICE 'La relation assurance_id est maintenant utilisée';
    RAISE NOTICE '========================================';
END $$;

