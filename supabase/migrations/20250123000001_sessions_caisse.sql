-- =====================================================
-- SESSIONS CAISSE: Ouverture/Fermeture quotidienne + Arrêté mensuel
-- =====================================================

-- Table sessions_caisse (une session = une journée)
CREATE TABLE IF NOT EXISTS public.sessions_caisse (
    id BIGSERIAL PRIMARY KEY,
    date_session DATE NOT NULL DEFAULT CURRENT_DATE,
    heure_ouverture TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    heure_fermeture TIMESTAMP WITH TIME ZONE,
    fond_caisse NUMERIC(10,2) NOT NULL DEFAULT 0,
    montant_journalier NUMERIC(10,2) DEFAULT 0,
    solde_final NUMERIC(10,2) GENERATED ALWAYS AS (fond_caisse + montant_journalier) STORED,
    caissier_id BIGINT REFERENCES public.users(id) ON DELETE SET NULL,
    notes TEXT,
    statut VARCHAR(50) DEFAULT 'ouverte' CHECK (statut IN ('ouverte', 'fermee')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Contrainte : une seule session ouverte par jour (mais plusieurs fermées possibles)
CREATE UNIQUE INDEX IF NOT EXISTS idx_sessions_caisse_unique_ouverte 
ON public.sessions_caisse(date_session) 
WHERE statut = 'ouverte';

CREATE INDEX IF NOT EXISTS idx_sessions_caisse_date ON public.sessions_caisse(date_session);
CREATE INDEX IF NOT EXISTS idx_sessions_caisse_statut ON public.sessions_caisse(statut);
CREATE INDEX IF NOT EXISTS idx_sessions_caisse_caissier ON public.sessions_caisse(caissier_id);

COMMENT ON TABLE public.sessions_caisse IS 'Sessions d''ouverture/fermeture de caisse quotidiennes';
COMMENT ON COLUMN public.sessions_caisse.fond_caisse IS 'Montant initial mis en caisse le matin';
COMMENT ON COLUMN public.sessions_caisse.montant_journalier IS 'Total des paiements de la journée';
COMMENT ON COLUMN public.sessions_caisse.solde_final IS 'Fond de caisse + montant journalier (calculé automatiquement)';

-- RLS
ALTER TABLE public.sessions_caisse ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Utilisateurs authentifiés peuvent tout faire sur sessions_caisse"
    ON public.sessions_caisse FOR ALL
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- Fonction pour calculer le montant journalier (paiements du jour de la session)
CREATE OR REPLACE FUNCTION calculer_montant_journalier(p_date_session DATE)
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

-- Fonction pour fermer une session (calcule automatiquement le montant journalier)
CREATE OR REPLACE FUNCTION fermer_session_caisse(p_session_id BIGINT)
RETURNS public.sessions_caisse AS $$
DECLARE
    v_session public.sessions_caisse;
    v_montant_journalier NUMERIC(10,2);
BEGIN
    -- Récupérer la session
    SELECT * INTO v_session FROM public.sessions_caisse WHERE id = p_session_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Session non trouvée';
    END IF;
    
    IF v_session.statut = 'fermee' THEN
        RAISE EXCEPTION 'Session déjà fermée';
    END IF;
    
    -- Calculer le montant journalier
    v_montant_journalier := calculer_montant_journalier(v_session.date_session);
    
    -- Fermer la session
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

-- Fonction pour obtenir l'arrêté comptable mensuel
CREATE OR REPLACE FUNCTION get_arrete_comptable_mensuel(p_annee INTEGER, p_mois INTEGER)
RETURNS TABLE (
    date_session DATE,
    fond_caisse NUMERIC(10,2),
    montant_journalier NUMERIC(10,2),
    solde_final NUMERIC(10,2),
    caissier_nom TEXT,
    statut VARCHAR(50)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.date_session,
        s.fond_caisse,
        s.montant_journalier,
        s.solde_final,
        COALESCE(u.prenom || ' ' || u.nom, 'N/A') as caissier_nom,
        s.statut
    FROM public.sessions_caisse s
    LEFT JOIN public.users u ON s.caissier_id = u.id
    WHERE EXTRACT(YEAR FROM s.date_session) = p_annee
      AND EXTRACT(MONTH FROM s.date_session) = p_mois
    ORDER BY s.date_session ASC;
END;
$$ LANGUAGE plpgsql;
