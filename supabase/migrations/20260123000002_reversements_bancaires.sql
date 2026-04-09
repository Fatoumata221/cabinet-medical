-- =====================================================
-- REVERSEMENTS BANCAIRES
-- Enregistrement des versements en banque (caisse -> banque)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.reversements_bancaires (
    id BIGSERIAL PRIMARY KEY,
    date_reversement DATE NOT NULL DEFAULT CURRENT_DATE,
    montant NUMERIC(12,2) NOT NULL CHECK (montant > 0),
    mode VARCHAR(50) DEFAULT 'virement' CHECK (mode IN ('virement', 'depot_especes', 'remise_cheques', 'autre')),
    reference_banque VARCHAR(100),
    banque_nom VARCHAR(255),
    compte_iban VARCHAR(50),
    notes TEXT,
    caissier_id BIGINT REFERENCES public.users(id) ON DELETE SET NULL,
    session_caisse_id BIGINT REFERENCES public.sessions_caisse(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reversements_date ON public.reversements_bancaires(date_reversement);
CREATE INDEX IF NOT EXISTS idx_reversements_caissier ON public.reversements_bancaires(caissier_id);
CREATE INDEX IF NOT EXISTS idx_reversements_session ON public.reversements_bancaires(session_caisse_id);

COMMENT ON TABLE public.reversements_bancaires IS 'Reversements de la caisse vers le compte bancaire du cabinet';

ALTER TABLE public.reversements_bancaires ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage reversements_bancaires"
    ON public.reversements_bancaires FOR ALL
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');
