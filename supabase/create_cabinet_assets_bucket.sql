-- Script SQL pour créer le bucket cabinet-assets
-- ⚠️ ATTENTION: Ce script peut nécessiter des permissions élevées
-- Si vous obtenez une erreur de permissions, suivez les instructions ci-dessous

-- ============================================================================
-- MÉTHODE 1: Création via SQL (nécessite des permissions admin)
-- ============================================================================

-- Essayer de créer le bucket (peut échouer si vous n'avez pas les permissions)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'cabinet-assets',
  'cabinet-assets',
  true,  -- Bucket public pour permettre l'accès aux logos
  5242880,  -- Limite de 5MB par fichier
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- MÉTHODE 2: Création via l'interface Supabase (RECOMMANDÉ)
-- ============================================================================
-- 
-- Si le script SQL ci-dessus échoue avec une erreur de permissions,
-- suivez ces étapes pour créer le bucket via l'interface :
--
-- 1. Allez sur https://supabase.com et connectez-vous
-- 2. Ouvrez votre projet
-- 3. Allez dans "Storage" dans le menu de gauche
-- 4. Cliquez sur "New bucket"
-- 5. Configurez le bucket :
--    - Name: cabinet-assets
--    - Public bucket: ✅ Activé (cochez cette case)
--    - File size limit: 5 MB
--    - Allowed MIME types: image/jpeg, image/jpg, image/png, image/gif, image/webp, image/svg+xml
-- 6. Cliquez sur "Create bucket"
--
-- Ensuite, exécutez le script ci-dessous pour créer les politiques RLS
-- (Ces politiques peuvent aussi être créées via l'interface Storage > Policies)

-- ============================================================================
-- POLITIQUES RLS (à exécuter APRÈS la création du bucket)
-- ============================================================================
-- 
-- ⚠️ Ces politiques nécessitent aussi des permissions élevées
-- Si elles échouent, créez-les via l'interface Supabase :
-- Storage > cabinet-assets > Policies > New Policy

-- Supprimer les anciennes politiques si elles existent
DROP POLICY IF EXISTS "Public Access for cabinet-assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload to cabinet-assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update cabinet-assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete cabinet-assets" ON storage.objects;

-- Politique pour permettre la lecture publique des fichiers
CREATE POLICY "Public Access for cabinet-assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'cabinet-assets');

-- Politique pour permettre l'upload aux utilisateurs authentifiés
CREATE POLICY "Authenticated users can upload to cabinet-assets"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'cabinet-assets' 
  AND auth.role() = 'authenticated'
);

-- Politique pour permettre la mise à jour aux utilisateurs authentifiés
CREATE POLICY "Authenticated users can update cabinet-assets"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'cabinet-assets' 
  AND auth.role() = 'authenticated'
);

-- Politique pour permettre la suppression aux utilisateurs authentifiés
CREATE POLICY "Authenticated users can delete cabinet-assets"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'cabinet-assets' 
  AND auth.role() = 'authenticated'
);
