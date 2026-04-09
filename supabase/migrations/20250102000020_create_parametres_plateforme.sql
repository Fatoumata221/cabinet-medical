-- Migration pour créer la table parametres_plateforme
-- Date: 2025-01-02
-- Description: Table pour stocker tous les paramètres de personnalisation de la plateforme

-- ============================================================================
-- TABLE PARAMETRES_PLATEFORME
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.parametres_plateforme (
    id BIGSERIAL PRIMARY KEY,
    
    -- Configuration générale
    configuration JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Métadonnées
    created_by BIGINT REFERENCES public.users(id) ON DELETE SET NULL,
    updated_by BIGINT REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Contrainte pour n'avoir qu'un seul enregistrement
    CONSTRAINT unique_parametres_plateforme UNIQUE (id)
);

-- ============================================================================
-- TRIGGER POUR MISE À JOUR AUTOMATIQUE DE updated_at
-- ============================================================================

CREATE OR REPLACE FUNCTION update_parametres_plateforme_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS trigger_update_parametres_plateforme_updated_at ON public.parametres_plateforme;

CREATE TRIGGER trigger_update_parametres_plateforme_updated_at
    BEFORE UPDATE ON public.parametres_plateforme
    FOR EACH ROW
    EXECUTE FUNCTION update_parametres_plateforme_updated_at();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE public.parametres_plateforme ENABLE ROW LEVEL SECURITY;

-- Politique de lecture : tous les utilisateurs authentifiés peuvent lire
DROP POLICY IF EXISTS "Lecture parametres_plateforme pour utilisateurs authentifiés" ON public.parametres_plateforme;

CREATE POLICY "Lecture parametres_plateforme pour utilisateurs authentifiés"
    ON public.parametres_plateforme
    FOR SELECT
    USING (auth.role() = 'authenticated');

-- Politique d'écriture : seuls les admins peuvent modifier
DROP POLICY IF EXISTS "Modification parametres_plateforme pour admins" ON public.parametres_plateforme;

CREATE POLICY "Modification parametres_plateforme pour admins"
    ON public.parametres_plateforme
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.auth_id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- ============================================================================
-- INDEX POUR OPTIMISATION
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_parametres_plateforme_updated_at 
    ON public.parametres_plateforme(updated_at DESC);

-- ============================================================================
-- DONNÉES PAR DÉFAUT
-- ============================================================================

-- Insérer un enregistrement par défaut si aucun n'existe
INSERT INTO public.parametres_plateforme (configuration)
VALUES (
    '{
        "theme": "light",
        "couleur_principale": "#3B82F6",
        "couleur_secondaire": "#10B981",
        "duree_consultation_defaut": 30,
        "tva_applicable": false,
        "remise_autorisee": true,
        "remise_max": 20,
        "notifications_email": true,
        "notifications_sms": false,
        "mot_de_passe_min": 8,
        "session_timeout": 30,
        "workflow_consultation": "standard"
    }'::jsonb
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- COMMENTAIRES
-- ============================================================================

COMMENT ON TABLE public.parametres_plateforme IS 'Table de configuration globale de la plateforme médicale';
COMMENT ON COLUMN public.parametres_plateforme.configuration IS 'Configuration JSONB contenant tous les paramètres personnalisables de la plateforme';











