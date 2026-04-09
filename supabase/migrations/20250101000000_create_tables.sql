-- Migration pour créer les tables du cabinet médical
-- Date: 2025-01-01

-- Création des séquences pour les IDs auto-incrémentés
CREATE SEQUENCE IF NOT EXISTS users_id_seq;
CREATE SEQUENCE IF NOT EXISTS patients_id_seq;
CREATE SEQUENCE IF NOT EXISTS appointments_id_seq;
CREATE SEQUENCE IF NOT EXISTS consultations_id_seq;
CREATE SEQUENCE IF NOT EXISTS invoices_id_seq;
CREATE SEQUENCE IF NOT EXISTS prescriptions_id_seq;
CREATE SEQUENCE IF NOT EXISTS waiting_queue_id_seq;
CREATE SEQUENCE IF NOT EXISTS medical_actions_id_seq;
CREATE SEQUENCE IF NOT EXISTS medications_id_seq;
CREATE SEQUENCE IF NOT EXISTS notifications_id_seq;

-- Table des utilisateurs (médecins, secrétaires, admins)
CREATE TABLE IF NOT EXISTS public.users (
  id bigint NOT NULL DEFAULT nextval('users_id_seq'::regclass),
  email character varying NOT NULL UNIQUE,
  role character varying NOT NULL CHECK (role::text = ANY (ARRAY['secretary'::character varying, 'doctor'::character varying, 'admin'::character varying]::text[])),
  nom character varying,
  prenom character varying,
  specialite character varying,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT users_pkey PRIMARY KEY (id)
);

-- Table des patients
CREATE TABLE IF NOT EXISTS public.patients (
  id bigint NOT NULL DEFAULT nextval('patients_id_seq'::regclass),
  nom character varying NOT NULL,
  prenom character varying NOT NULL,
  date_naissance date NOT NULL,
  telephone character varying,
  adresse character varying,
  assurance character varying,
  groupe_sanguin character varying,
  allergies text,
  antecedents text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT patients_pkey PRIMARY KEY (id)
);

-- Table des rendez-vous
CREATE TABLE IF NOT EXISTS public.appointments (
  id bigint NOT NULL DEFAULT nextval('appointments_id_seq'::regclass),
  patient_id bigint NOT NULL,
  medecin_id bigint NOT NULL,
  date_heure timestamp with time zone NOT NULL,
  motif character varying,
  statut character varying DEFAULT 'confirme'::character varying CHECK (statut::text = ANY (ARRAY['confirme'::character varying, 'en_attente'::character varying, 'annule'::character varying, 'termine'::character varying]::text[])),
  duree integer DEFAULT 30,
  priorite character varying DEFAULT 'normale'::character varying CHECK (priorite::text = ANY (ARRAY['normale'::character varying, 'urgente'::character varying, 'tres_urgente'::character varying]::text[])),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT appointments_pkey PRIMARY KEY (id),
  CONSTRAINT fk_appointments_patient FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE CASCADE,
  CONSTRAINT fk_appointments_medecin FOREIGN KEY (medecin_id) REFERENCES public.users(id) ON DELETE CASCADE
);

-- Table des consultations
CREATE TABLE IF NOT EXISTS public.consultations (
  id bigint NOT NULL DEFAULT nextval('consultations_id_seq'::regclass),
  patient_id bigint NOT NULL,
  medecin_id bigint NOT NULL,
  appointment_id bigint,
  date_consultation timestamp with time zone NOT NULL,
  motif character varying,
  diagnostic text,
  traitement text,
  notes text,
  statut character varying DEFAULT 'en_cours'::character varying CHECK (statut::text = ANY (ARRAY['en_cours'::character varying, 'terminee'::character varying, 'annulee'::character varying]::text[])),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT consultations_pkey PRIMARY KEY (id),
  CONSTRAINT fk_consultations_patient FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE CASCADE,
  CONSTRAINT fk_consultations_medecin FOREIGN KEY (medecin_id) REFERENCES public.users(id) ON DELETE CASCADE,
  CONSTRAINT fk_consultations_appointment FOREIGN KEY (appointment_id) REFERENCES public.appointments(id) ON DELETE SET NULL
);

-- Table des actions médicales
CREATE TABLE IF NOT EXISTS public.medical_actions (
  id bigint NOT NULL DEFAULT nextval('medical_actions_id_seq'::regclass),
  consultation_id bigint NOT NULL,
  type_action character varying NOT NULL CHECK (type_action::text = ANY (ARRAY['examen'::character varying, 'analyse'::character varying, 'radio'::character varying, 'echographie'::character varying, 'test'::character varying, 'autre'::character varying]::text[])),
  description text NOT NULL,
  resultat text,
  statut character varying DEFAULT 'prescrit'::character varying CHECK (statut::text = ANY (ARRAY['prescrit'::character varying, 'en_cours'::character varying, 'termine'::character varying, 'annule'::character varying]::text[])),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT medical_actions_pkey PRIMARY KEY (id),
  CONSTRAINT fk_medical_actions_consultation FOREIGN KEY (consultation_id) REFERENCES public.consultations(id) ON DELETE CASCADE
);

