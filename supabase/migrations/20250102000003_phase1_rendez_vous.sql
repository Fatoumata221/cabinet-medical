-- Migration Phase 1 - Module Rendez-vous
-- Date: 2025-01-02
-- Objectif: Améliorer et compléter le système de rendez-vous

-- ===== SÉQUENCES =====
CREATE SEQUENCE IF NOT EXISTS rappels_sms_id_seq;
CREATE SEQUENCE IF NOT EXISTS documents_patients_id_seq;
CREATE SEQUENCE IF NOT EXISTS disponibilites_medecins_id_seq;

-- ===== AMÉLIORATION DE LA TABLE PATIENTS =====

-- Ajout de colonnes manquantes pour la fiche patient complète
ALTER TABLE public.patients 
ADD COLUMN IF NOT EXISTS numero_dossier character varying UNIQUE,
ADD COLUMN IF NOT EXISTS email character varying,
ADD COLUMN IF NOT EXISTS sexe character varying CHECK (sexe IN ('M', 'F')),
ADD COLUMN IF NOT EXISTS lieu_naissance character varying,
ADD COLUMN IF NOT EXISTS nationalite character varying,
ADD COLUMN IF NOT EXISTS profession character varying,
ADD COLUMN IF NOT EXISTS situation_familiale character varying,
ADD COLUMN IF NOT EXISTS personne_contact character varying,
ADD COLUMN IF NOT EXISTS telephone_contact character varying,
ADD COLUMN IF NOT EXISTS lien_contact character varying,
ADD COLUMN IF NOT EXISTS medecin_traitant character varying,
ADD COLUMN IF NOT EXISTS numero_secu character varying,
ADD COLUMN IF NOT EXISTS mutuelle character varying,
ADD COLUMN IF NOT EXISTS numero_mutuelle character varying,
ADD COLUMN IF NOT EXISTS actif boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS notes text;

-- ===== AMÉLIORATION DE LA TABLE USERS (MÉDECINS) =====

-- Ajout de colonnes pour les médecins
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS telephone character varying,
ADD COLUMN IF NOT EXISTS specialite_id bigint,
ADD COLUMN IF NOT EXISTS horaires_travail jsonb,
ADD COLUMN IF NOT EXISTS duree_consultation integer DEFAULT 30,
ADD COLUMN IF NOT EXISTS actif boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS photo_url character varying;

-- ===== AMÉLIORATION DE LA TABLE APPOINTMENTS =====

-- Ajout de colonnes pour les rendez-vous
ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS heure_fin timestamp with time zone,
ADD COLUMN IF NOT EXISTS type_rdv character varying DEFAULT 'consultation' CHECK (type_rdv IN ('consultation', 'suivi', 'urgence', 'preventif')),
ADD COLUMN IF NOT EXISTS notes text,
ADD COLUMN IF NOT EXISTS rappel_envoye boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS rappel_veille_envoye boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS motif_detaille text;

-- ===== NOUVELLE TABLE POUR LES RAPPELS SMS =====

CREATE TABLE IF NOT EXISTS public.rappels_sms (
  id bigint NOT NULL DEFAULT nextval('rappels_sms_id_seq'::regclass),
  appointment_id bigint NOT NULL,
  patient_id bigint NOT NULL,
  medecin_id bigint NOT NULL,
  type_rappel character varying NOT NULL CHECK (type_rappel IN ('veille', 'jour_j', 'annulation', 'modification')),
  numero_telephone character varying NOT NULL,
  message text NOT NULL,
  statut character varying DEFAULT 'en_attente' CHECK (statut IN ('en_attente', 'envoye', 'delivre', 'erreur')),
  date_envoi timestamp with time zone,
  reponse_sms text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT rappels_sms_pkey PRIMARY KEY (id),
  CONSTRAINT fk_rappels_sms_appointment FOREIGN KEY (appointment_id) REFERENCES public.appointments(id) ON DELETE CASCADE,
  CONSTRAINT fk_rappels_sms_patient FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE CASCADE,
  CONSTRAINT fk_rappels_sms_medecin FOREIGN KEY (medecin_id) REFERENCES public.users(id) ON DELETE CASCADE
);

-- ===== NOUVELLE TABLE POUR LES DOCUMENTS PATIENTS =====

CREATE TABLE IF NOT EXISTS public.documents_patients (
  id bigint NOT NULL DEFAULT nextval('documents_patients_id_seq'::regclass),
  patient_id bigint NOT NULL,
  type_document character varying NOT NULL CHECK (type_document IN ('analyse', 'imagerie', 'prescription', 'certificat', 'autre')),
  nom_fichier character varying NOT NULL,
  url_fichier character varying NOT NULL,
  taille_fichier bigint,
  format_fichier character varying,
  description text,
  date_scan timestamp with time zone DEFAULT now(),
  scanned_by bigint NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT documents_patients_pkey PRIMARY KEY (id),
  CONSTRAINT fk_documents_patients_patient FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE CASCADE,
  CONSTRAINT fk_documents_patients_scanned_by FOREIGN KEY (scanned_by) REFERENCES public.users(id) ON DELETE CASCADE
);

