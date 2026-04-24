-- Vérification complète de la configuration des notifications

-- 1. Vérifier les colonnes de la table notifications_medecin_secretaire
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'notifications_medecin_secretaire' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Vérifier les index sur la table
SELECT 
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'notifications_medecin_secretaire'
AND schemaname = 'public';

-- 3. Vérifier les types de notifications existants
SELECT DISTINCT type_notification
FROM notifications_medecin_secretaire
ORDER BY type_notification;

-- 4. Vérifier les notifications par rôle
SELECT 
    COUNT(*) FILTER (WHERE medecin_id IS NOT NULL) as notifications_medecin,
    COUNT(*) FILTER (WHERE secretaire_id IS NOT NULL) as notifications_secretaire,
    COUNT(*) FILTER (WHERE caissier_id IS NOT NULL) as notifications_caissier,
    COUNT(*) FILTER (WHERE tenant_id IS NOT NULL) as notifications_avec_tenant,
    COUNT(*) FILTER (WHERE metadata IS NOT NULL) as notifications_avec_metadata
FROM notifications_medecin_secretaire;
