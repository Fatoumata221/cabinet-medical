-- Corriger le type de la colonne user_id dans notifications_realtime
-- Changer de bigint vers uuid pour correspondre aux IDs utilisateur

-- 1. Vérifier le type actuel
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'notifications_realtime' 
AND column_name = 'user_id'
AND table_schema = 'public';

-- 2. Modifier le type de la colonne user_id
ALTER TABLE public.notifications_realtime 
ALTER COLUMN user_id TYPE uuid USING user_id::text::uuid;

-- 3. Vérifier le changement
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'notifications_realtime' 
AND column_name = 'user_id'
AND table_schema = 'public';
