-- Migration pour créer les tables des certificats médicaux
-- Date: 2025-01-02
-- Objectif: Résoudre le problème d'affichage de la sous-catégorie certificats

-- =====================================================
-- 1. CRÉATION DE LA TABLE TYPES_CERTIFICATS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.types_certificats (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(255) NOT NULL,
    description TEXT,
    duree_defaut INTEGER DEFAULT 1, -- durée par défaut en jours
    template_contenu TEXT, -- template du contenu du certificat
    actif BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 2. CRÉATION DE LA TABLE CERTIFICATS_MEDICAUX
-- =====================================================

CREATE TABLE IF NOT EXISTS public.certificats_medicaux (
    id SERIAL PRIMARY KEY,
    consultation_id BIGINT REFERENCES consultations(id) ON DELETE CASCADE,
    patient_id BIGINT REFERENCES patients(id) ON DELETE CASCADE,
    medecin_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    type_certificat_id INTEGER REFERENCES types_certificats(id),
    numero_certificat VARCHAR(50) UNIQUE,
    date_emission DATE DEFAULT CURRENT_DATE,
    date_debut DATE NOT NULL,
    date_fin DATE,
    duree_jours INTEGER NOT NULL DEFAULT 1,
    motif TEXT,
    restrictions TEXT,
    observations TEXT,
    statut VARCHAR(20) DEFAULT 'actif' CHECK (statut IN ('actif', 'expire', 'annule')),
    contenu_personnalise TEXT, -- contenu spécifique du certificat
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 3. CRÉATION DES INDEX
-- =====================================================

-- Index pour types_certificats
CREATE INDEX IF NOT EXISTS idx_types_certificats_nom ON public.types_certificats(nom);
CREATE INDEX IF NOT EXISTS idx_types_certificats_actif ON public.types_certificats(actif);

-- Index pour certificats_medicaux
CREATE INDEX IF NOT EXISTS idx_certificats_consultation_id ON public.certificats_medicaux(consultation_id);
CREATE INDEX IF NOT EXISTS idx_certificats_patient_id ON public.certificats_medicaux(patient_id);
CREATE INDEX IF NOT EXISTS idx_certificats_medecin_id ON public.certificats_medicaux(medecin_id);
CREATE INDEX IF NOT EXISTS idx_certificats_type_id ON public.certificats_medicaux(type_certificat_id);
CREATE INDEX IF NOT EXISTS idx_certificats_date_emission ON public.certificats_medicaux(date_emission);
CREATE INDEX IF NOT EXISTS idx_certificats_statut ON public.certificats_medicaux(statut);
CREATE INDEX IF NOT EXISTS idx_certificats_numero ON public.certificats_medicaux(numero_certificat);

-- =====================================================
-- 4. TRIGGERS POUR UPDATED_AT
-- =====================================================

-- Trigger pour types_certificats
CREATE TRIGGER update_types_certificats_updated_at 
    BEFORE UPDATE ON public.types_certificats 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger pour certificats_medicaux
CREATE TRIGGER update_certificats_medicaux_updated_at 
    BEFORE UPDATE ON public.certificats_medicaux 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 5. FONCTION POUR GÉNÉRER NUMÉRO DE CERTIFICAT
-- =====================================================

CREATE OR REPLACE FUNCTION generer_numero_certificat()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.numero_certificat IS NULL THEN
        NEW.numero_certificat := 'CERT-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(nextval('certificats_medicaux_id_seq')::text, 6, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour générer automatiquement le numéro de certificat
CREATE TRIGGER trigger_generer_numero_certificat
    BEFORE INSERT ON public.certificats_medicaux
    FOR EACH ROW
    EXECUTE FUNCTION generer_numero_certificat();

-- =====================================================
-- 6. FONCTION POUR CALCULER DATE_FIN
-- =====================================================

CREATE OR REPLACE FUNCTION calculer_date_fin_certificat()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculer la date de fin basée sur la date de début et la durée
    IF NEW.date_debut IS NOT NULL AND NEW.duree_jours IS NOT NULL AND NEW.duree_jours > 0 THEN
        NEW.date_fin := NEW.date_debut + (NEW.duree_jours - 1) * INTERVAL '1 day';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour calculer automatiquement la date de fin
CREATE TRIGGER trigger_calculer_date_fin_certificat
    BEFORE INSERT OR UPDATE ON public.certificats_medicaux
    FOR EACH ROW
    EXECUTE FUNCTION calculer_date_fin_certificat();

-- =====================================================
-- 7. DONNÉES DE TEST
-- =====================================================

-- Types de certificats courants
INSERT INTO public.types_certificats (nom, description, duree_defaut, template_contenu) VALUES
('Certificat médical', 'Certificat médical standard', 1, 'Je soussigné(e), Docteur {medecin_nom}, certifie avoir examiné {patient_nom} ce jour et atteste que son état de santé nécessite un repos de {duree_jours} jour(s).'),
('Arrêt de travail', 'Certificat d''arrêt de travail', 7, 'Je soussigné(e), Docteur {medecin_nom}, certifie que l''état de santé de {patient_nom} nécessite un arrêt de travail du {date_debut} au {date_fin}.'),
('Certificat de sport', 'Certificat d''aptitude au sport', 365, 'Je soussigné(e), Docteur {medecin_nom}, certifie que {patient_nom} est apte à la pratique sportive.'),
('Certificat de non-contagion', 'Certificat de non-contagion', 1, 'Je soussigné(e), Docteur {medecin_nom}, certifie que {patient_nom} ne présente aucun signe de maladie contagieuse.'),
('Certificat d''aptitude', 'Certificat d''aptitude générale', 30, 'Je soussigné(e), Docteur {medecin_nom}, certifie que {patient_nom} est apte à {motif}.'),
('Certificat de vaccination', 'Certificat de vaccination', 365, 'Je soussigné(e), Docteur {medecin_nom}, certifie que {patient_nom} a reçu les vaccinations suivantes : {observations}.'),
('Certificat de grossesse', 'Certificat de grossesse', 1, 'Je soussigné(e), Docteur {medecin_nom}, certifie que Madame {patient_nom} est enceinte.'),
('Certificat de décès', 'Certificat de décès', 1, 'Je soussigné(e), Docteur {medecin_nom}, certifie le décès de {patient_nom}.'),
('Certificat d''hospitalisation', 'Certificat d''hospitalisation', 1, 'Je soussigné(e), Docteur {medecin_nom}, certifie que {patient_nom} a été hospitalisé(e) du {date_debut} au {date_fin}.'),
('Certificat de guérison', 'Certificat de guérison', 1, 'Je soussigné(e), Docteur {medecin_nom}, certifie que {patient_nom} est guéri(e) de {motif}.')
ON CONFLICT (nom) DO NOTHING;

-- =====================================================
-- 8. POLITIQUES RLS
-- =====================================================

-- Activer RLS sur les tables
ALTER TABLE public.types_certificats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificats_medicaux ENABLE ROW LEVEL SECURITY;

-- Politiques pour types_certificats
CREATE POLICY "Lecture types certificats pour tous" ON public.types_certificats
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Gestion types certificats pour admins" ON public.types_certificats
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE email = auth.email() 
            AND role = 'admin'
        )
    );

