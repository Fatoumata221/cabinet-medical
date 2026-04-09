-- Script pour ajouter la colonne appointment_id manquante à la table waiting_queue
-- Exécuter dans l'éditeur SQL de Supabase

-- 1. Ajouter la colonne appointment_id
ALTER TABLE public.waiting_queue 
ADD COLUMN IF NOT EXISTS appointment_id bigint;

-- 2. Ajouter la contrainte de clé étrangère (avec gestion d'erreur)
DO $$
BEGIN
    -- Vérifier si la contrainte existe déjà
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_waiting_queue_appointment' 
        AND table_name = 'waiting_queue'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.waiting_queue 
        ADD CONSTRAINT fk_waiting_queue_appointment 
        FOREIGN KEY (appointment_id) REFERENCES public.appointments(id) ON DELETE SET NULL;
        RAISE NOTICE '✅ Contrainte fk_waiting_queue_appointment ajoutée';
    ELSE
        RAISE NOTICE '✅ Contrainte fk_waiting_queue_appointment existe déjà';
    END IF;
END $$;

-- 3. Ajouter un index pour les performances
CREATE INDEX IF NOT EXISTS idx_waiting_queue_appointment_id ON public.waiting_queue(appointment_id);

-- 4. Vérifier que la colonne a été ajoutée
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'waiting_queue'
    AND column_name = 'appointment_id';

-- 5. Vérifier la structure complète de la table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'waiting_queue'
ORDER BY ordinal_position;
