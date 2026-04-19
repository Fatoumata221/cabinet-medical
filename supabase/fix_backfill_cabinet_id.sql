-- ============================================================================
-- SCRIPT COMPLET : Ajout cabinet_id + Normalisation rôles + Backfill
-- ============================================================================
-- À exécuter dans : Supabase Dashboard > SQL Editor
-- Ce script est idempotent (peut être relancé sans risque)
-- ============================================================================


-- ============================================================================
-- ÉTAPE 1 : Corriger le rôle 'cashier' → 'caissier'
-- ============================================================================

ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;

-- Normaliser d'abord les données avant de remettre la contrainte
UPDATE public.users SET role = 'caissier' WHERE role = 'cashier';

ALTER TABLE public.users ADD CONSTRAINT users_role_check 
    CHECK (role::text = ANY (ARRAY['secretary','doctor','admin','accounting','caissier']::text[]));


-- ============================================================================
-- ÉTAPE 2 : Ajouter cabinet_id à TOUTES les tables
-- ============================================================================

-- Table principale users
ALTER TABLE public.users 
    ADD COLUMN IF NOT EXISTS cabinet_id bigint;

-- Patients
ALTER TABLE public.patients 
    ADD COLUMN IF NOT EXISTS cabinet_id bigint;

-- Appointments
ALTER TABLE public.appointments 
    ADD COLUMN IF NOT EXISTS cabinet_id bigint;

-- Consultations
ALTER TABLE public.consultations 
    ADD COLUMN IF NOT EXISTS cabinet_id bigint;

-- Waiting queue
ALTER TABLE public.waiting_queue 
    ADD COLUMN IF NOT EXISTS cabinet_id bigint;

-- Notifications
ALTER TABLE public.notifications_medecin_secretaire 
    ADD COLUMN IF NOT EXISTS cabinet_id bigint;

DO $$ BEGIN
    ALTER TABLE public.notifications_simple 
        ADD COLUMN IF NOT EXISTS cabinet_id bigint;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE public.workflow_notifications 
        ADD COLUMN IF NOT EXISTS cabinet_id bigint;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE public.notifications_consultation 
        ADD COLUMN IF NOT EXISTS cabinet_id bigint;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- Facturation
ALTER TABLE public.factures 
    ADD COLUMN IF NOT EXISTS cabinet_id bigint;

DO $$ BEGIN
    ALTER TABLE public.paiements 
        ADD COLUMN IF NOT EXISTS cabinet_id bigint;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE public.sessions_caisse 
        ADD COLUMN IF NOT EXISTS cabinet_id bigint;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE public.reversements_bancaires 
        ADD COLUMN IF NOT EXISTS cabinet_id bigint;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- Médical
ALTER TABLE public.ordonnances 
    ADD COLUMN IF NOT EXISTS cabinet_id bigint;

DO $$ BEGIN
    ALTER TABLE public.prescriptions 
        ADD COLUMN IF NOT EXISTS cabinet_id bigint;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE public.prescriptions_pharmacie 
        ADD COLUMN IF NOT EXISTS cabinet_id bigint;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE public.certificats_medicaux 
        ADD COLUMN IF NOT EXISTS cabinet_id bigint;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE public.actes 
        ADD COLUMN IF NOT EXISTS cabinet_id bigint;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE public.actes_consultation 
        ADD COLUMN IF NOT EXISTS cabinet_id bigint;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE public.examens_medicaux 
        ADD COLUMN IF NOT EXISTS cabinet_id bigint;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE public.examens_prescrits 
        ADD COLUMN IF NOT EXISTS cabinet_id bigint;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE public.analyses_labo_prescrites 
        ADD COLUMN IF NOT EXISTS cabinet_id bigint;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- Documents
DO $$ BEGIN
    ALTER TABLE public.documents_patients 
        ADD COLUMN IF NOT EXISTS cabinet_id bigint;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE public.patient_documents 
        ADD COLUMN IF NOT EXISTS cabinet_id bigint;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- Paramétrage
ALTER TABLE public.specialites 
    ADD COLUMN IF NOT EXISTS cabinet_id bigint;

DO $$ BEGIN
    ALTER TABLE public.constantes 
        ADD COLUMN IF NOT EXISTS cabinet_id bigint;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE public.diagnostics 
        ADD COLUMN IF NOT EXISTS cabinet_id bigint;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE public.medicaments 
        ADD COLUMN IF NOT EXISTS cabinet_id bigint;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE public.antecedents 
        ADD COLUMN IF NOT EXISTS cabinet_id bigint;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE public.types_actes 
        ADD COLUMN IF NOT EXISTS cabinet_id bigint;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE public.types_certificats 
        ADD COLUMN IF NOT EXISTS cabinet_id bigint;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE public.assurances 
        ADD COLUMN IF NOT EXISTS cabinet_id bigint;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- Transferts
