-- Ajouter la colonne couleur à la table appointments
ALTER TABLE appointments 
ADD COLUMN couleur VARCHAR(7) DEFAULT '#3b82f6';

-- Ajouter un commentaire pour documenter la colonne
COMMENT ON COLUMN appointments.couleur IS 'Couleur personnalisée du rendez-vous (format hexadécimal)';

-- Vérifier que la colonne a été ajoutée
SELECT column_name, data_type, column_default, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'appointments' AND column_name = 'couleur';

