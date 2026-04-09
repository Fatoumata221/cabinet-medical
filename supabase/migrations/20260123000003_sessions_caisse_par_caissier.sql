-- =====================================================
-- Sessions de caisse isolées par caissier
-- Chaque caissier a sa propre session (ouverte/fermée) par jour.
-- =====================================================

-- 1. Supprimer l'ancienne contrainte "une seule session ouverte par jour" (globale)
DROP INDEX IF EXISTS public.idx_sessions_caisse_unique_ouverte;

-- 2. Nouvelle contrainte : une seule session ouverte par jour ET par caissier
-- Cas caissier_id renseigné : un seul (date_session, caissier_id) ouvert
CREATE UNIQUE INDEX idx_sessions_caisse_unique_ouverte_caissier
ON public.sessions_caisse(date_session, caissier_id)
WHERE statut = 'ouverte' AND caissier_id IS NOT NULL;

-- Cas caissier_id NULL (ex. secrétariat / legacy) : une seule session ouverte par jour
CREATE UNIQUE INDEX idx_sessions_caisse_unique_ouverte_sans_caissier
ON public.sessions_caisse(date_session)
WHERE statut = 'ouverte' AND caissier_id IS NULL;

-- 3. Calcul du montant journalier pour UNE session (paiements du caissier ce jour-là)
CREATE OR REPLACE FUNCTION public.calculer_montant_journalier_session(p_session_id BIGINT)
RETURNS NUMERIC(10,2) AS $$
DECLARE
    v_session RECORD;
    v_total NUMERIC(10,2);
BEGIN
    SELECT date_session, caissier_id INTO v_session
    FROM public.sessions_caisse WHERE id = p_session_id;
    
    IF NOT FOUND THEN
        RETURN 0;
    END IF;
    
    SELECT COALESCE(SUM(montant), 0)
    INTO v_total
    FROM public.paiements
    WHERE DATE(date_paiement) = v_session.date_session
      AND statut = 'effectue'
      AND ( (v_session.caissier_id IS NULL AND paiements.caissier_id IS NULL)
            OR (v_session.caissier_id IS NOT NULL AND paiements.caissier_id = v_session.caissier_id) );
    
    RETURN v_total;
END;
$$ LANGUAGE plpgsql;

-- Conserver l'ancienne signature pour compatibilité (montant global du jour si appelée ailleurs)
CREATE OR REPLACE FUNCTION public.calculer_montant_journalier(p_date_session DATE)
RETURNS NUMERIC(10,2) AS $$
DECLARE
    v_total NUMERIC(10,2);
BEGIN
    SELECT COALESCE(SUM(montant), 0)
    INTO v_total
    FROM public.paiements
    WHERE DATE(date_paiement) = p_date_session
      AND statut = 'effectue';
    RETURN v_total;
END;
$$ LANGUAGE plpgsql;

-- 4. Fermeture de session : utiliser le montant du caissier de cette session
CREATE OR REPLACE FUNCTION public.fermer_session_caisse(p_session_id BIGINT)
RETURNS public.sessions_caisse AS $$
DECLARE
    v_session public.sessions_caisse;
    v_montant_journalier NUMERIC(10,2);
BEGIN
    SELECT * INTO v_session FROM public.sessions_caisse WHERE id = p_session_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Session non trouvée';
    END IF;
    
    IF v_session.statut = 'fermee' THEN
        RAISE EXCEPTION 'Session déjà fermée';
    END IF;
    
    -- Montant journalier pour ce caissier et cette date uniquement
    v_montant_journalier := public.calculer_montant_journalier_session(p_session_id);
    
    UPDATE public.sessions_caisse
    SET 
        heure_fermeture = NOW(),
        montant_journalier = v_montant_journalier,
        statut = 'fermee',
        updated_at = NOW()
    WHERE id = p_session_id
    RETURNING * INTO v_session;
    
    RETURN v_session;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.calculer_montant_journalier_session(BIGINT) IS 'Montant des paiements du jour pour la session (même date et même caissier_id)';
COMMENT ON INDEX public.idx_sessions_caisse_unique_ouverte_caissier IS 'Une seule session ouverte par jour et par caissier';
