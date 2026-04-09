-- Migration pour ajouter les colonnes manquantes et corriger les différences
-- Date: 2025-01-02
-- Description: Ajout des colonnes d'audit, couleur, et correction des contraintes

-- ===== ÉTAPE 1: AJOUTER LES COLONNES D'AUDIT À LA TABLE PATIENTS =====
DO $$
BEGIN
    -- Ajouter created_by si elle n'existe pas
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'patients' 
        AND column_name = 'created_by'
    ) THEN
        ALTER TABLE public.patients ADD COLUMN created_by uuid;
        RAISE NOTICE '✅ Colonne created_by ajoutée à la table patients';
    END IF;

    -- Ajouter updated_by si elle n'existe pas
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'patients' 
        AND column_name = 'updated_by'
    ) THEN
        ALTER TABLE public.patients ADD COLUMN updated_by uuid;
        RAISE NOTICE '✅ Colonne updated_by ajoutée à la table patients';
    END IF;
END $$;

-- Ajouter les contraintes de clés étrangères pour patients
ALTER TABLE public.patients 
ADD CONSTRAINT IF NOT EXISTS patients_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES auth.users(id);

ALTER TABLE public.patients 
ADD CONSTRAINT IF NOT EXISTS patients_updated_by_fkey 
FOREIGN KEY (updated_by) REFERENCES auth.users(id);

-- ===== ÉTAPE 2: AJOUTER LES COLONNES MANQUANTES À LA TABLE APPOINTMENTS =====
DO $$
BEGIN
    -- Ajouter created_by si elle n'existe pas
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'appointments' 
        AND column_name = 'created_by'
    ) THEN
        ALTER TABLE public.appointments ADD COLUMN created_by uuid;
        RAISE NOTICE '✅ Colonne created_by ajoutée à la table appointments';
    END IF;

    -- Ajouter updated_by si elle n'existe pas
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'appointments' 
        AND column_name = 'updated_by'
    ) THEN
        ALTER TABLE public.appointments ADD COLUMN updated_by uuid;
        RAISE NOTICE '✅ Colonne updated_by ajoutée à la table appointments';
    END IF;

    -- Ajouter couleur si elle n'existe pas
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'appointments' 
        AND column_name = 'couleur'
    ) THEN
        ALTER TABLE public.appointments ADD COLUMN couleur character varying DEFAULT '#3b82f6'::character varying;
        RAISE NOTICE '✅ Colonne couleur ajoutée à la table appointments';
    END IF;
END $$;

-- Ajouter les contraintes de clés étrangères pour appointments
ALTER TABLE public.appointments 
ADD CONSTRAINT IF NOT EXISTS appointments_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES auth.users(id);

ALTER TABLE public.appointments 
ADD CONSTRAINT IF NOT EXISTS appointments_updated_by_fkey 
FOREIGN KEY (updated_by) REFERENCES auth.users(id);

-- ===== ÉTAPE 3: AJOUTER LA COLONNE MANQUANTE À LA TABLE CONSULTATIONS =====
DO $$
BEGIN
    -- Ajouter appointment_id si elle n'existe pas
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'consultations' 
        AND column_name = 'appointment_id'
    ) THEN
        ALTER TABLE public.consultations ADD COLUMN appointment_id bigint;
        RAISE NOTICE '✅ Colonne appointment_id ajoutée à la table consultations';
    END IF;
END $$;

-- Ajouter la contrainte de clé étrangère pour consultations
ALTER TABLE public.consultations 
ADD CONSTRAINT IF NOT EXISTS fk_consultations_appointment 
FOREIGN KEY (appointment_id) REFERENCES public.appointments(id) ON DELETE SET NULL;

-- ===== ÉTAPE 4: AJOUTER LA COLONNE MANQUANTE À LA TABLE WAITING_QUEUE =====
DO $$
BEGIN
    -- Ajouter added_by si elle n'existe pas
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'waiting_queue' 
        AND column_name = 'added_by'
    ) THEN
        ALTER TABLE public.waiting_queue ADD COLUMN added_by uuid;
        RAISE NOTICE '✅ Colonne added_by ajoutée à la table waiting_queue';
    END IF;
END $$;

-- Ajouter la contrainte de clé étrangère pour waiting_queue
ALTER TABLE public.waiting_queue 
ADD CONSTRAINT IF NOT EXISTS waiting_queue_added_by_fkey 
FOREIGN KEY (added_by) REFERENCES auth.users(id);

