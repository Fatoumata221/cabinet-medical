-- Migration: Créer le bucket de stockage pour les photos de profil
-- Date: 2025-01-16
-- Description: Création d'un bucket public pour stocker les photos de profil des utilisateurs

-- Note: Cette migration nécessite que l'extension storage soit activée dans Supabase
-- Le bucket sera créé via l'interface Supabase ou via une fonction Edge Function

-- Politique pour permettre la lecture publique des fichiers
CREATE POLICY IF NOT EXISTS "Public Access for profiles"
ON storage.objects FOR SELECT
USING (bucket_id = 'profiles');

-- Politique pour permettre l'upload aux utilisateurs authentifiés
CREATE POLICY IF NOT EXISTS "Authenticated users can upload to profiles"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'profiles' 
  AND auth.role() = 'authenticated'
);

-- Politique pour permettre la mise à jour aux utilisateurs authentifiés (seulement leurs propres fichiers)
CREATE POLICY IF NOT EXISTS "Users can update own profile photos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'profiles' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Politique pour permettre la suppression aux utilisateurs authentifiés (seulement leurs propres fichiers)
CREATE POLICY IF NOT EXISTS "Users can delete own profile photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'profiles' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Commentaire
COMMENT ON POLICY "Public Access for profiles" ON storage.objects IS 
'Permet la lecture publique des photos de profil des utilisateurs';














