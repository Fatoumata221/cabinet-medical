-- Migration pour augmenter les limites des colonnes VARCHAR(50) dans les tables de notifications
-- Problème: Les messages de notification dépassent la limite de 50 caractères lors de la création de rendez-vous de suivi

-- Augmenter la limite de la colonne type dans notifications (table principale)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'notifications'
    ) THEN
        -- Vérifier si la colonne type existe
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'notifications' 
            AND column_name = 'type'
        ) THEN
            -- D'abord, supprimer le CHECK constraint restrictif
            ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
            
            -- Ensuite, étendre la colonne
            ALTER TABLE public.notifications ALTER COLUMN type TYPE VARCHAR(100);
            RAISE NOTICE '✅ Colonne type étendue à VARCHAR(100) dans notifications';
        ELSE
            RAISE NOTICE '⚠️ Colonne type non trouvée dans notifications';
        END IF;
    ELSE
        RAISE NOTICE '⚠️ Table notifications non trouvée';
    END IF;
END $$;

-- Augmenter la limite de la colonne titre dans notifications
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'notifications'
    ) THEN
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'notifications' 
            AND column_name = 'titre'
        ) THEN
            ALTER TABLE public.notifications ALTER COLUMN titre TYPE VARCHAR(255);
            RAISE NOTICE '✅ Colonne titre étendue à VARCHAR(255) dans notifications';
        END IF;
    END IF;
END $$;

-- Augmenter la limite de la colonne type_notification dans notifications_consultation
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'notifications_consultation'
    ) THEN
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'notifications_consultation' 
            AND column_name = 'type_notification'
        ) THEN
            ALTER TABLE public.notifications_consultation ALTER COLUMN type_notification TYPE VARCHAR(100);
            RAISE NOTICE '✅ Colonne type_notification étendue à VARCHAR(100) dans notifications_consultation';
        ELSE
            RAISE NOTICE '⚠️ Colonne type_notification non trouvée dans notifications_consultation';
        END IF;
    ELSE
        RAISE NOTICE '⚠️ Table notifications_consultation non trouvée';
    END IF;
END $$;

-- Ajouter des commentaires pour documenter les changements
COMMENT ON COLUMN public.notifications.type IS 'Type de notification (VARCHAR(100))';
COMMENT ON COLUMN public.notifications.titre IS 'Titre de la notification (VARCHAR(255))';
COMMENT ON COLUMN public.notifications_consultation.type_notification IS 'Type de notification (VARCHAR(100))';
