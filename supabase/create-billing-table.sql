-- Création de la table de facturation
CREATE TABLE IF NOT EXISTS billing (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    numero_facture VARCHAR(50) UNIQUE NOT NULL,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    medecin_id UUID REFERENCES users(id) ON DELETE CASCADE,
    date_creation TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    date_paiement TIMESTAMP WITH TIME ZONE,
    montant_total DECIMAL(10,2) NOT NULL DEFAULT 0,
    montant_tva DECIMAL(10,2) DEFAULT 0,
    montant_ht DECIMAL(10,2) DEFAULT 0,
    statut VARCHAR(20) DEFAULT 'en_attente' CHECK (statut IN ('en_attente', 'paye', 'annule', 'rembourse')),
    mode_paiement VARCHAR(50),
    reference_paiement VARCHAR(100),
    notes TEXT,
    ordonnance TEXT,
    services JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_billing_patient_id ON billing(patient_id);
CREATE INDEX IF NOT EXISTS idx_billing_medecin_id ON billing(medecin_id);
CREATE INDEX IF NOT EXISTS idx_billing_date_creation ON billing(date_creation);
CREATE INDEX IF NOT EXISTS idx_billing_statut ON billing(statut);
CREATE INDEX IF NOT EXISTS idx_billing_numero_facture ON billing(numero_facture);

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_billing_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour updated_at
CREATE TRIGGER trigger_update_billing_updated_at
    BEFORE UPDATE ON billing
    FOR EACH ROW
    EXECUTE FUNCTION update_billing_updated_at();

-- Fonction pour générer automatiquement le numéro de facture
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TRIGGER AS $$
DECLARE
    last_number VARCHAR(50);
    next_number INTEGER;
BEGIN
    -- Récupérer le dernier numéro de facture
    SELECT numero_facture INTO last_number
    FROM billing
    WHERE numero_facture LIKE 'FACT-%'
    ORDER BY numero_facture DESC
    LIMIT 1;
    
    -- Générer le prochain numéro
    IF last_number IS NULL THEN
        NEW.numero_facture := 'FACT-0001';
    ELSE
        next_number := CAST(SUBSTRING(last_number FROM 6) AS INTEGER) + 1;
        NEW.numero_facture := 'FACT-' || LPAD(next_number::TEXT, 4, '0');
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour générer automatiquement le numéro de facture
CREATE TRIGGER trigger_generate_invoice_number
    BEFORE INSERT ON billing
    FOR EACH ROW
    WHEN (NEW.numero_facture IS NULL OR NEW.numero_facture = '')
    EXECUTE FUNCTION generate_invoice_number();

-- Politiques RLS (Row Level Security)
ALTER TABLE billing ENABLE ROW LEVEL SECURITY;

-- Politique pour les secrétaires : voir toutes les factures
CREATE POLICY "Secretaries can view all billing records" ON billing
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'secretary'
        )
    );

-- Politique pour les médecins : voir leurs propres factures
CREATE POLICY "Doctors can view their own billing records" ON billing
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'doctor'
            AND users.id = billing.medecin_id
        )
    );

-- Politique pour les admins : voir toutes les factures
CREATE POLICY "Admins can view all billing records" ON billing
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

-- Politique pour les secrétaires : créer des factures
CREATE POLICY "Secretaries can create billing records" ON billing
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'secretary'
        )
    );

-- Politique pour les secrétaires : modifier des factures
CREATE POLICY "Secretaries can update billing records" ON billing
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'secretary'
        )
    );

-- Politique pour les admins : toutes les opérations
CREATE POLICY "Admins can do all operations on billing" ON billing
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

-- Insérer quelques données de test
INSERT INTO billing (patient_id, medecin_id, montant_total, statut, notes, ordonnance) VALUES
(
    (SELECT id FROM patients LIMIT 1),
    (SELECT id FROM users WHERE role = 'doctor' LIMIT 1),
    75.00,
    'paye',
    'Consultation de routine',
    'Paracétamol 500mg - 1 comprimé 3x/jour pendant 5 jours'
),
(
    (SELECT id FROM patients LIMIT 1 OFFSET 1),
    (SELECT id FROM users WHERE role = 'doctor' LIMIT 1),
    120.00,
    'en_attente',
    'Consultation spécialisée',
    'Ibuprofène 400mg - 1 comprimé 2x/jour pendant 7 jours'
);

-- Afficher les données insérées
SELECT 
    b.numero_facture,
    p.prenom || ' ' || p.nom as patient,
    u.prenom || ' ' || u.nom as medecin,
    b.montant_total,
    b.statut,
    b.date_creation
FROM billing b
JOIN patients p ON b.patient_id = p.id
JOIN users u ON b.medecin_id = u.id;

