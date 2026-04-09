-- Migration Phase 1 - Tables de Référence Médicale (Version Simplifiée)
-- Date: 2025-01-02
-- Description: Ajout des tables de paramétrage médical manquantes

-- ===== SÉQUENCES =====
CREATE SEQUENCE IF NOT EXISTS constantes_id_seq;
CREATE SEQUENCE IF NOT EXISTS signes_cliniques_id_seq;
CREATE SEQUENCE IF NOT EXISTS appareils_id_seq;
CREATE SEQUENCE IF NOT EXISTS constats_appareils_id_seq;
CREATE SEQUENCE IF NOT EXISTS diagnostics_id_seq;

-- ===== TABLE DES CONSTANTES =====
CREATE TABLE public.constantes (
  id bigint NOT NULL DEFAULT nextval('constantes_id_seq'::regclass),
  nom character varying NOT NULL,
  description text,
  unite character varying,
  valeur_min numeric(10,2),
  valeur_max numeric(10,2),
  valeur_normale_min numeric(10,2),
  valeur_normale_max numeric(10,2),
  categorie character varying DEFAULT 'generale',
  ordre_affichage integer DEFAULT 0,
  actif boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  created_by bigint,
  updated_by bigint,
  CONSTRAINT constantes_pkey PRIMARY KEY (id)
);

-- ===== TABLE DES SIGNES CLINIQUES =====
CREATE TABLE public.signes_cliniques (
  id bigint NOT NULL DEFAULT nextval('signes_cliniques_id_seq'::regclass),
  nom character varying NOT NULL,
  description text,
  categorie character varying DEFAULT 'generale',
  type_signe character varying DEFAULT 'observation' CHECK (type_signe IN ('observation', 'palpation', 'percussion', 'auscultation')),
  localisation character varying,
  ordre_affichage integer DEFAULT 0,
  actif boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  created_by bigint,
  updated_by bigint,
  CONSTRAINT signes_cliniques_pkey PRIMARY KEY (id)
);

-- ===== TABLE DES APPAREILS =====
CREATE TABLE public.appareils (
  id bigint NOT NULL DEFAULT nextval('appareils_id_seq'::regclass),
  nom character varying NOT NULL,
  description text,
  specialite_id bigint,
  ordre_affichage integer DEFAULT 0,
  actif boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  created_by bigint,
  updated_by bigint,
  CONSTRAINT appareils_pkey PRIMARY KEY (id)
);

-- ===== TABLE DES CONSTATS D'APPAREILS =====
CREATE TABLE public.constats_appareils (
  id bigint NOT NULL DEFAULT nextval('constats_appareils_id_seq'::regclass),
  appareil_id bigint NOT NULL,
  nom character varying NOT NULL,
  description text,
  type_constat character varying DEFAULT 'normal' CHECK (type_constat IN ('normal', 'anormal', 'pathologique')),
  ordre_affichage integer DEFAULT 0,
  actif boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  created_by bigint,
  updated_by bigint,
  CONSTRAINT constats_appareils_pkey PRIMARY KEY (id)
);

-- ===== TABLE DES DIAGNOSTICS =====
CREATE TABLE public.diagnostics (
  id bigint NOT NULL DEFAULT nextval('diagnostics_id_seq'::regclass),
  nom character varying NOT NULL,
  description text,
  code_cim character varying,
  specialite_id bigint,
  niveau_gravite character varying DEFAULT 'leger' CHECK (niveau_gravite IN ('leger', 'modere', 'grave', 'critique')),
  ordre_affichage integer DEFAULT 0,
  actif boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  created_by bigint,
  updated_by bigint,
  CONSTRAINT diagnostics_pkey PRIMARY KEY (id)
);

