-- Correction complète du système de notifications
-- Gérer les types de colonnes et les contraintes de clés étrangères

-- 1. Vérifier la structure de la table users
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name = 'id'
AND table_schema = 'public';

-- 2. Vérifier la structure de la table notifications_realtime
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'notifications_realtime' 
AND column_name = 'user_id'
AND table_schema = 'public';

-- 3. Vérifier les contraintes de clés étrangères
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name = 'notifications_realtime';

-- 4. Supprimer temporairement les politiques RLS
DROP POLICY IF EXISTS "Users can view their own realtime notifications" ON public.notifications_realtime;
DROP POLICY IF EXISTS "Users can insert their own realtime notifications" ON public.notifications_realtime;
DROP POLICY IF EXISTS "Users can update their own realtime notifications" ON public.notifications_realtime;

-- 5. Supprimer la contrainte de clé étrangère
ALTER TABLE public.notifications_realtime 
DROP CONSTRAINT IF EXISTS notifications_realtime_user_id_fkey;

-- 6. Modifier le type de la colonne user_id dans notifications_realtime
-- Si users.id est bigint, on garde user_id en bigint
-- Si users.id est uuid, on change user_id en uuid

-- Vérifier d'abord le type de users.id
DO $$
DECLARE
    users_id_type text;
BEGIN
    SELECT data_type INTO users_id_type
    FROM information_schema.columns 
    WHERE table_name = 'users' 
    AND column_name = 'id'
    AND table_schema = 'public';
    
    IF users_id_type = 'uuid' THEN
        -- Si users.id est uuid, changer user_id en uuid
        ALTER TABLE public.notifications_realtime 
        ALTER COLUMN user_id TYPE uuid USING user_id::text::uuid;
        RAISE NOTICE 'Colonne user_id changée en uuid';
    ELSE
        -- Si users.id est bigint, s'assurer que user_id est bigint
        ALTER TABLE public.notifications_realtime 
        ALTER COLUMN user_id TYPE bigint USING user_id::bigint;
        RAISE NOTICE 'Colonne user_id maintenue en bigint';
    END IF;
END $$;

-- 7. Recréer la contrainte de clé étrangère
ALTER TABLE public.notifications_realtime 
ADD CONSTRAINT notifications_realtime_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- 8. Recréer les politiques RLS
CREATE POLICY "Users can view their own realtime notifications" ON public.notifications_realtime
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert their own realtime notifications" ON public.notifications_realtime
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own realtime notifications" ON public.notifications_realtime
    FOR UPDATE USING (auth.uid()::text = user_id::text);

-- 9. Vérification finale
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'notifications_realtime' 
AND column_name = 'user_id'
AND table_schema = 'public';

-- 10. Vérifier que les politiques ont été recréées
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'notifications_realtime';
