-- Migration pour ajouter le rôle de comptabilité
-- Date: 2026-01-21

-- Ajouter la colonne username si elle n'existe pas
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'username'
    ) THEN
        ALTER TABLE public.users ADD COLUMN username character varying;
        -- Créer un index pour optimiser les recherches
        CREATE INDEX idx_users_username ON public.users(username);
    END IF;
END $$;

-- Mettre à jour les usernames existants (pour les utilisateurs déjà créés)
UPDATE public.users 
SET username = LOWER(REPLACE(REPLACE(prenom, ' ', '.'), ' ', '')) || '.' || LOWER(REPLACE(REPLACE(nom, ' ', '.'), ' ', ''))
WHERE username IS NULL AND prenom IS NOT NULL AND nom IS NOT NULL;

-- Rendre la colonne unique après avoir mis à jour les valeurs
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'username'
    ) THEN
        ALTER TABLE public.users ADD CONSTRAINT users_username_unique UNIQUE (username);
    END IF;
END $$;

-- Ajouter le rôle 'accounting' à la contrainte CHECK de la table users
ALTER TABLE public.users 
DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE public.users 
ADD CONSTRAINT users_role_check 
CHECK (role::text = ANY (ARRAY['secretary'::character varying, 'doctor'::character varying, 'admin'::character varying, 'accounting'::character varying]::text[]));

-- Créer un utilisateur comptabilité par défaut
INSERT INTO public.users (email, username, role, nom, prenom, actif) 
VALUES ('comptabilite@cabinet.com', 'comptabilite.service', 'accounting', 'Comptabilité', 'Service', true)
ON CONFLICT (email) DO NOTHING;

-- Ajouter les permissions RLS pour le rôle comptabilité sur les tables financières
-- Politiques pour la table invoices (factures)
DROP POLICY IF EXISTS "Accounting can view all invoices" ON public.invoices;
DROP POLICY IF EXISTS "Accounting can update invoices" ON public.invoices;
DROP POLICY IF EXISTS "Accounting can insert invoices" ON public.invoices;

CREATE POLICY "Accounting can view all invoices" ON public.invoices
    FOR SELECT USING (auth.jwt() ->> 'role' = 'accounting');

CREATE POLICY "Accounting can update invoices" ON public.invoices
    FOR UPDATE USING (auth.jwt() ->> 'role' = 'accounting');

CREATE POLICY "Accounting can insert invoices" ON public.invoices
    FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'accounting');

-- Politiques pour la table consultations (pour accès aux informations financières des consultations)
DROP POLICY IF EXISTS "Accounting can view consultation financial data" ON public.consultations;

CREATE POLICY "Accounting can view consultation financial data" ON public.consultations
    FOR SELECT USING (auth.jwt() ->> 'role' = 'accounting');

-- Politiques pour la table patients (accès limité aux informations de facturation)
DROP POLICY IF EXISTS "Accounting can view patient billing info" ON public.patients;

CREATE POLICY "Accounting can view patient billing info" ON public.patients
    FOR SELECT USING (auth.jwt() ->> 'role' = 'accounting');

-- Commentaires pour documentation
COMMENT ON COLUMN public.users.role IS 'Rôle de l''utilisateur: secretary, doctor, admin, ou accounting';
COMMENT ON COLUMN public.users.username IS 'Nom d''utilisateur unique pour la connexion';

-- Afficher un résumé
DO $$
BEGIN
    RAISE NOTICE '✅ Migration comptabilité terminée';
    RAISE NOTICE '📝 Colonne username ajoutée à la table users';
    RAISE NOTICE '👤 Rôle accounting ajouté';
    RAISE NOTICE '🔐 Politiques RLS configurées';
    RAISE NOTICE '👤 Utilisateur comptabilité par défaut: comptabilite@cabinet.com / comptabilite.service';
END $$;
