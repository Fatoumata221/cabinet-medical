-- Migration: Ajout du suivi du temps de consultation
-- Date: 2025-01-03
-- Description: Ajout des colonnes pour enregistrer l'heure de début et de fin de consultation

-- Ajouter les colonnes si elles n'existent pas déjà
DO $$ 
BEGIN
  -- Colonne heure_debut_consultation
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'consultations' 
    AND column_name = 'heure_debut_consultation'
  ) THEN
    ALTER TABLE public.consultations 
    ADD COLUMN heure_debut_consultation TIMESTAMP WITH TIME ZONE;
  END IF;

  -- Colonne heure_fin_consultation
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'consultations' 
    AND column_name = 'heure_fin_consultation'
  ) THEN
    ALTER TABLE public.consultations 
    ADD COLUMN heure_fin_consultation TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- Commentaires sur les colonnes
COMMENT ON COLUMN public.consultations.heure_debut_consultation IS 'Heure de début de la consultation (enregistrée lors du clic sur "Commencer consultation")';
COMMENT ON COLUMN public.consultations.heure_fin_consultation IS 'Heure de fin de la consultation (enregistrée lors du clic sur "Terminer consultation")';


