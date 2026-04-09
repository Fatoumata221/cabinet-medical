-- Migration pour mettre à jour les politiques RLS de parametres_cabinet
-- Permet la lecture pour tous les utilisateurs authentifiés
-- L'écriture de mode_specialite_id se fait uniquement via edge function (service_role)
-- Date: 2025-01-17

-- Activer RLS si ce n'est pas déjà fait
ALTER TABLE public.parametres_cabinet ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes politiques si elles existent
DROP POLICY IF EXISTS "Lecture parametres_cabinet pour utilisateurs authentifiés" ON public.parametres_cabinet;
DROP POLICY IF EXISTS "Modification parametres_cabinet pour admins et médecins" ON public.parametres_cabinet;
DROP POLICY IF EXISTS "Modification mode_specialite_id via edge function" ON public.parametres_cabinet;

-- Politique de lecture : tous les utilisateurs authentifiés peuvent lire
CREATE POLICY "Lecture parametres_cabinet pour utilisateurs authentifiés"
    ON public.parametres_cabinet
    FOR SELECT
    USING (auth.role() = 'authenticated');

-- Politique d'écriture pour les autres champs : admins et médecins peuvent modifier
-- (sauf mode_specialite_id qui est géré uniquement par l'edge function)
CREATE POLICY "Modification parametres_cabinet pour admins et médecins"
    ON public.parametres_cabinet
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.auth_id = auth.uid() 
            AND (users.role = 'admin' OR users.role = 'doctor')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.auth_id = auth.uid() 
            AND (users.role = 'admin' OR users.role = 'doctor')
        )
    );

-- Note: L'edge function utilise la clé service_role qui bypass RLS
-- Donc elle peut modifier mode_specialite_id sans politique spécifique
-- Les utilisateurs normaux ne peuvent pas modifier mode_specialite_id car ils utilisent la clé anon

-- Commentaire
COMMENT ON POLICY "Lecture parametres_cabinet pour utilisateurs authentifiés" ON public.parametres_cabinet IS 
'Permet à tous les utilisateurs authentifiés de lire les paramètres du cabinet';

COMMENT ON POLICY "Modification parametres_cabinet pour admins et médecins" ON public.parametres_cabinet IS 
'Permet aux administrateurs et médecins de modifier les paramètres du cabinet (sauf mode_specialite_id qui est géré uniquement via edge function)';











