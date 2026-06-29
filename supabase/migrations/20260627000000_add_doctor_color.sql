-- Migration: Ajouter un champ couleur pour les médecins
-- Date: 2026-06-27
-- Description: Ajoute un champ 'couleur' à la table users pour permettre d'attribuer une couleur fixe à chaque médecin

-- Ajouter le champ couleur à la table users
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS couleur VARCHAR(7) DEFAULT NULL;

-- Ajouter un commentaire pour documenter le champ
COMMENT ON COLUMN public.users.couleur IS 'Couleur hexadécimale (ex: #FF0000) pour identifier visuellement le médecin dans le calendrier';

-- Créer une fonction pour attribuer automatiquement une couleur aux médecins existants
CREATE OR REPLACE FUNCTION assign_default_doctor_colors()
RETURNS void AS $$
DECLARE
  doctor_record RECORD;
  color_palette VARCHAR(7)[] := ARRAY['#EF4444', '#F97316', '#22C55E', '#8B5CF6', '#EAB308', '#3B82F6', '#A16207', '#EC4899'];
  color_index INTEGER := 0;
BEGIN
  -- Parcourir tous les médecins sans couleur
  FOR doctor_record IN 
    SELECT id FROM public.users 
    WHERE role = 'doctor' AND (couleur IS NULL OR couleur = '')
    ORDER BY id
  LOOP
    -- Attribuer une couleur cyclique
    UPDATE public.users 
    SET couleur = color_palette[color_index % array_length(color_palette, 1) + 1]
    WHERE id = doctor_record.id;
    
    color_index := color_index + 1;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Exécuter la fonction pour attribuer des couleurs aux médecins existants
SELECT assign_default_doctor_colors();

-- Nettoyer la fonction (optionnel, peut être gardée pour réutilisation)
-- DROP FUNCTION IF EXISTS assign_default_doctor_colors();