-- ===== INDEX POUR LES PERFORMANCES =====
CREATE INDEX IF NOT EXISTS idx_constantes_categorie ON public.constantes(categorie);
CREATE INDEX IF NOT EXISTS idx_constantes_ordre ON public.constantes(ordre_affichage);
CREATE INDEX IF NOT EXISTS idx_signes_cliniques_categorie ON public.signes_cliniques(categorie);
CREATE INDEX IF NOT EXISTS idx_signes_cliniques_type ON public.signes_cliniques(type_signe);
CREATE INDEX IF NOT EXISTS idx_appareils_specialite ON public.appareils(specialite_id);
CREATE INDEX IF NOT EXISTS idx_constats_appareil_id ON public.constats_appareils(appareil_id);
CREATE INDEX IF NOT EXISTS idx_constats_type ON public.constats_appareils(type_constat);
CREATE INDEX IF NOT EXISTS idx_diagnostics_specialite ON public.diagnostics(specialite_id);
CREATE INDEX IF NOT EXISTS idx_diagnostics_gravite ON public.diagnostics(niveau_gravite);

-- ===== DONNÉES DE RÉFÉRENCE =====

-- Constantes de base
INSERT INTO public.constantes (nom, description, unite, valeur_min, valeur_max, valeur_normale_min, valeur_normale_max, categorie, ordre_affichage) VALUES
('Tension artérielle systolique', 'Pression artérielle systolique', 'mmHg', 70, 200, 90, 140, 'cardiovasculaire', 1),
('Tension artérielle diastolique', 'Pression artérielle diastolique', 'mmHg', 40, 120, 60, 90, 'cardiovasculaire', 2),
('Fréquence cardiaque', 'Nombre de battements cardiaques par minute', 'bpm', 40, 200, 60, 100, 'cardiovasculaire', 3),
('Température', 'Température corporelle', '°C', 35, 42, 36.5, 37.5, 'generale', 4),
('Poids', 'Poids corporel', 'kg', 0, 300, 0, 0, 'generale', 5),
('Taille', 'Taille du patient', 'cm', 0, 250, 0, 0, 'generale', 6),
('Fréquence respiratoire', 'Nombre de respirations par minute', 'rpm', 8, 40, 12, 20, 'respiratoire', 7),
('Saturation en oxygène', 'Saturation en oxygène du sang', '%', 70, 100, 95, 100, 'respiratoire', 8),
('Glycémie', 'Taux de glucose dans le sang', 'g/L', 0.4, 4, 0.7, 1.1, 'metabolique', 9),
('IMC', 'Indice de masse corporelle', 'kg/m²', 10, 60, 18.5, 25, 'generale', 10);

-- Signes cliniques de base
INSERT INTO public.signes_cliniques (nom, description, categorie, type_signe, localisation, ordre_affichage) VALUES
('État général', 'État général du patient', 'generale', 'observation', 'general', 1),
('Conscience', 'Niveau de conscience', 'neurologique', 'observation', 'neurologique', 2),
('Coloration cutanée', 'Couleur de la peau', 'dermatologique', 'observation', 'peau', 3),
('Muqueuses', 'État des muqueuses', 'generale', 'observation', 'muqueuses', 4),
('Œdèmes', 'Présence d''œdèmes', 'cardiovasculaire', 'observation', 'membres', 5),
('Déformation', 'Déformations visibles', 'orthopedique', 'observation', 'squelette', 6),
('Douleur à la palpation', 'Douleur lors de la palpation', 'generale', 'palpation', 'variable', 7),
('Masse palpable', 'Masse détectée à la palpation', 'generale', 'palpation', 'variable', 8),
('Souffle cardiaque', 'Souffle à l''auscultation cardiaque', 'cardiovasculaire', 'auscultation', 'thorax', 9),
('Râles pulmonaires', 'Râles à l''auscultation pulmonaire', 'respiratoire', 'auscultation', 'thorax', 10);

-- Appareils de base
INSERT INTO public.appareils (nom, description, specialite_id, ordre_affichage) VALUES
('Appareil cardiovasculaire', 'Examen du cœur et des vaisseaux', NULL, 1),
('Appareil respiratoire', 'Examen des poumons et des voies respiratoires', NULL, 2),
('Appareil digestif', 'Examen de l''abdomen et du tube digestif', NULL, 3),
('Appareil locomoteur', 'Examen des articulations et des muscles', NULL, 4),
('Appareil neurologique', 'Examen du système nerveux', NULL, 5),
('Appareil génito-urinaire', 'Examen des organes génitaux et urinaires', NULL, 6),
('Appareil ORL', 'Examen des oreilles, du nez et de la gorge', NULL, 7),
('Appareil ophtalmologique', 'Examen des yeux', NULL, 8);

