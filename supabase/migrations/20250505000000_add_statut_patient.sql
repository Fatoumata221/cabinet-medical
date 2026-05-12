-- Migration pour ajouter le statut de patient (Actif/Inactif)
-- Permet de gérer automatiquement l'inactivité des patients

-- Ajouter le champ statut_patient à la table patients
ALTER TABLE public.patients 
ADD COLUMN IF NOT EXISTS statut_patient VARCHAR(20) DEFAULT 'actif' 
CHECK (statut_patient IN ('actif', 'inactif'));

-- Ajouter le champ derniere_consultation pour suivre la date de dernière consultation
ALTER TABLE public.patients 
ADD COLUMN IF NOT EXISTS derniere_consultation TIMESTAMP WITH TIME ZONE;

-- Ajouter le champ derniere_activite pour suivre la date de dernière activité (RDV ou consultation)
ALTER TABLE public.patients 
ADD COLUMN IF NOT EXISTS derniere_activite TIMESTAMP WITH TIME ZONE;

-- Créer un index sur statut_patient pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_patients_statut_patient ON public.patients(statut_patient);

-- Créer un index sur derniere_activite pour optimiser les requêtes de recherche d'inactivité
CREATE INDEX IF NOT EXISTS idx_patients_derniere_activite ON public.patients(derniere_activite);

-- Ajouter le paramètre jours_inactivité dans la table paramètres_cabinet
ALTER TABLE public.parametres_cabinet 
ADD COLUMN IF NOT EXISTS jours_inactivite INTEGER DEFAULT 365;

-- Créer une fonction pour mettre à jour la derniere_activite d'un patient
CREATE OR REPLACE FUNCTION update_patient_activity(patient_id BIGINT)
RETURNS VOID AS $$
BEGIN
    UPDATE public.patients 
    SET 
        derniere_activite = NOW(),
        statut_patient = 'actif'
    WHERE id = patient_id;
END;
$$ LANGUAGE plpgsql;

-- Créer une fonction pour marquer les patients inactifs
CREATE OR REPLACE FUNCTION mark_inactive_patients(cabinet_id_param BIGINT DEFAULT NULL)
RETURNS INTEGER AS $$
DECLARE
    jours_inactivite_param INTEGER;
    date_limite TIMESTAMP WITH TIME ZONE;
    patients_updates INTEGER;
BEGIN
    -- Récupérer le paramètre jours_inactivité pour le cabinet
    IF cabinet_id_param IS NOT NULL THEN
        SELECT jours_inactivite INTO jours_inactivite_param
        FROM public.parametres_cabinet
        WHERE id = cabinet_id_param;
    ELSE
        -- Valeur par défaut si pas de cabinet spécifié
        jours_inactivite_param := 365;
    END IF;
    
    -- Calculer la date limite
    date_limite := NOW() - (jours_inactivite_param || ' days')::INTERVAL;
    
    -- Mettre à jour les patients inactifs
    UPDATE public.patients
    SET 
        statut_patient = 'inactif'
    WHERE 
        statut_patient = 'actif'
        AND (derniere_activite IS NULL OR derniere_activite < date_limite)
        AND id IN (
            SELECT DISTINCT patient_id 
            FROM public.consultations 
            WHERE date_consultation < date_limite
        );
    
    GET DIAGNOSTICS patients_updates = ROW_COUNT;
    
    RETURN patients_updates;
END;
$$ LANGUAGE plpgsql;

-- Créer un trigger pour mettre à jour derniere_activite automatiquement lors d'une consultation
CREATE OR REPLACE FUNCTION trigger_update_patient_activity_consultation()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM update_patient_activity(NEW.patient_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger sur la table consultations
DROP TRIGGER IF EXISTS tr_update_patient_activity_consultation ON public.consultations;
CREATE TRIGGER tr_update_patient_activity_consultation
    AFTER INSERT OR UPDATE ON public.consultations
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_patient_activity_consultation();

-- Créer un trigger pour mettre à jour derniere_activite automatiquement lors d'un rendez-vous
CREATE OR REPLACE FUNCTION trigger_update_patient_activity_appointment()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM update_patient_activity(NEW.patient_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger sur la table appointments
DROP TRIGGER IF EXISTS tr_update_patient_activity_appointment ON public.appointments;
CREATE TRIGGER tr_update_patient_activity_appointment
    AFTER INSERT OR UPDATE ON public.appointments
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_patient_activity_appointment();

-- Commentaires pour documentation
COMMENT ON COLUMN public.patients.statut_patient IS 'Statut du patient: actif ou inactif. Mis à jour automatiquement par le système.';
COMMENT ON COLUMN public.patients.derniere_consultation IS 'Date de la dernière consultation du patient';
COMMENT ON COLUMN public.patients.derniere_activite IS 'Date de la dernière activité (RDV ou consultation)';
COMMENT ON COLUMN public.parametres_cabinet.jours_inactivite IS 'Nombre de jours sans activité avant de marquer un patient comme inactif (défaut: 365)';
COMMENT ON FUNCTION update_patient_activity(BIGINT) IS 'Met à jour la date de dernière activité et réactive un patient';
COMMENT ON FUNCTION mark_inactive_patients(BIGINT) IS 'Marque les patients inactifs selon le paramètre jours_inactivite';
