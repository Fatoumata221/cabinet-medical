-- =====================================================
-- Migration: add-caissiers
-- Ajoute le rôle 'caissier' pour que chaque caissier ait son compte
-- et enregistre ses propres encaissements (sessions_caisse, paiements).
-- =====================================================

-- 1. Étendre la contrainte CHECK sur users.role pour inclure 'caissier'
ALTER TABLE public.users
DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE public.users
ADD CONSTRAINT users_role_check
CHECK (role::text = ANY (ARRAY[
  'secretary'::character varying,
  'doctor'::character varying,
  'admin'::character varying,
  'accounting'::character varying,
  'caissier'::character varying
]::text[]));

-- 2. (Optionnel) Créer un utilisateur caissier par défaut si aucun n'existe
-- Les caissiers supplémentaires se créent via l'interface Administration > Utilisateurs
INSERT INTO public.users (email, username, role, nom, prenom, actif)
SELECT 'caissier@cabinet.com', 'caissier.service', 'caissier', 'Caisse', 'Service', true
WHERE NOT EXISTS (SELECT 1 FROM public.users WHERE role = 'caissier' LIMIT 1);

-- 3. Commentaire de documentation
COMMENT ON COLUMN public.users.role IS 'Rôle: secretary, doctor, admin, accounting, caissier';

-- 4. Résumé
DO $$
BEGIN
  RAISE NOTICE '✅ Migration add-caissiers terminée';
  RAISE NOTICE '👤 Rôle caissier ajouté à la table users';
  RAISE NOTICE '💳 Les encaissements sont liés à caissier_id (sessions_caisse, paiements)';
  RAISE NOTICE '📝 Créez les comptes caissier via Administration > Gestion utilisateurs';
END $$;
