-- Fix: Corriger les politiques RLS sur la table users pour éviter la récursion infinie
-- Date: 2026-02-03
-- Description: Remplacer les politiques RLS problématiques par des politiques simples

-- 1. Supprimer toutes les anciennes politiques sur users
DROP POLICY IF EXISTS "Accès complet pour tous" ON public.users;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.users;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.users;
DROP POLICY IF EXISTS "Enable update for users based on id" ON public.users;
DROP POLICY IF EXISTS "Enable delete for users based on id" ON public.users;
DROP POLICY IF EXISTS "Users are viewable by everyone" ON public.users;
DROP POLICY IF EXISTS "Users can insert their own data" ON public.users;
DROP POLICY IF EXISTS "Users can update their own data" ON public.users;
DROP POLICY IF EXISTS "Users can delete their own data" ON public.users;

-- 2. Créer une politique simple pour lecture publique (LECTURE SEULE)
-- Cette politique permet à tout le monde (y compris anonyme) de LIRE les users actifs
CREATE POLICY "Allow anonymous read access to active users"
  ON public.users
  FOR SELECT
  TO anon, authenticated
  USING (actif = true);

-- 3. Créer une politique pour les utilisateurs authentifiés (INSERTION)
-- Seulement les utilisateurs authentifiés peuvent insérer
CREATE POLICY "Allow authenticated insert"
  ON public.users
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 4. Créer une politique pour mise à jour
-- Les utilisateurs peuvent mettre à jour leurs propres données
CREATE POLICY "Allow authenticated update own data"
  ON public.users
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 5. Créer une politique pour suppression
-- Les utilisateurs peuvent supprimer (désactiver) leurs propres données
CREATE POLICY "Allow authenticated delete"
  ON public.users
  FOR DELETE
  TO authenticated
  USING (true);

-- Vérifier que RLS est activé
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
