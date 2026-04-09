-- =====================================================
-- CAISSE: Table paiements + colonnes factures (type, facture_parent_id)
-- =====================================================

-- 1. Colonnes factures pour facture patient / couverture (assurance, IPM, mutuelle)
ALTER TABLE public.factures ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'patient';
ALTER TABLE public.factures ADD COLUMN IF NOT EXISTS facture_parent_id BIGINT REFERENCES public.factures(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.factures.type IS 'patient = facture principale, couverture = part assurance/IPM/mutuelle';
COMMENT ON COLUMN public.factures.facture_parent_id IS 'Pour type=couverture: référence vers la facture patient';

-- 2. Table paiements (enregistrements à la caisse)
CREATE TABLE IF NOT EXISTS public.paiements (
    id BIGSERIAL PRIMARY KEY,
    facture_id BIGINT NOT NULL REFERENCES public.factures(id) ON DELETE CASCADE,
    montant NUMERIC(10,2) NOT NULL,
    mode_paiement VARCHAR(50) NOT NULL DEFAULT 'especes',
    date_paiement TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    caissier_id BIGINT REFERENCES public.users(id) ON DELETE SET NULL,
    notes TEXT,
    statut VARCHAR(50) DEFAULT 'effectue',
    signature_caissier TEXT,
    signature_patient TEXT,
    signature_couverture TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_paiements_facture ON public.paiements(facture_id);
CREATE INDEX IF NOT EXISTS idx_paiements_date ON public.paiements(date_paiement);
CREATE INDEX IF NOT EXISTS idx_paiements_caissier ON public.paiements(caissier_id);

COMMENT ON TABLE public.paiements IS 'Paiements enregistrés à la caisse';

-- RLS
ALTER TABLE public.paiements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Utilisateurs authentifiés peuvent tout faire sur paiements"
    ON public.paiements FOR ALL
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');
