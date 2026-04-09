-- Migration pour ajouter la colonne assurance_id à la table patients
-- Cette colonne fait référence à la table assurances

-- ===== AJOUTER LA COLONNE assurance_id SI ELLE N'EXISTE PAS =====

DO $$
BEGIN
    -- Vérifier si la colonne assurance_id existe déjà
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'patients' 
        AND column_name = 'assurance_id'
    ) THEN
        -- Ajouter la colonne assurance_id
        ALTER TABLE public.patients ADD COLUMN assurance_id bigint;
        RAISE NOTICE '✅ Colonne assurance_id ajoutée à la table patients';
        
        -- Ajouter la contrainte de clé étrangère
        ALTER TABLE public.patients 
        ADD CONSTRAINT fk_patients_assurance 
        FOREIGN KEY (assurance_id) 
        REFERENCES public.assurances(id) 
        ON DELETE SET NULL;
        
        RAISE NOTICE '✅ Contrainte de clé étrangère ajoutée pour assurance_id';
        
        -- Ajouter un commentaire sur la colonne
        COMMENT ON COLUMN public.patients.assurance_id IS 'Référence vers la table assurances (relation avec l''assurance du patient)';
        
        RAISE NOTICE '✅ Commentaire ajouté sur la colonne assurance_id';
    ELSE
        RAISE NOTICE 'ℹ️  La colonne assurance_id existe déjà dans la table patients';
    END IF;
END $$;

-- ===== VÉRIFIER LA STRUCTURE FINALE =====

DO $$
DECLARE
    col_exists boolean;
    fk_exists boolean;
BEGIN
    -- Vérifier la colonne
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'patients' 
        AND column_name = 'assurance_id'
    ) INTO col_exists;
    
    -- Vérifier la contrainte FK
    SELECT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_schema = 'public' 
        AND table_name = 'patients' 
        AND constraint_type = 'FOREIGN KEY'
        AND constraint_name = 'fk_patients_assurance'
    ) INTO fk_exists;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE '📊 VÉRIFICATION DE LA STRUCTURE';
    RAISE NOTICE '========================================';
    
    IF col_exists THEN
        RAISE NOTICE '✅ Colonne assurance_id: EXISTE';
    ELSE
        RAISE NOTICE '❌ Colonne assurance_id: N''EXISTE PAS';
    END IF;
    
    IF fk_exists THEN
        RAISE NOTICE '✅ Contrainte FK fk_patients_assurance: EXISTE';
    ELSE
        RAISE NOTICE '❌ Contrainte FK fk_patients_assurance: N''EXISTE PAS';
    END IF;
    
    RAISE NOTICE '========================================';
END $$;

-- ===== RÉSUMÉ =====

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '✅ Migration terminée avec succès!';
    RAISE NOTICE '';
    RAISE NOTICE '📝 Modifications appliquées:';
    RAISE NOTICE '  • Colonne assurance_id ajoutée à la table patients';
    RAISE NOTICE '  • Type: bigint (nullable)';
    RAISE NOTICE '  • Contrainte FK vers assurances(id)';
    RAISE NOTICE '  • ON DELETE SET NULL';
    RAISE NOTICE '';
    RAISE NOTICE '🔄 Prochaines étapes:';
    RAISE NOTICE '  1. Redémarrer Supabase PostgREST pour rafraîchir le cache';
    RAISE NOTICE '  2. Ou attendre quelques secondes pour le rafraîchissement automatique';
    RAISE NOTICE '  3. Tester la création d''un patient avec assurance';
    RAISE NOTICE '';
END $$;

