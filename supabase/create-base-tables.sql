-- =====================================================
-- CRÉATION DES TABLES DE BASE MANQUANTES
-- =====================================================

-- Table des utilisateurs (si elle n'existe pas)
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('secretary', 'doctor', 'admin')),
    nom VARCHAR(100),
    prenom VARCHAR(100),
    specialite VARCHAR(100),
    telephone VARCHAR(20),
    specialite_id BIGINT,
    horaires_travail JSONB,
    duree_consultation INTEGER DEFAULT 30,
    actif BOOLEAN DEFAULT true,
    photo_url VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des spécialités
CREATE TABLE IF NOT EXISTS specialites (
    id BIGSERIAL PRIMARY KEY,
    nom VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    actif BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des patients
CREATE TABLE IF NOT EXISTS patients (
    id BIGSERIAL PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    date_naissance DATE NOT NULL,
    sexe VARCHAR(10) CHECK (sexe IN ('M', 'F')),
    telephone VARCHAR(20),
    email VARCHAR(255),
    adresse TEXT,
    numero_dossier VARCHAR(50) UNIQUE,
    lieu_naissance VARCHAR(100),
    nationalite VARCHAR(100),
    profession VARCHAR(100),
    situation_familiale VARCHAR(50),
    personne_contact VARCHAR(100),
    telephone_contact VARCHAR(20),
    lien_contact VARCHAR(50),
    medecin_traitant VARCHAR(100),
    numero_secu VARCHAR(20),
    mutuelle VARCHAR(100),
    numero_mutuelle VARCHAR(20),
    assurance VARCHAR(100),
    actif BOOLEAN DEFAULT true,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des consultations
CREATE TABLE IF NOT EXISTS consultations (
    id BIGSERIAL PRIMARY KEY,
    patient_id BIGINT NOT NULL REFERENCES patients(id),
    medecin_id BIGINT NOT NULL REFERENCES users(id),
    date_consultation DATE NOT NULL,
    motif VARCHAR(255),
    diagnostic TEXT,
    traitement TEXT,
    notes TEXT,
    duree_consultation INTEGER DEFAULT 0,
    niveau_urgence VARCHAR(20) DEFAULT 'normale' CHECK (niveau_urgence IN ('normale', 'urgente', 'tres_urgente')),
    type_consultation VARCHAR(20) DEFAULT 'standard' CHECK (type_consultation IN ('standard', 'suivi', 'urgence', 'preventive')),
    notes_confidentielles TEXT,
    plan_suivi TEXT,
    prochaine_consultation DATE,
    statut VARCHAR(20) DEFAULT 'en_cours' CHECK (statut IN ('en_cours', 'terminee', 'annulee')),
    appointment_id BIGINT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des types d'actes
CREATE TABLE IF NOT EXISTS types_actes (
    id BIGSERIAL PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    description TEXT,
    tarif_defaut DECIMAL(10,2),
    specialite_id BIGINT REFERENCES specialites(id),
    duree_estimee INTEGER,
    ordre_affichage INTEGER DEFAULT 0,
    actif BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des actes
CREATE TABLE IF NOT EXISTS actes (
    id BIGSERIAL PRIMARY KEY,
    consultation_id BIGINT REFERENCES consultations(id),
    patient_id BIGINT NOT NULL REFERENCES patients(id),
    medecin_id BIGINT NOT NULL REFERENCES users(id),
    date_acte DATE NOT NULL,
    type_acte VARCHAR(100) NOT NULL,
    description TEXT,
    montant DECIMAL(10,2) DEFAULT 0,
    statut VARCHAR(20) DEFAULT 'en_cours' CHECK (statut IN ('en_cours', 'termine', 'annule')),
    actif BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des factures
CREATE TABLE IF NOT EXISTS factures (
    id BIGSERIAL PRIMARY KEY,
    consultation_id BIGINT REFERENCES consultations(id),
    patient_id BIGINT REFERENCES patients(id),
    numero_facture VARCHAR(50) UNIQUE NOT NULL,
    date_facture DATE DEFAULT CURRENT_DATE,
    montant_ht DECIMAL(10,2) DEFAULT 0,
    tva DECIMAL(10,2) DEFAULT 0,
    montant_ttc DECIMAL(10,2) DEFAULT 0,
    montant_paye DECIMAL(10,2) DEFAULT 0,
    montant_restant DECIMAL(10,2) DEFAULT 0,
    statut_paiement VARCHAR(20) DEFAULT 'en_attente' CHECK (statut_paiement IN ('en_attente', 'partiel', 'paye', 'impaye')),
    mode_paiement VARCHAR(50),
    assurance_id BIGINT,
    numero_carte VARCHAR(50),
    emetteur_monnaie_electronique VARCHAR(100),
    date_paiement TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des types de certificats
CREATE TABLE IF NOT EXISTS types_certificats (
    id BIGSERIAL PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    description TEXT,
    duree_defaut INTEGER DEFAULT 30,
    specialite_id BIGINT REFERENCES specialites(id),
    ordre_affichage INTEGER DEFAULT 0,
    actif BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des certificats médicaux
CREATE TABLE IF NOT EXISTS certificats_medicaux (
    id BIGSERIAL PRIMARY KEY,
    consultation_id BIGINT NOT NULL REFERENCES consultations(id),
    type_certificat_id BIGINT NOT NULL REFERENCES types_certificats(id),
    date_debut DATE NOT NULL,
    date_fin DATE NOT NULL,
    motif TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INSERTION DE DONNÉES DE BASE
-- =====================================================

-- Insertion des spécialités de base
INSERT INTO specialites (nom, description) VALUES
('Cardiologie', 'Spécialité médicale du cœur et des vaisseaux'),
('Dermatologie', 'Spécialité médicale de la peau'),
('Gynécologie', 'Spécialité médicale de la femme'),
('Pédiatrie', 'Spécialité médicale de l''enfant'),
('Médecine générale', 'Médecine générale et familiale')
ON CONFLICT (nom) DO NOTHING;

-- Insertion des utilisateurs de base (médecins et secrétaires)
INSERT INTO users (email, role, nom, prenom, specialite, telephone, specialite_id) VALUES
('jean.dupont@cabinet.com', 'doctor', 'Dupont', 'Jean', 'Cardiologie', '+22670123456', (SELECT id FROM specialites WHERE nom = 'Cardiologie')),
('marie.martin@cabinet.com', 'doctor', 'Martin', 'Marie', 'Dermatologie', '+22670234567', (SELECT id FROM specialites WHERE nom = 'Dermatologie')),
('sophie.bernard@cabinet.com', 'doctor', 'Bernard', 'Sophie', 'Gynécologie', '+22670345678', (SELECT id FROM specialites WHERE nom = 'Gynécologie')),
('pierre.petit@cabinet.com', 'doctor', 'Petit', 'Pierre', 'Pédiatrie', '+22670456789', (SELECT id FROM specialites WHERE nom = 'Pédiatrie')),
('anne.durand@cabinet.com', 'doctor', 'Durand', 'Anne', 'Médecine générale', '+22670567890', (SELECT id FROM specialites WHERE nom = 'Médecine générale')),
('secretary@cabinet.com', 'secretary', 'Secrétaire', 'Principal', 'Accueil', '+22670678901', NULL),
('admin@cabinet.com', 'admin', 'Admin', 'Système', 'Administration', '+22670789012', NULL)
ON CONFLICT (email) DO NOTHING;

-- Insertion des patients de base
INSERT INTO patients (nom, prenom, date_naissance, sexe, telephone, email, numero_dossier) VALUES
('Koné', 'Fatou', '1985-03-15', 'F', '+22670111111', 'fatou.kone@email.com', 'P001'),
('Traoré', 'Moussa', '1990-07-22', 'M', '+22670222222', 'moussa.traore@email.com', 'P002'),
('Ouattara', 'Aminata', '1988-11-08', 'F', '+22670333333', 'aminata.ouattara@email.com', 'P003')
ON CONFLICT (numero_dossier) DO NOTHING;

-- Insertion des types d'actes de base
INSERT INTO types_actes (nom, description, tarif_defaut, specialite_id) VALUES
('Consultation simple', 'Consultation médicale de base', 5000, (SELECT id FROM specialites WHERE nom = 'Médecine générale')),
('Consultation spécialisée', 'Consultation avec un spécialiste', 8000, (SELECT id FROM specialites WHERE nom = 'Cardiologie')),
('Électrocardiogramme', 'Examen du cœur', 15000, (SELECT id FROM specialites WHERE nom = 'Cardiologie')),
('Biopsie cutanée', 'Prélèvement de peau', 12000, (SELECT id FROM specialites WHERE nom = 'Dermatologie')),
('Échographie gynécologique', 'Échographie de la femme', 20000, (SELECT id FROM specialites WHERE nom = 'Gynécologie'))
ON CONFLICT DO NOTHING;

-- Insertion des types de certificats de base
INSERT INTO types_certificats (nom, description, duree_defaut) VALUES
('Certificat de travail', 'Certificat pour reprise de travail', 30),
('Certificat de sport', 'Certificat pour pratique sportive', 90),
('Certificat de grossesse', 'Certificat de grossesse', 180),
('Certificat de maladie', 'Certificat d''arrêt de travail', 1),
('Certificat de vaccination', 'Certificat de vaccination', 365)
ON CONFLICT DO NOTHING;

-- =====================================================
-- INDEX DE BASE
-- =====================================================

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_specialite ON users(specialite_id);
CREATE INDEX IF NOT EXISTS idx_consultations_patient ON consultations(patient_id);
CREATE INDEX IF NOT EXISTS idx_consultations_medecin ON consultations(medecin_id);
CREATE INDEX IF NOT EXISTS idx_consultations_date ON consultations(date_consultation);
CREATE INDEX IF NOT EXISTS idx_actes_consultation ON actes(consultation_id);
CREATE INDEX IF NOT EXISTS idx_actes_medecin ON actes(medecin_id);
CREATE INDEX IF NOT EXISTS idx_factures_consultation ON factures(consultation_id);
CREATE INDEX IF NOT EXISTS idx_certificats_consultation ON certificats_medicaux(consultation_id);

-- =====================================================
-- POLITIQUES RLS DE BASE
-- =====================================================

-- Activer RLS sur toutes les tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE specialites ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE types_actes ENABLE ROW LEVEL SECURITY;
ALTER TABLE actes ENABLE ROW LEVEL SECURITY;
ALTER TABLE factures ENABLE ROW LEVEL SECURITY;
ALTER TABLE types_certificats ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificats_medicaux ENABLE ROW LEVEL SECURITY;

-- Politiques de base (accès pour tous les utilisateurs authentifiés)
CREATE POLICY "Accès complet pour tous" ON users FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Accès complet pour tous" ON specialites FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Accès complet pour tous" ON patients FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Accès complet pour tous" ON consultations FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Accès complet pour tous" ON types_actes FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Accès complet pour tous" ON actes FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Accès complet pour tous" ON factures FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Accès complet pour tous" ON types_certificats FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Accès complet pour tous" ON certificats_medicaux FOR ALL USING (auth.role() = 'authenticated');
