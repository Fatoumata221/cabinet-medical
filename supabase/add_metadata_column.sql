-- Ajouter la colonne metadata à la table notifications_medecin_secretaire
ALTER TABLE public.notifications_medecin_secretaire 
ADD COLUMN IF NOT EXISTS metadata jsonb;

-- Vérifier que la colonne a été ajoutée
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'notifications_medecin_secretaire' 
AND column_name = 'metadata'
AND table_schema = 'public';
