-- À exécuter dans Supabase > SQL Editor (tout en une fois)
-- 1) Supprimer la contrainte  2) Remplacer cashier par caissier  3) Recréer la contrainte

-- 1. Supprimer la contrainte AVANT toute modification (sinon UPDATE caissier échoue)
ALTER TABLE public.users
DROP CONSTRAINT IF EXISTS users_role_check;

-- 2. Remplacer cashier par caissier
UPDATE public.users
SET role = 'caissier'
WHERE role::text = 'cashier';

-- 3. Recréer la contrainte avec 'caissier'
ALTER TABLE public.users
ADD CONSTRAINT users_role_check
CHECK (role::text = ANY (ARRAY[
  'secretary',
  'doctor',
  'admin',
  'accounting',
  'caissier'
]::text[]));

COMMENT ON COLUMN public.users.role IS 'Rôle: secretary, doctor, admin, accounting, caissier';
