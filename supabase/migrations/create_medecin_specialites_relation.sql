-- Table de relation many-to-many entre médecins et spécialités
-- Permet d'associer plusieurs spécialités à un médecin

CREATE TABLE IF NOT EXISTS public.medecin_specialites (
  id BIGSERIAL PRIMARY KEY,
  medecin_id BIGINT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  specialite_id BIGINT NOT NULL REFERENCES public.specialites(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(medecin_id, specialite_id)
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_medecin_specialites_medecin ON public.medecin_specialites(medecin_id);
CREATE INDEX IF NOT EXISTS idx_medecin_specialites_specialite ON public.medecin_specialites(specialite_id);

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_medecin_specialites_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_medecin_specialites_updated_at
    BEFORE UPDATE ON public.medecin_specialites
    FOR EACH ROW
    EXECUTE FUNCTION update_medecin_specialites_updated_at();

-- Fonction pour récupérer les spécialités d'un médecin
CREATE OR REPLACE FUNCTION get_medecin_specialites(p_medecin_id BIGINT)
RETURNS TABLE (
  specialite_id BIGINT,
  nom VARCHAR,
  description TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.nom,
    s.description
  FROM public.specialites s
  INNER JOIN public.medecin_specialites ms ON s.id = ms.specialite_id
  WHERE ms.medecin_id = p_medecin_id
    AND s.actif = true
  ORDER BY s.nom;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour synchroniser les spécialités d'un médecin
CREATE OR REPLACE FUNCTION sync_medecin_specialites(
  p_medecin_id BIGINT,
  p_specialite_ids BIGINT[]
)
RETURNS VOID AS $$
BEGIN
  -- Supprimer les associations existantes
  DELETE FROM public.medecin_specialites
  WHERE medecin_id = p_medecin_id;
  
  -- Ajouter les nouvelles associations
  IF p_specialite_ids IS NOT NULL AND array_length(p_specialite_ids, 1) > 0 THEN
    INSERT INTO public.medecin_specialites (medecin_id, specialite_id)
    SELECT p_medecin_id, unnest(p_specialite_ids)
    ON CONFLICT (medecin_id, specialite_id) DO NOTHING;
  END IF;
END;
$$ LANGUAGE plpgsql;

