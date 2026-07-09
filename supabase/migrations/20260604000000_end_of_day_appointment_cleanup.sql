-- Migration: Nettoyage automatique des rendez-vous en fin de journée
-- Cette migration ajoute les statuts nécessaires et crée une fonction pour le nettoyage automatique

-- 1. Ajouter les nouveaux statuts de rendez-vous
ALTER TABLE public.appointments 
DROP CONSTRAINT IF EXISTS appointments_statut_check;

ALTER TABLE public.appointments 
ADD CONSTRAINT appointments_statut_check 
CHECK (statut IN (
  'confirme',      -- Rendez-vous confirmé (actif)
  'en_attente',    -- En attente de confirmation
  'annule',        -- Annulé par le patient ou le cabinet
  'termine',       -- Consultation terminée normalement
  'absent',        -- Patient absent (non présent)
  'reporte',       -- Rendez-vous reporté (nouveau RDV créé)
  'consulte'       -- Patient consulté (même que termine mais plus explicite)
));

-- 2. Ajouter une colonne pour suivre si un RDV a été traité par le système automatique
ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS traite_automatiquement BOOLEAN DEFAULT FALSE;

ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS date_traitement_automatique TIMESTAMP WITH TIME ZONE;

-- 3. Ajouter une colonne pour lier au rendez-vous original en cas de report
ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS appointment_original_id BIGINT REFERENCES public.appointments(id) ON DELETE SET NULL;

-- 4. Créer la fonction de nettoyage automatique des rendez-vous
CREATE OR REPLACE FUNCTION public.cleanup_appointments_end_of_day()
RETURNS TABLE(
  appointments_traites INTEGER,
  nouveaux_rdv_crees INTEGER,
  rdv_absents INTEGER,
  rdv_reportes INTEGER,
  rdv_annules_auto INTEGER
) AS $$
DECLARE
  v_date_limite TIMESTAMP WITH TIME ZONE;
  v_appointments_traites INTEGER := 0;
  v_nouveaux_rdv_crees INTEGER := 0;
  v_rdv_absents INTEGER := 0;
  v_rdv_reportes INTEGER := 0;
  v_rdv_annules_auto INTEGER := 0;
  v_cabinet_heure_fermeture TIME;
  v_heure_actuelle TIME;
BEGIN
  -- Récupérer l'heure de fermeture du cabinet (défaut: 20:00)
  SELECT COALESCE(heure_fermeture, '20:00'::TIME)
  INTO v_cabinet_heure_fermeture
  FROM public.parametres_cabinet
  LIMIT 1;
  
  v_heure_actuelle := CURRENT_TIME;
  
  -- Définir la date limite: si l'heure actuelle est après la fermeture, traiter les RDV d'aujourd'hui
  -- Sinon, traiter les RDV d'hier
  IF v_heure_actuelle >= v_cabinet_heure_fermeture THEN
    v_date_limite := CURRENT_DATE;
  ELSE
    v_date_limite := CURRENT_DATE - INTERVAL '1 day';
  END IF;
  
  -- Traiter les rendez-vous non consultés avant la date limite
  -- Statuts actifs: confirme, en_attente
  -- Ces RDV doivent être marqués comme absents, annulés ou reportés
  
  -- Par défaut, marquer comme "absent" les RDV confirmés qui n'ont pas eu lieu
  UPDATE public.appointments
  SET 
    statut = 'absent',
    traite_automatiquement = TRUE,
    date_traitement_automatique = NOW(),
    updated_at = NOW()
  WHERE 
    statut IN ('confirme', 'en_attente')
    AND DATE(date_heure) <= v_date_limite
    AND traite_automatiquement = FALSE
    AND id NOT IN (
      -- Exclure les RDV qui ont une consultation associée
      SELECT DISTINCT appointment_id 
      FROM public.consultations 
      WHERE appointment_id IS NOT NULL
    );
  
  GET DIAGNOSTICS v_rdv_absents = ROW_COUNT;
  v_appointments_traites := v_appointments_traites + v_rdv_absents;
  
  -- NOTE: Pour les reports et annulations, une logique plus complexe serait nécessaire
  -- basée sur des préférences patient ou des règles métier spécifiques
  -- Pour l'instant, nous marquons tout comme "absent" par défaut
  
  -- Retourner les statistiques
  RETURN QUERY SELECT 
    v_appointments_traites,
    v_nouveaux_rdv_crees,
    v_rdv_absents,
    v_rdv_reportes,
    v_rdv_annules_auto;
END;
$$ LANGUAGE plpgsql;

-- 5. Créer une fonction pour reporter un rendez-vous (créer un nouveau RDV)
CREATE OR REPLACE FUNCTION public.reporter_rendez_vous(
  p_appointment_id BIGINT,
  p_nouvelle_date TIMESTAMP WITH TIME ZONE,
  p_motif_report TEXT DEFAULT NULL
) RETURNS BIGINT AS $$
DECLARE
  v_appointment RECORD;
  v_nouveau_id BIGINT;