-- ===== NOUVELLE TABLE POUR LES DISPONIBILITÉS MÉDECINS =====

CREATE TABLE IF NOT EXISTS public.disponibilites_medecins (
  id bigint NOT NULL DEFAULT nextval('disponibilites_medecins_id_seq'::regclass),
  medecin_id bigint NOT NULL,
  date_disponibilite date NOT NULL,
  heure_debut time NOT NULL,
  heure_fin time NOT NULL,
  statut character varying DEFAULT 'disponible' CHECK (statut IN ('disponible', 'indisponible', 'pause', 'conges')),
  motif_indisponibilite text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT disponibilites_medecins_pkey PRIMARY KEY (id),
  CONSTRAINT fk_disponibilites_medecins_medecin FOREIGN KEY (medecin_id) REFERENCES public.users(id) ON DELETE CASCADE,
  CONSTRAINT unique_disponibilite UNIQUE (medecin_id, date_disponibilite, heure_debut)
);

-- ===== AMÉLIORATION DE LA TABLE WAITING_QUEUE =====

-- Ajout de colonnes pour la salle d'attente
ALTER TABLE public.waiting_queue 
ADD COLUMN IF NOT EXISTS documents_scannes boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS motif_consultation text,
ADD COLUMN IF NOT EXISTS temps_attente_estime integer,
ADD COLUMN IF NOT EXISTS notification_envoyee boolean DEFAULT false;

-- ===== INDEX POUR LES PERFORMANCES =====

-- Index pour les rappels SMS
CREATE INDEX IF NOT EXISTS idx_rappels_sms_appointment_id ON public.rappels_sms(appointment_id);
CREATE INDEX IF NOT EXISTS idx_rappels_sms_patient_id ON public.rappels_sms(patient_id);
CREATE INDEX IF NOT EXISTS idx_rappels_sms_medecin_id ON public.rappels_sms(medecin_id);
CREATE INDEX IF NOT EXISTS idx_rappels_sms_statut ON public.rappels_sms(statut);
CREATE INDEX IF NOT EXISTS idx_rappels_sms_date_envoi ON public.rappels_sms(date_envoi);

-- Index pour les documents patients
CREATE INDEX IF NOT EXISTS idx_documents_patients_patient_id ON public.documents_patients(patient_id);
CREATE INDEX IF NOT EXISTS idx_documents_patients_type_document ON public.documents_patients(type_document);
CREATE INDEX IF NOT EXISTS idx_documents_patients_date_scan ON public.documents_patients(date_scan);

-- Index pour les disponibilités médecins
CREATE INDEX IF NOT EXISTS idx_disponibilites_medecins_medecin_id ON public.disponibilites_medecins(medecin_id);
CREATE INDEX IF NOT EXISTS idx_disponibilites_medecins_date ON public.disponibilites_medecins(date_disponibilite);
CREATE INDEX IF NOT EXISTS idx_disponibilites_medecins_statut ON public.disponibilites_medecins(statut);

-- Index pour les améliorations des tables existantes
CREATE INDEX IF NOT EXISTS idx_patients_numero_dossier ON public.patients(numero_dossier);
CREATE INDEX IF NOT EXISTS idx_patients_actif ON public.patients(actif);
CREATE INDEX IF NOT EXISTS idx_users_specialite_id ON public.users(specialite_id);
CREATE INDEX IF NOT EXISTS idx_users_actif ON public.users(actif);
CREATE INDEX IF NOT EXISTS idx_appointments_type_rdv ON public.appointments(type_rdv);
CREATE INDEX IF NOT EXISTS idx_appointments_rappel_envoye ON public.appointments(rappel_envoye);

-- ===== TRIGGERS POUR AUDIT =====

-- Trigger pour les nouvelles tables
CREATE TRIGGER update_rappels_sms_updated_at BEFORE UPDATE ON public.rappels_sms FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_documents_patients_updated_at BEFORE UPDATE ON public.documents_patients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_disponibilites_medecins_updated_at BEFORE UPDATE ON public.disponibilites_medecins FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===== FONCTIONS UTILITAIRES =====

-- Fonction pour calculer automatiquement l'heure de fin d'un rendez-vous
CREATE OR REPLACE FUNCTION calculer_heure_fin_rdv()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.heure_fin IS NULL AND NEW.duree IS NOT NULL THEN
        NEW.heure_fin = NEW.date_heure + (NEW.duree || ' minutes')::interval;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger pour calculer automatiquement l'heure de fin
CREATE TRIGGER trigger_calculer_heure_fin_rdv 
    BEFORE INSERT OR UPDATE ON public.appointments 
    FOR EACH ROW EXECUTE FUNCTION calculer_heure_fin_rdv();

