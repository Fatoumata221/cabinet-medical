-- Migration Phase 2 - Tables de Référence Médicale (Suite)
-- Date: 2025-01-02
-- Description: Ajout des tables de paramétrage médical manquantes - Phase 2

-- ===== SÉQUENCES =====
CREATE SEQUENCE IF NOT EXISTS antecedents_id_seq;
CREATE SEQUENCE IF NOT EXISTS elements_synthese_id_seq;
CREATE SEQUENCE IF NOT EXISTS medicaments_id_seq;
CREATE SEQUENCE IF NOT EXISTS types_certificats_id_seq;
CREATE SEQUENCE IF NOT EXISTS types_actes_id_seq;
CREATE SEQUENCE IF NOT EXISTS assurances_id_seq;

-- ===== TABLE DES ANTÉCÉDENTS =====
-- Ensemble des maladies pouvant faire l'objet d'antécédent
CREATE TABLE public.antecedents (
  id bigint NOT NULL DEFAULT nextval('antecedents_id_seq'::regclass),
  nom character varying NOT NULL,
  description text,
  categorie character varying DEFAULT 'generale',
  code_cim character varying,
  niveau_gravite character varying DEFAULT 'leger' CHECK (niveau_gravite IN ('leger', 'modere', 'grave', 'critique')),
  ordre_affichage integer DEFAULT 0,
  actif boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  created_by bigint,
  updated_by bigint,
  CONSTRAINT antecedents_pkey PRIMARY KEY (id)
);

-- ===== TABLE DES ÉLÉMENTS DE SYNTHÈSE =====
-- Ensemble des éléments pouvant faire l'objet d'une synthèse de consultation
CREATE TABLE public.elements_synthese (
  id bigint NOT NULL DEFAULT nextval('elements_synthese_id_seq'::regclass),
  nom character varying NOT NULL,
  description text,
  categorie character varying DEFAULT 'generale',
  type_element character varying DEFAULT 'observation' CHECK (type_element IN ('observation', 'conclusion', 'recommandation', 'prescription')),
  ordre_affichage integer DEFAULT 0,
  actif boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  created_by bigint,
  updated_by bigint,
  CONSTRAINT elements_synthese_pkey PRIMARY KEY (id)
);

-- ===== TABLE DES MÉDICAMENTS =====
-- Ensemble des médicaments pouvant être prescrits avec posologie par défaut
CREATE TABLE public.medicaments (
  id bigint NOT NULL DEFAULT nextval('medicaments_id_seq'::regclass),
  nom character varying NOT NULL,
  description text,
  forme_pharmaceutique character varying,
  dosage character varying,
  posologie_defaut text,
  contre_indications text,
  interactions text,
  specialite_id bigint,
  ordre_affichage integer DEFAULT 0,
  actif boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  created_by bigint,
  updated_by bigint,
  CONSTRAINT medicaments_pkey PRIMARY KEY (id)
);

-- ===== TABLE DES TYPES DE CERTIFICATS MÉDICAUX =====
-- Ensemble des types de certificats médicaux avec durée par défaut
CREATE TABLE public.types_certificats (
  id bigint NOT NULL DEFAULT nextval('types_certificats_id_seq'::regclass),
  nom character varying NOT NULL,
  description text,
  duree_defaut integer, -- en jours
  specialite_id bigint,
  ordre_affichage integer DEFAULT 0,
  actif boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  created_by bigint,
  updated_by bigint,
  CONSTRAINT types_certificats_pkey PRIMARY KEY (id)
);

-- ===== TABLE DES TYPES D'ACTES =====
-- Ensemble des types d'actes médicaux avec tarif par défaut
CREATE TABLE public.types_actes (
  id bigint NOT NULL DEFAULT nextval('types_actes_id_seq'::regclass),
  nom character varying NOT NULL,
  description text,
  tarif_defaut numeric(10,2),
  specialite_id bigint,
  duree_estimee integer, -- en minutes
  ordre_affichage integer DEFAULT 0,
  actif boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  created_by bigint,
  updated_by bigint,
  CONSTRAINT types_actes_pkey PRIMARY KEY (id)
);

-- ===== TABLE DES ASSURANCES =====
-- Ensemble des assurances acceptées
CREATE TABLE public.assurances (
  id bigint NOT NULL DEFAULT nextval('assurances_id_seq'::regclass),
  nom character varying NOT NULL,
  description text,
  type_assurance character varying DEFAULT 'mutuelle' CHECK (type_assurance IN ('mutuelle', 'securite_sociale', 'privee', 'autre')),
  taux_remboursement numeric(5,2), -- pourcentage
  ordre_affichage integer DEFAULT 0,
  actif boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  created_by bigint,
  updated_by bigint,
  CONSTRAINT assurances_pkey PRIMARY KEY (id)
);

