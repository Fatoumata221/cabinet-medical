-- Script SQL pour créer la table parametres_cabinet
-- À exécuter dans l'éditeur SQL de Supabase
-- 
-- Instructions:
-- 1. Allez sur https://supabase.com et connectez-vous
-- 2. Ouvrez votre projet
-- 3. Allez dans "SQL Editor" dans le menu de gauche
-- 4. Copiez-collez ce script complet
-- 5. Cliquez sur "Run" pour exécuter

-- ============================================================================
-- TABLE PARAMETRES_CABINET
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.parametres_cabinet (
    id BIGSERIAL PRIMARY KEY,
    
    -- Informations générales
    nom_cabinet VARCHAR(255),
    adresse TEXT,
    ville VARCHAR(100),
    code_postal VARCHAR(20),
    pays VARCHAR(100) DEFAULT 'Niger',
    
    -- Coordonnées
    telephone VARCHAR(20),
    email VARCHAR(255),
    site_web VARCHAR(255),
    
    -- Informations légales
    numero_agrement VARCHAR(100),
    ninea VARCHAR(20),
    registre_commerce VARCHAR(100),
    tva NUMERIC(5,2) DEFAULT 0,
    
    -- Apparence
    logo_url TEXT,
    
    -- Localisation
    devise VARCHAR(10) DEFAULT 'FCFA',
    fuseau_horaire VARCHAR(50) DEFAULT 'Africa/Niamey',
    langue VARCHAR(10) DEFAULT 'fr',
    format_date VARCHAR(20) DEFAULT 'DD/MM/YYYY',
    
    -- Horaires d'ouverture (JSONB)
    horaires_ouverture JSONB DEFAULT '{
        "lundi": {"ouvert": true, "debut": "08:00", "fin": "18:00"},
        "mardi": {"ouvert": true, "debut": "08:00", "fin": "18:00"},
        "mercredi": {"ouvert": true, "debut": "08:00", "fin": "18:00"},
        "jeudi": {"ouvert": true, "debut": "08:00", "fin": "18:00"},
        "vendredi": {"ouvert": true, "debut": "08:00", "fin": "18:00"},
        "samedi": {"ouvert": false, "debut": "08:00", "fin": "12:00"},
        "dimanche": {"ouvert": false, "debut": "", "fin": ""}
    }'::jsonb,
    
    -- Métadonnées
    created_by BIGINT REFERENCES public.users(id) ON DELETE SET NULL,
    updated_by BIGINT REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Contrainte pour n'avoir qu'un seul enregistrement
    CONSTRAINT unique_parametres_cabinet UNIQUE (id)
);

-- ============================================================================
-- TRIGGER POUR MISE À JOUR AUTOMATIQUE DE updated_at
-- ============================================================================

CREATE OR REPLACE FUNCTION update_parametres_cabinet_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS trigger_update_parametres_cabinet_updated_at ON public.parametres_cabinet;

CREATE TRIGGER trigger_update_parametres_cabinet_updated_at
    BEFORE UPDATE ON public.parametres_cabinet
    FOR EACH ROW
    EXECUTE FUNCTION update_parametres_cabinet_updated_at();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE public.parametres_cabinet ENABLE ROW LEVEL SECURITY;

-- Politique de lecture : tous les utilisateurs authentifiés peuvent lire
DROP POLICY IF EXISTS "Lecture parametres_cabinet pour utilisateurs authentifiés" ON public.parametres_cabinet;

CREATE POLICY "Lecture parametres_cabinet pour utilisateurs authentifiés"
    ON public.parametres_cabinet
    FOR SELECT
    USING (auth.role() = 'authenticated');

-- Politique d'écriture : admins et médecins peuvent modifier
DROP POLICY IF EXISTS "Modification parametres_cabinet pour admins" ON public.parametres_cabinet;
DROP POLICY IF EXISTS "Modification parametres_cabinet pour admins et médecins" ON public.parametres_cabinet;

CREATE POLICY "Modification parametres_cabinet pour admins et médecins"
    ON public.parametres_cabinet
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.auth_id = auth.uid() 
            AND (users.role = 'admin' OR users.role = 'doctor')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.auth_id = auth.uid() 
            AND (users.role = 'admin' OR users.role = 'doctor')
        )
    );

-- ============================================================================
-- INDEX POUR OPTIMISATION
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_parametres_cabinet_updated_at 
    ON public.parametres_cabinet(updated_at DESC);

-- ============================================================================
-- COMMENTAIRES
-- ============================================================================

COMMENT ON TABLE public.parametres_cabinet IS 'Table de configuration du cabinet médical';
COMMENT ON COLUMN public.parametres_cabinet.horaires_ouverture IS 'Horaires d''ouverture au format JSONB avec les jours de la semaine';

