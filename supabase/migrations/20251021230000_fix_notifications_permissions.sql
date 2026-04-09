-- Migration pour corriger les permissions de notifications_realtime

-- 1. Désactiver le RLS si actif
ALTER TABLE public.notifications_realtime DISABLE ROW LEVEL SECURITY;

-- 2. Supprimer les politiques existantes pour éviter tout conflit
DROP POLICY IF EXISTS "Users can view their own realtime notifications" ON public.notifications_realtime;
DROP POLICY IF EXISTS "Users can update their own realtime notifications" ON public.notifications_realtime;
DROP POLICY IF EXISTS "Users can insert their own realtime notifications" ON public.notifications_realtime;
DROP POLICY IF EXISTS "Users can delete their own realtime notifications" ON public.notifications_realtime;
DROP POLICY IF EXISTS "Admins can view all realtime notifications" ON public.notifications_realtime;
DROP POLICY IF EXISTS "Admins can insert realtime notifications" ON public.notifications_realtime;

-- 3. Accorder les permissions nécessaires
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.notifications_realtime TO authenticated;

-- 4. Vérification (commentaire pour l'historique)
COMMENT ON TABLE public.notifications_realtime IS 'Permissions corrigées le 21/10/2025 - Accès complet pour authenticated';
