-- Correction simple du système de notifications
-- Basé sur la structure actuelle avec politiques RLS en place

-- 1. Vérifier le type actuel de user_id
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'notifications_realtime' 
AND column_name = 'user_id'
AND table_schema = 'public';

-- 2. Supprimer temporairement la contrainte de clé étrangère
ALTER TABLE public.notifications_realtime 
DROP CONSTRAINT IF EXISTS notifications_realtime_user_id_fkey;

-- 3. Supprimer temporairement les politiques RLS
DROP POLICY IF EXISTS "Users can view their own realtime notifications" ON public.notifications_realtime;
DROP POLICY IF EXISTS "Users can insert their own realtime notifications" ON public.notifications_realtime;
DROP POLICY IF EXISTS "Users can update their own realtime notifications" ON public.notifications_realtime;

-- 4. Modifier le type de user_id en uuid
-- (Les politiques utilisent déjà ::text donc ça devrait fonctionner)
ALTER TABLE public.notifications_realtime 
ALTER COLUMN user_id TYPE uuid USING user_id::text::uuid;

-- 5. Recréer la contrainte de clé étrangère
-- (En supposant que users.id est aussi uuid)
ALTER TABLE public.notifications_realtime 
ADD CONSTRAINT notifications_realtime_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- 6. Recréer les politiques RLS (elles utilisent déjà ::text)
CREATE POLICY "Users can view their own realtime notifications" ON public.notifications_realtime
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert their own realtime notifications" ON public.notifications_realtime
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own realtime notifications" ON public.notifications_realtime
    FOR UPDATE USING (auth.uid()::text = user_id::text);

-- 7. Vérification finale
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'notifications_realtime' 
AND column_name = 'user_id'
AND table_schema = 'public';

-- 8. Test de la requête qui causait l'erreur
SELECT COUNT(*) as total_notifications 
FROM public.notifications_realtime 
WHERE user_id = 'e9db3b3a-c67a-48b7-9dbe-f445501e664c';
