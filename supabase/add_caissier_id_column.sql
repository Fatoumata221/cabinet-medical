-- Ajouter la colonne caissier_id à la table notifications_medecin_secretaire
ALTER TABLE public.notifications_medecin_secretaire 
ADD COLUMN IF NOT EXISTS caissier_id bigint;

-- Ajouter un index sur caissier_id pour les performances
CREATE INDEX IF NOT EXISTS idx_notifications_medecin_secretaire_caissier_id 
ON public.notifications_medecin_secretaire(caissier_id);

-- Vérifier que la colonne a été ajoutée
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'notifications_medecin_secretaire' 
AND column_name = 'caissier_id'
AND table_schema = 'public';