DO $$ BEGIN
    ALTER TABLE public.transferts_dossiers 
        ADD COLUMN IF NOT EXISTS cabinet_id bigint;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;


-- ============================================================================
-- ÉTAPE 3 : Créer les index pour la performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_users_cabinet_id ON public.users(cabinet_id);
CREATE INDEX IF NOT EXISTS idx_patients_cabinet_id ON public.patients(cabinet_id);
CREATE INDEX IF NOT EXISTS idx_appointments_cabinet_id ON public.appointments(cabinet_id);
CREATE INDEX IF NOT EXISTS idx_consultations_cabinet_id ON public.consultations(cabinet_id);
CREATE INDEX IF NOT EXISTS idx_specialites_cabinet_id ON public.specialites(cabinet_id);


-- ============================================================================
-- ÉTAPE 4 : Mettre à jour la fonction get_user_by_username
-- ============================================================================

DROP FUNCTION IF EXISTS public.get_user_by_username(TEXT);

CREATE OR REPLACE FUNCTION public.get_user_by_username(p_username TEXT)
RETURNS TABLE (
    id BIGINT,
    email VARCHAR,
    username VARCHAR,
    auth_id UUID,
    actif BOOLEAN,
    role VARCHAR,
    cabinet_id BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT u.id, u.email, u.username, u.auth_id, u.actif, u.role, u.cabinet_id
    FROM public.users u
    WHERE u.username = p_username AND u.actif = true
    LIMIT 1;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_by_username(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.get_user_by_username(TEXT) TO authenticated;


-- ============================================================================
-- ÉTAPE 5 : BACKFILL — Assigner cabinet_id à toutes les données existantes
-- ============================================================================

DO $$
DECLARE
    v_cabinet_id BIGINT;
    v_count INT;
BEGIN
    SELECT id INTO v_cabinet_id FROM public.parametres_cabinet LIMIT 1;
    
    IF v_cabinet_id IS NULL THEN
        RAISE EXCEPTION 'Aucun cabinet trouvé dans parametres_cabinet !';
    END IF;
    
    RAISE NOTICE 'Cabinet trouvé : id = %', v_cabinet_id;

    -- Users
    UPDATE public.users SET cabinet_id = v_cabinet_id WHERE cabinet_id IS NULL;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE 'users : % lignes mises à jour', v_count;

    -- Patients
    UPDATE public.patients SET cabinet_id = v_cabinet_id WHERE cabinet_id IS NULL;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE 'patients : % lignes mises à jour', v_count;

    -- Appointments
    UPDATE public.appointments SET cabinet_id = v_cabinet_id WHERE cabinet_id IS NULL;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE 'appointments : % lignes mises à jour', v_count;

    -- Consultations
    UPDATE public.consultations SET cabinet_id = v_cabinet_id WHERE cabinet_id IS NULL;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE 'consultations : % lignes mises à jour', v_count;

    -- Waiting queue
    UPDATE public.waiting_queue SET cabinet_id = v_cabinet_id WHERE cabinet_id IS NULL;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE 'waiting_queue : % lignes mises à jour', v_count;

    -- Notifications
    UPDATE public.notifications_medecin_secretaire SET cabinet_id = v_cabinet_id WHERE cabinet_id IS NULL;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE 'notifications_medecin_secretaire : % lignes mises à jour', v_count;

    -- Factures
    UPDATE public.factures SET cabinet_id = v_cabinet_id WHERE cabinet_id IS NULL;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE 'factures : % lignes mises à jour', v_count;

    -- Ordonnances
    UPDATE public.ordonnances SET cabinet_id = v_cabinet_id WHERE cabinet_id IS NULL;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE 'ordonnances : % lignes mises à jour', v_count;

    -- Specialites
    UPDATE public.specialites SET cabinet_id = v_cabinet_id WHERE cabinet_id IS NULL;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE 'specialites : % lignes mises à jour', v_count;

    RAISE NOTICE '';
    RAISE NOTICE 'Backfill terminé ! cabinet_id = %', v_cabinet_id;
END $$;


-- ============================================================================
-- VÉRIFICATION : Tout doit afficher 0
-- ============================================================================

SELECT 'users' AS table_name, COUNT(*) AS sans_cabinet_id 
FROM public.users WHERE cabinet_id IS NULL
UNION ALL
SELECT 'patients', COUNT(*) FROM public.patients WHERE cabinet_id IS NULL
UNION ALL
SELECT 'appointments', COUNT(*) FROM public.appointments WHERE cabinet_id IS NULL
UNION ALL
SELECT 'specialites', COUNT(*) FROM public.specialites WHERE cabinet_id IS NULL
ORDER BY table_name;
