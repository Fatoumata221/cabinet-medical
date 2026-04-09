-- Migration complète pour créer toutes les tables de paramétrage manquantes
-- Basée sur l'analyse de basesql.sql
-- Date: 2025-01-02
-- Description: Création de toutes les tables nécessaires pour les pages de paramétrage

-- ============================================================================
-- FONCTION UTILITAIRE POUR LES TRIGGERS
-- ============================================================================

-- Fonction pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ============================================================================
-- TABLES DE PARAMÉTRAGE PRINCIPAL
-- ============================================================================

-- Table annuaire_actes_tarifs (si elle n'existe pas)
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
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
    duree_validite INTEGER, -- en mois
    actif BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table liste_etiologies
CREATE TABLE IF NOT EXISTS public.liste_etiologies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nom VARCHAR(255) NOT NULL,
    description TEXT,
    categorie VARCHAR(100) DEFAULT 'generale',
    code_classification VARCHAR(50),
    actif BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table plaintes_principales
CREATE TABLE IF NOT EXISTS public.plaintes_principales (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nom VARCHAR(255) NOT NULL,
    description TEXT,
    categorie VARCHAR(100) DEFAULT 'generale',
    specialite_associee VARCHAR(100),
    actif BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table types_symptomes
CREATE TABLE IF NOT EXISTS public.types_symptomes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nom VARCHAR(255) NOT NULL,
    description TEXT,
    categorie VARCHAR(100) DEFAULT 'generale',
    niveau_gravite VARCHAR(50) DEFAULT 'leger' CHECK (niveau_gravite IN ('leger', 'modere', 'grave', 'critique')),
    actif BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table categories_antecedents
CREATE TABLE IF NOT EXISTS public.categories_antecedents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nom VARCHAR(255) NOT NULL,
    description TEXT,
    couleur VARCHAR(7) DEFAULT '#3b82f6'::VARCHAR,
    ordre_affichage INTEGER DEFAULT 0,
    actif BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table types_antecedents
CREATE TABLE IF NOT EXISTS public.types_antecedents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nom VARCHAR(255) NOT NULL,
    description TEXT,
    categorie_id UUID REFERENCES public.categories_antecedents(id),
    actif BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table types_certificats
CREATE TABLE IF NOT EXISTS public.types_certificats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nom VARCHAR(255) NOT NULL,
    description TEXT,
    modele_texte TEXT,
    duree_validite INTEGER, -- en jours
    actif BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table tiers_payant
CREATE TABLE IF NOT EXISTS public.tiers_payant (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nom VARCHAR(255) NOT NULL,
    description TEXT,
    type_tiers VARCHAR(100) DEFAULT 'assurance' CHECK (type_tiers IN ('assurance', 'mutuelle', 'employeur', 'autre')),
    taux_prise_charge NUMERIC DEFAULT 0,
    plafond_annuel NUMERIC,
    actif BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================================================
-- TABLES D'ARCHIVES
-- ============================================================================

-- Table familles_archives
CREATE TABLE IF NOT EXISTS public.familles_archives (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nom VARCHAR(255) NOT NULL,
    description TEXT,
    couleur VARCHAR(7) DEFAULT '#3b82f6'::VARCHAR,
    actif BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table types_archives
CREATE TABLE IF NOT EXISTS public.types_archives (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nom VARCHAR(255) NOT NULL,
    description TEXT,
    famille_id UUID REFERENCES public.familles_archives(id),
    extension_fichier VARCHAR(10),
    actif BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table liste_archives
CREATE TABLE IF NOT EXISTS public.liste_archives (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nom VARCHAR(255) NOT NULL,
    description TEXT,
    type_archive_id UUID REFERENCES public.types_archives(id),
    chemin_fichier TEXT,
    taille_fichier BIGINT,
    actif BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================================================
-- TABLES DE PARAMÉTRAGE MÉDICAL
-- ============================================================================

-- Table constantes (si elle n'existe pas)
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table signes_cliniques
CREATE TABLE IF NOT EXISTS public.signes_cliniques (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nom VARCHAR(255) NOT NULL,
    description TEXT,
    categorie VARCHAR(100) DEFAULT 'generale',
    type_signe VARCHAR(100) DEFAULT 'objectif' CHECK (type_signe IN ('objectif', 'subjectif', 'fonctionnel')),
    actif BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table appareils (si elle n'existe pas)
CREATE TABLE IF NOT EXISTS public.appareils (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nom VARCHAR(255) NOT NULL,
    description TEXT,
    specialite_associee VARCHAR(100),
    ordre_affichage INTEGER DEFAULT 0,
    actif BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table diagnostics (si elle n'existe pas)
CREATE TABLE IF NOT EXISTS public.diagnostics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nom VARCHAR(255) NOT NULL,
    description TEXT,
    code_cim VARCHAR(50),
    specialite_associee VARCHAR(100),
    niveau_gravite VARCHAR(50) DEFAULT 'leger' CHECK (niveau_gravite IN ('leger', 'modere', 'grave', 'critique')),
    ordre_affichage INTEGER DEFAULT 0,
    actif BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table antecedents (si elle n'existe pas)
CREATE TABLE IF NOT EXISTS public.antecedents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nom VARCHAR(255) NOT NULL,
    description TEXT,
    categorie VARCHAR(100) DEFAULT 'generale',
    code_cim VARCHAR(50),
    niveau_gravite VARCHAR(50) DEFAULT 'leger' CHECK (niveau_gravite IN ('leger', 'modere', 'grave', 'critique')),
    ordre_affichage INTEGER DEFAULT 0,
    actif BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table medicaments
CREATE TABLE IF NOT EXISTS public.medicaments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nom VARCHAR(255) NOT NULL,
    description TEXT,
    dci VARCHAR(255), -- Dénomination Commune Internationale
    forme_pharmaceutique VARCHAR(100),
    dosage VARCHAR(100),
    voie_administration VARCHAR(100),
    classe_therapeutique VARCHAR(100),
    contre_indications TEXT,
    effets_indesirables TEXT,
    posologie_adulte TEXT,
    posologie_enfant TEXT,
    actif BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table elements_synthese
CREATE TABLE IF NOT EXISTS public.elements_synthese (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nom VARCHAR(255) NOT NULL,
    description TEXT,
    categorie VARCHAR(100) DEFAULT 'generale',
    modele_texte TEXT,
    actif BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table types_actes (si elle n'existe pas)
CREATE TABLE IF NOT EXISTS public.types_actes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nom VARCHAR(255) NOT NULL,
    description TEXT,
    code_ccam VARCHAR(50),
    tarif_base NUMERIC DEFAULT 0,
    duree_moyenne INTEGER DEFAULT 0, -- en minutes
    categorie VARCHAR(100),
    actif BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table assurances (si elle n'existe pas)
CREATE TABLE IF NOT EXISTS public.assurances (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nom VARCHAR(255) NOT NULL,
    description TEXT,
    type_assurance VARCHAR(100) DEFAULT 'mutuelle' CHECK (type_assurance IN ('mutuelle', 'securite_sociale', 'privee', 'autre')),
    taux_remboursement NUMERIC DEFAULT 0,
    plafond_annuel NUMERIC,
    telephone VARCHAR(20),
    email VARCHAR(255),
    adresse TEXT,
    actif BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================================================
-- INDEX POUR OPTIMISER LES PERFORMANCES
-- ============================================================================

-- Index pour les recherches fréquentes
CREATE INDEX IF NOT EXISTS idx_annuaire_actes_nom ON public.annuaire_actes_tarifs(nom);
CREATE INDEX IF NOT EXISTS idx_annuaire_actes_actif ON public.annuaire_actes_tarifs(actif);
CREATE INDEX IF NOT EXISTS idx_liste_vaccins_nom ON public.liste_vaccins(nom);
CREATE INDEX IF NOT EXISTS idx_liste_vaccins_actif ON public.liste_vaccins(actif);
CREATE INDEX IF NOT EXISTS idx_constantes_nom ON public.constantes(nom);
CREATE INDEX IF NOT EXISTS idx_constantes_actif ON public.constantes(actif);
CREATE INDEX IF NOT EXISTS idx_medicaments_nom ON public.medicaments(nom);
CREATE INDEX IF NOT EXISTS idx_medicaments_dci ON public.medicaments(dci);
CREATE INDEX IF NOT EXISTS idx_medicaments_actif ON public.medicaments(actif);

-- ============================================================================
-- TRIGGERS POUR MISE À JOUR AUTOMATIQUE
-- ============================================================================

-- Créer les triggers pour toutes les tables
DO $$
DECLARE
    table_name TEXT;
    tables_list TEXT[] := ARRAY[
        'annuaire_actes_tarifs', 'liste_vaccins', 'liste_etiologies', 'plaintes_principales',
        'types_symptomes', 'categories_antecedents', 'types_antecedents', 'types_certificats',
        'employeurs', 'tiers_payant', 'type_couverture_medicale', 'familles_archives',
        'types_archives', 'liste_archives', 'constantes', 'signes_cliniques', 'appareils',
        'diagnostics', 'antecedents', 'medicaments', 'elements_synthese', 'types_actes', 'assurances'
    ];
BEGIN
    FOREACH table_name IN ARRAY tables_list
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS update_%I_updated_at ON public.%I', table_name, table_name);
        EXECUTE format('CREATE TRIGGER update_%I_updated_at
            BEFORE UPDATE ON public.%I
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column()', table_name, table_name);
    END LOOP;
END $$;

-- ============================================================================
-- POLITIQUES RLS (ROW LEVEL SECURITY)
-- ============================================================================

-- Activer RLS sur toutes les tables
DO $$
DECLARE
    table_name TEXT;
    tables_list TEXT[] := ARRAY[
        'annuaire_actes_tarifs', 'liste_vaccins', 'liste_etiologies', 'plaintes_principales',
        'types_symptomes', 'categories_antecedents', 'types_antecedents', 'types_certificats',
        'employeurs', 'tiers_payant', 'type_couverture_medicale', 'familles_archives',
        'types_archives', 'liste_archives', 'constantes', 'signes_cliniques', 'appareils',
        'diagnostics', 'antecedents', 'medicaments', 'elements_synthese', 'types_actes', 'assurances'
    ];
BEGIN
    FOREACH table_name IN ARRAY tables_list
    LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);
        
        -- Politique de lecture pour tous les utilisateurs authentifiés
        EXECUTE format('DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.%I', table_name);
        EXECUTE format('CREATE POLICY "Enable read access for authenticated users" ON public.%I
            FOR SELECT USING (auth.role() = ''authenticated'')', table_name);
        
        -- Politique d'écriture pour admins et médecins
        EXECUTE format('DROP POLICY IF EXISTS "Enable write access for admin and doctor" ON public.%I', table_name);
        EXECUTE format('CREATE POLICY "Enable write access for admin and doctor" ON public.%I
            FOR ALL USING (
                EXISTS (
                    SELECT 1 FROM public.users 
                    WHERE users.auth_id = auth.uid() 
                    AND (users.role = ''admin'' OR users.role = ''doctor'')
                )
            )', table_name);
    END LOOP;
END $$;

-- ============================================================================
-- DONNÉES DE TEST
-- ============================================================================

-- Données pour annuaire_actes_tarifs
INSERT INTO public.annuaire_actes_tarifs (nom, description, code_ccam, tarif_base, tarif_secu, categorie, actif) VALUES
('Consultation générale', 'Consultation médicale générale', 'C001', 25000, 20000, 'Consultation', true),
('Consultation spécialisée', 'Consultation médicale spécialisée', 'C002', 35000, 28000, 'Consultation', true),
('Électrocardiogramme', 'Enregistrement ECG', 'ECG001', 15000, 12000, 'Examen', true),
('Pansement simple', 'Réfection de pansement', 'P001', 5000, 4000, 'Soin', true),
('Injection intramusculaire', 'Administration IM', 'INJ001', 3000, 2500, 'Soin', true)
ON CONFLICT (nom) DO NOTHING;

-- Données pour liste_vaccins
INSERT INTO public.liste_vaccins (nom, description, fabricant, code_atc, actif) VALUES
('BCG', 'Vaccin contre la tuberculose', 'Sanofi Pasteur', 'J07AN01', true),
('DTC-Hep B-Hib', 'Vaccin pentavalent', 'GSK', 'J07CA09', true),
('Polio (VPO)', 'Vaccin poliomyélite oral', 'Sanofi Pasteur', 'J07BF01', true),
('Rougeole-Rubéole', 'Vaccin RR', 'Serum Institute', 'J07BD52', true),
('Fièvre jaune', 'Vaccin anti-amaril', 'Sanofi Pasteur', 'J07BL01', true),
('Méningite A+C', 'Vaccin méningococcique', 'GSK', 'J07AH04', true)
ON CONFLICT (nom) DO NOTHING;

-- Données pour constantes
INSERT INTO public.constantes (nom, description, unite, valeur_normale_min, valeur_normale_max, categorie, actif) VALUES
('Tension artérielle systolique', 'Pression artérielle systolique', 'mmHg', 90, 140, 'Cardiovasculaire', true),
('Tension artérielle diastolique', 'Pression artérielle diastolique', 'mmHg', 60, 90, 'Cardiovasculaire', true),
('Fréquence cardiaque', 'Battements par minute', 'bpm', 60, 100, 'Cardiovasculaire', true),
('Température', 'Température corporelle', '°C', 36.1, 37.2, 'Générale', true),
('Poids', 'Poids corporel', 'kg', NULL, NULL, 'Anthropométrique', true),
('Taille', 'Taille', 'cm', NULL, NULL, 'Anthropométrique', true),
('Saturation O2', 'Saturation en oxygène', '%', 95, 100, 'Respiratoire', true)
ON CONFLICT (nom) DO NOTHING;

-- Données pour medicaments
INSERT INTO public.medicaments (nom, dci, forme_pharmaceutique, dosage, classe_therapeutique, actif) VALUES
('Paracétamol', 'Paracétamol', 'Comprimé', '500mg', 'Antalgique', true),
('Ibuprofène', 'Ibuprofène', 'Comprimé', '400mg', 'Anti-inflammatoire', true),
('Amoxicilline', 'Amoxicilline', 'Gélule', '500mg', 'Antibiotique', true),
('Oméprazole', 'Oméprazole', 'Gélule', '20mg', 'Inhibiteur pompe à protons', true),
('Salbutamol', 'Salbutamol', 'Aérosol', '100µg/dose', 'Bronchodilatateur', true)
ON CONFLICT (nom) DO NOTHING;

-- ============================================================================
-- COMMENTAIRES SUR LES TABLES
-- ============================================================================

COMMENT ON TABLE public.annuaire_actes_tarifs IS 'Annuaire des actes médicaux avec tarification';
COMMENT ON TABLE public.liste_vaccins IS 'Liste des vaccins disponibles';
COMMENT ON TABLE public.constantes IS 'Constantes vitales et mesures médicales';
COMMENT ON TABLE public.medicaments IS 'Base de données des médicaments';
COMMENT ON TABLE public.assurances IS 'Liste des organismes d''assurance maladie';

-- Fin de la migration