-- Constats d'appareils de base
INSERT INTO public.constats_appareils (appareil_id, nom, description, type_constat, ordre_affichage) VALUES
(1, 'Normal', 'Examen cardiovasculaire normal', 'normal', 1),
(1, 'Souffle systolique', 'Souffle cardiaque systolique', 'anormal', 2),
(1, 'Souffle diastolique', 'Souffle cardiaque diastolique', 'anormal', 3),
(1, 'Arythmie', 'Rythme cardiaque irrégulier', 'pathologique', 4),
(2, 'Normal', 'Examen respiratoire normal', 'normal', 1),
(2, 'Râles crépitants', 'Râles crépitants à l''auscultation', 'anormal', 2),
(2, 'Râles sibilants', 'Râles sibilants à l''auscultation', 'anormal', 3),
(2, 'Diminution du murmure vésiculaire', 'Diminution du murmure vésiculaire', 'pathologique', 4),
(3, 'Normal', 'Examen abdominal normal', 'normal', 1),
(3, 'Défense abdominale', 'Défense à la palpation abdominale', 'anormal', 2),
(3, 'Masse palpable', 'Masse détectée à la palpation', 'pathologique', 3),
(4, 'Normal', 'Examen locomoteur normal', 'normal', 1),
(4, 'Douleur articulaire', 'Douleur à la mobilisation articulaire', 'anormal', 2),
(4, 'Raideur articulaire', 'Raideur articulaire', 'anormal', 3);

-- Diagnostics de base
INSERT INTO public.diagnostics (nom, description, code_cim, specialite_id, niveau_gravite, ordre_affichage) VALUES
('Hypertension artérielle', 'Pression artérielle élevée', 'I10', NULL, 'modere', 1),
('Diabète de type 2', 'Diabète non insulinodépendant', 'E11', NULL, 'modere', 2),
('Bronchite aiguë', 'Inflammation aiguë des bronches', 'J20', NULL, 'leger', 3),
('Grippe', 'Infection virale grippale', 'J10', NULL, 'leger', 4),
('Infarctus du myocarde', 'Nécrose du muscle cardiaque', 'I21', NULL, 'critique', 5),
('Pneumonie', 'Infection pulmonaire', 'J18', NULL, 'grave', 6),
('Appendicite', 'Inflammation de l''appendice', 'K35', NULL, 'grave', 7),
('Migraine', 'Céphalée unilatérale', 'G43', NULL, 'leger', 8),
('Dépression', 'Trouble dépressif', 'F32', NULL, 'modere', 9),
('Anémie', 'Diminution du taux d''hémoglobine', 'D50', NULL, 'modere', 10);

-- ===== TRIGGERS POUR AUDIT =====

-- Trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Application des triggers
CREATE TRIGGER update_constantes_updated_at BEFORE UPDATE ON public.constantes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_signes_cliniques_updated_at BEFORE UPDATE ON public.signes_cliniques FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_appareils_updated_at BEFORE UPDATE ON public.appareils FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_constats_appareils_updated_at BEFORE UPDATE ON public.constats_appareils FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_diagnostics_updated_at BEFORE UPDATE ON public.diagnostics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===== RLS (ROW LEVEL SECURITY) =====

-- Activer RLS sur toutes les nouvelles tables
ALTER TABLE public.constantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signes_cliniques ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appareils ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.constats_appareils ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diagnostics ENABLE ROW LEVEL SECURITY;

-- Politiques RLS simplifiées (lecture pour tous les utilisateurs authentifiés)
CREATE POLICY "Constantes viewable by authenticated users" ON public.constantes FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Signes cliniques viewable by authenticated users" ON public.signes_cliniques FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Appareils viewable by authenticated users" ON public.appareils FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Constats appareils viewable by authenticated users" ON public.constats_appareils FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Diagnostics viewable by authenticated users" ON public.diagnostics FOR SELECT USING (auth.role() = 'authenticated');
