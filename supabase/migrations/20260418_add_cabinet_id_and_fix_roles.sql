-- ============================================================================
-- MIGRATION : Ajout cabinet_id + Normalisation des rôles
-- Date : 2026-04-18
-- Description : 
--   1. Corriger la contrainte CHECK sur users.role (accepter 'caissier')
--   2. Normaliser les données existantes cashier → caissier
--   3. Ajouter cabinet_id à toutes les tables critiques
--   4. Backfill les données existantes avec le premier cabinet_id
-- ============================================================================

-- ============================================================================
-- ÉTAPE 1 : Corriger le rôle 'cashier' → 'caissier'
-- ============================================================================

-- 1a. Supprimer l'ancienne contrainte CHECK sur users.role
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;

-- 1b. Ajouter la nouvelle contrainte avec 'caissier' au lieu de 'cashier'
ALTER TABLE public.users ADD CONSTRAINT users_role_check 
    CHECK (role::text = ANY (ARRAY['secretary','doctor','admin','accounting','caissier']::text[]));

-- 1c. Normaliser les données existantes : cashier → caissier
UPDATE public.users SET role = 'caissier' WHERE role = 'cashier';


-- ============================================================================
-- ÉTAPE 2 : Ajouter cabinet_id aux tables critiques
-- ============================================================================

-- Ajouter cabinet_id à la table users
ALTER TABLE public.users 
    ADD COLUMN IF NOT EXISTS cabinet_id bigint REFERENCES public.parametres_cabinet(id);

-- Ajouter cabinet_id à la table patients
ALTER TABLE public.patients 
    ADD COLUMN IF NOT EXISTS cabinet_id bigint REFERENCES public.parametres_cabinet(id);

-- Ajouter cabinet_id à la table appointments
ALTER TABLE public.appointments 
    ADD COLUMN IF NOT EXISTS cabinet_id bigint REFERENCES public.parametres_cabinet(id);

-- Ajouter cabinet_id à la table consultations
ALTER TABLE public.consultations 
    ADD COLUMN IF NOT EXISTS cabinet_id bigint REFERENCES public.parametres_cabinet(id);

-- Ajouter cabinet_id à la table waiting_queue
ALTER TABLE public.waiting_queue 
    ADD COLUMN IF NOT EXISTS cabinet_id bigint REFERENCES public.parametres_cabinet(id);

-- Ajouter cabinet_id aux tables de notifications
ALTER TABLE public.notifications_medecin_secretaire 
    ADD COLUMN IF NOT EXISTS cabinet_id bigint REFERENCES public.parametres_cabinet(id);

ALTER TABLE public.notifications_simple 
    ADD COLUMN IF NOT EXISTS cabinet_id bigint REFERENCES public.parametres_cabinet(id);

ALTER TABLE public.workflow_notifications 
    ADD COLUMN IF NOT EXISTS cabinet_id bigint REFERENCES public.parametres_cabinet(id);

ALTER TABLE public.notifications_consultation 
    ADD COLUMN IF NOT EXISTS cabinet_id bigint REFERENCES public.parametres_cabinet(id);

-- Ajouter cabinet_id aux tables de facturation
ALTER TABLE public.factures 
    ADD COLUMN IF NOT EXISTS cabinet_id bigint REFERENCES public.parametres_cabinet(id);

ALTER TABLE public.paiements 
    ADD COLUMN IF NOT EXISTS cabinet_id bigint REFERENCES public.parametres_cabinet(id);

ALTER TABLE public.sessions_caisse 
    ADD COLUMN IF NOT EXISTS cabinet_id bigint REFERENCES public.parametres_cabinet(id);

ALTER TABLE public.reversements_bancaires 
    ADD COLUMN IF NOT EXISTS cabinet_id bigint REFERENCES public.parametres_cabinet(id);

