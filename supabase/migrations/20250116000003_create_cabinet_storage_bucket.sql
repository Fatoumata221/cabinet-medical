-- Migration: Créer le bucket de stockage pour les assets du cabinet (logo, etc.)
-- Date: 2025-01-16
-- Description: Création d'un bucket public pour stocker les logos et autres assets du cabinet

-- Note: Cette migration nécessite que l'extension storage soit activée dans Supabase
-- Le bucket sera créé via l'interface Supabase ou via une fonction Edge Function

-- Créer une politique RLS pour permettre la lecture publique du bucket
-- (Le bucket lui-même doit être créé via l'interface Supabase Dashboard ou via SQL)

-- Si le bucket n'existe pas, il sera créé automatiquement lors du premier upload
-- via l'interface Supabase Storage

-- Politique pour permettre la lecture publique des fichiers
CREATE POLICY IF NOT EXISTS "Public Access for cabinet-assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'cabinet-assets');

-- Politique pour permettre l'upload aux utilisateurs authentifiés
CREATE POLICY IF NOT EXISTS "Authenticated users can upload to cabinet-assets"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'cabinet-assets' 
  AND auth.role() = 'authenticated'
);

-- Politique pour permettre la mise à jour aux utilisateurs authentifiés
CREATE POLICY IF NOT EXISTS "Authenticated users can update cabinet-assets"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'cabinet-assets' 
  AND auth.role() = 'authenticated'
);

-- Politique pour permettre la suppression aux utilisateurs authentifiés
CREATE POLICY IF NOT EXISTS "Authenticated users can delete cabinet-assets"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'cabinet-assets' 
  AND auth.role() = 'authenticated'
);

-- Commentaire
COMMENT ON POLICY "Public Access for cabinet-assets" ON storage.objects IS 
'Permet la lecture publique des assets du cabinet (logo, etc.)';














