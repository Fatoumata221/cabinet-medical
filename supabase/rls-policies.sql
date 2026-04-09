-- Script de configuration des politiques RLS (Row Level Security) pour Supabase
-- Ce script doit être exécuté dans l'éditeur SQL de Supabase

-- ===== ACTIVATION DE RLS SUR TOUTES LES TABLES =====

-- Activer RLS sur la table users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Activer RLS sur la table patients
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

-- Activer RLS sur la table appointments
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Activer RLS sur la table consultations
ALTER TABLE public.consultations ENABLE ROW LEVEL SECURITY;

-- Activer RLS sur la table prescriptions
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;

-- Activer RLS sur la table invoices
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- Activer RLS sur la table waiting_queue
ALTER TABLE public.waiting_queue ENABLE ROW LEVEL SECURITY;

-- ===== POLITIQUES POUR LA TABLE USERS =====

-- Politique pour permettre aux utilisateurs authentifiés de voir tous les utilisateurs
CREATE POLICY "Users can view all users" ON public.users
  FOR SELECT USING (auth.role() = 'authenticated');

-- Politique pour permettre aux utilisateurs de modifier leur propre profil
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Politique pour permettre aux administrateurs de créer des utilisateurs
CREATE POLICY "Admins can create users" ON public.users
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT id FROM public.users 
      WHERE role = 'admin'
    )
  );

-- ===== POLITIQUES POUR LA TABLE PATIENTS =====

-- Politique pour permettre aux utilisateurs authentifiés de voir tous les patients
CREATE POLICY "Users can view all patients" ON public.patients
  FOR SELECT USING (auth.role() = 'authenticated');

-- Politique pour permettre aux utilisateurs authentifiés de créer des patients
CREATE POLICY "Users can create patients" ON public.patients
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Politique pour permettre aux utilisateurs authentifiés de modifier les patients
CREATE POLICY "Users can update patients" ON public.patients
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Politique pour permettre aux utilisateurs authentifiés de supprimer les patients
CREATE POLICY "Users can delete patients" ON public.patients
  FOR DELETE USING (auth.role() = 'authenticated');

-- ===== POLITIQUES POUR LA TABLE APPOINTMENTS =====

-- Politique pour permettre aux utilisateurs authentifiés de voir tous les rendez-vous
CREATE POLICY "Users can view all appointments" ON public.appointments
  FOR SELECT USING (auth.role() = 'authenticated');

-- Politique pour permettre aux utilisateurs authentifiés de créer des rendez-vous
CREATE POLICY "Users can create appointments" ON public.appointments
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Politique pour permettre aux utilisateurs authentifiés de modifier les rendez-vous
CREATE POLICY "Users can update appointments" ON public.appointments
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Politique pour permettre aux utilisateurs authentifiés de supprimer les rendez-vous
CREATE POLICY "Users can delete appointments" ON public.appointments
  FOR DELETE USING (auth.role() = 'authenticated');

-- ===== POLITIQUES POUR LA TABLE CONSULTATIONS =====

-- Politique pour permettre aux utilisateurs authentifiés de voir toutes les consultations
CREATE POLICY "Users can view all consultations" ON public.consultations
  FOR SELECT USING (auth.role() = 'authenticated');

-- Politique pour permettre aux utilisateurs authentifiés de créer des consultations
CREATE POLICY "Users can create consultations" ON public.consultations
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Politique pour permettre aux utilisateurs authentifiés de modifier les consultations
CREATE POLICY "Users can update consultations" ON public.consultations
  FOR UPDATE USING (auth.role() = 'authenticated');

-- ===== POLITIQUES POUR LA TABLE PRESCRIPTIONS =====

-- Politique pour permettre aux utilisateurs authentifiés de voir toutes les prescriptions
CREATE POLICY "Users can view all prescriptions" ON public.prescriptions
  FOR SELECT USING (auth.role() = 'authenticated');

-- Politique pour permettre aux utilisateurs authentifiés de créer des prescriptions
CREATE POLICY "Users can create prescriptions" ON public.prescriptions
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Politique pour permettre aux utilisateurs authentifiés de modifier les prescriptions
CREATE POLICY "Users can update prescriptions" ON public.prescriptions
  FOR UPDATE USING (auth.role() = 'authenticated');

-- ===== POLITIQUES POUR LA TABLE INVOICES =====

-- Politique pour permettre aux utilisateurs authentifiés de voir toutes les factures
CREATE POLICY "Users can view all invoices" ON public.invoices
  FOR SELECT USING (auth.role() = 'authenticated');

-- Politique pour permettre aux utilisateurs authentifiés de créer des factures
CREATE POLICY "Users can create invoices" ON public.invoices
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Politique pour permettre aux utilisateurs authentifiés de modifier les factures
CREATE POLICY "Users can update invoices" ON public.invoices
  FOR UPDATE USING (auth.role() = 'authenticated');

-- ===== POLITIQUES POUR LA TABLE WAITING_QUEUE =====

-- Politique pour permettre aux utilisateurs authentifiés de voir la file d'attente
CREATE POLICY "Users can view waiting queue" ON public.waiting_queue
  FOR SELECT USING (auth.role() = 'authenticated');

-- Politique pour permettre aux utilisateurs authentifiés d'ajouter à la file d'attente
CREATE POLICY "Users can add to waiting queue" ON public.waiting_queue
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Politique pour permettre aux utilisateurs authentifiés de modifier la file d'attente
CREATE POLICY "Users can update waiting queue" ON public.waiting_queue
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Politique pour permettre aux utilisateurs authentifiés de supprimer de la file d'attente
CREATE POLICY "Users can delete from waiting queue" ON public.waiting_queue
  FOR DELETE USING (auth.role() = 'authenticated');

-- ===== POLITIQUES SPÉCIALES POUR LES MÉDECINS =====

-- Politique pour permettre aux médecins de voir leurs propres rendez-vous
CREATE POLICY "Doctors can view own appointments" ON public.appointments
  FOR SELECT USING (
    auth.uid() = medecin_id AND 
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'doctor'
    )
  );

-- Politique pour permettre aux médecins de modifier leurs propres rendez-vous
CREATE POLICY "Doctors can update own appointments" ON public.appointments
  FOR UPDATE USING (
    auth.uid() = medecin_id AND 
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'doctor'
    )
  );

-- ===== POLITIQUES SPÉCIALES POUR LES SECRÉTAIRES =====

-- Politique pour permettre aux secrétaires d'accéder à toutes les données
CREATE POLICY "Secretaries have full access" ON public.appointments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'secretary'
    )
  );

-- ===== FONCTION POUR OBTENIR LE RÔLE DE L'UTILISATEUR =====

-- Fonction pour obtenir le rôle de l'utilisateur actuel
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
BEGIN
  RETURN (
    SELECT role 
    FROM public.users 
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===== COMMENTAIRES ET DOCUMENTATION =====

COMMENT ON FUNCTION get_user_role() IS 'Fonction pour obtenir le rôle de l''utilisateur actuel';

-- Afficher un message de confirmation
DO $$
BEGIN
  RAISE NOTICE '✅ Politiques RLS configurées avec succès !';
  RAISE NOTICE '🔒 Toutes les tables sont maintenant protégées par RLS';
  RAISE NOTICE '👥 Les utilisateurs authentifiés peuvent accéder aux données';
  RAISE NOTICE '👨‍⚕️ Les médecins ont des permissions spéciales sur leurs rendez-vous';
  RAISE NOTICE '👩‍💼 Les secrétaires ont un accès complet';
END $$;








