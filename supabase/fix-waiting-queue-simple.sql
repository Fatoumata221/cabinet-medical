-- Script simplifié pour ajouter la colonne appointment_id à waiting_queue
-- Exécuter dans l'éditeur SQL de Supabase

-- 1. Ajouter la colonne appointment_id
ALTER TABLE public.waiting_queue 
ADD COLUMN appointment_id bigint;

-- 2. Ajouter la contrainte de clé étrangère
ALTER TABLE public.waiting_queue 
ADD CONSTRAINT fk_waiting_queue_appointment 
FOREIGN KEY (appointment_id) REFERENCES public.appointments(id) ON DELETE SET NULL;

-- 3. Ajouter un index pour les performances
CREATE INDEX idx_waiting_queue_appointment_id ON public.waiting_queue(appointment_id);

-- 4. Vérifier que tout a été ajouté
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'waiting_queue'
    AND column_name = 'appointment_id';
