-- Ajout de la colonne dental_state pour stocker l'état du schéma dentaire
ALTER TABLE consultations 
ADD COLUMN IF NOT EXISTS dental_state jsonb DEFAULT '{}'::jsonb;

COMMENT ON COLUMN consultations.dental_state IS 'Stocke l''état des dents (sain, carie, absent, etc.) au format JSON pour cette consultation.';
