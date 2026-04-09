-- Migration: Ajouter specialite_id à la table signes_cliniques
-- Date: 2025-12-28
-- Description: Permet de filtrer les signes cliniques par spécialité du médecin

-- Ajouter la colonne specialite_id à signes_cliniques
ALTER TABLE public.signes_cliniques
ADD COLUMN IF NOT EXISTS specialite_id bigint;

-- Ajouter la contrainte de clé étrangère
ALTER TABLE public.signes_cliniques
ADD CONSTRAINT fk_signes_cliniques_specialite
FOREIGN KEY (specialite_id)
REFERENCES public.specialites(id)
ON DELETE SET NULL;

-- Créer un index pour améliorer les performances des requêtes filtrées
CREATE INDEX IF NOT EXISTS idx_signes_cliniques_specialite ON public.signes_cliniques(specialite_id);

-- Commentaire sur la colonne
COMMENT ON COLUMN public.signes_cliniques.specialite_id IS 'ID de la spécialité associée au signe clinique (NULL = disponible pour toutes les spécialités)';