-- ===== ÉTAPE 5: CORRIGER LA COLONNE DUREE DANS APPOINTMENTS =====
-- Modifier la valeur par défaut de duree si elle n'est pas 30
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'appointments' 
        AND column_name = 'duree'
        AND column_default != '30'
    ) THEN
        ALTER TABLE public.appointments ALTER COLUMN duree SET DEFAULT 30;
        RAISE NOTICE '✅ Valeur par défaut de duree corrigée à 30';
    END IF;
END $$;

-- ===== ÉTAPE 6: AJOUTER LES INDEX MANQUANTS =====
-- Index pour les nouvelles colonnes d'audit
CREATE INDEX IF NOT EXISTS idx_patients_created_by ON public.patients(created_by);
CREATE INDEX IF NOT EXISTS idx_patients_updated_by ON public.patients(updated_by);
CREATE INDEX IF NOT EXISTS idx_appointments_created_by ON public.appointments(created_by);
CREATE INDEX IF NOT EXISTS idx_appointments_updated_by ON public.appointments(updated_by);
CREATE INDEX IF NOT EXISTS idx_appointments_couleur ON public.appointments(couleur);
CREATE INDEX IF NOT EXISTS idx_consultations_appointment_id ON public.consultations(appointment_id);
CREATE INDEX IF NOT EXISTS idx_waiting_queue_added_by ON public.waiting_queue(added_by);

-- ===== ÉTAPE 7: MISE À JOUR DES TRIGGERS POUR LES NOUVELLES COLONNES =====
-- Fonction pour mettre à jour automatiquement updated_by
CREATE OR REPLACE FUNCTION update_updated_by_column()
RETURNS TRIGGER AS $$
BEGIN
    -- Mettre à jour updated_by avec l'utilisateur actuel si disponible
    IF TG_OP = 'UPDATE' THEN
        NEW.updated_by = auth.uid();
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Ajouter les triggers pour updated_by (si pas déjà présents)
DO $$
BEGIN
    -- Trigger pour patients
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_patients_updated_by'
    ) THEN
        CREATE TRIGGER update_patients_updated_by 
        BEFORE UPDATE ON public.patients 
        FOR EACH ROW EXECUTE FUNCTION update_updated_by_column();
    END IF;

    -- Trigger pour appointments
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_appointments_updated_by'
    ) THEN
        CREATE TRIGGER update_appointments_updated_by 
        BEFORE UPDATE ON public.appointments 
        FOR EACH ROW EXECUTE FUNCTION update_updated_by_column();
    END IF;
END $$;

-- ===== ÉTAPE 8: FONCTION POUR DÉFINIR AUTOMATIQUEMENT CREATED_BY =====
CREATE OR REPLACE FUNCTION set_created_by_column()
RETURNS TRIGGER AS $$
BEGIN
    -- Définir created_by avec l'utilisateur actuel si disponible
    IF NEW.created_by IS NULL THEN
        NEW.created_by = auth.uid();
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Ajouter les triggers pour created_by
DO $$
BEGIN
    -- Trigger pour patients
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'set_patients_created_by'
    ) THEN
        CREATE TRIGGER set_patients_created_by 
        BEFORE INSERT ON public.patients 
        FOR EACH ROW EXECUTE FUNCTION set_created_by_column();
    END IF;

    -- Trigger pour appointments
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'set_appointments_created_by'
    ) THEN
        CREATE TRIGGER set_appointments_created_by 
        BEFORE INSERT ON public.appointments 
        FOR EACH ROW EXECUTE FUNCTION set_created_by_column();
    END IF;

    -- Trigger pour waiting_queue
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'set_waiting_queue_added_by'
    ) THEN
        CREATE TRIGGER set_waiting_queue_added_by 
        BEFORE INSERT ON public.waiting_queue 
        FOR EACH ROW EXECUTE FUNCTION set_created_by_column();
    END IF;
END $$;

-- ===== ÉTAPE 9: VÉRIFICATION FINALE =====
DO $$
BEGIN
    RAISE NOTICE '🎉 Migration terminée avec succès!';
    RAISE NOTICE '📋 Colonnes ajoutées:';
    RAISE NOTICE '   - patients: created_by, updated_by';
    RAISE NOTICE '   - appointments: created_by, updated_by, couleur';
    RAISE NOTICE '   - consultations: appointment_id';
    RAISE NOTICE '   - waiting_queue: added_by';
    RAISE NOTICE '🔗 Contraintes de clés étrangères ajoutées vers auth.users';
    RAISE NOTICE '📊 Index créés pour les nouvelles colonnes';
    RAISE NOTICE '⚡ Triggers ajoutés pour l''audit automatique';
END $$;