-- ===== INDEX POUR LES PERFORMANCES =====
CREATE INDEX IF NOT EXISTS idx_antecedents_categorie ON public.antecedents(categorie);
CREATE INDEX IF NOT EXISTS idx_antecedents_gravite ON public.antecedents(niveau_gravite);
CREATE INDEX IF NOT EXISTS idx_elements_synthese_categorie ON public.elements_synthese(categorie);
CREATE INDEX IF NOT EXISTS idx_elements_synthese_type ON public.elements_synthese(type_element);
CREATE INDEX IF NOT EXISTS idx_medicaments_specialite ON public.medicaments(specialite_id);
CREATE INDEX IF NOT EXISTS idx_medicaments_forme ON public.medicaments(forme_pharmaceutique);
CREATE INDEX IF NOT EXISTS idx_types_certificats_specialite ON public.types_certificats(specialite_id);
CREATE INDEX IF NOT EXISTS idx_types_actes_specialite ON public.types_actes(specialite_id);
CREATE INDEX IF NOT EXISTS idx_types_actes_tarif ON public.types_actes(tarif_defaut);
CREATE INDEX IF NOT EXISTS idx_assurances_type ON public.assurances(type_assurance);

-- ===== DONNÉES DE RÉFÉRENCE =====

-- Antécédents de base
INSERT INTO public.antecedents (nom, description, categorie, code_cim, niveau_gravite, ordre_affichage) VALUES
('Hypertension artérielle', 'Antécédent d''hypertension artérielle', 'cardiovasculaire', 'I10', 'modere', 1),
('Diabète', 'Antécédent de diabète', 'metabolique', 'E11', 'modere', 2),
('Infarctus du myocarde', 'Antécédent d''infarctus du myocarde', 'cardiovasculaire', 'I21', 'grave', 3),
('Accident vasculaire cérébral', 'Antécédent d''AVC', 'neurologique', 'I64', 'grave', 4),
('Cancer', 'Antécédent de cancer', 'oncologique', 'C80', 'grave', 5),
('Asthme', 'Antécédent d''asthme', 'respiratoire', 'J45', 'modere', 6),
('Allergie médicamenteuse', 'Antécédent d''allergie médicamenteuse', 'allergique', 'Z88', 'modere', 7),
('Chirurgie cardiaque', 'Antécédent de chirurgie cardiaque', 'chirurgical', 'Z95', 'grave', 8),
('Fracture', 'Antécédent de fracture', 'traumatologique', 'S72', 'leger', 9),
('Dépression', 'Antécédent de dépression', 'psychiatrique', 'F32', 'modere', 10);

-- Éléments de synthèse de base
INSERT INTO public.elements_synthese (nom, description, categorie, type_element, ordre_affichage) VALUES
('Motif de consultation', 'Motif principal de la consultation', 'generale', 'observation', 1),
('Examen clinique', 'Résultats de l''examen clinique', 'generale', 'observation', 2),
('Diagnostic', 'Diagnostic établi', 'generale', 'conclusion', 3),
('Traitement prescrit', 'Traitement médicamenteux prescrit', 'generale', 'prescription', 4),
('Recommandations', 'Recommandations données au patient', 'generale', 'recommandation', 5),
('Suivi', 'Modalités de suivi', 'generale', 'recommandation', 6),
('Examens complémentaires', 'Examens demandés', 'generale', 'prescription', 7),
('Contre-indications', 'Contre-indications identifiées', 'generale', 'observation', 8),
('Facteurs de risque', 'Facteurs de risque identifiés', 'generale', 'observation', 9),
('Éducation thérapeutique', 'Conseils d''éducation thérapeutique', 'generale', 'recommandation', 10);

-- Médicaments de base
INSERT INTO public.medicaments (nom, description, forme_pharmaceutique, dosage, posologie_defaut, specialite_id, ordre_affichage) VALUES
('Paracétamol', 'Antalgique et antipyrétique', 'Comprimé', '500mg', '1 comprimé 3-4 fois par jour', NULL, 1),
('Ibuprofène', 'Anti-inflammatoire non stéroïdien', 'Comprimé', '400mg', '1 comprimé 3 fois par jour', NULL, 2),
('Amoxicilline', 'Antibiotique', 'Gélule', '1g', '1 gélule 2 fois par jour pendant 7 jours', NULL, 3),
('Oméprazole', 'Anti-ulcéreux', 'Gélule', '20mg', '1 gélule le matin à jeun', NULL, 4),
('Atorvastatine', 'Hypolipémiant', 'Comprimé', '10mg', '1 comprimé le soir', NULL, 5),
('Métoprolol', 'Bêta-bloquant', 'Comprimé', '50mg', '1 comprimé 2 fois par jour', NULL, 6),
('Lisinopril', 'Inhibiteur de l''enzyme de conversion', 'Comprimé', '10mg', '1 comprimé le matin', NULL, 7),
('Metformine', 'Antidiabétique oral', 'Comprimé', '500mg', '1 comprimé 2 fois par jour', NULL, 8),
('Sertraline', 'Antidépresseur', 'Comprimé', '50mg', '1 comprimé le matin', NULL, 9),
('Alprazolam', 'Anxiolytique', 'Comprimé', '0.25mg', '1 comprimé 2-3 fois par jour', NULL, 10);

