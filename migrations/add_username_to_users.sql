-- Migration: Ajouter la colonne username à la table users
-- Date: 2025-01-XX
-- Description: Remplace la logique de connexion basée sur email par username

-- 1. Ajouter la colonne username (nullable pour permettre la migration des données existantes)
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS username character varying(100) NULL;

-- 2. Créer un index unique sur username (après avoir rempli les données)
-- Note: On ne peut pas créer l'index unique maintenant car username peut être NULL
-- On le créera après avoir rempli les données

-- 3. Fonction pour générer un username à partir de l'email si username est NULL
CREATE OR REPLACE FUNCTION generate_username_from_email()
RETURNS TRIGGER AS $$
BEGIN
  -- Si username est NULL, générer un username à partir de l'email
  IF NEW.username IS NULL OR NEW.username = '' THEN
    -- Extraire la partie avant @ de l'email
    NEW.username := LOWER(SPLIT_PART(NEW.email, '@', 1));
    
    -- Vérifier l'unicité et ajouter un suffixe si nécessaire
    DECLARE
      base_username VARCHAR(100);
      counter INTEGER := 0;
      final_username VARCHAR(100);
    BEGIN
      base_username := NEW.username;
      final_username := base_username;
      
      -- Vérifier si le username existe déjà
      WHILE EXISTS (SELECT 1 FROM public.users WHERE username = final_username AND id != COALESCE(NEW.id, 0)) LOOP
        counter := counter + 1;
        final_username := base_username || counter::TEXT;
      END LOOP;
      
      NEW.username := final_username;
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Créer un trigger pour générer automatiquement le username
DROP TRIGGER IF EXISTS generate_username_trigger ON public.users;
CREATE TRIGGER generate_username_trigger
  BEFORE INSERT OR UPDATE ON public.users
  FOR EACH ROW
  WHEN (NEW.username IS NULL OR NEW.username = '')
  EXECUTE FUNCTION generate_username_from_email();

-- 5. Mettre à jour les utilisateurs existants pour générer leurs usernames
UPDATE public.users 
SET username = LOWER(SPLIT_PART(email, '@', 1))
WHERE username IS NULL OR username = '';

-- 6. Gérer les doublons pour les utilisateurs existants
DO $$
DECLARE
  user_record RECORD;
  base_username VARCHAR(100);
  counter INTEGER;
  final_username VARCHAR(100);
BEGIN
  FOR user_record IN 
    SELECT id, username, email 
    FROM public.users 
    WHERE username IS NOT NULL
    ORDER BY id
  LOOP
    -- Vérifier si le username existe déjà pour un autre utilisateur
    IF EXISTS (
      SELECT 1 
      FROM public.users 
      WHERE username = user_record.username 
      AND id != user_record.id
    ) THEN
      base_username := user_record.username;
      counter := 1;
      final_username := base_username || counter::TEXT;
      
      -- Trouver un username unique
      WHILE EXISTS (
        SELECT 1 
        FROM public.users 
        WHERE username = final_username 
        AND id != user_record.id
      ) LOOP
        counter := counter + 1;
        final_username := base_username || counter::TEXT;
      END LOOP;
      
      -- Mettre à jour avec le username unique
      UPDATE public.users 
      SET username = final_username 
      WHERE id = user_record.id;
    END IF;
  END LOOP;
END $$;

-- 7. Rendre la colonne username NOT NULL après avoir rempli les données
ALTER TABLE public.users 
ALTER COLUMN username SET NOT NULL;

-- 8. Créer l'index unique sur username
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username ON public.users (username);

-- 9. Ajouter une contrainte unique explicite (optionnel, l'index unique suffit)
-- ALTER TABLE public.users ADD CONSTRAINT users_username_key UNIQUE (username);

-- 10. Commentaire sur la colonne
COMMENT ON COLUMN public.users.username IS 'Nom d''utilisateur unique pour la connexion (remplace l''email comme identifiant de connexion)';

