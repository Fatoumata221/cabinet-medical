-- Migration pour augmenter les limites des colonnes VARCHAR(50) dans les tables de notifications
-- Problème: Les messages de notification dépassent la limite de 50 caractères lors de la création de rendez-vous de suivi

-- Augmenter la limite des colonnes dans notifications_medecin_secretaire
ALTER TABLE public.notifications_medecin_secretaire
    ALTER COLUMN message TYPE TEXT,
    ALTER COLUMN titre TYPE VARCHAR(255),
    ALTER COLUMN type_notification TYPE VARCHAR(100);

-- Augmenter la limite des colonnes dans notifications_simple (si elle existe)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'notifications_simple'
    ) THEN
        -- Vérifier et modifier chaque colonne si elle existe
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'notifications_simple' 
            AND column_name = 'message'
        ) THEN
            ALTER TABLE public.notifications_simple ALTER COLUMN message TYPE TEXT;
        END IF;
        
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'notifications_simple' 
            AND column_name = 'titre'
        ) THEN
            ALTER TABLE public.notifications_simple ALTER COLUMN titre TYPE VARCHAR(255);
        END IF;
        
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'notifications_simple' 
            AND column_name = 'type_notification'
        ) THEN
            ALTER TABLE public.notifications_simple ALTER COLUMN type_notification TYPE VARCHAR(100);
        END IF;
    END IF;
END $$;

-- Augmenter la limite des colonnes dans workflow_notifications (si elle existe)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'workflow_notifications'
    ) THEN
        -- Vérifier et modifier chaque colonne si elle existe
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'workflow_notifications' 
            AND column_name = 'message'
        ) THEN
            ALTER TABLE public.workflow_notifications ALTER COLUMN message TYPE TEXT;
        END IF;
        
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'workflow_notifications' 
            AND column_name = 'titre'
        ) THEN
            ALTER TABLE public.workflow_notifications ALTER COLUMN titre TYPE VARCHAR(255);
        END IF;
        
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'workflow_notifications' 
            AND column_name = 'type_notification'
        ) THEN
            ALTER TABLE public.workflow_notifications ALTER COLUMN type_notification TYPE VARCHAR(100);
        END IF;
    END IF;
END $$;

-- Augmenter la limite des colonnes dans notifications_consultation (si elle existe)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'notifications_consultation'
    ) THEN
        -- Vérifier et modifier chaque colonne si elle existe
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'notifications_consultation' 
            AND column_name = 'message'
        ) THEN
            ALTER TABLE public.notifications_consultation ALTER COLUMN message TYPE TEXT;
        END IF;
        
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'notifications_consultation' 
            AND column_name = 'titre'
        ) THEN
            ALTER TABLE public.notifications_consultation ALTER COLUMN titre TYPE VARCHAR(255);
        END IF;
        
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'notifications_consultation' 
            AND column_name = 'type_notification'
        ) THEN
            ALTER TABLE public.notifications_consultation ALTER COLUMN type_notification TYPE VARCHAR(100);
        END IF;
    END IF;
END $$;

-- Augmenter la limite du motif dans appointments et consultations (pour éviter le même problème)
ALTER TABLE public.appointments
    ALTER COLUMN motif TYPE VARCHAR(255);

ALTER TABLE public.consultations
    ALTER COLUMN motif TYPE VARCHAR(255);

-- Ajouter des commentaires pour documenter les changements
COMMENT ON COLUMN public.notifications_medecin_secretaire.message IS 'Message de la notification (TEXT pour supporter les longs messages)';
COMMENT ON COLUMN public.notifications_medecin_secretaire.titre IS 'Titre de la notification (VARCHAR(255))';
COMMENT ON COLUMN public.notifications_medecin_secretaire.type_notification IS 'Type de notification (VARCHAR(100))';

COMMENT ON COLUMN public.appointments.motif IS 'Motif du rendez-vous (VARCHAR(255))';
COMMENT ON COLUMN public.consultations.motif IS 'Motif de la consultation (VARCHAR(255))';