-- Table des médicaments
CREATE TABLE IF NOT EXISTS public.medications (
  id bigint NOT NULL DEFAULT nextval('medications_id_seq'::regclass),
  nom character varying NOT NULL,
  forme character varying,
  dosage character varying,
  laboratoire character varying,
  prix numeric(10,2),
  stock integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT medications_pkey PRIMARY KEY (id)
);

-- Table des prescriptions
CREATE TABLE IF NOT EXISTS public.prescriptions (
  id bigint NOT NULL DEFAULT nextval('prescriptions_id_seq'::regclass),
  consultation_id bigint NOT NULL,
  patient_id bigint NOT NULL,
  medecin_id bigint NOT NULL,
  medicament_id bigint,
  nom_medicament character varying NOT NULL,
  posologie text NOT NULL,
  duree_traitement character varying,
  instructions text,
  date_prescription timestamp with time zone DEFAULT now(),
  statut character varying DEFAULT 'active'::character varying CHECK (statut::text = ANY (ARRAY['active'::character varying, 'terminee'::character varying, 'annulee'::character varying]::text[])),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT prescriptions_pkey PRIMARY KEY (id),
  CONSTRAINT fk_prescriptions_consultation FOREIGN KEY (consultation_id) REFERENCES public.consultations(id) ON DELETE CASCADE,
  CONSTRAINT fk_prescriptions_patient FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE CASCADE,
  CONSTRAINT fk_prescriptions_medecin FOREIGN KEY (medecin_id) REFERENCES public.users(id) ON DELETE CASCADE,
  CONSTRAINT fk_prescriptions_medicament FOREIGN KEY (medicament_id) REFERENCES public.medications(id) ON DELETE SET NULL
);

-- Table des factures
CREATE TABLE IF NOT EXISTS public.invoices (
  id bigint NOT NULL DEFAULT nextval('invoices_id_seq'::regclass),
  patient_id bigint NOT NULL,
  consultation_id bigint,
  montant numeric(10,2) NOT NULL,
  montant_consultation numeric(10,2) DEFAULT 0,
  montant_medicaments numeric(10,2) DEFAULT 0,
  montant_actions_medicales numeric(10,2) DEFAULT 0,
  statut_paiement character varying NOT NULL DEFAULT 'en_attente'::character varying CHECK (statut_paiement::text = ANY (ARRAY['paye'::character varying, 'en_attente'::character varying, 'impaye'::character varying]::text[])),
  mode_paiement character varying CHECK (mode_paiement::text = ANY (ARRAY['especes'::character varying, 'carte'::character varying, 'cheque'::character varying, 'virement'::character varying]::text[])),
  date_paiement timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT invoices_pkey PRIMARY KEY (id),
  CONSTRAINT fk_invoices_patient FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE CASCADE,
  CONSTRAINT fk_invoices_consultation FOREIGN KEY (consultation_id) REFERENCES public.consultations(id) ON DELETE SET NULL
);

-- Table de la file d'attente (améliorée)
CREATE TABLE IF NOT EXISTS public.waiting_queue (
  id bigint NOT NULL DEFAULT nextval('waiting_queue_id_seq'::regclass),
  patient_id bigint NOT NULL,
  medecin_id bigint NOT NULL,
  appointment_id bigint,
  order_position bigint NOT NULL,
  status character varying NOT NULL DEFAULT 'waiting'::character varying CHECK (status::text = ANY (ARRAY['waiting'::character varying, 'present'::character varying, 'in_consultation'::character varying, 'late'::character varying, 'emergency'::character varying, 'finished'::character varying]::text[])),
  arrived_at timestamp with time zone DEFAULT now(),
  called_at timestamp with time zone,
  consultation_started_at timestamp with time zone,
  consultation_finished_at timestamp with time zone,
  priority character varying DEFAULT 'normale'::character varying CHECK (priority::text = ANY (ARRAY['normale'::character varying, 'urgente'::character varying, 'tres_urgente'::character varying]::text[])),
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT waiting_queue_pkey PRIMARY KEY (id),
  CONSTRAINT fk_waiting_queue_patient FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE CASCADE,
  CONSTRAINT fk_waiting_queue_medecin FOREIGN KEY (medecin_id) REFERENCES public.users(id) ON DELETE CASCADE,
  CONSTRAINT fk_waiting_queue_appointment FOREIGN KEY (appointment_id) REFERENCES public.appointments(id) ON DELETE SET NULL
);

-- Table des notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id bigint NOT NULL DEFAULT nextval('notifications_id_seq'::regclass),
  user_id bigint NOT NULL,
  type character varying NOT NULL CHECK (type::text = ANY (ARRAY['patient_next'::character varying, 'appointment_reminder'::character varying, 'emergency'::character varying, 'consultation_finished'::character varying, 'payment_received'::character varying]::text[])),
  titre character varying NOT NULL,
  message text NOT NULL,
  data jsonb,
  lu boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT notifications_pkey PRIMARY KEY (id),
  CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
);

