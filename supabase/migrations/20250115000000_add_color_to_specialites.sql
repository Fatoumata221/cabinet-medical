-- Migration: Ajouter le champ color à la table specialites
-- Date: 2025-01-15
-- Objectif: Permettre de définir une couleur personnalisée pour chaque spécialité

-- Vérifier si la colonne couleur existe (ancienne version) et la renommer en color
DO $$ 
BEGIN
  -- Si la colonne couleur existe, la renommer en color
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'specialites' 
    AND column_name = 'couleur'
  ) THEN
    ALTER TABLE public.specialites RENAME COLUMN couleur TO color;
  END IF;
  
  -- Ajouter la colonne color si elle n'existe pas déjà
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'specialites' 
    AND column_name = 'color'
  ) THEN
    ALTER TABLE public.specialites ADD COLUMN color VARCHAR(7) DEFAULT '#3b82f6';
  END IF;
END $$;

-- Mettre à jour les spécialités existantes avec des couleurs par défaut si elles n'en ont pas
UPDATE public.specialites 
SET color = CASE 
  WHEN LOWER(nom) = 'médecine générale' OR LOWER(nom) = 'généraliste' THEN '#3b82f6'  -- Bleu
  WHEN LOWER(nom) = 'cardiologie' THEN '#dc2626'  -- Rouge
  WHEN LOWER(nom) = 'dermatologie' THEN '#f59e0b'  -- Orange
  WHEN LOWER(nom) = 'pédiatrie' THEN '#10b981'  -- Vert
  WHEN LOWER(nom) = 'gynécologie' THEN '#ec4899'  -- Rose
  WHEN LOWER(nom) = 'ophtalmologie' THEN '#06b6d4'  -- Cyan
  WHEN LOWER(nom) = 'orthopédie' THEN '#8b5cf6'  -- Violet
  WHEN LOWER(nom) = 'neurologie' THEN '#6366f1'  -- Indigo
  WHEN LOWER(nom) = 'pneumologie' THEN '#14b8a6'  -- Teal
  WHEN LOWER(nom) = 'endocrinologie' THEN '#f97316'  -- Orange foncé
  WHEN LOWER(nom) = 'gastroentérologie' THEN '#22c55e'  -- Vert foncé
  WHEN LOWER(nom) = 'urologie' THEN '#a855f7'  -- Violet foncé
  WHEN LOWER(nom) = 'oncologie' THEN '#ef4444'  -- Rouge vif
  WHEN LOWER(nom) = 'psychiatrie' THEN '#8b5cf6'  -- Violet
  WHEN LOWER(nom) = 'radiologie' THEN '#06b6d4'  -- Cyan
  WHEN LOWER(nom) = 'chirurgie' THEN '#dc2626'  -- Rouge
  WHEN LOWER(nom) = 'anesthésie' THEN '#64748b'  -- Gris bleu
  WHEN LOWER(nom) LIKE '%urgence%' THEN '#f59e0b'  -- Orange
  WHEN LOWER(nom) LIKE '%travail%' THEN '#10b981'  -- Vert
  ELSE '#3b82f6'  -- Bleu par défaut
END
WHERE color IS NULL OR color = '#3b82f6' OR color = '';

-- Supprimer la fonction existante si elle existe (pour pouvoir changer le type de retour)
DROP FUNCTION IF EXISTS get_medecin_specialites(bigint);

-- Recréer la fonction get_medecin_specialites avec le nouveau type de retour incluant la couleur
CREATE FUNCTION get_medecin_specialites(p_medecin_id BIGINT)
RETURNS TABLE (
  specialite_id BIGINT,
  nom VARCHAR,
  description TEXT,
  color VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.nom,
    s.description,
    s.color
  FROM public.specialites s
  INNER JOIN public.medecin_specialites ms ON s.id = ms.specialite_id
  WHERE ms.medecin_id = p_medecin_id
    AND s.actif = true
  ORDER BY s.nom;
END;
$$ LANGUAGE plpgsql;

