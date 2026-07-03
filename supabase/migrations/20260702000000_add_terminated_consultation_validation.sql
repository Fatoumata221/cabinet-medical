-- Migration: Add validation for terminated consultations
-- Description: Prevent any modifications to consultation data when the consultation status is 'terminee'
-- This ensures data integrity for completed consultations

-- Create a function to check if a consultation is terminated
CREATE OR REPLACE FUNCTION is_consultation_terminated(p_consultation_id BIGINT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM consultations 
    WHERE id = p_consultation_id 
    AND statut = 'terminee'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to raise an error if consultation is terminated
CREATE OR REPLACE FUNCTION check_consultation_not_terminated()
RETURNS TRIGGER AS $$
BEGIN
  IF is_consultation_terminated(NEW.consultation_id) THEN
    RAISE EXCEPTION 'Cette consultation est terminée et ne peut plus être modifiée (consultation_id: %)', NEW.consultation_id
    USING ERRCODE = '23503'; -- Foreign key violation error code
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add triggers to prevent modifications on terminated consultations
-- For constantes_consultation
DROP TRIGGER IF EXISTS check_constantes_consultation_terminated ON constantes_consultation;
CREATE TRIGGER check_constantes_consultation_terminated
  BEFORE INSERT OR UPDATE OR DELETE ON constantes_consultation
  FOR EACH ROW EXECUTE FUNCTION check_consultation_not_terminated();

-- For signes_cliniques_consultation
DROP TRIGGER IF EXISTS check_signes_cliniques_consultation_terminated ON signes_cliniques_consultation;
CREATE TRIGGER check_signes_cliniques_consultation_terminated
  BEFORE INSERT OR UPDATE OR DELETE ON signes_cliniques_consultation
  FOR EACH ROW EXECUTE FUNCTION check_consultation_not_terminated();

-- For diagnostics_consultation
DROP TRIGGER IF EXISTS check_diagnostics_consultation_terminated ON diagnostics_consultation;
CREATE TRIGGER check_diagnostics_consultation_terminated
  BEFORE INSERT OR UPDATE OR DELETE ON diagnostics_consultation
  FOR EACH ROW EXECUTE FUNCTION check_consultation_not_terminated();

-- For actes_consultation
DROP TRIGGER IF EXISTS check_actes_consultation_terminated ON actes_consultation;
CREATE TRIGGER check_actes_consultation_terminated
  BEFORE INSERT OR UPDATE OR DELETE ON actes_consultation
  FOR EACH ROW EXECUTE FUNCTION check_consultation_not_terminated();

-- For examens_appareils
DROP TRIGGER IF EXISTS check_examens_appareils_terminated ON examens_appareils;
CREATE TRIGGER check_examens_appareils_terminated
  BEFORE INSERT OR UPDATE OR DELETE ON examens_appareils
  FOR EACH ROW EXECUTE FUNCTION check_consultation_not_terminated();

-- For syntheses_consultation
DROP TRIGGER IF EXISTS check_syntheses_consultation_terminated ON syntheses_consultation;
CREATE TRIGGER check_syntheses_consultation_terminated
  BEFORE INSERT OR UPDATE OR DELETE ON syntheses_consultation
  FOR EACH ROW EXECUTE FUNCTION check_consultation_not_terminated();

-- For ordonnances (check consultation_id if it exists)
DROP TRIGGER IF EXISTS check_ordonnances_terminated ON ordonnances;
CREATE TRIGGER check_ordonnances_terminated
  BEFORE INSERT OR UPDATE OR DELETE ON ordonnances
  FOR EACH ROW EXECUTE FUNCTION check_consultation_not_terminated();

-- For certificats (check consultation_id if it exists)
DROP TRIGGER IF EXISTS check_certificats_terminated ON certificats;
CREATE TRIGGER check_certificats_terminated
  BEFORE INSERT OR UPDATE OR DELETE ON certificats
  FOR EACH ROW EXECUTE FUNCTION check_consultation_not_terminated();

-- For antecedents_consultation (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'antecedents_consultation') THEN
    DROP TRIGGER IF EXISTS check_antecedents_consultation_terminated ON antecedents_consultation;
    CREATE TRIGGER check_antecedents_consultation_terminated
      BEFORE INSERT OR UPDATE OR DELETE ON antecedents_consultation
      FOR EACH ROW EXECUTE FUNCTION check_consultation_not_terminated();
  END IF;
END $$;

-- Add comment to document the validation
COMMENT ON FUNCTION is_consultation_terminated(BIGINT) IS 'Checks if a consultation has terminated status';
COMMENT ON FUNCTION check_consultation_not_terminated() IS 'Raises exception if consultation is terminated, used in triggers to prevent modifications';
