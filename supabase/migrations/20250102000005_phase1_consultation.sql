-- Migration Phase 1 - Module Consultation
-- Création des tables pour gérer les consultations médicales complètes

-- =====================================================
-- 1. TABLE CONSULTATIONS (table principale)
-- =====================================================

CREATE TABLE IF NOT EXISTS consultations (
    id BIGSERIAL PRIMARY KEY,
    patient_id BIGINT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    medecin_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rendez_vous_id BIGINT REFERENCES appointments(id) ON DELETE SET NULL,
    date_consultation TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    motif_consultation TEXT,
    statut VARCHAR(50) DEFAULT 'en_cours' CHECK (statut IN ('en_cours', 'terminee', 'annulee')),
    notes_generales TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 2. TABLE ANTECEDENTS_PATIENTS (liaison patient-antécédents)
-- =====================================================

CREATE TABLE IF NOT EXISTS antecedents_patients (
    id BIGSERIAL PRIMARY KEY,
    patient_id BIGINT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    antecedent_id BIGINT NOT NULL REFERENCES antecedents(id) ON DELETE CASCADE,
    consultation_id BIGINT REFERENCES consultations(id) ON DELETE SET NULL,
    date_decouverte DATE,
    date_debut DATE,
    date_fin DATE,
    commentaires TEXT,
    actif BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(patient_id, antecedent_id)
);

-- =====================================================
-- 3. TABLE CONSTANTES_CONSULTATION (mesures des constantes)
-- =====================================================

CREATE TABLE IF NOT EXISTS constantes_consultation (
    id BIGSERIAL PRIMARY KEY,
    consultation_id BIGINT NOT NULL REFERENCES consultations(id) ON DELETE CASCADE,
    constante_id BIGINT NOT NULL REFERENCES constantes(id) ON DELETE CASCADE,
    valeur_mesuree DECIMAL(8,2),
    unite VARCHAR(20),
    commentaires TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(consultation_id, constante_id)
);

-- =====================================================
-- 4. TABLE SIGNS_CLINIQUES_CONSULTATION (signes cliniques observés)
-- =====================================================

CREATE TABLE IF NOT EXISTS signes_cliniques_consultation (
    id BIGSERIAL PRIMARY KEY,
    consultation_id BIGINT NOT NULL REFERENCES consultations(id) ON DELETE CASCADE,
    signe_clinique_id BIGINT NOT NULL REFERENCES signes_cliniques(id) ON DELETE CASCADE,
    intensite VARCHAR(20) CHECK (intensite IN ('faible', 'moderee', 'forte')),
    localisation TEXT,
    commentaires TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(consultation_id, signe_clinique_id)
);

-- =====================================================
-- 5. TABLE EXAMENS_APPAREILS (examens des appareils)
-- =====================================================

CREATE TABLE IF NOT EXISTS examens_appareils (
    id BIGSERIAL PRIMARY KEY,
    consultation_id BIGINT NOT NULL REFERENCES consultations(id) ON DELETE CASCADE,
    appareil_id BIGINT NOT NULL REFERENCES appareils(id) ON DELETE CASCADE,
    resultat_examen TEXT,
    anomalies_detectees TEXT,
    recommandations TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(consultation_id, appareil_id)
);

-- =====================================================
-- 6. TABLE SYNTHESES_CONSULTATION (éléments de synthèse)
-- =====================================================

CREATE TABLE IF NOT EXISTS syntheses_consultation (
    id BIGSERIAL PRIMARY KEY,
    consultation_id BIGINT NOT NULL REFERENCES consultations(id) ON DELETE CASCADE,
    element_synthese_id BIGINT NOT NULL REFERENCES elements_synthese(id) ON DELETE CASCADE,
    commentaires TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(consultation_id, element_synthese_id)
);

-- =====================================================
-- 7. TABLE AUTRES_SIGNES_PHYSIQUES (autres commentaires)
-- =====================================================

CREATE TABLE IF NOT EXISTS autres_signes_physiques (
    id BIGSERIAL PRIMARY KEY,
    consultation_id BIGINT NOT NULL REFERENCES consultations(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    categorie VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 8. TABLE DIAGNOSTICS_CONSULTATION (diagnostics posés)
-- =====================================================

CREATE TABLE IF NOT EXISTS diagnostics_consultation (
    id BIGSERIAL PRIMARY KEY,
    consultation_id BIGINT NOT NULL REFERENCES consultations(id) ON DELETE CASCADE,
    diagnostic_id BIGINT NOT NULL REFERENCES diagnostics(id) ON DELETE CASCADE,
    commentaires TEXT,
    certitude VARCHAR(20) DEFAULT 'probable' CHECK (certitude IN ('certain', 'probable', 'possible')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(consultation_id, diagnostic_id)
);

-- =====================================================
-- 9. TABLE ORDONNANCES (prescriptions médicales)
-- =====================================================

CREATE TABLE IF NOT EXISTS ordonnances (
    id BIGSERIAL PRIMARY KEY,
    consultation_id BIGINT NOT NULL REFERENCES consultations(id) ON DELETE CASCADE,
    numero_ordonnance VARCHAR(50) UNIQUE,
    date_prescription DATE DEFAULT CURRENT_DATE,
    statut VARCHAR(20) DEFAULT 'active' CHECK (statut IN ('active', 'terminee', 'annulee')),
    instructions_generales TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 10. TABLE LIGNES_ORDONNANCE (médicaments prescrits)
-- =====================================================

CREATE TABLE IF NOT EXISTS lignes_ordonnance (
    id BIGSERIAL PRIMARY KEY,
    ordonnance_id BIGINT NOT NULL REFERENCES ordonnances(id) ON DELETE CASCADE,
    medicament_id BIGINT NOT NULL REFERENCES medicaments(id) ON DELETE CASCADE,
    posologie TEXT NOT NULL,
    quantite INTEGER DEFAULT 1,
    duree_traitement INTEGER, -- en jours
    instructions_particulieres TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 11. TABLE CERTIFICATS_MEDICAUX (certificats délivrés)
-- =====================================================

CREATE TABLE IF NOT EXISTS certificats_medicaux (
    id BIGSERIAL PRIMARY KEY,
    consultation_id BIGINT NOT NULL REFERENCES consultations(id) ON DELETE CASCADE,
    type_certificat_id BIGINT NOT NULL REFERENCES types_certificats(id) ON DELETE CASCADE,
    duree_jours INTEGER NOT NULL,
    motif TEXT,
    restrictions TEXT,
    date_debut DATE DEFAULT CURRENT_DATE,
    date_fin DATE,
    statut VARCHAR(20) DEFAULT 'actif' CHECK (statut IN ('actif', 'expire', 'annule')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INDEXES POUR LES PERFORMANCES
-- =====================================================

-- Index pour consultations
CREATE INDEX idx_consultations_patient_id ON consultations(patient_id);
CREATE INDEX idx_consultations_medecin_id ON consultations(medecin_id);
CREATE INDEX idx_consultations_date ON consultations(date_consultation);
CREATE INDEX idx_consultations_statut ON consultations(statut);

-- Index pour antecedents_patients
CREATE INDEX idx_antecedents_patients_patient_id ON antecedents_patients(patient_id);
CREATE INDEX idx_antecedents_patients_consultation_id ON antecedents_patients(consultation_id);
CREATE INDEX idx_antecedents_patients_actif ON antecedents_patients(actif);

-- Index pour constantes_consultation
CREATE INDEX idx_constantes_consultation_consultation_id ON constantes_consultation(consultation_id);

-- Index pour signes_cliniques_consultation
CREATE INDEX idx_signes_cliniques_consultation_consultation_id ON signes_cliniques_consultation(consultation_id);

-- Index pour examens_appareils
CREATE INDEX idx_examens_appareils_consultation_id ON examens_appareils(consultation_id);

-- Index pour syntheses_consultation
CREATE INDEX idx_syntheses_consultation_consultation_id ON syntheses_consultation(consultation_id);

-- Index pour diagnostics_consultation
CREATE INDEX idx_diagnostics_consultation_consultation_id ON diagnostics_consultation(consultation_id);

-- Index pour ordonnances
CREATE INDEX idx_ordonnances_consultation_id ON ordonnances(consultation_id);
CREATE INDEX idx_ordonnances_statut ON ordonnances(statut);

-- Index pour lignes_ordonnance
CREATE INDEX idx_lignes_ordonnance_ordonnance_id ON lignes_ordonnance(ordonnance_id);

-- Index pour certificats_medicaux
CREATE INDEX idx_certificats_medicaux_consultation_id ON certificats_medicaux(consultation_id);
CREATE INDEX idx_certificats_medicaux_statut ON certificats_medicaux(statut);

-- =====================================================
-- TRIGGERS POUR AUDIT (updated_at)
-- =====================================================

-- Fonction pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers pour updated_at
CREATE TRIGGER update_consultations_updated_at BEFORE UPDATE ON consultations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_antecedents_patients_updated_at BEFORE UPDATE ON antecedents_patients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_constantes_consultation_updated_at BEFORE UPDATE ON constantes_consultation FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_signes_cliniques_consultation_updated_at BEFORE UPDATE ON signes_cliniques_consultation FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_examens_appareils_updated_at BEFORE UPDATE ON examens_appareils FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_syntheses_consultation_updated_at BEFORE UPDATE ON syntheses_consultation FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_autres_signes_physiques_updated_at BEFORE UPDATE ON autres_signes_physiques FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_diagnostics_consultation_updated_at BEFORE UPDATE ON diagnostics_consultation FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ordonnances_updated_at BEFORE UPDATE ON ordonnances FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_lignes_ordonnance_updated_at BEFORE UPDATE ON lignes_ordonnance FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_certificats_medicaux_updated_at BEFORE UPDATE ON certificats_medicaux FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- FONCTIONS UTILITAIRES
-- =====================================================

-- Fonction pour calculer automatiquement la date de fin d'un certificat
CREATE OR REPLACE FUNCTION calculer_date_fin_certificat()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.date_debut IS NOT NULL AND NEW.duree_jours IS NOT NULL THEN
        NEW.date_fin = NEW.date_debut + INTERVAL '1 day' * NEW.duree_jours;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger pour calculer automatiquement la date de fin
CREATE TRIGGER trigger_calculer_date_fin_certificat 
    BEFORE INSERT OR UPDATE ON certificats_medicaux 
    FOR EACH ROW EXECUTE FUNCTION calculer_date_fin_certificat();

-- Fonction pour générer automatiquement le numéro d'ordonnance
CREATE OR REPLACE FUNCTION generer_numero_ordonnance()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.numero_ordonnance IS NULL THEN
        NEW.numero_ordonnance = 'ORD-' || EXTRACT(YEAR FROM NOW()) || '-' || LPAD(NEW.id::TEXT, 6, '0');
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger pour générer automatiquement le numéro d'ordonnance
CREATE TRIGGER trigger_generer_numero_ordonnance 
    BEFORE INSERT ON ordonnances 
    FOR EACH ROW EXECUTE FUNCTION generer_numero_ordonnance();

-- =====================================================
-- DONNÉES DE TEST
-- =====================================================

-- Insertion de consultations de test
INSERT INTO consultations (patient_id, medecin_id, motif_consultation, statut) VALUES
(1, 2, 'Consultation de routine - contrôle tension', 'terminee'),
(2, 2, 'Douleurs thoraciques', 'en_cours'),
(3, 3, 'Suivi diabète', 'terminee');

-- Insertion d'antécédents pour les patients
INSERT INTO antecedents_patients (patient_id, antecedent_id, date_decouverte, commentaires) VALUES
(1, 1, '2020-01-15', 'Hypertension découverte lors d\'un contrôle'),
(1, 3, '2018-03-20', 'Diabète de type 2'),
(2, 2, '2019-06-10', 'Asthme modéré'),
(3, 1, '2021-02-28', 'Hypertension artérielle');

-- Insertion de constantes mesurées
INSERT INTO constantes_consultation (consultation_id, constante_id, valeur_mesuree, unite) VALUES
(1, 1, 140, 'mmHg'), -- Tension systolique
(1, 2, 90, 'mmHg'),  -- Tension diastolique
(1, 3, 72, 'bpm'),   -- Pouls
(2, 1, 160, 'mmHg'), -- Tension systolique
(2, 2, 95, 'mmHg'),  -- Tension diastolique
(2, 3, 85, 'bpm');   -- Pouls

-- Insertion de signes cliniques
INSERT INTO signes_cliniques_consultation (consultation_id, signe_clinique_id, intensite, localisation) VALUES
(1, 1, 'moderee', 'Thorax'),
(2, 2, 'forte', 'Thorax antérieur'),
(2, 3, 'moderee', 'Membres supérieurs');

-- Insertion d'examens d'appareils
INSERT INTO examens_appareils (consultation_id, appareil_id, resultat_examen, anomalies_detectees) VALUES
(1, 1, 'Auscultation cardiaque normale', 'Aucune anomalie détectée'),
(1, 2, 'Auscultation pulmonaire normale', 'Pas de râles ni de sibilances'),
(2, 1, 'Rythme cardiaque régulier', 'Pas d\'anomalie rythmique');

-- Insertion de synthèses
INSERT INTO syntheses_consultation (consultation_id, element_synthese_id, commentaires) VALUES
(1, 1, 'Patient stable, tension bien contrôlée'),
(2, 2, 'Douleurs thoraciques nécessitant investigations complémentaires');

-- Insertion d'autres signes physiques
INSERT INTO autres_signes_physiques (consultation_id, description, categorie) VALUES
(1, 'Patient en bon état général', 'Examen général'),
(2, 'Anxiété modérée', 'État psychologique');

-- Insertion de diagnostics
INSERT INTO diagnostics_consultation (consultation_id, diagnostic_id, commentaires, certitude) VALUES
(1, 1, 'Hypertension bien contrôlée', 'certain'),
(2, 2, 'Douleurs thoraciques d\'origine à préciser', 'probable');

-- Insertion d'ordonnances
INSERT INTO ordonnances (consultation_id, instructions_generales) VALUES
(1, 'Continuer le traitement actuel'),
(2, 'Traitement symptomatique en attendant les examens');

-- Insertion de lignes d'ordonnance
INSERT INTO lignes_ordonnance (ordonnance_id, medicament_id, posologie, quantite, duree_traitement) VALUES
(1, 1, '1 comprimé le matin', 30, 30),
(2, 2, '1 comprimé 3 fois par jour', 21, 7);

-- Insertion de certificats médicaux
INSERT INTO certificats_medicaux (consultation_id, type_certificat_id, duree_jours, motif) VALUES
(1, 1, 30, 'Contrôle tension artérielle'),
(2, 2, 7, 'Arrêt de travail pour douleurs thoraciques');

-- =====================================================
-- POLITIQUES RLS (Row Level Security)
-- =====================================================

-- Activer RLS sur toutes les tables
ALTER TABLE consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE antecedents_patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE constantes_consultation ENABLE ROW LEVEL SECURITY;
ALTER TABLE signes_cliniques_consultation ENABLE ROW LEVEL SECURITY;
ALTER TABLE examens_appareils ENABLE ROW LEVEL SECURITY;
ALTER TABLE syntheses_consultation ENABLE ROW LEVEL SECURITY;
ALTER TABLE autres_signes_physiques ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagnostics_consultation ENABLE ROW LEVEL SECURITY;
ALTER TABLE ordonnances ENABLE ROW LEVEL SECURITY;
ALTER TABLE lignes_ordonnance ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificats_medicaux ENABLE ROW LEVEL SECURITY;

-- Politiques pour consultations
CREATE POLICY "Médecins peuvent voir leurs consultations" ON consultations
    FOR SELECT USING (medecin_id = auth.uid() OR auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Médecins peuvent créer leurs consultations" ON consultations
    FOR INSERT WITH CHECK (medecin_id = auth.uid());

CREATE POLICY "Médecins peuvent modifier leurs consultations" ON consultations
    FOR UPDATE USING (medecin_id = auth.uid());

-- Politiques pour les autres tables (basées sur consultation_id)
CREATE POLICY "Accès aux données de consultation" ON antecedents_patients
    FOR ALL USING (
        consultation_id IN (
            SELECT id FROM consultations WHERE medecin_id = auth.uid()
        ) OR auth.jwt() ->> 'role' = 'admin'
    );

CREATE POLICY "Accès aux données de consultation" ON constantes_consultation
    FOR ALL USING (
        consultation_id IN (
            SELECT id FROM consultations WHERE medecin_id = auth.uid()
        ) OR auth.jwt() ->> 'role' = 'admin'
    );

CREATE POLICY "Accès aux données de consultation" ON signes_cliniques_consultation
    FOR ALL USING (
        consultation_id IN (
            SELECT id FROM consultations WHERE medecin_id = auth.uid()
        ) OR auth.jwt() ->> 'role' = 'admin'
    );

CREATE POLICY "Accès aux données de consultation" ON examens_appareils
    FOR ALL USING (
        consultation_id IN (
            SELECT id FROM consultations WHERE medecin_id = auth.uid()
        ) OR auth.jwt() ->> 'role' = 'admin'
    );

CREATE POLICY "Accès aux données de consultation" ON syntheses_consultation
    FOR ALL USING (
        consultation_id IN (
            SELECT id FROM consultations WHERE medecin_id = auth.uid()
        ) OR auth.jwt() ->> 'role' = 'admin'
    );

CREATE POLICY "Accès aux données de consultation" ON autres_signes_physiques
    FOR ALL USING (
        consultation_id IN (
            SELECT id FROM consultations WHERE medecin_id = auth.uid()
        ) OR auth.jwt() ->> 'role' = 'admin'
    );

CREATE POLICY "Accès aux données de consultation" ON diagnostics_consultation
    FOR ALL USING (
        consultation_id IN (
            SELECT id FROM consultations WHERE medecin_id = auth.uid()
        ) OR auth.jwt() ->> 'role' = 'admin'
    );

CREATE POLICY "Accès aux données de consultation" ON ordonnances
    FOR ALL USING (
        consultation_id IN (
            SELECT id FROM consultations WHERE medecin_id = auth.uid()
        ) OR auth.jwt() ->> 'role' = 'admin'
    );

CREATE POLICY "Accès aux données de consultation" ON lignes_ordonnance
    FOR ALL USING (
        ordonnance_id IN (
            SELECT id FROM ordonnances WHERE consultation_id IN (
                SELECT id FROM consultations WHERE medecin_id = auth.uid()
            )
        ) OR auth.jwt() ->> 'role' = 'admin'
    );

CREATE POLICY "Accès aux données de consultation" ON certificats_medicaux
    FOR ALL USING (
        consultation_id IN (
            SELECT id FROM consultations WHERE medecin_id = auth.uid()
        ) OR auth.jwt() ->> 'role' = 'admin'
    );

-- =====================================================
-- COMMENTAIRES
-- =====================================================

COMMENT ON TABLE consultations IS 'Table principale des consultations médicales';
COMMENT ON TABLE antecedents_patients IS 'Liaison entre patients et leurs antécédents médicaux';
COMMENT ON TABLE constantes_consultation IS 'Mesures des constantes vitales lors d''une consultation';
COMMENT ON TABLE signes_cliniques_consultation IS 'Signes cliniques observés lors d''une consultation';
COMMENT ON TABLE examens_appareils IS 'Résultats des examens des différents appareils';
COMMENT ON TABLE syntheses_consultation IS 'Éléments de synthèse de la consultation';
COMMENT ON TABLE autres_signes_physiques IS 'Autres signes physiques et commentaires';
COMMENT ON TABLE diagnostics_consultation IS 'Diagnostics posés lors de la consultation';
COMMENT ON TABLE ordonnances IS 'Ordonnances prescrites lors de la consultation';
COMMENT ON TABLE lignes_ordonnance IS 'Lignes détaillées des ordonnances (médicaments)';
COMMENT ON TABLE certificats_medicaux IS 'Certificats médicaux délivrés lors de la consultation';
