-- Migration: Ajout de l'acte "Acte non facturé"
-- Date: 2025-01-03
-- Description: Ajout d'un acte avec prix 0 FCFA pour les actes non facturés

-- Vérifier si l'acte n'existe pas déjà avant de l'insérer
INSERT INTO public.types_actes (nom, description, tarif_defaut, specialite_id, duree_estimee, ordre_affichage, actif, created_at, updated_at)
SELECT 
  'Acte non facturé',
  'Acte médical non facturé',
  0.00,
  NULL,
  NULL,
  (SELECT COALESCE(MAX(ordre_affichage), 0) + 1 FROM public.types_actes),
  true,
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM public.types_actes WHERE nom = 'Acte non facturé'
);