-- Politiques pour certificats_medicaux
CREATE POLICY "Lecture certificats pour médecins et admins" ON public.certificats_medicaux
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE email = auth.email() 
            AND role IN ('doctor', 'admin')
        )
    );

CREATE POLICY "Gestion certificats pour médecins" ON public.certificats_medicaux
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE email = auth.email() 
            AND role IN ('doctor', 'admin')
        )
    );

-- =====================================================
-- 9. VUES UTILES
-- =====================================================

-- Vue pour les certificats avec informations complètes
CREATE OR REPLACE VIEW certificats_complets AS
SELECT 
    cm.*,
    tc.nom as type_nom,
    tc.description as type_description,
    tc.template_contenu,
    p.nom as patient_nom,
    p.prenom as patient_prenom,
    p.date_naissance as patient_date_naissance,
    u.nom as medecin_nom,
    u.prenom as medecin_prenom,
    u.specialite as medecin_specialite,
    c.motif_consultation
FROM certificats_medicaux cm
LEFT JOIN types_certificats tc ON cm.type_certificat_id = tc.id
LEFT JOIN patients p ON cm.patient_id = p.id
LEFT JOIN users u ON cm.medecin_id = u.id
LEFT JOIN consultations c ON cm.consultation_id = c.id;

-- =====================================================
-- 10. COMMENTAIRES
-- =====================================================

COMMENT ON TABLE public.types_certificats IS 'Types de certificats médicaux disponibles';
COMMENT ON TABLE public.certificats_medicaux IS 'Certificats médicaux émis lors des consultations';
COMMENT ON COLUMN public.certificats_medicaux.numero_certificat IS 'Numéro unique du certificat généré automatiquement';
COMMENT ON COLUMN public.certificats_medicaux.template_contenu IS 'Template du contenu avec variables à remplacer';
COMMENT ON VIEW certificats_complets IS 'Vue complète des certificats avec toutes les informations liées';

-- =====================================================
-- 11. VÉRIFICATION FINALE
-- =====================================================

-- Vérifier que les tables ont été créées
DO $$
DECLARE
    tables_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO tables_count
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN ('types_certificats', 'certificats_medicaux');
    
    IF tables_count = 2 THEN
        RAISE NOTICE '✅ Tables certificats créées avec succès';
        
        -- Vérifier les données de test
        SELECT COUNT(*) INTO tables_count FROM types_certificats;
        RAISE NOTICE '📊 % types de certificats créés', tables_count;
    ELSE
        RAISE WARNING '❌ Problème lors de la création des tables certificats';
    END IF;
END $$;

RAISE NOTICE '🎉 Migration certificats terminée !';
RAISE NOTICE '📝 Les tables types_certificats et certificats_medicaux sont prêtes';
RAISE NOTICE '🔍 Exécutez debug_certificats_consultation.sql pour vérifier';
