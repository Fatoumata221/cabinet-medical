-- Migration pour ajouter les champs dentaires à la table actes_consultation
-- Permet de lier les actes à des dents spécifiques pour le module dentaire

-- Ajouter les colonnes dent_id et dent_nom si elles n'existent pas déjà
ALTER TABLE public.actes_consultation
    ADD COLUMN IF NOT EXISTS dent_id VARCHAR(10),
    ADD COLUMN IF NOT EXISTS dent_nom VARCHAR(100);

-- Ajouter un commentaire pour documenter l'utilisation
COMMENT ON COLUMN public.actes_consultation.dent_id IS 'Identifiant de la dent concernée (ex: 11, 18, 21-28, etc.) pour les consultations dentaires';
COMMENT ON COLUMN public.actes_consultation.dent_nom IS 'Nom de la dent concernée (ex: Incisive centrale, Molaire, etc.) pour les consultations dentaires';

-- Créer un index pour optimiser les requêtes par dent
CREATE INDEX IF NOT EXISTS idx_actes_consultation_dent_id ON public.actes_consultation(dent_id);
CREATE INDEX IF NOT EXISTS idx_actes_consultation_consultation_dent ON public.actes_consultation(consultation_id, dent_id);
