-- Vérifier si la colonne caissier_id existe dans notifications_medecin_secretaire
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'notifications_medecin_secretaire' 
AND table_schema = 'public'
ORDER BY ordinal_position;