-- Création des index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_appointments_patient_id ON public.appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_medecin_id ON public.appointments(medecin_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date_heure ON public.appointments(date_heure);
CREATE INDEX IF NOT EXISTS idx_appointments_statut ON public.appointments(statut);
CREATE INDEX IF NOT EXISTS idx_consultations_patient_id ON public.consultations(patient_id);
CREATE INDEX IF NOT EXISTS idx_consultations_medecin_id ON public.consultations(medecin_id);
CREATE INDEX IF NOT EXISTS idx_consultations_date_consultation ON public.consultations(date_consultation);
CREATE INDEX IF NOT EXISTS idx_consultations_statut ON public.consultations(statut);
CREATE INDEX IF NOT EXISTS idx_medical_actions_consultation_id ON public.medical_actions(consultation_id);
CREATE INDEX IF NOT EXISTS idx_medical_actions_statut ON public.medical_actions(statut);
CREATE INDEX IF NOT EXISTS idx_medications_nom ON public.medications(nom);
CREATE INDEX IF NOT EXISTS idx_prescriptions_consultation_id ON public.prescriptions(consultation_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_patient_id ON public.prescriptions(patient_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_medecin_id ON public.prescriptions(medecin_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_statut ON public.prescriptions(statut);
CREATE INDEX IF NOT EXISTS idx_invoices_patient_id ON public.invoices(patient_id);
CREATE INDEX IF NOT EXISTS idx_invoices_consultation_id ON public.invoices(consultation_id);
CREATE INDEX IF NOT EXISTS idx_invoices_statut_paiement ON public.invoices(statut_paiement);
CREATE INDEX IF NOT EXISTS idx_waiting_queue_medecin_id ON public.waiting_queue(medecin_id);
CREATE INDEX IF NOT EXISTS idx_waiting_queue_order_position ON public.waiting_queue(order_position);
CREATE INDEX IF NOT EXISTS idx_waiting_queue_status ON public.waiting_queue(status);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_lu ON public.notifications(lu);

-- Fonction pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers pour mettre à jour automatiquement updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON public.patients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_consultations_updated_at BEFORE UPDATE ON public.consultations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_medical_actions_updated_at BEFORE UPDATE ON public.medical_actions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_medications_updated_at BEFORE UPDATE ON public.medications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_prescriptions_updated_at BEFORE UPDATE ON public.prescriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_waiting_queue_updated_at BEFORE UPDATE ON public.waiting_queue FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Fonction pour notifier le secrétaire quand un médecin termine une consultation
CREATE OR REPLACE FUNCTION notify_secretary_consultation_finished()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.statut = 'terminee' AND OLD.statut != 'terminee' THEN
        INSERT INTO public.notifications (user_id, type, titre, message, data)
        SELECT u.id, 'consultation_finished', 'Consultation terminée', 
               'Le Dr. ' || NEW.medecin_id || ' a terminé la consultation de ' || p.prenom || ' ' || p.nom,
               jsonb_build_object('consultation_id', NEW.id, 'patient_id', NEW.patient_id, 'medecin_id', NEW.medecin_id)
        FROM public.users u, public.patients p
        WHERE u.role = 'secretary' AND p.id = NEW.patient_id;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger pour notifier le secrétaire
CREATE TRIGGER trigger_notify_secretary_consultation_finished 
    AFTER UPDATE ON public.consultations 
    FOR EACH ROW EXECUTE FUNCTION notify_secretary_consultation_finished();

-- Données de test (optionnel)
-- Insérer un utilisateur admin par défaut
INSERT INTO public.users (email, role, nom, prenom) 
VALUES ('admin@cabinet.com', 'admin', 'Admin', 'Système')
ON CONFLICT (email) DO NOTHING;

-- Insérer quelques médecins de test
INSERT INTO public.users (email, role, nom, prenom, specialite) 
VALUES 
  ('dr.martin@cabinet.com', 'doctor', 'Martin', 'Dr. Jean', 'Médecine générale'),
  ('dr.bernard@cabinet.com', 'doctor', 'Bernard', 'Dr. Marie', 'Cardiologie'),
  ('secretaire@cabinet.com', 'secretary', 'Dubois', 'Sophie', NULL)
ON CONFLICT (email) DO NOTHING;

-- Insérer quelques médicaments de test
INSERT INTO public.medications (nom, forme, dosage, laboratoire, prix) 
VALUES 
  ('Paracétamol', 'Comprimé', '500mg', 'Sanofi', 5.50),
  ('Ibuprofène', 'Comprimé', '400mg', 'Bayer', 6.20),
  ('Amoxicilline', 'Gélule', '1g', 'GSK', 12.80),
  ('Oméprazole', 'Gélule', '20mg', 'AstraZeneca', 15.30),
  ('Atorvastatine', 'Comprimé', '10mg', 'Pfizer', 18.90)
ON CONFLICT DO NOTHING;