-- Ajouter cabinet_id aux tables médicales
ALTER TABLE public.ordonnances 
    ADD COLUMN IF NOT EXISTS cabinet_id bigint REFERENCES public.parametres_cabinet(id);

ALTER TABLE public.prescriptions 
    ADD COLUMN IF NOT EXISTS cabinet_id bigint REFERENCES public.parametres_cabinet(id);

ALTER TABLE public.prescriptions_pharmacie 
    ADD COLUMN IF NOT EXISTS cabinet_id bigint REFERENCES public.parametres_cabinet(id);

ALTER TABLE public.certificats_medicaux 
    ADD COLUMN IF NOT EXISTS cabinet_id bigint REFERENCES public.parametres_cabinet(id);

ALTER TABLE public.actes 
    ADD COLUMN IF NOT EXISTS cabinet_id bigint REFERENCES public.parametres_cabinet(id);

ALTER TABLE public.actes_consultation 
    ADD COLUMN IF NOT EXISTS cabinet_id bigint REFERENCES public.parametres_cabinet(id);

ALTER TABLE public.examens_medicaux 
    ADD COLUMN IF NOT EXISTS cabinet_id bigint REFERENCES public.parametres_cabinet(id);

ALTER TABLE public.examens_prescrits 
    ADD COLUMN IF NOT EXISTS cabinet_id bigint REFERENCES public.parametres_cabinet(id);

ALTER TABLE public.analyses_labo_prescrites 
    ADD COLUMN IF NOT EXISTS cabinet_id bigint REFERENCES public.parametres_cabinet(id);

-- Ajouter cabinet_id aux tables de documents
ALTER TABLE public.documents_patients 
    ADD COLUMN IF NOT EXISTS cabinet_id bigint REFERENCES public.parametres_cabinet(id);

ALTER TABLE public.patient_documents 
    ADD COLUMN IF NOT EXISTS cabinet_id bigint REFERENCES public.parametres_cabinet(id);

-- Ajouter cabinet_id aux tables de paramétrage médical
ALTER TABLE public.specialites 
    ADD COLUMN IF NOT EXISTS cabinet_id bigint REFERENCES public.parametres_cabinet(id);

ALTER TABLE public.constantes 
    ADD COLUMN IF NOT EXISTS cabinet_id bigint REFERENCES public.parametres_cabinet(id);

ALTER TABLE public.diagnostics 
    ADD COLUMN IF NOT EXISTS cabinet_id bigint REFERENCES public.parametres_cabinet(id);

ALTER TABLE public.medicaments 
    ADD COLUMN IF NOT EXISTS cabinet_id bigint REFERENCES public.parametres_cabinet(id);

ALTER TABLE public.antecedents 
    ADD COLUMN IF NOT EXISTS cabinet_id bigint REFERENCES public.parametres_cabinet(id);

ALTER TABLE public.types_actes 
    ADD COLUMN IF NOT EXISTS cabinet_id bigint REFERENCES public.parametres_cabinet(id);

ALTER TABLE public.types_certificats 
    ADD COLUMN IF NOT EXISTS cabinet_id bigint REFERENCES public.parametres_cabinet(id);

ALTER TABLE public.assurances 
    ADD COLUMN IF NOT EXISTS cabinet_id bigint REFERENCES public.parametres_cabinet(id);

-- Ajouter cabinet_id aux transferts
ALTER TABLE public.transferts_dossiers 
    ADD COLUMN IF NOT EXISTS cabinet_id bigint REFERENCES public.parametres_cabinet(id);


