-- ÉTAPE 2 : Backfill cabinet_id (SQL pur, sans PL/pgSQL)
-- Exécutez APRÈS step1_add_columns.sql

UPDATE public.users 
SET cabinet_id = (SELECT id FROM public.parametres_cabinet LIMIT 1) 
WHERE cabinet_id IS NULL;

UPDATE public.patients 
SET cabinet_id = (SELECT id FROM public.parametres_cabinet LIMIT 1) 
WHERE cabinet_id IS NULL;

UPDATE public.appointments 
SET cabinet_id = (SELECT id FROM public.parametres_cabinet LIMIT 1) 
WHERE cabinet_id IS NULL;

UPDATE public.consultations 
SET cabinet_id = (SELECT id FROM public.parametres_cabinet LIMIT 1) 
WHERE cabinet_id IS NULL;

UPDATE public.waiting_queue 
SET cabinet_id = (SELECT id FROM public.parametres_cabinet LIMIT 1) 
WHERE cabinet_id IS NULL;

UPDATE public.notifications_medecin_secretaire 
SET cabinet_id = (SELECT id FROM public.parametres_cabinet LIMIT 1) 
WHERE cabinet_id IS NULL;

UPDATE public.factures 
SET cabinet_id = (SELECT id FROM public.parametres_cabinet LIMIT 1) 
WHERE cabinet_id IS NULL;

UPDATE public.ordonnances 
SET cabinet_id = (SELECT id FROM public.parametres_cabinet LIMIT 1) 
WHERE cabinet_id IS NULL;

UPDATE public.specialites 
SET cabinet_id = (SELECT id FROM public.parametres_cabinet LIMIT 1) 
WHERE cabinet_id IS NULL;

-- Vérification
SELECT 'users' AS t, COUNT(*) AS sans_cabinet FROM public.users WHERE cabinet_id IS NULL
UNION ALL SELECT 'patients', COUNT(*) FROM public.patients WHERE cabinet_id IS NULL
UNION ALL SELECT 'specialites', COUNT(*) FROM public.specialites WHERE cabinet_id IS NULL;
