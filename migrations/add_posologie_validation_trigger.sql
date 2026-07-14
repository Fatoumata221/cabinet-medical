-- Trigger de validation pour s'assurer que la posologie est renseignée
-- Ce trigger s'exécute avant l'insertion ou la mise à jour dans lignes_ordonnance

CREATE OR REPLACE FUNCTION validate_posologie()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.posologie IS NULL OR TRIM(NEW.posologie) = '' THEN
        RAISE EXCEPTION 'La posologie est obligatoire pour chaque médicament prescrit.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger pour l'insertion
DROP TRIGGER IF EXISTS trigger_validate_posologie_insert ON public.lignes_ordonnance;
CREATE TRIGGER trigger_validate_posologie_insert
    BEFORE INSERT ON public.lignes_ordonnance
    FOR EACH ROW
    EXECUTE FUNCTION validate_posologie();

-- Créer le trigger pour la mise à jour
DROP TRIGGER IF EXISTS trigger_validate_posologie_update ON public.lignes_ordonnance;
CREATE TRIGGER trigger_validate_posologie_update
    BEFORE UPDATE ON public.lignes_ordonnance
    FOR EACH ROW
    EXECUTE FUNCTION validate_posologie();

COMMENT ON FUNCTION validate_posologie() IS 'Valide que la posologie est renseignée avant insertion/mise à jour';