-- Fonction pour notifier quand un patient arrive en salle d'attente
CREATE OR REPLACE FUNCTION notifier_arrivee_patient()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'present' AND OLD.status != 'present' THEN
        INSERT INTO public.notifications (user_id, type, titre, message, data)
        VALUES (
            NEW.medecin_id, 
            'patient_next', 
            'Patient arrivé', 
            'Le patient ' || (SELECT prenom || ' ' || nom FROM public.patients WHERE id = NEW.patient_id) || ' est arrivé en salle d''attente',
            jsonb_build_object('patient_id', NEW.patient_id, 'waiting_queue_id', NEW.id)
        );
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger pour notifier l'arrivée d'un patient
CREATE TRIGGER trigger_notifier_arrivee_patient 
    AFTER UPDATE ON public.waiting_queue 
    FOR EACH ROW EXECUTE FUNCTION notifier_arrivee_patient();

-- Fonction pour notifier quand un médecin est disponible
CREATE OR REPLACE FUNCTION notifier_disponibilite_medecin()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.statut = 'disponible' AND OLD.statut != 'disponible' THEN
        INSERT INTO public.notifications (user_id, type, titre, message, data)
        SELECT 
            u.id, 
            'medecin_disponible', 
            'Médecin disponible', 
            'Le Dr. ' || NEW.medecin_id || ' est maintenant disponible',
            jsonb_build_object('medecin_id', NEW.medecin_id, 'disponibilite_id', NEW.id)
        FROM public.users u 
        WHERE u.role = 'secretary';
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger pour notifier la disponibilité d'un médecin
CREATE TRIGGER trigger_notifier_disponibilite_medecin 
    AFTER UPDATE ON public.disponibilites_medecins 
    FOR EACH ROW EXECUTE FUNCTION notifier_disponibilite_medecin();

-- ===== DONNÉES DE RÉFÉRENCE =====

-- Insertion de données de test pour les patients (si la table est vide)
INSERT INTO public.patients (nom, prenom, date_naissance, telephone, email, sexe, numero_dossier, actif)
SELECT * FROM (VALUES 
    ('Dupont', 'Marie', '1985-03-15'::date, '0123456789', 'marie.dupont@email.com', 'F', 'P001', true),
    ('Martin', 'Jean', '1978-07-22'::date, '0987654321', 'jean.martin@email.com', 'M', 'P002', true),
    ('Bernard', 'Sophie', '1992-11-08'::date, '0567891234', 'sophie.bernard@email.com', 'F', 'P003', true),
    ('Petit', 'Pierre', '1965-12-03'::date, '0345678912', 'pierre.petit@email.com', 'M', 'P004', true),
    ('Robert', 'Claire', '1988-05-19'::date, '0789012345', 'claire.robert@email.com', 'F', 'P005', true)
) AS v(nom, prenom, date_naissance, telephone, email, sexe, numero_dossier, actif)
WHERE NOT EXISTS (SELECT 1 FROM public.patients LIMIT 1);

-- Insertion de données de test pour les médecins (si la table est vide)
INSERT INTO public.users (email, role, nom, prenom, specialite, telephone, actif)
SELECT * FROM (VALUES 
    ('dr.durand@cabinet.com', 'doctor', 'Durand', 'Dr. Paul', 'Cardiologie', '0123456789', true),
    ('dr.leroy@cabinet.com', 'doctor', 'Leroy', 'Dr. Anne', 'Dermatologie', '0987654321', true),
    ('dr.moreau@cabinet.com', 'doctor', 'Moreau', 'Dr. Michel', 'Pédiatrie', '0567891234', true),
    ('dr.simon@cabinet.com', 'doctor', 'Simon', 'Dr. Isabelle', 'Gynécologie', '0345678912', true),
    ('dr.laurent@cabinet.com', 'doctor', 'Laurent', 'Dr. Thomas', 'Orthopédie', '0789012345', true)
) AS v(email, role, nom, prenom, specialite, telephone, actif)
WHERE NOT EXISTS (SELECT 1 FROM public.users WHERE role = 'doctor' LIMIT 1);

-- ===== POLITIQUES RLS =====

-- Activer RLS sur les nouvelles tables
ALTER TABLE public.rappels_sms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents_patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disponibilites_medecins ENABLE ROW LEVEL SECURITY;

-- Politiques pour les rappels SMS
CREATE POLICY "Users can view rappels_sms" ON public.rappels_sms
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can create rappels_sms" ON public.rappels_sms
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update rappels_sms" ON public.rappels_sms
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Politiques pour les documents patients
CREATE POLICY "Users can view documents_patients" ON public.documents_patients
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can create documents_patients" ON public.documents_patients
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update documents_patients" ON public.documents_patients
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Politiques pour les disponibilités médecins
CREATE POLICY "Users can view disponibilites_medecins" ON public.disponibilites_medecins
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can create disponibilites_medecins" ON public.disponibilites_medecins
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update disponibilites_medecins" ON public.disponibilites_medecins
  FOR UPDATE USING (auth.role() = 'authenticated');
