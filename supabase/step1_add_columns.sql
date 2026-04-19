-- ÉTAPE 1 : Ajouter la colonne cabinet_id aux tables principales
-- Exécutez CE SCRIPT EN PREMIER, puis le script de backfill après

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS cabinet_id bigint;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS cabinet_id bigint;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS cabinet_id bigint;
ALTER TABLE public.consultations ADD COLUMN IF NOT EXISTS cabinet_id bigint;
ALTER TABLE public.waiting_queue ADD COLUMN IF NOT EXISTS cabinet_id bigint;
ALTER TABLE public.notifications_medecin_secretaire ADD COLUMN IF NOT EXISTS cabinet_id bigint;
ALTER TABLE public.factures ADD COLUMN IF NOT EXISTS cabinet_id bigint;
ALTER TABLE public.ordonnances ADD COLUMN IF NOT EXISTS cabinet_id bigint;
ALTER TABLE public.specialites ADD COLUMN IF NOT EXISTS cabinet_id bigint;

CREATE INDEX IF NOT EXISTS idx_users_cabinet_id ON public.users(cabinet_id);
CREATE INDEX IF NOT EXISTS idx_patients_cabinet_id ON public.patients(cabinet_id);
CREATE INDEX IF NOT EXISTS idx_appointments_cabinet_id ON public.appointments(cabinet_id);
