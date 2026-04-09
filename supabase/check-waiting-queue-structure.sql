-- Script pour vérifier la structure actuelle de la table waiting_queue
-- Exécuter dans l'éditeur SQL de Supabase

-- 1. Vérifier la structure complète de la table waiting_queue
SELECT 
    'Structure de la table waiting_queue' as info,
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'waiting_queue'
ORDER BY ordinal_position;

-- 2. Vérifier les contraintes de clés étrangères
SELECT 
    'Contraintes de clés étrangères' as info,
    tc.constraint_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_schema = 'public'
    AND tc.table_name = 'waiting_queue';

-- 3. Vérifier les index
SELECT 
    'Index de la table waiting_queue' as info,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public'
    AND tablename = 'waiting_queue';

-- 4. Vérifier quelques données d'exemple
SELECT 
    'Données d\'exemple' as info,
    id,
    patient_id,
    medecin_id,
    status,
    order_position,
    arrived_at,
    created_at
FROM public.waiting_queue 
LIMIT 5;
