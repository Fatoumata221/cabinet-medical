-- Script de vérification de la structure de la base de données
-- Exécutez ce script dans l'interface Supabase SQL Editor

-- Vérifier toutes les tables existantes
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- Vérifier la structure de la table patients
SELECT 
    'patients' as table_name,
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'patients' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Vérifier la structure de la table users
SELECT 
    'users' as table_name,
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'users' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Vérifier la structure de la table appointments
SELECT 
    'appointments' as table_name,
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'appointments' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Vérifier la structure de la table consultations
SELECT 
    'consultations' as table_name,
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'consultations' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Vérifier la structure de la table invoices
SELECT 
    'invoices' as table_name,
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'invoices' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Vérifier la structure de la table prescriptions
SELECT 
    'prescriptions' as table_name,
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'prescriptions' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Vérifier la structure de la table waiting_queue
SELECT 
    'waiting_queue' as table_name,
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'waiting_queue' 
AND table_schema = 'public'
ORDER BY ordinal_position;
