-- Corriger le type de la colonne user_id dans notifications_realtime
-- Gérer les politiques RLS qui bloquent la modification

-- 1. Vérifier les politiques existantes
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

-- 2. Supprimer temporairement les politiques RLS
DROP POLICY IF EXISTS "Users can view their own realtime notifications" ON public.notifications_realtime;
DROP POLICY IF EXISTS "Users can insert their own realtime notifications" ON public.notifications_realtime;
DROP POLICY IF EXISTS "Users can update their own realtime notifications" ON public.notifications_realtime;

-- 3. Vérifier le type actuel de user_id
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'notifications_realtime' 
AND column_name = 'user_id'
AND table_schema = 'public';

-- 4. Modifier le type de la colonne user_id
ALTER TABLE public.notifications_realtime 
ALTER COLUMN user_id TYPE uuid USING user_id::text::uuid;

-- 5. Vérifier le changement
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'notifications_realtime' 
AND column_name = 'user_id'
AND table_schema = 'public';

-- 6. Recréer les politiques RLS
CREATE POLICY "Users can view their own realtime notifications" ON public.notifications_realtime
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own realtime notifications" ON public.notifications_realtime
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own realtime notifications" ON public.notifications_realtime
    FOR UPDATE USING (auth.uid() = user_id);

-- 7. Vérifier que les politiques ont été recréées
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
