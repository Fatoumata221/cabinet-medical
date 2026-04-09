-- Migration pour corriger la table consultations et ajouter les colonnes manquantes
-- Date: 2025-01-02
-- Objectif: Résoudre l'erreur "Could not find the 'motif_consultation' column"

-- =====================================================
-- 1. VÉRIFICATION ET AJOUT DES COLONNES MANQUANTES
-- =====================================================

-- Ajouter la colonne motif_consultation si elle n'existe pas
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'consultations' 
        AND column_name = 'motif_consultation'
    ) THEN
        ALTER TABLE public.consultations ADD COLUMN motif_consultation TEXT;
        RAISE NOTICE '✅ Colonne motif_consultation ajoutée';
    ELSE
        RAISE NOTICE '⚠️ Colonne motif_consultation existe déjà';
    END IF;
END $$;

-- Ajouter la colonne niveau_urgence si elle n'existe pas
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'consultations' 
        AND column_name = 'niveau_urgence'
    ) THEN
        ALTER TABLE public.consultations ADD COLUMN niveau_urgence VARCHAR(20) DEFAULT 'normale';
        RAISE NOTICE '✅ Colonne niveau_urgence ajoutée';
    ELSE
        RAISE NOTICE '⚠️ Colonne niveau_urgence existe déjà';
    END IF;
END $$;

-- Ajouter la colonne type_consultation si elle n'existe pas
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'consultations' 
        AND column_name = 'type_consultation'
    ) THEN
        ALTER TABLE public.consultations ADD COLUMN type_consultation VARCHAR(50) DEFAULT 'standard';
        RAISE NOTICE '✅ Colonne type_consultation ajoutée';
    ELSE
        RAISE NOTICE '⚠️ Colonne type_consultation existe déjà';
    END IF;
END $$;

-- Ajouter la colonne notes_confidentielles si elle n'existe pas
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'consultations' 
        AND column_name = 'notes_confidentielles'
    ) THEN
        ALTER TABLE public.consultations ADD COLUMN notes_confidentielles TEXT;
        RAISE NOTICE '✅ Colonne notes_confidentielles ajoutée';
    ELSE
        RAISE NOTICE '⚠️ Colonne notes_confidentielles existe déjà';
    END IF;
END $$;

-- Vérifier et corriger la colonne date_consultation
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'consultations' 
        AND column_name = 'date_consultation'
    ) THEN
        ALTER TABLE public.consultations ADD COLUMN date_consultation TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE '✅ Colonne date_consultation ajoutée';
    ELSE
        RAISE NOTICE '⚠️ Colonne date_consultation existe déjà';
    END IF;
END $$;

-- =====================================================
-- 2. AJOUT DES CONTRAINTES DE VALIDATION
-- =====================================================

-- Ajouter des contraintes CHECK pour niveau_urgence
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_schema = 'public' 
        AND constraint_name = 'consultations_niveau_urgence_check'
    ) THEN
        ALTER TABLE public.consultations 
        ADD CONSTRAINT consultations_niveau_urgence_check 
        CHECK (niveau_urgence IN ('normale', 'urgente', 'tres_urgente'));
        RAISE NOTICE '✅ Contrainte niveau_urgence ajoutée';
    ELSE
        RAISE NOTICE '⚠️ Contrainte niveau_urgence existe déjà';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '⚠️ Impossible d''ajouter la contrainte niveau_urgence: %', SQLERRM;
END $$;

-- Ajouter des contraintes CHECK pour type_consultation
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_schema = 'public' 
        AND constraint_name = 'consultations_type_consultation_check'
    ) THEN
        ALTER TABLE public.consultations 
        ADD CONSTRAINT consultations_type_consultation_check 
        CHECK (type_consultation IN ('standard', 'suivi', 'urgence', 'preventive'));
        RAISE NOTICE '✅ Contrainte type_consultation ajoutée';
    ELSE
        RAISE NOTICE '⚠️ Contrainte type_consultation existe déjà';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '⚠️ Impossible d''ajouter la contrainte type_consultation: %', SQLERRM;
END $$;

-- =====================================================
-- 3. MISE À JOUR DES DONNÉES EXISTANTES
-- =====================================================

-- Mettre à jour les données existantes avec des valeurs par défaut
UPDATE public.consultations 
SET 
    motif_consultation = COALESCE(motif_consultation, COALESCE(motif, 'Consultation médicale')),
    niveau_urgence = COALESCE(niveau_urgence, 'normale'),
    type_consultation = COALESCE(type_consultation, 'standard'),
    date_consultation = COALESCE(date_consultation, created_at, NOW())
WHERE motif_consultation IS NULL 
   OR niveau_urgence IS NULL 
   OR type_consultation IS NULL 
   OR date_consultation IS NULL;

-- =====================================================
-- 4. CRÉATION D'INDEX POUR LES PERFORMANCES
-- =====================================================

-- Index pour motif_consultation (recherche textuelle)
CREATE INDEX IF NOT EXISTS idx_consultations_motif_consultation 
ON public.consultations USING gin(to_tsvector('french', motif_consultation));

-- Index pour niveau_urgence
CREATE INDEX IF NOT EXISTS idx_consultations_niveau_urgence 
ON public.consultations(niveau_urgence);

-- Index pour type_consultation
CREATE INDEX IF NOT EXISTS idx_consultations_type_consultation 
ON public.consultations(type_consultation);

-- Index pour date_consultation
CREATE INDEX IF NOT EXISTS idx_consultations_date_consultation 
ON public.consultations(date_consultation);

-- Index composé pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_consultations_medecin_date 
ON public.consultations(medecin_id, date_consultation DESC);

-- =====================================================
-- 5. VÉRIFICATION FINALE
-- =====================================================

-- Vérifier que toutes les colonnes requises existent maintenant
DO $$
DECLARE
    missing_columns TEXT[];
    col_name TEXT;
BEGIN
    -- Vérifier chaque colonne requise
    FOR col_name IN SELECT unnest(ARRAY['motif_consultation', 'niveau_urgence', 'type_consultation', 'notes_confidentielles', 'date_consultation']) LOOP
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'consultations' 
            AND column_name = col_name
        ) THEN
            missing_columns := array_append(missing_columns, col_name);
        END IF;
    END LOOP;
    
    IF array_length(missing_columns, 1) > 0 THEN
        RAISE WARNING '❌ Colonnes encore manquantes: %', array_to_string(missing_columns, ', ');
    ELSE
        RAISE NOTICE '✅ Toutes les colonnes requises sont présentes';
    END IF;
END $$;

-- Afficher la structure finale
SELECT 
    'Structure finale table consultations' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'consultations'
ORDER BY ordinal_position;

-- Compter les consultations avec les nouvelles colonnes
SELECT 
    'Vérification données' as info,
    COUNT(*) as total_consultations,
    COUNT(CASE WHEN motif_consultation IS NOT NULL THEN 1 END) as avec_motif,
    COUNT(CASE WHEN niveau_urgence IS NOT NULL THEN 1 END) as avec_urgence,
    COUNT(CASE WHEN type_consultation IS NOT NULL THEN 1 END) as avec_type,
    COUNT(CASE WHEN date_consultation IS NOT NULL THEN 1 END) as avec_date
FROM public.consultations;

RAISE NOTICE '🎉 Migration terminée avec succès !';
RAISE NOTICE '📝 Les colonnes manquantes ont été ajoutées à la table consultations';
RAISE NOTICE '🔍 Exécutez debug_consultations_schema.sql pour vérifier la structure';
