-- Migration ultra-simplifiée pour créer les tables de paramétrage
-- Version sans erreurs de syntaxe - Approche minimaliste
-- Date: 2025-01-02

-- ============================================================================
-- FONCTION UTILITAIRE
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ============================================================================
-- TABLES PRINCIPALES DE PARAMÉTRAGE
-- ============================================================================

-- Table annuaire_actes_tarifs
CREATE TABLE IF NOT EXISTS public.annuaire_actes_tarifs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nom VARCHAR(255) NOT NULL,
    description TEXT,
    code_ccam VARCHAR(50),
    tarif_base NUMERIC DEFAULT 0,
    tarif_secu NUMERIC DEFAULT 0,
    tarif_mutuelle NUMERIC DEFAULT 0,
    categorie VARCHAR(100),
    actif BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Table liste_vaccins
CREATE TABLE IF NOT EXISTS public.liste_vaccins (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nom VARCHAR(255) NOT NULL,
    description TEXT,
    fabricant VARCHAR(255),
    code_atc VARCHAR(50),
    age_minimum INTEGER,
    age_maximum INTEGER,
    rappel_necessaire BOOLEAN DEFAULT false,
    duree_validite INTEGER,
    actif BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Table liste_etiologies
CREATE TABLE IF NOT EXISTS public.liste_etiologies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nom VARCHAR(255) NOT NULL,
    description TEXT,
    categorie VARCHAR(100) DEFAULT 'generale',
    code_classification VARCHAR(50),
    actif BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Table plaintes_principales
CREATE TABLE IF NOT EXISTS public.plaintes_principales (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nom VARCHAR(255) NOT NULL,
    description TEXT,
    categorie VARCHAR(100) DEFAULT 'generale',
    specialite_associee VARCHAR(100),
    actif BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Table types_symptomes
CREATE TABLE IF NOT EXISTS public.types_symptomes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nom VARCHAR(255) NOT NULL,
    description TEXT,
    categorie VARCHAR(100) DEFAULT 'generale',
    niveau_gravite VARCHAR(50) DEFAULT 'leger',
    actif BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Table categories_antecedents
CREATE TABLE IF NOT EXISTS public.categories_antecedents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nom VARCHAR(255) NOT NULL,
    description TEXT,
    couleur VARCHAR(7) DEFAULT '#3b82f6',
    ordre_affichage INTEGER DEFAULT 0,
    actif BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Table types_antecedents
CREATE TABLE IF NOT EXISTS public.types_antecedents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nom VARCHAR(255) NOT NULL,
    description TEXT,
    categorie_id UUID,
    actif BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Table types_certificats
CREATE TABLE IF NOT EXISTS public.types_certificats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nom VARCHAR(255) NOT NULL,
    description TEXT,
    modele_texte TEXT,
    duree_validite INTEGER,
    actif BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Table employeurs
CREATE TABLE IF NOT EXISTS public.employeurs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nom VARCHAR(255) NOT NULL,
    adresse TEXT,
    telephone VARCHAR(20),
    email VARCHAR(255),
    secteur_activite VARCHAR(100),
    actif BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Table tiers_payant
CREATE TABLE IF NOT EXISTS public.tiers_payant (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nom VARCHAR(255) NOT NULL,
    description TEXT,
    type_tiers VARCHAR(100) DEFAULT 'assurance',
    taux_prise_charge NUMERIC DEFAULT 0,
    plafond_annuel NUMERIC,
    actif BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Table type_couverture_medicale
CREATE TABLE IF NOT EXISTS public.type_couverture_medicale (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nom VARCHAR(255) NOT NULL,
    description TEXT,
    taux_remboursement NUMERIC DEFAULT 0,
    plafond_mensuel NUMERIC,
    plafond_annuel NUMERIC,
    actif BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- ============================================================================
-- TABLES D'ARCHIVES
-- ============================================================================

-- Table familles_archives
CREATE TABLE IF NOT EXISTS public.familles_archives (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nom VARCHAR(255) NOT NULL,
    description TEXT,
    couleur VARCHAR(7) DEFAULT '#3b82f6',
    actif BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Table types_archives
CREATE TABLE IF NOT EXISTS public.types_archives (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nom VARCHAR(255) NOT NULL,
    description TEXT,
    famille_id UUID,
    extension_fichier VARCHAR(10),
    actif BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Table liste_archives
CREATE TABLE IF NOT EXISTS public.liste_archives (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nom VARCHAR(255) NOT NULL,
    description TEXT,
    type_archive_id UUID,
    chemin_fichier TEXT,
    taille_fichier BIGINT,
    actif BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- ============================================================================
-- TABLES MÉDICALES
-- ============================================================================

-- Table constantes
CREATE TABLE IF NOT EXISTS public.constantes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nom VARCHAR(255) NOT NULL,
    description TEXT,
    unite VARCHAR(50),
    valeur_min NUMERIC,
    valeur_max NUMERIC,
    valeur_normale_min NUMERIC,
    valeur_normale_max NUMERIC,
    categorie VARCHAR(100) DEFAULT 'generale',
    ordre_affichage INTEGER DEFAULT 0,
    actif BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Table signes_cliniques
CREATE TABLE IF NOT EXISTS public.signes_cliniques (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nom VARCHAR(255) NOT NULL,
    description TEXT,
    categorie VARCHAR(100) DEFAULT 'generale',
    type_signe VARCHAR(100) DEFAULT 'objectif',
    actif BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Table appareils
CREATE TABLE IF NOT EXISTS public.appareils (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nom VARCHAR(255) NOT NULL,
    description TEXT,
    specialite_associee VARCHAR(100),
    ordre_affichage INTEGER DEFAULT 0,
    actif BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Table diagnostics
CREATE TABLE IF NOT EXISTS public.diagnostics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nom VARCHAR(255) NOT NULL,
    description TEXT,
    code_cim VARCHAR(50),
    specialite_associee VARCHAR(100),
    niveau_gravite VARCHAR(50) DEFAULT 'leger',
    ordre_affichage INTEGER DEFAULT 0,
    actif BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Table antecedents
CREATE TABLE IF NOT EXISTS public.antecedents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nom VARCHAR(255) NOT NULL,
    description TEXT,
    categorie VARCHAR(100) DEFAULT 'generale',
    code_cim VARCHAR(50),
    niveau_gravite VARCHAR(50) DEFAULT 'leger',
    ordre_affichage INTEGER DEFAULT 0,
    actif BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Table medicaments
CREATE TABLE IF NOT EXISTS public.medicaments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nom VARCHAR(255) NOT NULL,
    description TEXT,
    dci VARCHAR(255),
    forme_pharmaceutique VARCHAR(100),
    dosage VARCHAR(100),
    voie_administration VARCHAR(100),
    classe_therapeutique VARCHAR(100),
    contre_indications TEXT,
    effets_indesirables TEXT,
    posologie_adulte TEXT,
    posologie_enfant TEXT,
    actif BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Table elements_synthese
CREATE TABLE IF NOT EXISTS public.elements_synthese (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nom VARCHAR(255) NOT NULL,
    description TEXT,
    categorie VARCHAR(100) DEFAULT 'generale',
    modele_texte TEXT,
    actif BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Table types_actes
CREATE TABLE IF NOT EXISTS public.types_actes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nom VARCHAR(255) NOT NULL,
    description TEXT,
    code_ccam VARCHAR(50),
    tarif_base NUMERIC DEFAULT 0,
    duree_moyenne INTEGER DEFAULT 0,
    categorie VARCHAR(100),
    actif BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Table assurances
CREATE TABLE IF NOT EXISTS public.assurances (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nom VARCHAR(255) NOT NULL,
    description TEXT,
    type_assurance VARCHAR(100) DEFAULT 'mutuelle',
    taux_remboursement NUMERIC DEFAULT 0,
    plafond_annuel NUMERIC,
    telephone VARCHAR(20),
    email VARCHAR(255),
    adresse TEXT,
    actif BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- ============================================================================
-- INDEX ESSENTIELS
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_annuaire_actes_nom ON public.annuaire_actes_tarifs(nom);
CREATE INDEX IF NOT EXISTS idx_liste_vaccins_nom ON public.liste_vaccins(nom);
CREATE INDEX IF NOT EXISTS idx_constantes_nom ON public.constantes(nom);
CREATE INDEX IF NOT EXISTS idx_medicaments_nom ON public.medicaments(nom);
CREATE INDEX IF NOT EXISTS idx_assurances_nom ON public.assurances(nom);

-- ============================================================================
-- TRIGGERS SIMPLES
-- ============================================================================

DROP TRIGGER IF EXISTS update_annuaire_actes_tarifs_updated_at ON public.annuaire_actes_tarifs;
CREATE TRIGGER update_annuaire_actes_tarifs_updated_at
    BEFORE UPDATE ON public.annuaire_actes_tarifs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_liste_vaccins_updated_at ON public.liste_vaccins;
CREATE TRIGGER update_liste_vaccins_updated_at
    BEFORE UPDATE ON public.liste_vaccins
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_constantes_updated_at ON public.constantes;
CREATE TRIGGER update_constantes_updated_at
    BEFORE UPDATE ON public.constantes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_medicaments_updated_at ON public.medicaments;
CREATE TRIGGER update_medicaments_updated_at
    BEFORE UPDATE ON public.medicaments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_assurances_updated_at ON public.assurances;
CREATE TRIGGER update_assurances_updated_at
    BEFORE UPDATE ON public.assurances
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- DONNÉES DE TEST ESSENTIELLES
-- ============================================================================

-- Données pour annuaire_actes_tarifs
INSERT INTO public.annuaire_actes_tarifs (nom, description, tarif_base, categorie, actif) VALUES
('Consultation générale', 'Consultation médicale générale', 25000, 'Consultation', true),
('Consultation spécialisée', 'Consultation médicale spécialisée', 35000, 'Consultation', true),
('Électrocardiogramme', 'Enregistrement ECG', 15000, 'Examen', true)
ON CONFLICT (nom) DO NOTHING;

-- Données pour liste_vaccins
INSERT INTO public.liste_vaccins (nom, description, fabricant, actif) VALUES
('BCG', 'Vaccin contre la tuberculose', 'Sanofi Pasteur', true),
('DTC-Hep B-Hib', 'Vaccin pentavalent', 'GSK', true),
('Polio (VPO)', 'Vaccin poliomyélite oral', 'Sanofi Pasteur', true)
ON CONFLICT (nom) DO NOTHING;

-- Données pour constantes
INSERT INTO public.constantes (nom, description, unite, valeur_normale_min, valeur_normale_max, categorie, actif) VALUES
('Tension artérielle systolique', 'Pression artérielle systolique', 'mmHg', 90, 140, 'Cardiovasculaire', true),
('Fréquence cardiaque', 'Battements par minute', 'bpm', 60, 100, 'Cardiovasculaire', true),
('Température', 'Température corporelle', '°C', 36.1, 37.2, 'Générale', true)
ON CONFLICT (nom) DO NOTHING;

-- Données pour medicaments
INSERT INTO public.medicaments (nom, dci, forme_pharmaceutique, dosage, classe_therapeutique, actif) VALUES
('Paracétamol', 'Paracétamol', 'Comprimé', '500mg', 'Antalgique', true),
('Ibuprofène', 'Ibuprofène', 'Comprimé', '400mg', 'Anti-inflammatoire', true),
('Amoxicilline', 'Amoxicilline', 'Gélule', '500mg', 'Antibiotique', true)
ON CONFLICT (nom) DO NOTHING;

-- ============================================================================
-- COMMENTAIRES
-- ============================================================================

COMMENT ON TABLE public.annuaire_actes_tarifs IS 'Annuaire des actes médicaux avec tarification';
COMMENT ON TABLE public.liste_vaccins IS 'Liste des vaccins disponibles';
COMMENT ON TABLE public.constantes IS 'Constantes vitales et mesures médicales';
COMMENT ON TABLE public.medicaments IS 'Base de données des médicaments';
COMMENT ON TABLE public.assurances IS 'Liste des organismes d''assurance maladie';

-- Fin de la migration simplifiée