BEGIN
  -- Récupérer les informations du rendez-vous original
  SELECT * INTO v_appointment
  FROM public.appointments
  WHERE id = p_appointment_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Rendez-vous non trouvé';
  END IF;
  
  -- Créer le nouveau rendez-vous
  INSERT INTO public.appointments (
    patient_id,
    medecin_id,
    date_heure,
    motif,
    statut,
    duree,
    priorite,
    appointment_original_id
  ) VALUES (
    v_appointment.patient_id,
    v_appointment.medecin_id,
    p_nouvelle_date,
    COALESCE(p_motif_report, v_appointment.motif || ' (Reporté)'),
    'confirme',
    v_appointment.duree,
    v_appointment.priorite,
    v_appointment.id
  )
  RETURNING id INTO v_nouveau_id;
  
  -- Marquer l'ancien rendez-vous comme reporté
  UPDATE public.appointments
  SET 
    statut = 'reporte',
    traite_automatiquement = TRUE,
    date_traitement_automatique = NOW(),
    updated_at = NOW()
  WHERE id = p_appointment_id;
  
  -- Envoyer une notification au patient (si configuré)
  -- Cette partie peut être étendue avec un système de notification
  
  RETURN v_nouveau_id;
END;
$$ LANGUAGE plpgsql;

-- 6. Créer une fonction pour annuler un rendez-vous
CREATE OR REPLACE FUNCTION public.annuler_rendez_vous(
  p_appointment_id BIGINT,
  p_motif_annulation TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
BEGIN
  -- Mettre à jour le statut du rendez-vous
  UPDATE public.appointments
  SET
    statut = 'annule',
    traite_automatiquement = TRUE,
    date_traitement_automatique = NOW(),
    updated_at = NOW()
  WHERE id = p_appointment_id;

  -- Mettre à jour ou supprimer l'entrée correspondante dans waiting_queue
  UPDATE public.waiting_queue
  SET
    status = 'annule',
    updated_at = NOW()
  WHERE appointment_id = p_appointment_id
  AND status IN ('waiting', 'en_attente', 'present', 'arrive', 'authorized', 'called', 'appele', 'en_route', 'medecin_pret');

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- 7. Créer une fonction pour marquer un rendez-vous comme consulté
CREATE OR REPLACE FUNCTION public.marquer_rdv_consulte(
  p_appointment_id BIGINT
) RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.appointments
  SET 
    statut = 'consulte',
    traite_automatiquement = TRUE,
    date_traitement_automatique = NOW(),
    updated_at = NOW()
  WHERE id = p_appointment_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- 8. Ajouter des commentaires pour documentation
COMMENT ON COLUMN public.appointments.statut IS 'Statut du rendez-vous: confirme, en_attente, annule, termine, absent, reporte, consulte';
COMMENT ON COLUMN public.appointments.traite_automatiquement IS 'Indique si le RDV a été traité automatiquement par le système de nettoyage';
COMMENT ON COLUMN public.appointments.date_traitement_automatique IS 'Date à laquelle le système a traité automatiquement ce RDV';
COMMENT ON COLUMN public.appointments.appointment_original_id IS 'ID du rendez-vous original si celui-ci est un report';

COMMENT ON FUNCTION public.cleanup_appointments_end_of_day() IS 'Fonction exécutée automatiquement en fin de journée pour traiter les RDV non consultés';
COMMENT ON FUNCTION public.reporter_rendez_vous(BIGINT, TIMESTAMP WITH TIME ZONE, TEXT) IS 'Crée un nouveau rendez-vous et marque l''ancien comme reporté';
COMMENT ON FUNCTION public.annuler_rendez_vous(BIGINT, TEXT) IS 'Annule un rendez-vous';
COMMENT ON FUNCTION public.marquer_rdv_consulte(BIGINT) IS 'Marque un rendez-vous comme consulté';

-- 9. Créer une vue pour les rendez-vous à traiter manuellement
CREATE OR REPLACE VIEW rendez_vous_a_traiter AS
SELECT 
  a.id,
  a.date_heure,
  p.nom as patient_nom,
  p.prenom as patient_prenom,
  u.nom as medecin_nom,
  u.prenom as medecin_prenom,
  a.statut,
  a.motif,
  CASE 
    WHEN a.date_heure < CURRENT_DATE THEN 'expire'
    WHEN DATE(a.date_heure) = CURRENT_DATE THEN 'aujourd_hui'
    ELSE 'futur'
  END as urgence
FROM public.appointments a
JOIN public.patients p ON a.patient_id = p.id
JOIN public.users u ON a.medecin_id = u.id
WHERE 
  a.statut IN ('confirme', 'en_attente')
  AND a.traite_automatiquement = FALSE
  AND a.date_heure < CURRENT_DATE
ORDER BY a.date_heure ASC;

-- 10. Vérification: Afficher les rendez-vous qui seraient traités
-- (Commenté par défaut, à décommenter pour tester)
-- SELECT * FROM rendez_vous_a_traiter;
