-- Migration pour corriger les politiques RLS de la table notifications_realtime
-- Le problème : auth.uid() est un UUID mais user_id est un bigint (ID de profil)

-- ===== SUPPRESSION DES ANCIENNES POLITIQUES =====

DROP POLICY IF EXISTS "Users can view their own realtime notifications" ON public.notifications_realtime;
DROP POLICY IF EXISTS "Users can update their own realtime notifications" ON public.notifications_realtime;
DROP POLICY IF EXISTS "Users can insert their own realtime notifications" ON public.notifications_realtime;

-- ===== NOUVELLES POLITIQUES RLS CORRECTES =====

-- Les utilisateurs peuvent voir leurs propres notifications
-- On utilise une fonction pour convertir l'UUID auth vers l'ID de profil
CREATE POLICY "Users can view their own realtime notifications" ON public.notifications_realtime
  FOR SELECT USING (
    user_id = (
      SELECT id FROM public.users 
      WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

-- Les utilisateurs peuvent mettre à jour leurs propres notifications
CREATE POLICY "Users can update their own realtime notifications" ON public.notifications_realtime
  FOR UPDATE USING (
    user_id = (
      SELECT id FROM public.users 
      WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

-- Les utilisateurs peuvent insérer des notifications pour eux-mêmes
CREATE POLICY "Users can insert their own realtime notifications" ON public.notifications_realtime
  FOR INSERT WITH CHECK (
    user_id = (
      SELECT id FROM public.users 
      WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

-- Les utilisateurs peuvent supprimer leurs propres notifications
CREATE POLICY "Users can delete their own realtime notifications" ON public.notifications_realtime
  FOR DELETE USING (
    user_id = (
      SELECT id FROM public.users 
      WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

-- ===== POLITIQUES POUR LES ADMINISTRATEURS =====

-- Les administrateurs peuvent voir toutes les notifications
CREATE POLICY "Admins can view all realtime notifications" ON public.notifications_realtime
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
      AND role = 'admin'
    )
  );

-- Les administrateurs peuvent insérer des notifications pour n'importe qui
CREATE POLICY "Admins can insert realtime notifications" ON public.notifications_realtime
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
      AND role = 'admin'
    )
  );

-- ===== COMMENTAIRES =====

COMMENT ON POLICY "Users can view their own realtime notifications" ON public.notifications_realtime IS 'Permet aux utilisateurs de voir leurs propres notifications temps réel';
COMMENT ON POLICY "Users can update their own realtime notifications" ON public.notifications_realtime IS 'Permet aux utilisateurs de marquer leurs notifications comme lues';
COMMENT ON POLICY "Users can insert their own realtime notifications" ON public.notifications_realtime IS 'Permet aux utilisateurs d\'insérer des notifications pour eux-mêmes';
COMMENT ON POLICY "Users can delete their own realtime notifications" ON public.notifications_realtime IS 'Permet aux utilisateurs de supprimer leurs propres notifications';
COMMENT ON POLICY "Admins can view all realtime notifications" ON public.notifications_realtime IS 'Permet aux administrateurs de voir toutes les notifications';
COMMENT ON POLICY "Admins can insert realtime notifications" ON public.notifications_realtime IS 'Permet aux administrateurs d\'insérer des notifications pour n\'importe qui';


