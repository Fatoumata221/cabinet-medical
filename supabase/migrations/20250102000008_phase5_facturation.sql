-- =====================================================
-- PHASE 5 - FACTURATION : DIVERS INSTRUCTIONS
-- =====================================================

-- Table pour les instructions diverses
CREATE TABLE IF NOT EXISTS divers_instructions (
    id BIGSERIAL PRIMARY KEY,
    consultation_id BIGINT NOT NULL,
    medecin_id BIGINT NOT NULL,
    type_instruction VARCHAR(50) NOT NULL DEFAULT 'general',
    titre VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    priorite VARCHAR(20) DEFAULT 'normale' CHECK (priorite IN ('basse', 'normale', 'haute', 'urgente')),
    statut VARCHAR(20) DEFAULT 'en_attente' CHECK (statut IN ('en_attente', 'en_cours', 'terminee', 'annulee')),
    date_creation TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    date_modification TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    date_execution TIMESTAMP WITH TIME ZONE,
    notes_execution TEXT,
    created_by BIGINT,
    updated_by BIGINT
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_divers_consultation ON divers_instructions(consultation_id);
CREATE INDEX IF NOT EXISTS idx_divers_medecin ON divers_instructions(medecin_id);
CREATE INDEX IF NOT EXISTS idx_divers_statut ON divers_instructions(statut);
CREATE INDEX IF NOT EXISTS idx_divers_priorite ON divers_instructions(priorite);
CREATE INDEX IF NOT EXISTS idx_divers_date_creation ON divers_instructions(date_creation);

-- Contraintes de clés étrangères
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_divers_consultation') THEN
        ALTER TABLE divers_instructions ADD CONSTRAINT fk_divers_consultation 
        FOREIGN KEY (consultation_id) REFERENCES consultations(id) ON DELETE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_divers_medecin') THEN
        ALTER TABLE divers_instructions ADD CONSTRAINT fk_divers_medecin 
        FOREIGN KEY (medecin_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Fonction pour mettre à jour la date de modification
CREATE OR REPLACE FUNCTION update_divers_modified()
RETURNS TRIGGER AS $$
BEGIN
    NEW.date_modification = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour la mise à jour automatique
DROP TRIGGER IF EXISTS trigger_update_divers_modified ON divers_instructions;
CREATE TRIGGER trigger_update_divers_modified
    BEFORE UPDATE ON divers_instructions
    FOR EACH ROW
    EXECUTE FUNCTION update_divers_modified();

-- Données de test (en utilisant des IDs d'utilisateurs médecins existants)
INSERT INTO divers_instructions (consultation_id, medecin_id, type_instruction, titre, description, priorite, statut) VALUES
(1, (SELECT id FROM users WHERE role = 'doctor' LIMIT 1), 'rendez_vous', 'Prise de rendez-vous de contrôle', 'Programmer un rendez-vous de contrôle dans 2 semaines pour vérifier l''évolution du traitement', 'normale', 'en_attente'),
(1, (SELECT id FROM users WHERE role = 'doctor' LIMIT 1), 'examen', 'Radiographie pulmonaire', 'Demander au patient de faire une radiographie pulmonaire avant le prochain rendez-vous', 'haute', 'en_attente'),
(2, (SELECT id FROM users WHERE role = 'doctor' LIMIT 1), 'general', 'Instructions post-opératoires', 'Rappeler au patient les précautions à prendre après l''intervention', 'urgente', 'en_cours'),
(3, (SELECT id FROM users WHERE role = 'doctor' LIMIT 1), 'pharmacie', 'Renouvellement ordonnance', 'Préparer le renouvellement de l''ordonnance pour les 3 prochains mois', 'normale', 'en_attente'),
(4, (SELECT id FROM users WHERE role = 'doctor' LIMIT 1), 'laboratoire', 'Analyses sanguines', 'Programmer les analyses sanguines de contrôle pour la semaine prochaine', 'haute', 'en_attente');

-- RLS Policies
ALTER TABLE divers_instructions ENABLE ROW LEVEL SECURITY;

-- Politique pour les médecins : voir leurs propres instructions
CREATE POLICY "Medecins peuvent voir leurs instructions" ON divers_instructions
    FOR SELECT USING (
        medecin_id = (SELECT id FROM users WHERE email = auth.jwt() ->> 'email' AND role = 'doctor')
    );

-- Politique pour les médecins : créer leurs instructions
CREATE POLICY "Medecins peuvent créer des instructions" ON divers_instructions
    FOR INSERT WITH CHECK (
        medecin_id = (SELECT id FROM users WHERE email = auth.jwt() ->> 'email' AND role = 'doctor')
    );

-- Politique pour l'accueil : voir toutes les instructions
CREATE POLICY "Accueil peut voir toutes les instructions" ON divers_instructions
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM users WHERE email = auth.jwt() ->> 'email' AND role = 'secretary')
    );

-- Politique pour l'accueil : modifier le statut des instructions
CREATE POLICY "Accueil peut modifier le statut des instructions" ON divers_instructions
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM users WHERE email = auth.jwt() ->> 'email' AND role = 'secretary')
    );

-- Politique pour les administrateurs : accès complet
CREATE POLICY "Admins ont accès complet aux instructions" ON divers_instructions
    FOR ALL USING (
        EXISTS (SELECT 1 FROM users WHERE email = auth.jwt() ->> 'email' AND role = 'admin')
    );
