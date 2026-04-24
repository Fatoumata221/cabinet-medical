-- Script pour créer les paramètres des cabinets avec leurs logos
-- Exécutez ce script dans le dashboard Supabase (SQL Editor)

-- Vérifier d'abord ce qui existe
SELECT id, nom_cabinet, tenant_id, logo_url FROM parametres_cabinet;

-- Vérifier les paramètres de plateforme
SELECT id, configuration FROM parametres_plateforme;

-- Supprimer d'abord les entrées existantes pour ces tenant_id (si elles existent)
DELETE FROM parametres_cabinet WHERE tenant_id = 'd1d62ea1-ca84-4693-ba4d-3d6c67719873';
DELETE FROM parametres_cabinet WHERE tenant_id = 'a9b69401-8d44-4921-9154-81b4135254f4';

-- Cabinet Dentaire Dakar Centre
INSERT INTO parametres_cabinet (
  nom_cabinet,
  adresse,
  ville,
  code_postal,
  pays,
  telephone,
  email,
  logo_url,
  devise,
  fuseau_horaire,
  langue,
  format_date,
  tenant_id,
  created_at,
  updated_at
) VALUES (
  'Cabinet Dentaire Dakar Centre',
  'Adresse à compléter',
  'Dakar',
  'BP',
  'Sénégal',
  '+221 33 000 00 00',
  'contact@cabinet-dakar.sn',
  'https://zddaandjckkbidudduum.supabase.co/storage/v1/object/public/cabinet-assets/Cabinet_Dentaire_Dakar.png',
  'FCFA',
  'Africa/Dakar',
  'fr',
  'DD/MM/YYYY',
  'd1d62ea1-ca84-4693-ba4d-3d6c67719873',
  NOW(),
  NOW()
);

-- Cabinet Dentaire Plateau
INSERT INTO parametres_cabinet (
  nom_cabinet,
  adresse,
  ville,
  code_postal,
  pays,
  telephone,
  email,
  logo_url,
  devise,
  fuseau_horaire,
  langue,
  format_date,
  tenant_id,
  created_at,
  updated_at
) VALUES (
  'Cabinet Dentaire Plateau',
  'Adresse à compléter',
  'Dakar',
  'BP',
  'Sénégal',
  '+221 33 000 00 00',
  'contact@cabinet-plateau.sn',
  'https://zddaandjckkbidudduum.supabase.co/storage/v1/object/public/cabinet-assets/Cabinet_Dentaire_Plateau.png',
  'FCFA',
  'Africa/Dakar',
  'fr',
  'DD/MM/YYYY',
  'a9b69401-8d44-4921-9154-81b4135254f4',
  NOW(),
  NOW()
);

-- Vérifier après insertion
SELECT id, nom_cabinet, tenant_id, logo_url FROM parametres_cabinet;

-- Mettre à jour les paramètres de plateforme pour activer l'affichage du logo sur les documents
UPDATE parametres_plateforme
SET
  configuration = jsonb_set(
    COALESCE(configuration, '{}'::jsonb),
    '{document_afficher_logo}',
    'true'::jsonb
  ),
  configuration = jsonb_set(
    configuration,
    '{document_logo_url}',
    'https://zddaandjckkbidudduum.supabase.co/storage/v1/object/public/cabinet-assets/Cabinet_Dentaire_Dakar.png'::jsonb
  )
WHERE id IS NOT NULL;

-- Vérifier après mise à jour
SELECT id, configuration FROM parametres_plateforme;
