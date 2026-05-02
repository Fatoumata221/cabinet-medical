-- Uniformisation des numéros de dossier des patients
-- Ce script permet d'uniformiser tous les numéros de dossier au format séquentiel XXXXXX

-- ATTENTION: Ce script doit être exécuté avec précaution
-- Il est recommandé de faire une sauvegarde de la base de données avant l'exécution

-- ÉTAPE 1: Nettoyer les numéros de dossier vides ou NULL
-- On ne fait rien pour l'instant, on les laissera NULL

-- ÉTAPE 2: Convertir les numéros de dossier au format PAT-YYYYMMDD-HHMM en format séquentiel
-- On va supprimer ces numéros et les régénérer avec le format standard

-- D'abord, sauvegarder les anciens numéros dans une colonne temporaire
ALTER TABLE patients ADD COLUMN IF NOT EXISTS old_numero_dossier TEXT;

UPDATE patients 
SET old_numero_dossier = numero_dossier
WHERE numero_dossier ~ '^PAT-';

-- Supprimer les numéros au format PAT-
UPDATE patients 
SET numero_dossier = NULL
WHERE numero_dossier ~ '^PAT-';

-- ÉTAPE 2.5: Supprimer temporairement la contrainte d'unicité si elle existe
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'patients_numero_dossier_unique' 
        AND conrelid = 'patients'::regclass
    ) THEN
        ALTER TABLE patients DROP CONSTRAINT patients_numero_dossier_unique;
        RAISE NOTICE 'Contrainte d''unicité supprimée temporairement.';
    END IF;
    
    -- Vérifier aussi la contrainte patients_numero_dossier_key
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'patients_numero_dossier_key' 
        AND conrelid = 'patients'::regclass
    ) THEN
        ALTER TABLE patients DROP CONSTRAINT patients_numero_dossier_key;
        RAISE NOTICE 'Contrainte patients_numero_dossier_key supprimée temporairement.';
    END IF;
END $$;

-- ÉTAPE 3: Générer des numéros de dossier séquentiels pour tous les patients sans numéro
-- On va utiliser une fonction pour générer les numéros manquants

-- Créer une fonction pour générer le prochain numéro de dossier
CREATE OR REPLACE FUNCTION get_next_folder_number()
RETURNS TEXT AS $$
DECLARE
    next_number BIGINT;
    padded_number TEXT;
BEGIN
    -- Récupérer le dernier numéro de dossier séquentiel
    SELECT COALESCE(MAX(CAST(numero_dossier AS BIGINT)), 0) + 1
    INTO next_number
    FROM patients
    WHERE numero_dossier ~ '^[0-9]+$';
    
    -- Déterminer le padding (6, 7 ou 8 chiffres)
    IF next_number <= 999999 THEN
        padded_number := LPAD(next_number::TEXT, 6, '0');
    ELSIF next_number <= 9999999 THEN
        padded_number := LPAD(next_number::TEXT, 7, '0');
    ELSE
        padded_number := LPAD(next_number::TEXT, 8, '0');
    END IF;
    
    RETURN padded_number;
END;
$$ LANGUAGE plpgsql;

-- Générer les numéros de dossier pour les patients sans numéro
-- APPROCHE OPTIMISÉE: Utiliser UPDATE en lot avec génération de numéros séquentiels
-- TRAITER PAR LOTS DE 500 PATIENTS POUR ÉVITER LE TIMEOUT
DO $$
DECLARE
    start_number BIGINT;
    end_number BIGINT;
    batch_size INTEGER := 500;
    padded_number TEXT;
    padding INTEGER;
BEGIN
    -- Récupérer le dernier numéro de dossier séquentiel
    SELECT COALESCE(MAX(CAST(numero_dossier AS BIGINT)), 0)
    INTO start_number
    FROM patients
    WHERE numero_dossier ~ '^[0-9]+$';
    
    start_number := start_number + 1;
    end_number := start_number + batch_size - 1;
    
    -- Déterminer le padding
    IF end_number <= 999999 THEN
        padding := 6;
    ELSIF end_number <= 9999999 THEN
        padding := 7;
    ELSE
        padding := 8;
    END IF;
    
    -- Générer les numéros en lot avec UPDATE direct
    -- Utiliser une CTE pour générer les numéros séquentiels
    WITH patients_to_update AS (
        SELECT id, 
               ROW_NUMBER() OVER (ORDER BY created_at ASC) as rn
        FROM patients
        WHERE numero_dossier IS NULL OR numero_dossier = ''
        LIMIT batch_size
    )
    UPDATE patients p
    SET numero_dossier = LPAD((start_number + ptu.rn - 1)::TEXT, padding, '0')
    FROM patients_to_update ptu
    WHERE p.id = ptu.id;
    
    RAISE NOTICE 'Lot de patients traité: numéros de % à % (padding: % chiffres)', 
        start_number, end_number, padding;
END $$;

-- ÉTAPE 4: Ajouter une contrainte d'unicité sur numero_dossier
-- D'abord, s'assurer qu'il n'y a plus de doublons
-- Si des doublons existent, ils doivent être résolus manuellement avant d'ajouter la contrainte

-- Vérifier s'il y a encore des doublons
DO $$
DECLARE
    duplicate_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO duplicate_count
    FROM (
        SELECT numero_dossier, COUNT(*) 
        FROM patients 
        WHERE numero_dossier IS NOT NULL AND numero_dossier != ''
        GROUP BY numero_dossier 
        HAVING COUNT(*) > 1
    ) duplicates;
    
    IF duplicate_count > 0 THEN
        RAISE EXCEPTION 'Il y a encore % doublons de numéros de dossier. Veuillez les résoudre avant d''ajouter la contrainte d''unicité.', duplicate_count;
    ELSE
        RAISE NOTICE 'Aucun doublon détecté. Prêt à ajouter la contrainte d''unicité.';
    END IF;
END $$;

-- Ajouter la contrainte d'unicité
ALTER TABLE patients 
ADD CONSTRAINT patients_numero_dossier_unique 
UNIQUE (numero_dossier);

-- ÉTAPE 5: Nettoyer la colonne temporaire (optionnel)
-- Décommenter pour supprimer la colonne old_numero_dossier après vérification
-- ALTER TABLE patients DROP COLUMN IF EXISTS old_numero_dossier;

-- ÉTAPE 6: Vérification finale
SELECT 
    COUNT(*) as total_patients,
    COUNT(*) FILTER (WHERE numero_dossier IS NOT NULL AND numero_dossier != '') as patients_with_numero_dossier,
    COUNT(*) FILTER (WHERE numero_dossier IS NULL OR numero_dossier = '') as patients_without_numero_dossier
FROM patients;

-- Vérifier s'il y a des doublons après l'uniformisation
SELECT 
    numero_dossier,
    COUNT(*) as count
FROM patients
WHERE numero_dossier IS NOT NULL AND numero_dossier != ''
GROUP BY numero_dossier
HAVING COUNT(*) > 1;
