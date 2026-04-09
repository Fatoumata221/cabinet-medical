-- Script SQL pour corriger la table parametres_cabinet
-- À exécuter dans l'éditeur SQL de Supabase si la table existe déjà
-- 
-- Ce script corrige :
-- 1. La taille du champ logo_url (VARCHAR(500) -> TEXT) pour supporter les images en base64
-- 2. Les politiques RLS pour permettre l'accès correct

-- ============================================================================
-- CORRECTION DU CHAMP logo_url
-- ============================================================================

-- Changer le type de logo_url de VARCHAR(500) à TEXT pour supporter les images en base64
ALTER TABLE IF EXISTS public.parametres_cabinet 
ALTER COLUMN logo_url TYPE TEXT;

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
DROP POLICY IF EXISTS "Modification parametres_cabinet pour admins" ON public.parametres_cabinet;
DROP POLICY IF EXISTS "Modification parametres_cabinet pour admins et médecins" ON public.parametres_cabinet;

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

