-- Migration pour créer la table transferts_dossiers
-- Date: 2025-12-20
-- Description: Table pour gérer les transferts de dossiers médicaux vers d'autres cabinets, hôpitaux ou médecins

-- ============================================================================
-- TABLE TRANSFERTS_DOSSIERS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.transferts_dossiers (
    id BIGSERIAL PRIMARY KEY,
    
    -- Références
    patient_id BIGINT NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    consultation_id BIGINT REFERENCES public.consultations(id) ON DELETE SET NULL,
    medecin_origine_id BIGINT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    
    -- Informations du destinataire
    type_destinataire VARCHAR(20) NOT NULL CHECK (type_destinataire IN ('cabinet', 'hopital', 'medecin')),
    nom_destinataire VARCHAR(255) NOT NULL,
    adresse_destinataire TEXT,
    telephone_destinataire VARCHAR(20),
    email_destinataire VARCHAR(255),
    medecin_destinataire VARCHAR(255), -- Nom du médecin si type = 'medecin'
    
    -- Informations du transfert
    motif_transfert TEXT NOT NULL,
    donnees_transferees JSONB NOT NULL DEFAULT '{}'::jsonb, -- Liste des données sélectionnées
    document_transfert_url VARCHAR(500), -- URL du PDF généré
    statut VARCHAR(20) DEFAULT 'en_preparation' CHECK (statut IN ('en_preparation', 'envoye', 'recu', 'annule')),
    date_transfert DATE DEFAULT CURRENT_DATE,
    notes TEXT,
    
    -- Métadonnées
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================================================
-- TRIGGER POUR MISE À JOUR AUTOMATIQUE DE updated_at
-- ============================================================================

CREATE OR REPLACE FUNCTION update_transferts_dossiers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS trigger_update_transferts_dossiers_updated_at ON public.transferts_dossiers;

CREATE TRIGGER trigger_update_transferts_dossiers_updated_at
    BEFORE UPDATE ON public.transferts_dossiers
    FOR EACH ROW
    EXECUTE FUNCTION update_transferts_dossiers_updated_at();

-- ============================================================================
-- INDEX POUR OPTIMISATION
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_transferts_dossiers_patient_id 
    ON public.transferts_dossiers(patient_id);

CREATE INDEX IF NOT EXISTS idx_transferts_dossiers_medecin_origine_id 
    ON public.transferts_dossiers(medecin_origine_id);

CREATE INDEX IF NOT EXISTS idx_transferts_dossiers_date_transfert 
    ON public.transferts_dossiers(date_transfert DESC);

CREATE INDEX IF NOT EXISTS idx_transferts_dossiers_statut 
    ON public.transferts_dossiers(statut);

CREATE INDEX IF NOT EXISTS idx_transferts_dossiers_consultation_id 
    ON public.transferts_dossiers(consultation_id);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE public.transferts_dossiers ENABLE ROW LEVEL SECURITY;

-- Politique de lecture : médecins et admins peuvent voir tous les transferts
-- Secrétaires peuvent voir les transferts de leur cabinet
DROP POLICY IF EXISTS "Lecture transferts_dossiers pour médecins et admins" ON public.transferts_dossiers;

CREATE POLICY "Lecture transferts_dossiers pour médecins et admins"
    ON public.transferts_dossiers
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.auth_id = auth.uid()
            AND users.role IN ('doctor', 'admin')
        )
        OR
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.auth_id = auth.uid()
            AND users.role = 'secretary'
        )
    );

-- Politique d'insertion : seuls les médecins peuvent créer des transferts
DROP POLICY IF EXISTS "Création transferts_dossiers pour médecins" ON public.transferts_dossiers;

CREATE POLICY "Création transferts_dossiers pour médecins"
    ON public.transferts_dossiers
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.auth_id = auth.uid()
            AND users.role = 'doctor'
        )
        AND medecin_origine_id = (
            SELECT id FROM public.users 
            WHERE users.auth_id = auth.uid()
        )
    );

-- Politique de mise à jour : seuls les médecins peuvent modifier leurs transferts
DROP POLICY IF EXISTS "Modification transferts_dossiers pour médecins" ON public.transferts_dossiers;

CREATE POLICY "Modification transferts_dossiers pour médecins"
    ON public.transferts_dossiers
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.auth_id = auth.uid()
            AND users.role = 'doctor'
        )
        AND medecin_origine_id = (
            SELECT id FROM public.users 
            WHERE users.auth_id = auth.uid()
        )
    );

-- Politique de suppression : seuls les médecins peuvent supprimer leurs transferts
DROP POLICY IF EXISTS "Suppression transferts_dossiers pour médecins" ON public.transferts_dossiers;

CREATE POLICY "Suppression transferts_dossiers pour médecins"
    ON public.transferts_dossiers
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.auth_id = auth.uid()
            AND users.role = 'doctor'
        )
        AND medecin_origine_id = (
            SELECT id FROM public.users 
            WHERE users.auth_id = auth.uid()
        )
    );

-- ============================================================================
-- COMMENTAIRES
-- ============================================================================

COMMENT ON TABLE public.transferts_dossiers IS 'Table pour gérer les transferts de dossiers médicaux vers d''autres cabinets, hôpitaux ou médecins';
COMMENT ON COLUMN public.transferts_dossiers.donnees_transferees IS 'JSONB contenant la liste des données sélectionnées pour le transfert (consultations, documents, antécédents, etc.)';
COMMENT ON COLUMN public.transferts_dossiers.document_transfert_url IS 'URL du document PDF généré et stocké dans Supabase Storage';