-- Types de certificats de base
INSERT INTO public.types_certificats (nom, description, duree_defaut, specialite_id, ordre_affichage) VALUES
('Certificat d''arrêt de travail', 'Certificat pour arrêt de travail', 1, NULL, 1),
('Certificat de sport', 'Certificat d''aptitude au sport', 365, NULL, 2),
('Certificat de grossesse', 'Certificat de grossesse', 280, NULL, 3),
('Certificat de décès', 'Certificat de décès', 1, NULL, 4),
('Certificat de vaccination', 'Certificat de vaccination', 365, NULL, 5),
('Certificat de bonne santé', 'Certificat de bonne santé générale', 30, NULL, 6),
('Certificat de scolarité', 'Certificat pour scolarité', 365, NULL, 7),
('Certificat de conduite', 'Certificat d''aptitude à la conduite', 365, NULL, 8),
('Certificat de travail', 'Certificat pour reprise de travail', 1, NULL, 9),
('Certificat de voyage', 'Certificat médical pour voyage', 30, NULL, 10);

-- Types d'actes de base
INSERT INTO public.types_actes (nom, description, tarif_defaut, specialite_id, duree_estimee, ordre_affichage) VALUES
('Consultation générale', 'Consultation médicale générale', 25.00, NULL, 20, 1),
('Consultation spécialisée', 'Consultation avec un spécialiste', 35.00, NULL, 30, 2),
('Visite à domicile', 'Visite médicale à domicile', 45.00, NULL, 45, 3),
('Certificat médical', 'Établissement d''un certificat médical', 15.00, NULL, 10, 4),
('Injection', 'Injection intramusculaire ou sous-cutanée', 8.00, NULL, 5, 5),
('Pansement', 'Réalisation d''un pansement', 12.00, NULL, 15, 6),
('Suture', 'Suture d''une plaie', 25.00, NULL, 20, 7),
('Électrocardiogramme', 'Réalisation d''un ECG', 30.00, NULL, 15, 8),
('Échographie', 'Échographie abdominale', 80.00, NULL, 30, 9),
('Biopsie', 'Prélèvement biopsique', 50.00, NULL, 25, 10);

-- Assurances de base
INSERT INTO public.assurances (nom, description, type_assurance, taux_remboursement, ordre_affichage) VALUES
('Sécurité Sociale', 'Caisse primaire d''assurance maladie', 'securite_sociale', 70.00, 1),
('Mutuelle Générale', 'Mutuelle complémentaire générale', 'mutuelle', 30.00, 2),
('AXA Santé', 'Assurance santé privée', 'privee', 80.00, 3),
('MGEN', 'Mutuelle des fonctionnaires', 'mutuelle', 25.00, 4),
('Harmonie Mutuelle', 'Mutuelle complémentaire', 'mutuelle', 30.00, 5),
('Allianz', 'Assurance santé privée', 'privee', 75.00, 6),
('Groupama', 'Mutuelle agricole', 'mutuelle', 20.00, 7),
('MACIF', 'Mutuelle automobile', 'mutuelle', 25.00, 8),
('MAIF', 'Mutuelle assurance', 'mutuelle', 30.00, 9),
('Crédit Agricole', 'Assurance santé bancaire', 'privee', 70.00, 10);

-- ===== TRIGGERS POUR AUDIT =====

-- Application des triggers
CREATE TRIGGER update_antecedents_updated_at BEFORE UPDATE ON public.antecedents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_elements_synthese_updated_at BEFORE UPDATE ON public.elements_synthese FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_medicaments_updated_at BEFORE UPDATE ON public.medicaments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_types_certificats_updated_at BEFORE UPDATE ON public.types_certificats FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_types_actes_updated_at BEFORE UPDATE ON public.types_actes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_assurances_updated_at BEFORE UPDATE ON public.assurances FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===== RLS (ROW LEVEL SECURITY) =====

-- Activer RLS sur toutes les nouvelles tables
ALTER TABLE public.antecedents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.elements_synthese ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medicaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.types_certificats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.types_actes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assurances ENABLE ROW LEVEL SECURITY;

-- Politiques RLS simplifiées (lecture pour tous les utilisateurs authentifiés)
CREATE POLICY "Antecedents viewable by authenticated users" ON public.antecedents FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Elements synthese viewable by authenticated users" ON public.elements_synthese FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Medicaments viewable by authenticated users" ON public.medicaments FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Types certificats viewable by authenticated users" ON public.types_certificats FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Types actes viewable by authenticated users" ON public.types_actes FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Assurances viewable by authenticated users" ON public.assurances FOR SELECT USING (auth.role() = 'authenticated');
