-- Script pour restaurer les services avec les colonnes d'audit
-- À exécuter APRÈS avoir ajouté les colonnes d'audit

-- Vérifier que les colonnes d'audit existent
DO $$
BEGIN
    -- Vérifier appointments
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'appointments' 
        AND column_name = 'created_by'
    ) THEN
        RAISE EXCEPTION 'Colonne created_by manquante dans appointments';
    END IF;
    
    -- Vérifier patients
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'patients' 
        AND column_name = 'created_by'
    ) THEN
        RAISE EXCEPTION 'Colonne created_by manquante dans patients';
    END IF;
    
    -- Vérifier waiting_queue
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'waiting_queue' 
        AND column_name = 'added_by'
    ) THEN
        RAISE EXCEPTION 'Colonne added_by manquante dans waiting_queue';
    END IF;
    
    RAISE NOTICE 'Toutes les colonnes d''audit sont présentes';
END $$;

-- Créer une fonction pour obtenir l'ID de l'utilisateur connecté
CREATE OR REPLACE FUNCTION get_current_user_id()
RETURNS uuid AS $$
BEGIN
    RETURN auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Créer des triggers pour automatiquement remplir les colonnes d'audit
-- Trigger pour appointments
CREATE OR REPLACE FUNCTION set_appointments_audit_columns()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        NEW.created_by = get_current_user_id();
        NEW.updated_by = get_current_user_id();
    ELSIF TG_OP = 'UPDATE' THEN
        NEW.updated_by = get_current_user_id();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Supprimer les triggers existants s'ils existent
DROP TRIGGER IF EXISTS trigger_set_appointments_audit ON public.appointments;

-- Créer le trigger pour appointments
CREATE TRIGGER trigger_set_appointments_audit
    BEFORE INSERT OR UPDATE ON public.appointments
    FOR EACH ROW
    EXECUTE FUNCTION set_appointments_audit_columns();

-- Trigger pour patients
CREATE OR REPLACE FUNCTION set_patients_audit_columns()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        NEW.created_by = get_current_user_id();
        NEW.updated_by = get_current_user_id();
    ELSIF TG_OP = 'UPDATE' THEN
        NEW.updated_by = get_current_user_id();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Supprimer les triggers existants s'ils existent
DROP TRIGGER IF EXISTS trigger_set_patients_audit ON public.patients;

-- Créer le trigger pour patients
CREATE TRIGGER trigger_set_patients_audit
    BEFORE INSERT OR UPDATE ON public.patients
    FOR EACH ROW
    EXECUTE FUNCTION set_patients_audit_columns();

-- Trigger pour waiting_queue
CREATE OR REPLACE FUNCTION set_waiting_queue_audit_columns()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        NEW.added_by = get_current_user_id();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Supprimer les triggers existants s'ils existent
DROP TRIGGER IF EXISTS trigger_set_waiting_queue_audit ON public.waiting_queue;

-- Créer le trigger pour waiting_queue
CREATE TRIGGER trigger_set_waiting_queue_audit
    BEFORE INSERT ON public.waiting_queue
    FOR EACH ROW
    EXECUTE FUNCTION set_waiting_queue_audit_columns();

-- Vérifier que tout fonctionne
SELECT 
    'appointments' as table_name,
    COUNT(*) as total_rows,
    COUNT(created_by) as rows_with_created_by,
    COUNT(updated_by) as rows_with_updated_by
FROM public.appointments
UNION ALL
SELECT 
    'patients' as table_name,
    COUNT(*) as total_rows,
    COUNT(created_by) as rows_with_created_by,
    COUNT(updated_by) as rows_with_updated_by
FROM public.patients
UNION ALL
SELECT 
    'waiting_queue' as table_name,
    COUNT(*) as total_rows,
    COUNT(added_by) as rows_with_added_by,
    0 as rows_with_updated_by
FROM public.waiting_queue;







