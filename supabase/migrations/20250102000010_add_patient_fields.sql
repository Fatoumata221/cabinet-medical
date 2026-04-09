-- Migration pour ajouter les champs manquants à la table patients
-- Date: 2025-01-02
-- Description: Ajout des colonnes manquantes utilisées dans l'interface

-- ===== AJOUTER LES COLONNES MANQUANTES À LA TABLE PATIENTS =====
DO $$
BEGIN
    -- Ajouter sexe si elle n'existe pas
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'patients' 
        AND column_name = 'sexe'
    ) THEN
        ALTER TABLE public.patients ADD COLUMN sexe character varying(1) CHECK (sexe IN ('M', 'F'));
        RAISE NOTICE '✅ Colonne sexe ajoutée à la table patients';
    END IF;

    -- Ajouter email si elle n'existe pas
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'patients' 
        AND column_name = 'email'
    ) THEN
        ALTER TABLE public.patients ADD COLUMN email character varying;
        RAISE NOTICE '✅ Colonne email ajoutée à la table patients';
    END IF;

    -- Ajouter numero_dossier si elle n'existe pas
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'patients' 
        AND column_name = 'numero_dossier'
    ) THEN
        ALTER TABLE public.patients ADD COLUMN numero_dossier character varying;
        RAISE NOTICE '✅ Colonne numero_dossier ajoutée à la table patients';
    END IF;

    -- Ajouter lieu_naissance si elle n'existe pas
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'patients' 
        AND column_name = 'lieu_naissance'
    ) THEN
        ALTER TABLE public.patients ADD COLUMN lieu_naissance character varying;
        RAISE NOTICE '✅ Colonne lieu_naissance ajoutée à la table patients';
    END IF;

    -- Ajouter nationalite si elle n'existe pas
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'patients' 
        AND column_name = 'nationalite'
    ) THEN
        ALTER TABLE public.patients ADD COLUMN nationalite character varying;
        RAISE NOTICE '✅ Colonne nationalite ajoutée à la table patients';
    END IF;

    -- Ajouter profession si elle n'existe pas
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'patients' 
        AND column_name = 'profession'
    ) THEN
        ALTER TABLE public.patients ADD COLUMN profession character varying;
        RAISE NOTICE '✅ Colonne profession ajoutée à la table patients';
    END IF;

    -- Ajouter situation_familiale si elle n'existe pas
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'patients' 
        AND column_name = 'situation_familiale'
    ) THEN
        ALTER TABLE public.patients ADD COLUMN situation_familiale character varying;
        RAISE NOTICE '✅ Colonne situation_familiale ajoutée à la table patients';
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
    END IF;

    -- Ajouter medecin_traitant si elle n'existe pas
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'patients' 
        AND column_name = 'medecin_traitant'
    ) THEN
        ALTER TABLE public.patients ADD COLUMN medecin_traitant character varying;
        RAISE NOTICE '✅ Colonne medecin_traitant ajoutée à la table patients';
    END IF;

    -- Ajouter mutuelle si elle n'existe pas
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'patients' 
        AND column_name = 'mutuelle'
    ) THEN
        ALTER TABLE public.patients ADD COLUMN mutuelle character varying;
        RAISE NOTICE '✅ Colonne mutuelle ajoutée à la table patients';
    END IF;

    -- Ajouter numero_mutuelle si elle n'existe pas
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'patients' 
        AND column_name = 'numero_mutuelle'
    ) THEN
        ALTER TABLE public.patients ADD COLUMN numero_mutuelle character varying;
        RAISE NOTICE '✅ Colonne numero_mutuelle ajoutée à la table patients';
    END IF;

    -- Ajouter personne_contact si elle n'existe pas
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'patients' 
        AND column_name = 'personne_contact'
    ) THEN
        ALTER TABLE public.patients ADD COLUMN personne_contact character varying;
        RAISE NOTICE '✅ Colonne personne_contact ajoutée à la table patients';
    END IF;

    -- Ajouter telephone_contact si elle n'existe pas
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'patients' 
        AND column_name = 'telephone_contact'
    ) THEN
        ALTER TABLE public.patients ADD COLUMN telephone_contact character varying;
        RAISE NOTICE '✅ Colonne telephone_contact ajoutée à la table patients';
    END IF;

    -- Ajouter lien_contact si elle n'existe pas
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'patients' 
        AND column_name = 'lien_contact'
    ) THEN
        ALTER TABLE public.patients ADD COLUMN lien_contact character varying;
        RAISE NOTICE '✅ Colonne lien_contact ajoutée à la table patients';
    END IF;

    -- Ajouter actif si elle n'existe pas
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'patients' 
        AND column_name = 'actif'
    ) THEN
        ALTER TABLE public.patients ADD COLUMN actif boolean DEFAULT true;
        RAISE NOTICE '✅ Colonne actif ajoutée à la table patients';
    END IF;

    -- Ajouter notes si elle n'existe pas
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'patients' 
        AND column_name = 'notes'
    ) THEN
        ALTER TABLE public.patients ADD COLUMN notes text;
        RAISE NOTICE '✅ Colonne notes ajoutée à la table patients';
    END IF;
END $$;

-- ===== AJOUTER LES INDEX POUR LES NOUVELLES COLONNES =====
CREATE INDEX IF NOT EXISTS idx_patients_numero_dossier ON public.patients(numero_dossier);
CREATE INDEX IF NOT EXISTS idx_patients_numero_ipm ON public.patients(numero_ipm);
CREATE INDEX IF NOT EXISTS idx_patients_email ON public.patients(email);
CREATE INDEX IF NOT EXISTS idx_patients_sexe ON public.patients(sexe);
CREATE INDEX IF NOT EXISTS idx_patients_actif ON public.patients(actif);

-- ===== VÉRIFICATION FINALE =====
DO $$
BEGIN
    RAISE NOTICE '🎉 Migration des champs patients terminée avec succès!';
    RAISE NOTICE '📋 Colonnes ajoutées à la table patients:';
    RAISE NOTICE '   - sexe, email, numero_dossier, lieu_naissance';
    RAISE NOTICE '   - nationalite, profession, situation_familiale';
    RAISE NOTICE '   - numero_ipm, medecin_traitant, mutuelle, numero_mutuelle';
    RAISE NOTICE '   - personne_contact, telephone_contact, lien_contact';
    RAISE NOTICE '   - actif, notes';
    RAISE NOTICE '📊 Index créés pour les colonnes importantes';
END $$;
