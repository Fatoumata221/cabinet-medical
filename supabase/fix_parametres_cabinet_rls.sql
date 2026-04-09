-- Script SQL pour corriger les politiques RLS de parametres_cabinet
-- Permet aux médecins (doctor) et admins de modifier les paramètres
-- À exécuter dans l'éditeur SQL de Supabase

-- ============================================================================
-- CORRECTION DES POLITIQUES RLS
-- ============================================================================

-- Supprimer les anciennes politiques si elles existent
DROP POLICY IF EXISTS "Lecture parametres_cabinet pour utilisateurs authentifiés" ON public.parametres_cabinet;
DROP POLICY IF EXISTS "Modification parametres_cabinet pour admins" ON public.parametres_cabinet;

-- Politique de lecture : tous les utilisateurs authentifiés peuvent lire
CREATE POLICY "Lecture parametres_cabinet pour utilisateurs authentifiés"
    ON public.parametres_cabinet
    FOR SELECT
    USING (auth.role() = 'authenticated');

-- Politique d'écriture : admins et médecins peuvent modifier
CREATE POLICY "Modification parametres_cabinet pour admins et médecins"
    ON public.parametres_cabinet
    FOR ALL
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

-- Commentaire
COMMENT ON POLICY "Modification parametres_cabinet pour admins et médecins" ON public.parametres_cabinet IS 
'Permet aux administrateurs et médecins de modifier les paramètres du cabinet';











