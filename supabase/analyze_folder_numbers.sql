-- Analyse des numéros de dossier des patients
-- Ce script permet de vérifier l'état actuel des numéros de dossier

-- 1. Vérifier le nombre total de patients
SELECT COUNT(*) as total_patients FROM patients;

-- 2. Vérifier le nombre de patients avec un numéro de dossier
SELECT 
    COUNT(*) as patients_with_folder,
    COUNT(*) FILTER (WHERE numero_dossier IS NOT NULL AND numero_dossier != '') as patients_with_numero_dossier
FROM patients;

-- 3. Vérifier les formats de numéros de dossier actuels
SELECT 
    CASE 
        WHEN numero_dossier ~ '^[0-9]{6}$' THEN '6 chiffres (standard)'
        WHEN numero_dossier ~ '^[0-9]{7}$' THEN '7 chiffres'
        WHEN numero_dossier ~ '^[0-9]{8}$' THEN '8 chiffres'
        WHEN numero_dossier ~ '^PAT-[0-9]{8}-[0-9]{4}$' THEN 'Format PAT-YYYYMMDD-HHMM'
        WHEN numero_dossier IS NULL OR numero_dossier = '' THEN 'Vide'
        ELSE 'Autre format'
    END as format,
    COUNT(*) as count
FROM patients
GROUP BY format
ORDER BY count DESC;

-- 4. Identifier les doublons de numéros de dossier
SELECT 
    numero_dossier,
    COUNT(*) as count,
    ARRAY_AGG(id) as patient_ids,
    ARRAY_AGG(nom || ' ' || prenom) as patient_names
FROM patients
WHERE numero_dossier IS NOT NULL AND numero_dossier != ''
GROUP BY numero_dossier
HAVING COUNT(*) > 1
ORDER BY count DESC;

-- 5. Vérifier les patients sans numéro de dossier
SELECT 
    id,
    nom,
    prenom,
    date_naissance,
    created_at
FROM patients
WHERE numero_dossier IS NULL OR numero_dossier = ''
ORDER BY created_at DESC
LIMIT 20;

-- 6. Vérifier le numéro de dossier le plus élevé (pour les formats séquentiels)
SELECT 
    numero_dossier,
    CAST(numero_dossier AS BIGINT) as numero_value
FROM patients
WHERE numero_dossier ~ '^[0-9]+$'
ORDER BY numero_value DESC
LIMIT 10;
