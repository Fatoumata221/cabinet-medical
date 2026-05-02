-- Résolution des doublons de numéros de dossier
-- Ce script identifie et résout les doublons de numéros de dossier

-- ÉTAPE 1: Identifier les doublons
SELECT 
    numero_dossier,
    COUNT(*) as count,
    ARRAY_AGG(id) as patient_ids,
    ARRAY_AGG(nom || ' ' || prenom) as patient_names,
    ARRAY_AGG(created_at) as created_dates
FROM patients
WHERE numero_dossier IS NOT NULL AND numero_dossier != ''
GROUP BY numero_dossier
HAVING COUNT(*) > 1
ORDER BY count DESC;

-- ÉTAPE 2: Résoudre les doublons en régénérant des numéros pour les patients les plus récents
-- On garde le patient le plus ancien avec le numéro existant
-- Et on génère un nouveau numéro pour les patients plus récents

DO $$
DECLARE
    duplicate_record RECORD;
    patient_to_update RECORD;
    new_numero TEXT;
    start_number BIGINT;
BEGIN
    -- Récupérer le dernier numéro de dossier séquentiel
    SELECT COALESCE(MAX(CAST(numero_dossier AS BIGINT)), 0)
    INTO start_number
    FROM patients
    WHERE numero_dossier ~ '^[0-9]+$';
    
    start_number := start_number + 1;
    
    -- Pour chaque doublon
    FOR duplicate_record IN 
        SELECT numero_dossier, ARRAY_AGG(id ORDER BY created_at ASC) as ids
        FROM patients
        WHERE numero_dossier IS NOT NULL AND numero_dossier != ''
        GROUP BY numero_dossier
        HAVING COUNT(*) > 1
    LOOP
        -- Garder le premier patient (le plus ancien) avec le numéro existant
        -- Régénérer un numéro pour les autres patients (les plus récents)
        FOR i IN 2..array_length(duplicate_record.ids, 1) LOOP
            -- Générer un nouveau numéro
            new_numero := LPAD(start_number::TEXT, 6, '0');
            
            -- S'assurer que le numéro n'existe pas déjà
            WHILE EXISTS (SELECT 1 FROM patients WHERE numero_dossier = new_numero) LOOP
                start_number := start_number + 1;
                new_numero := LPAD(start_number::TEXT, 6, '0');
            END LOOP;
            
            -- Mettre à jour le patient
            UPDATE patients 
            SET numero_dossier = new_numero 
            WHERE id = duplicate_record.ids[i];
            
            RAISE NOTICE 'Doublon résolu: Patient % reçoit le nouveau numéro % (ancien: %)', 
                duplicate_record.ids[i], new_numero, duplicate_record.numero_dossier;
            
            start_number := start_number + 1;
        END LOOP;
    END LOOP;
    
    RAISE NOTICE 'Tous les doublons ont été résolus.';
END $$;

-- ÉTAPE 3: Vérifier qu'il n'y a plus de doublons
SELECT 
    numero_dossier,
    COUNT(*) as count
FROM patients
WHERE numero_dossier IS NOT NULL AND numero_dossier != ''
GROUP BY numero_dossier
HAVING COUNT(*) > 1;
