-- Migration Phase 1 - Module Facturation (Structure de base de données)
-- Date: 2025-01-02
-- Description: Création de la structure de base de données pour le module Facturation

-- =====================================================
-- 0. TABLES MANQUANTES PRÉALABLES
-- =====================================================

-- Table des spécialités médicales
CREATE TABLE IF NOT EXISTS specialites (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    couleur VARCHAR(7) DEFAULT '#3B82F6',
    actif BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by BIGINT REFERENCES users(id),
    updated_by BIGINT REFERENCES users(id)
);

-- Table des types d'actes
CREATE TABLE IF NOT EXISTS types_actes (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(255) NOT NULL,
    description TEXT,
    code_ccam VARCHAR(20),
    specialite_id BIGINT REFERENCES specialites(id),
    actif BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by BIGINT REFERENCES users(id),
    updated_by BIGINT REFERENCES users(id)
);

-- Table des médicaments (renommer medications en medicaments pour cohérence)
CREATE TABLE IF NOT EXISTS medicaments (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(255) NOT NULL,
    forme VARCHAR(100),
    dosage VARCHAR(100),
    laboratoire VARCHAR(255),
    prix NUMERIC(10,2),
    stock INTEGER DEFAULT 0,
    actif BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by BIGINT REFERENCES users(id),
    updated_by BIGINT REFERENCES users(id)
);

-- Table des assurances
CREATE TABLE IF NOT EXISTS assurances (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'secu', 'mutuelle', 'privee'
    numero_contrat VARCHAR(100),
    taux_remboursement NUMERIC(5,2) DEFAULT 100.00,
    actif BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by BIGINT REFERENCES users(id),
    updated_by BIGINT REFERENCES users(id)
);

-- =====================================================
-- 1. TABLES PRINCIPALES POUR LA FACTURATION
-- =====================================================

-- Table pour les actes pratiqués lors d'une consultation
CREATE TABLE IF NOT EXISTS actes_consultation (
    id SERIAL PRIMARY KEY,
    consultation_id BIGINT REFERENCES consultations(id) ON DELETE CASCADE,
    type_acte_id BIGINT REFERENCES types_actes(id),
    quantite INTEGER DEFAULT 1,
    tarif_unitaire NUMERIC(10,2) NOT NULL,
    montant_total NUMERIC(10,2) GENERATED ALWAYS AS (quantite * tarif_unitaire) STORED,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by BIGINT REFERENCES users(id),
    updated_by BIGINT REFERENCES users(id)
);

-- Table pour les examens complémentaires prescrits
CREATE TABLE IF NOT EXISTS examens_prescrits (
    id SERIAL PRIMARY KEY,
    consultation_id BIGINT REFERENCES consultations(id) ON DELETE CASCADE,
    patient_id BIGINT REFERENCES patients(id),
    type_examen VARCHAR(255) NOT NULL,
    description TEXT,
    urgence BOOLEAN DEFAULT false,
    date_prescription DATE DEFAULT CURRENT_DATE,
    date_realisation DATE,
    statut VARCHAR(50) DEFAULT 'prescrit' CHECK (statut IN ('prescrit', 'en_cours', 'termine', 'annule')),
    resultat TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by BIGINT REFERENCES users(id),
    updated_by BIGINT REFERENCES users(id)
);

-- Table pour les analyses de laboratoire prescrites
CREATE TABLE IF NOT EXISTS analyses_labo_prescrites (
    id SERIAL PRIMARY KEY,
    consultation_id BIGINT REFERENCES consultations(id) ON DELETE CASCADE,
    patient_id BIGINT REFERENCES patients(id),
    type_analyse VARCHAR(255) NOT NULL,
    description TEXT,
    urgence BOOLEAN DEFAULT false,
    date_prescription DATE DEFAULT CURRENT_DATE,
    date_prelevement DATE,
    date_resultat DATE,
    statut VARCHAR(50) DEFAULT 'prescrit' CHECK (statut IN ('prescrit', 'preleve', 'en_cours', 'termine', 'annule')),
    resultat TEXT,
    valeurs_normales TEXT,
    interpretation TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by BIGINT REFERENCES users(id),
    updated_by BIGINT REFERENCES users(id)
);

