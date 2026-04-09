-- Script de vérification de la structure de la base de données
-- Basé sur le schéma fourni par l'utilisateur

-- Vérifier que toutes les tables existent
SELECT 
    'Tables existantes' as verification,
    table_name
FROM information_schema.tables 
WHERE table_schema = 'public'
AND table_name IN (
    'appointments',
    'consultations', 
    'invoices',
    'patients',
    'prescriptions',
    'users',
    'waiting_queue'
)
ORDER BY table_name;

-- Vérifier les colonnes de la table patients
SELECT 
    'Colonnes patients' as verification,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'patients' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Vérifier les colonnes de la table users
SELECT 
    'Colonnes users' as verification,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'users' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Vérifier les colonnes de la table appointments
SELECT 
    'Colonnes appointments' as verification,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'appointments' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Vérifier les colonnes de la table consultations
SELECT 
    'Colonnes consultations' as verification,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'consultations' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Vérifier les colonnes de la table invoices
SELECT 
    'Colonnes invoices' as verification,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'invoices' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Vérifier les colonnes de la table prescriptions
SELECT 
    'Colonnes prescriptions' as verification,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'prescriptions' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Vérifier les colonnes de la table waiting_queue
SELECT 
    'Colonnes waiting_queue' as verification,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'waiting_queue' 
AND table_schema = 'public'
ORDER BY ordinal_position;
