-- Script pour vérifier la structure des tables
-- Exécuter dans l'éditeur SQL de Supabase

-- 1. Vérifier la structure de la table appointments
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'appointments'
ORDER BY ordinal_position;

-- 2. Vérifier si la colonne priorite existe
SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN 'EXISTE'
        ELSE 'N\'EXISTE PAS'
    END as priorite_status
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'appointments'
    AND column_name = 'priorite';

-- 3. Vérifier les colonnes d'audit
SELECT 
    column_name,
    CASE 
        WHEN COUNT(*) > 0 THEN 'PRÉSENTE'
        ELSE 'MANQUANTE'
    END as audit_status
FROM (
    SELECT 'created_by' as column_name
    UNION ALL SELECT 'updated_by'
    UNION ALL SELECT 'added_by'
) required_columns
LEFT JOIN information_schema.columns cols 
    ON cols.column_name = required_columns.column_name
    AND cols.table_schema = 'public' 
    AND cols.table_name = 'appointments'
GROUP BY column_name;

-- 4. Compter les rendez-vous existants
SELECT COUNT(*) as total_appointments FROM public.appointments;

-- 5. Afficher quelques exemples de données
SELECT 
    id,
    patient_id,
    medecin_id,
    date_heure,
    motif,
    statut,
    duree
FROM public.appointments 
LIMIT 5;







