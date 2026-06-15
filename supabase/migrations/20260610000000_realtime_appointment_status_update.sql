-- Migration: Mise à jour en temps réel des statuts de rendez-vous passés
-- Cette migration crée une fonction qui s'exécute toutes les heures pour mettre à jour les rendez-vous passés

-- 1. Créer une fonction pour mettre à jour les rendez-vous passés en temps réel
CREATE OR REPLACE FUNCTION public.update_past_appointments_status()
RETURNS TABLE(
  rdv_mis_a_jour INTEGER,
  rdv_absents INTEGER,
  rdv_annules INTEGER
) AS $$
DECLARE
  v_rdv_mis_a_jour INTEGER := 0;
  v_rdv_absents INTEGER := 0;
  v_rdv_annules INTEGER := 0;
BEGIN
  -- Marquer comme "absent" les rendez-vous passés (plus de 1 heure après l'heure prévue)
  -- qui n'ont pas de consultation associée et qui sont encore en statut actif
  UPDATE public.appointments
  SET 
    statut = 'absent',
    traite_automatiquement = TRUE,
    date_traitement_automatique = NOW(),
    updated_at = NOW()
  WHERE 
    statut IN ('confirme', 'en_attente')
    AND date_heure < NOW() - INTERVAL '1 hour'
    AND traite_automatiquement = FALSE
    AND id NOT IN (
      -- Exclure les RDV qui ont une consultation associée
      SELECT DISTINCT appointment_id 
      FROM public.consultations 
      WHERE appointment_id IS NOT NULL
    );
  
  GET DIAGNOSTICS v_rdv_absents = ROW_COUNT;
  v_rdv_mis_a_jour := v_rdv_mis_a_jour + v_rdv_absents;
  
  -- Retourner les statistiques
  RETURN QUERY SELECT 
    v_rdv_mis_a_jour,
    v_rdv_absents,
    v_rdv_annules;
END;
$$ LANGUAGE plpgsql;

-- 2. Créer une fonction pour mettre à jour les rendez-vous passés immédiatement (à la demande)
CREATE OR REPLACE FUNCTION public.update_past_appointments_now()
RETURNS TABLE(
  rdv_mis_a_jour INTEGER,
  rdv_absents INTEGER,
  rdv_annules INTEGER
) AS $$
BEGIN
  -- Appeler la fonction de mise à jour
  RETURN QUERY SELECT * FROM public.update_past_appointments_status();
END;
$$ LANGUAGE plpgsql;

-- 3. Ajouter des commentaires pour documentation
COMMENT ON FUNCTION public.update_past_appointments_status() IS 'Fonction qui met à jour les statuts des rendez-vous passés (plus de 1 heure après l''heure prévue) en les marquant comme absents';
COMMENT ON FUNCTION public.update_past_appointments_now() IS 'Fonction qui met à jour immédiatement les statuts des rendez-vous passés (peut être appelée manuellement ou via un cron job)';

-- 4. Créer une vue pour les rendez-vous passés qui doivent être mis à jour
CREATE OR REPLACE VIEW rendez_vous_passes_a_mettre_a_jour AS
SELECT 
  a.id,
  a.date_heure,
  p.nom as patient_nom,
  p.prenom as patient_prenom,
  u.nom as medecin_nom,
  u.prenom as medecin_prenom,
  a.statut,
  a.motif,
  EXTRACT(EPOCH FROM (NOW() - a.date_heure)) / 3600 as heures_ecoulees,
  CASE 
    WHEN a.date_heure < NOW() - INTERVAL '1 hour' THEN 'a_mettre_a_jour'
    ELSE 'encore_valide'
  END as statut_mise_a_jour
FROM public.appointments a
JOIN public.patients p ON a.patient_id = p.id
JOIN public.users u ON a.medecin_id = u.id
WHERE 
  a.statut IN ('confirme', 'en_attente')
  AND a.traite_automatiquement = FALSE
  AND a.date_heure < NOW() - INTERVAL '1 hour'
ORDER BY a.date_heure ASC;

-- 5. Test: Afficher les rendez-vous qui seraient mis à jour
-- SELECT * FROM rendez_vous_passes_a_mettre_a_jour;