-- Table pour les prescriptions pharmaceutiques
CREATE TABLE IF NOT EXISTS prescriptions_pharmacie (
    id SERIAL PRIMARY KEY,
    consultation_id BIGINT REFERENCES consultations(id) ON DELETE CASCADE,
    patient_id BIGINT REFERENCES patients(id),
    medicament_id BIGINT REFERENCES medicaments(id),
    posologie TEXT NOT NULL,
    duree_traitement VARCHAR(100),
    quantite_prescrite INTEGER,
    unite VARCHAR(50),
    renouvellements INTEGER DEFAULT 0,
    urgence BOOLEAN DEFAULT false,
    date_prescription DATE DEFAULT CURRENT_DATE,
    date_debut_traitement DATE,
    statut VARCHAR(50) DEFAULT 'prescrit' CHECK (statut IN ('prescrit', 'delivre', 'termine', 'annule')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by BIGINT REFERENCES users(id),
    updated_by BIGINT REFERENCES users(id)
);

-- Table pour les instructions diverses (rendez-vous, etc.)
CREATE TABLE IF NOT EXISTS instructions_diverses (
    id SERIAL PRIMARY KEY,
    consultation_id BIGINT REFERENCES consultations(id) ON DELETE CASCADE,
    patient_id BIGINT REFERENCES patients(id),
    type_instruction VARCHAR(100) NOT NULL, -- 'rendez_vous', 'conseil', 'information', 'autre'
    titre VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    urgence BOOLEAN DEFAULT false,
    date_instruction DATE DEFAULT CURRENT_DATE,
    date_execution DATE,
    statut VARCHAR(50) DEFAULT 'en_attente' CHECK (statut IN ('en_attente', 'en_cours', 'termine', 'annule')),
    traite_par BIGINT REFERENCES users(id),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by BIGINT REFERENCES users(id),
    updated_by BIGINT REFERENCES users(id)
);

-- Table pour les factures
CREATE TABLE IF NOT EXISTS factures (
    id SERIAL PRIMARY KEY,
    consultation_id BIGINT REFERENCES consultations(id) ON DELETE CASCADE,
    patient_id BIGINT REFERENCES patients(id),
    numero_facture VARCHAR(50) UNIQUE NOT NULL,
    date_facture DATE DEFAULT CURRENT_DATE,
    montant_ht NUMERIC(10,2) DEFAULT 0,
    tva NUMERIC(5,2) DEFAULT 0,
    montant_ttc NUMERIC(10,2) DEFAULT 0,
    montant_paye NUMERIC(10,2) DEFAULT 0,
    montant_restant NUMERIC(10,2) GENERATED ALWAYS AS (montant_ttc - montant_paye) STORED,
    statut_paiement VARCHAR(50) DEFAULT 'en_attente' CHECK (statut_paiement IN ('en_attente', 'partiel', 'paye', 'impaye')),
    mode_paiement VARCHAR(50), -- 'especes', 'carte', 'cheque', 'assurance', 'monnaie_electronique'
    assurance_id BIGINT REFERENCES assurances(id),
    numero_carte VARCHAR(20),
    emetteur_monnaie_electronique VARCHAR(100),
    date_paiement TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by BIGINT REFERENCES users(id),
    updated_by BIGINT REFERENCES users(id)
);

-- Table pour les lignes de facture (détail des actes)
CREATE TABLE IF NOT EXISTS lignes_facture (
    id SERIAL PRIMARY KEY,
    facture_id BIGINT REFERENCES factures(id) ON DELETE CASCADE,
    acte_consultation_id BIGINT REFERENCES actes_consultation(id),
    description VARCHAR(255) NOT NULL,
    quantite INTEGER DEFAULT 1,
    prix_unitaire NUMERIC(10,2) NOT NULL,
    montant_ligne NUMERIC(10,2) GENERATED ALWAYS AS (quantite * prix_unitaire) STORED,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 2. TABLES DE CONFIGURATION ET TARIFS
-- =====================================================

-- Table pour les tarifs des actes par spécialité
CREATE TABLE IF NOT EXISTS tarifs_actes (
    id SERIAL PRIMARY KEY,
    type_acte_id BIGINT REFERENCES types_actes(id),
    specialite_id BIGINT REFERENCES specialites(id),
    tarif_base NUMERIC(10,2) NOT NULL,
    tarif_secu NUMERIC(10,2),
    tarif_mutuelle NUMERIC(10,2),
    date_debut_validite DATE DEFAULT CURRENT_DATE,
    date_fin_validite DATE,
    actif BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by BIGINT REFERENCES users(id),
    updated_by BIGINT REFERENCES users(id),
    UNIQUE(type_acte_id, specialite_id, date_debut_validite)
);

-- Table pour les types d'examens disponibles
CREATE TABLE IF NOT EXISTS types_examens (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(255) NOT NULL,
    description TEXT,
    specialite_id BIGINT REFERENCES specialites(id),
    duree_estimee INTEGER, -- en minutes
    preparation_requise TEXT,
    actif BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by BIGINT REFERENCES users(id),
    updated_by BIGINT REFERENCES users(id)
);

-- Table pour les types d'analyses de laboratoire
CREATE TABLE IF NOT EXISTS types_analyses_labo (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(255) NOT NULL,
    description TEXT,
    code_analyse VARCHAR(50),
    valeurs_normales TEXT,
    unite VARCHAR(50),
    delai_resultat INTEGER, -- en heures
    actif BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by BIGINT REFERENCES users(id),
    updated_by BIGINT REFERENCES users(id)
);

-- =====================================================
-- 3. INDEX POUR LES PERFORMANCES
-- =====================================================

-- Index pour les nouvelles tables préalables
CREATE INDEX IF NOT EXISTS idx_specialites_nom ON specialites(nom);
CREATE INDEX IF NOT EXISTS idx_types_actes_specialite ON types_actes(specialite_id);
CREATE INDEX IF NOT EXISTS idx_medicaments_nom ON medicaments(nom);
CREATE INDEX IF NOT EXISTS idx_assurances_nom ON assurances(nom);

-- Index pour les actes de consultation
CREATE INDEX IF NOT EXISTS idx_actes_consultation_consultation ON actes_consultation(consultation_id);
CREATE INDEX IF NOT EXISTS idx_actes_consultation_type ON actes_consultation(type_acte_id);

-- Index pour les examens prescrits
CREATE INDEX IF NOT EXISTS idx_examens_prescrits_consultation ON examens_prescrits(consultation_id);
CREATE INDEX IF NOT EXISTS idx_examens_prescrits_patient ON examens_prescrits(patient_id);
CREATE INDEX IF NOT EXISTS idx_examens_prescrits_statut ON examens_prescrits(statut);

-- Index pour les analyses labo
CREATE INDEX IF NOT EXISTS idx_analyses_labo_consultation ON analyses_labo_prescrites(consultation_id);
CREATE INDEX IF NOT EXISTS idx_analyses_labo_patient ON analyses_labo_prescrites(patient_id);
CREATE INDEX IF NOT EXISTS idx_analyses_labo_statut ON analyses_labo_prescrites(statut);

-- Index pour les prescriptions pharmacie
CREATE INDEX IF NOT EXISTS idx_prescriptions_pharmacie_consultation ON prescriptions_pharmacie(consultation_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_pharmacie_patient ON prescriptions_pharmacie(patient_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_pharmacie_medicament ON prescriptions_pharmacie(medicament_id);

-- Index pour les instructions diverses
CREATE INDEX IF NOT EXISTS idx_instructions_diverses_consultation ON instructions_diverses(consultation_id);
CREATE INDEX IF NOT EXISTS idx_instructions_diverses_patient ON instructions_diverses(patient_id);
CREATE INDEX IF NOT EXISTS idx_instructions_diverses_statut ON instructions_diverses(statut);

-- Index pour les factures
CREATE INDEX IF NOT EXISTS idx_factures_consultation ON factures(consultation_id);
CREATE INDEX IF NOT EXISTS idx_factures_patient ON factures(patient_id);
CREATE INDEX IF NOT EXISTS idx_factures_statut ON factures(statut_paiement);
CREATE INDEX IF NOT EXISTS idx_factures_date ON factures(date_facture);

-- Index pour les lignes de facture
CREATE INDEX IF NOT EXISTS idx_lignes_facture_facture ON lignes_facture(facture_id);

-- Index pour les tarifs
CREATE INDEX IF NOT EXISTS idx_tarifs_actes_type ON tarifs_actes(type_acte_id);
CREATE INDEX IF NOT EXISTS idx_tarifs_actes_specialite ON tarifs_actes(specialite_id);

-- =====================================================
-- 4. FONCTIONS ET TRIGGERS
-- =====================================================

-- Fonction pour générer automatiquement le numéro de facture
CREATE OR REPLACE FUNCTION generer_numero_facture()
RETURNS TRIGGER AS $$
DECLARE
    annee VARCHAR(4);
    compteur INTEGER;
    numero VARCHAR(50);
BEGIN
    annee := EXTRACT(YEAR FROM CURRENT_DATE)::VARCHAR;
    
    -- Compter les factures de l'année
    SELECT COALESCE(MAX(CAST(SUBSTRING(numero_facture FROM 9) AS INTEGER)), 0) + 1
    INTO compteur
    FROM factures
    WHERE numero_facture LIKE 'FACT-' || annee || '-%';
    
    numero := 'FACT-' || annee || '-' || LPAD(compteur::VARCHAR, 6, '0');
    NEW.numero_facture := numero;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour générer automatiquement le numéro de facture
CREATE TRIGGER trigger_generer_numero_facture
    BEFORE INSERT ON factures
    FOR EACH ROW
    WHEN (NEW.numero_facture IS NULL OR NEW.numero_facture = '')
    EXECUTE FUNCTION generer_numero_facture();

-- Fonction pour calculer automatiquement les montants de facture
CREATE OR REPLACE FUNCTION calculer_montants_facture()
RETURNS TRIGGER AS $$
DECLARE
    total_ht NUMERIC(10,2);
    total_ttc NUMERIC(10,2);
BEGIN
    -- Calculer le montant HT total
    SELECT COALESCE(SUM(montant_ligne), 0)
    INTO total_ht
    FROM lignes_facture
    WHERE facture_id = NEW.id;
    
    -- Calculer le montant TTC (TVA 20% par défaut)
    total_ttc := total_ht * (1 + COALESCE(NEW.tva, 20) / 100);
    
    -- Mettre à jour les montants
    UPDATE factures 
    SET 
        montant_ht = total_ht,
        montant_ttc = total_ttc,
        updated_at = NOW()
    WHERE id = NEW.id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour recalculer les montants quand une ligne de facture change
CREATE TRIGGER trigger_calculer_montants_facture
    AFTER INSERT OR UPDATE OR DELETE ON lignes_facture
    FOR EACH ROW
    EXECUTE FUNCTION calculer_montants_facture();

-- =====================================================
-- 5. DONNÉES DE TEST
-- =====================================================

-- Spécialités de test
INSERT INTO specialites (nom, description, couleur) VALUES
('Médecine générale', 'Médecine générale et familiale', '#3B82F6'),
('Cardiologie', 'Spécialité du cœur et des vaisseaux', '#EF4444'),
('Dermatologie', 'Spécialité de la peau', '#10B981'),
('Pédiatrie', 'Médecine des enfants', '#F59E0B'),
('Gynécologie', 'Spécialité de la femme', '#EC4899');

-- Types d'actes de test
INSERT INTO types_actes (nom, description, code_ccam, specialite_id) VALUES
('Consultation simple', 'Consultation médicale standard', 'CCAM001', 1),
('Consultation spécialisée', 'Consultation avec un spécialiste', 'CCAM002', 1),
('Électrocardiogramme', 'ECG 12 dérivations', 'CCAM003', 2),
('Échographie cardiaque', 'Échographie du cœur', 'CCAM004', 2),
('Examen dermatologique', 'Examen de la peau', 'CCAM005', 3);

-- Médicaments de test
INSERT INTO medicaments (nom, forme, dosage, laboratoire, prix) VALUES
('Paracétamol', 'Comprimé', '500mg', 'Laboratoire A', 5.50),
('Ibuprofène', 'Comprimé', '400mg', 'Laboratoire B', 6.20),
('Amoxicilline', 'Gélule', '1g', 'Laboratoire C', 12.80),
('Oméprazole', 'Gélule', '20mg', 'Laboratoire D', 15.40),
('Atorvastatine', 'Comprimé', '10mg', 'Laboratoire E', 18.90);

-- Assurances de test
INSERT INTO assurances (nom, type, numero_contrat, taux_remboursement) VALUES
('Sécurité Sociale', 'secu', 'SS001', 70.00),
('Mutuelle Bleue', 'mutuelle', 'MB001', 30.00),
('Assurance Privée Plus', 'privee', 'APP001', 100.00),
('Mutuelle Verte', 'mutuelle', 'MV001', 25.00),
('Assurance Santé Premium', 'privee', 'ASP001', 100.00);

-- Types d'examens de test
INSERT INTO types_examens (nom, description, specialite_id, duree_estimee) VALUES
('Radiographie thorax', 'Radiographie du thorax de face et profil', 1, 30),
('Échographie abdominale', 'Échographie de l''abdomen complet', 1, 45),
('Électrocardiogramme', 'ECG 12 dérivations', 2, 20),
('Test d''effort', 'Test d''effort sur tapis roulant', 2, 60),
('Endoscopie digestive', 'Endoscopie haute ou basse', 1, 90);

-- Types d'analyses de laboratoire de test
INSERT INTO types_analyses_labo (nom, description, code_analyse, delai_resultat) VALUES
('Numération formule sanguine', 'NFS complète', 'NFS', 24),
('Glycémie à jeun', 'Dosage de la glycémie', 'GLY', 4),
('Cholestérol total', 'Dosage du cholestérol', 'CHOL', 24),
('Créatinine', 'Dosage de la créatinine', 'CREA', 24),
('Groupage sanguin', 'Détermination du groupe sanguin', 'GRP', 48);

-- Tarifs d'actes de test
INSERT INTO tarifs_actes (type_acte_id, specialite_id, tarif_base, tarif_secu, tarif_mutuelle) VALUES
(1, 1, 50.00, 25.00, 45.00),
(2, 1, 80.00, 40.00, 72.00),
(3, 2, 120.00, 60.00, 108.00);

-- =====================================================
-- 6. POLITIQUES RLS
-- =====================================================

-- Activer RLS sur toutes les nouvelles tables
ALTER TABLE specialites ENABLE ROW LEVEL SECURITY;
ALTER TABLE types_actes ENABLE ROW LEVEL SECURITY;
ALTER TABLE medicaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assurances ENABLE ROW LEVEL SECURITY;
ALTER TABLE actes_consultation ENABLE ROW LEVEL SECURITY;
ALTER TABLE examens_prescrits ENABLE ROW LEVEL SECURITY;
ALTER TABLE analyses_labo_prescrites ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions_pharmacie ENABLE ROW LEVEL SECURITY;
ALTER TABLE instructions_diverses ENABLE ROW LEVEL SECURITY;
ALTER TABLE factures ENABLE ROW LEVEL SECURITY;
ALTER TABLE lignes_facture ENABLE ROW LEVEL SECURITY;
ALTER TABLE tarifs_actes ENABLE ROW LEVEL SECURITY;
ALTER TABLE types_examens ENABLE ROW LEVEL SECURITY;
ALTER TABLE types_analyses_labo ENABLE ROW LEVEL SECURITY;

-- Politiques pour les tables de référence
CREATE POLICY "Tous les utilisateurs authentifiés peuvent voir les spécialités" ON specialites
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Tous les utilisateurs authentifiés peuvent voir les types d'actes" ON types_actes
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Tous les utilisateurs authentifiés peuvent voir les médicaments" ON medicaments
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Tous les utilisateurs authentifiés peuvent voir les assurances" ON assurances
    FOR SELECT USING (auth.role() = 'authenticated');

-- Politiques pour les actes de consultation
CREATE POLICY "Les médecins peuvent gérer les actes de leurs consultations" ON actes_consultation
    FOR ALL USING (
        consultation_id IN (
            SELECT id FROM consultations WHERE medecin_id = auth.uid()
        )
    );

-- Politiques pour les examens prescrits
CREATE POLICY "Les médecins peuvent gérer les examens de leurs patients" ON examens_prescrits
    FOR ALL USING (
        consultation_id IN (
            SELECT id FROM consultations WHERE medecin_id = auth.uid()
        )
    );

-- Politiques pour les analyses labo
CREATE POLICY "Les médecins peuvent gérer les analyses de leurs patients" ON analyses_labo_prescrites
    FOR ALL USING (
        consultation_id IN (
            SELECT id FROM consultations WHERE medecin_id = auth.uid()
        )
    );

-- Politiques pour les prescriptions pharmacie
CREATE POLICY "Les médecins peuvent gérer les prescriptions de leurs patients" ON prescriptions_pharmacie
    FOR ALL USING (
        consultation_id IN (
            SELECT id FROM consultations WHERE medecin_id = auth.uid()
        )
    );

-- Politiques pour les instructions diverses
CREATE POLICY "Les médecins peuvent gérer les instructions de leurs patients" ON instructions_diverses
    FOR ALL USING (
        consultation_id IN (
            SELECT id FROM consultations WHERE medecin_id = auth.uid()
        )
    );

-- Politiques pour les factures
CREATE POLICY "Les utilisateurs peuvent voir les factures de leurs consultations" ON factures
    FOR SELECT USING (
        consultation_id IN (
            SELECT id FROM consultations WHERE medecin_id = auth.uid()
        )
    );

CREATE POLICY "Les admins peuvent gérer toutes les factures" ON factures
    FOR ALL USING (auth.role() = 'admin');

-- Politiques pour les lignes de facture
CREATE POLICY "Les utilisateurs peuvent voir les lignes de leurs factures" ON lignes_facture
    FOR SELECT USING (
        facture_id IN (
            SELECT id FROM factures WHERE consultation_id IN (
                SELECT id FROM consultations WHERE medecin_id = auth.uid()
            )
        )
    );

-- Politiques pour les tarifs et types
CREATE POLICY "Tous les utilisateurs authentifiés peuvent voir les tarifs" ON tarifs_actes
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Tous les utilisateurs authentifiés peuvent voir les types" ON types_examens
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Tous les utilisateurs authentifiés peuvent voir les types d'analyses" ON types_analyses_labo
    FOR SELECT USING (auth.role() = 'authenticated');

-- =====================================================
-- 7. VUES UTILES
-- =====================================================

-- Vue pour le récapitulatif de facturation d'une consultation
CREATE OR REPLACE VIEW recapitulatif_facturation_consultation AS
SELECT 
    c.id as consultation_id,
    c.date_consultation,
    p.nom as nom_patient,
    p.prenom as prenom_patient,
    u.nom as nom_medecin,
    u.prenom as prenom_medecin,
    COUNT(ac.id) as nombre_actes,
    COALESCE(SUM(ac.montant_total), 0) as montant_actes,
    COUNT(ep.id) as nombre_examens,
    COUNT(alp.id) as nombre_analyses,
    COUNT(pp.id) as nombre_prescriptions,
    COUNT(id.id) as nombre_instructions,
    f.numero_facture,
    f.montant_ttc,
    f.statut_paiement
FROM consultations c
LEFT JOIN patients p ON c.patient_id = p.id
LEFT JOIN users u ON c.medecin_id = u.id
LEFT JOIN actes_consultation ac ON c.id = ac.consultation_id
LEFT JOIN examens_prescrits ep ON c.id = ep.consultation_id
LEFT JOIN analyses_labo_prescrites alp ON c.id = alp.consultation_id
LEFT JOIN prescriptions_pharmacie pp ON c.id = pp.consultation_id
LEFT JOIN instructions_diverses id ON c.id = id.consultation_id
LEFT JOIN factures f ON c.id = f.consultation_id
GROUP BY c.id, c.date_consultation, p.nom, p.prenom, u.nom, u.prenom, f.numero_facture, f.montant_ttc, f.statut_paiement;

-- Vue pour les prescriptions en attente
CREATE OR REPLACE VIEW prescriptions_en_attente AS
SELECT 
    'examen' as type,
    ep.id,
    ep.consultation_id,
    ep.patient_id,
    p.nom as nom_patient,
    p.prenom as prenom_patient,
    ep.type_examen as description,
    ep.urgence,
    ep.date_prescription,
    ep.statut
FROM examens_prescrits ep
JOIN patients p ON ep.patient_id = p.id
WHERE ep.statut = 'prescrit'

UNION ALL

SELECT 
    'analyse' as type,
    alp.id,
    alp.consultation_id,
    alp.patient_id,
    p.nom as nom_patient,
    p.prenom as prenom_patient,
    alp.type_analyse as description,
    alp.urgence,
    alp.date_prescription,
    alp.statut
FROM analyses_labo_prescrites alp
JOIN patients p ON alp.patient_id = p.id
WHERE alp.statut = 'prescrit'

UNION ALL

SELECT 
    'prescription' as type,
    pp.id,
    pp.consultation_id,
    pp.patient_id,
    p.nom as nom_patient,
    p.prenom as prenom_patient,
    m.nom as description,
    pp.urgence,
    pp.date_prescription,
    pp.statut
FROM prescriptions_pharmacie pp
JOIN patients p ON pp.patient_id = p.id
JOIN medicaments m ON pp.medicament_id = m.id
WHERE pp.statut = 'prescrit'

UNION ALL

SELECT 
    'instruction' as type,
    id.id,
    id.consultation_id,
    id.patient_id,
    p.nom as nom_patient,
    p.prenom as prenom_patient,
    id.titre as description,
    id.urgence,
    id.date_instruction as date_prescription,
    id.statut
FROM instructions_diverses id
JOIN patients p ON id.patient_id = p.id
WHERE id.statut = 'en_attente';

-- =====================================================
-- 8. COMMENTAIRES ET DOCUMENTATION
-- =====================================================

COMMENT ON TABLE specialites IS 'Spécialités médicales disponibles';
COMMENT ON TABLE types_actes IS 'Types d''actes médicaux avec codes CCAM';
COMMENT ON TABLE medicaments IS 'Médicaments disponibles en pharmacie';
COMMENT ON TABLE assurances IS 'Assurances et mutuelles';
COMMENT ON TABLE actes_consultation IS 'Actes pratiqués lors d''une consultation avec tarification';
COMMENT ON TABLE examens_prescrits IS 'Examens complémentaires prescrits par le médecin';
COMMENT ON TABLE analyses_labo_prescrites IS 'Analyses de laboratoire prescrites';
COMMENT ON TABLE prescriptions_pharmacie IS 'Prescriptions pharmaceutiques';
COMMENT ON TABLE instructions_diverses IS 'Instructions diverses (rendez-vous, conseils, etc.)';
COMMENT ON TABLE factures IS 'Factures générées pour les consultations';
COMMENT ON TABLE lignes_facture IS 'Détail des lignes de facture';
COMMENT ON TABLE tarifs_actes IS 'Tarifs des actes par spécialité';
COMMENT ON TABLE types_examens IS 'Types d''examens disponibles';
COMMENT ON TABLE types_analyses_labo IS 'Types d''analyses de laboratoire';

COMMENT ON FUNCTION generer_numero_facture IS 'Génère automatiquement un numéro de facture unique';
COMMENT ON FUNCTION calculer_montants_facture IS 'Calcule automatiquement les montants HT et TTC d''une facture';

-- =====================================================
-- FIN DE LA MIGRATION
-- =====================================================
