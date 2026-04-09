-- Migration: Ajouter consultation_id à notifications_medecin_secretaire
-- Permet de lier directement une notification à une consultation terminée

-- Vérifier si la colonne existe déjà
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'notifications_medecin_secretaire' 
        AND column_name = 'consultation_id'
    ) THEN
        -- Ajouter la colonne consultation_id
        ALTER TABLE public.notifications_medecin_secretaire
        ADD COLUMN consultation_id BIGINT REFERENCES public.consultations(id) ON DELETE SET NULL;
        
        -- Créer un index pour améliorer les performances
        CREATE INDEX IF NOT EXISTS idx_notifications_ms_consultation 
        ON public.notifications_medecin_secretaire(consultation_id);
        
        RAISE NOTICE 'Colonne consultation_id ajoutée à notifications_medecin_secretaire';
    ELSE
        RAISE NOTICE 'Colonne consultation_id existe déjà dans notifications_medecin_secretaire';
    END IF;
END $$;




