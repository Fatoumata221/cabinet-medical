-- Rendre medecin_id nullable dans notifications_medecin_secretaire
ALTER TABLE public.notifications_medecin_secretaire 
ALTER COLUMN medecin_id DROP NOT NULL;

-- Vérifier que la modification a été appliquée
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'notifications_medecin_secretaire' 
AND column_name = 'medecin_id'
AND table_schema = 'public';
