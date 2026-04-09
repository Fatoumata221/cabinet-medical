-- Migration pour ajouter le champ mode_specialite_id à parametres_cabinet
-- Date: 2025-01-17
-- Description: Permet de configurer le mode spécialité du cabinet via edge function

-- Ajouter la colonne mode_specialite_id
ALTER TABLE public.parametres_cabinet
ADD COLUMN IF NOT EXISTS mode_specialite_id BIGINT;

-- Ajouter la contrainte de clé étrangère
ALTER TABLE public.parametres_cabinet
ADD CONSTRAINT IF NOT EXISTS parametres_cabinet_mode_specialite_id_fkey 
FOREIGN KEY (mode_specialite_id) REFERENCES public.specialites(id) ON DELETE SET NULL;

-- Créer un index pour améliorer les performances des requêtes
CREATE INDEX IF NOT EXISTS idx_parametres_cabinet_mode_specialite_id 
ON public.parametres_cabinet(mode_specialite_id);

-- Commentaire sur la colonne
COMMENT ON COLUMN public.parametres_cabinet.mode_specialite_id IS 
'Spécialité configurée pour le mode spécialité du cabinet. NULL = mode généraliste (toutes les spécialités). Configuré via edge function configure-speciality.';











