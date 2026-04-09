-- Script pour ajouter les colonnes d'audit manquantes
-- Usage: Exécuter dans l'éditeur SQL de Supabase

-- 1. Ajouter la colonne created_by à la table appointments
ALTER TABLE public.appointments 
ADD COLUMN created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- 2. Ajouter la colonne updated_by à la table appointments
ALTER TABLE public.appointments 
ADD COLUMN updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- 3. Ajouter la colonne created_by à la table patients
ALTER TABLE public.patients 
ADD COLUMN created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- 4. Ajouter la colonne updated_by à la table patients
ALTER TABLE public.patients 
ADD COLUMN updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- 5. Ajouter la colonne added_by à la table waiting_queue
ALTER TABLE public.waiting_queue 
ADD COLUMN added_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- 6. Créer des index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_appointments_created_by ON public.appointments(created_by);
CREATE INDEX IF NOT EXISTS idx_appointments_updated_by ON public.appointments(updated_by);
CREATE INDEX IF NOT EXISTS idx_patients_created_by ON public.patients(created_by);
CREATE INDEX IF NOT EXISTS idx_patients_updated_by ON public.patients(updated_by);
CREATE INDEX IF NOT EXISTS idx_waiting_queue_added_by ON public.waiting_queue(added_by);

-- 7. Mettre à jour les politiques RLS pour inclure les nouvelles colonnes
-- Politique pour les appointments
DROP POLICY IF EXISTS "Users can view appointments" ON public.appointments;
CREATE POLICY "Users can view appointments" ON public.appointments
    FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can insert appointments" ON public.appointments;
CREATE POLICY "Users can insert appointments" ON public.appointments
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can update appointments" ON public.appointments;
CREATE POLICY "Users can update appointments" ON public.appointments
    FOR UPDATE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can delete appointments" ON public.appointments;
CREATE POLICY "Users can delete appointments" ON public.appointments
    FOR DELETE USING (auth.role() = 'authenticated');

-- Politique pour les patients
DROP POLICY IF EXISTS "Users can view patients" ON public.patients;
CREATE POLICY "Users can view patients" ON public.patients
    FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can insert patients" ON public.patients;
CREATE POLICY "Users can insert patients" ON public.patients
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can update patients" ON public.patients;
CREATE POLICY "Users can update patients" ON public.patients
    FOR UPDATE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can delete patients" ON public.patients;
CREATE POLICY "Users can delete patients" ON public.patients
    FOR DELETE USING (auth.role() = 'authenticated');

-- Politique pour la waiting_queue
DROP POLICY IF EXISTS "Users can view waiting_queue" ON public.waiting_queue;
CREATE POLICY "Users can view waiting_queue" ON public.waiting_queue
    FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can insert waiting_queue" ON public.waiting_queue;
CREATE POLICY "Users can insert waiting_queue" ON public.waiting_queue
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can update waiting_queue" ON public.waiting_queue;
CREATE POLICY "Users can update waiting_queue" ON public.waiting_queue
    FOR UPDATE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can delete waiting_queue" ON public.waiting_queue;
CREATE POLICY "Users can delete waiting_queue" ON public.waiting_queue
    FOR DELETE USING (auth.role() = 'authenticated');

-- 8. Vérifier que les colonnes ont été ajoutées
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name IN ('appointments', 'patients', 'waiting_queue')
    AND column_name IN ('created_by', 'updated_by', 'added_by')
ORDER BY table_name, column_name;