-- ============================================================================
-- ÉTAPE 3 : Créer les index sur cabinet_id
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_users_cabinet_id ON public.users(cabinet_id);
CREATE INDEX IF NOT EXISTS idx_patients_cabinet_id ON public.patients(cabinet_id);
CREATE INDEX IF NOT EXISTS idx_appointments_cabinet_id ON public.appointments(cabinet_id);
CREATE INDEX IF NOT EXISTS idx_consultations_cabinet_id ON public.consultations(cabinet_id);
CREATE INDEX IF NOT EXISTS idx_waiting_queue_cabinet_id ON public.waiting_queue(cabinet_id);
CREATE INDEX IF NOT EXISTS idx_notifications_ms_cabinet_id ON public.notifications_medecin_secretaire(cabinet_id);
CREATE INDEX IF NOT EXISTS idx_notifications_simple_cabinet_id ON public.notifications_simple(cabinet_id);
CREATE INDEX IF NOT EXISTS idx_factures_cabinet_id ON public.factures(cabinet_id);
CREATE INDEX IF NOT EXISTS idx_paiements_cabinet_id ON public.paiements(cabinet_id);
CREATE INDEX IF NOT EXISTS idx_sessions_caisse_cabinet_id ON public.sessions_caisse(cabinet_id);
CREATE INDEX IF NOT EXISTS idx_ordonnances_cabinet_id ON public.ordonnances(cabinet_id);
CREATE INDEX IF NOT EXISTS idx_actes_cabinet_id ON public.actes(cabinet_id);
CREATE INDEX IF NOT EXISTS idx_specialites_cabinet_id ON public.specialites(cabinet_id);
CREATE INDEX IF NOT EXISTS idx_transferts_dossiers_cabinet_id ON public.transferts_dossiers(cabinet_id);


-- ============================================================================
-- ÉTAPE 4 : Mettre à jour la fonction get_user_by_username
-- pour retourner cabinet_id
-- ============================================================================

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
-- ÉTAPE 5 : BACKFILL — Affecter les données existantes
-- ============================================================================
-- IMPORTANT: Exécuter cette partie MANUELLEMENT après avoir vérifié 
-- la correspondance entre utilisateurs et cabinets.
-- 
-- Si vous avez un seul cabinet et voulez tout backfiller :
-- 
-- DO $$
-- DECLARE
--     v_cabinet_id BIGINT;
-- BEGIN
--     SELECT id INTO v_cabinet_id FROM public.parametres_cabinet LIMIT 1;
--     IF v_cabinet_id IS NOT NULL THEN
--         UPDATE public.users SET cabinet_id = v_cabinet_id WHERE cabinet_id IS NULL;
--         UPDATE public.patients SET cabinet_id = v_cabinet_id WHERE cabinet_id IS NULL;
--         UPDATE public.appointments SET cabinet_id = v_cabinet_id WHERE cabinet_id IS NULL;
--         UPDATE public.consultations SET cabinet_id = v_cabinet_id WHERE cabinet_id IS NULL;
--         UPDATE public.waiting_queue SET cabinet_id = v_cabinet_id WHERE cabinet_id IS NULL;
--         UPDATE public.notifications_medecin_secretaire SET cabinet_id = v_cabinet_id WHERE cabinet_id IS NULL;
--         UPDATE public.factures SET cabinet_id = v_cabinet_id WHERE cabinet_id IS NULL;
--         UPDATE public.paiements SET cabinet_id = v_cabinet_id WHERE cabinet_id IS NULL;
--         UPDATE public.sessions_caisse SET cabinet_id = v_cabinet_id WHERE cabinet_id IS NULL;
--         UPDATE public.ordonnances SET cabinet_id = v_cabinet_id WHERE cabinet_id IS NULL;
--         UPDATE public.actes SET cabinet_id = v_cabinet_id WHERE cabinet_id IS NULL;
--         UPDATE public.specialites SET cabinet_id = v_cabinet_id WHERE cabinet_id IS NULL;
--         RAISE NOTICE 'Backfill terminé pour cabinet_id = %', v_cabinet_id;
--     END IF;
-- END $$;
--
-- Pour plusieurs cabinets, adapter le backfill selon votre logique métier.
-- ============================================================================


-- ============================================================================
-- FIN DE LA MIGRATION
-- ============================================================================
