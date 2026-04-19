-- ============================================================================
-- SCRIPT: ISOLATION DES DONNÉES PAR CABINET (MULTI-TENANT)
-- ============================================================================
-- Ce script réactive RLS et met en place une isolation stricte entre 
-- les différents cabinets médicaux pour garantir la confidentialité.
-- ============================================================================

-- 1. Créer une fonction sécurisée pour récupérer le cabinet de l'utilisateur
-- Le "SECURITY DEFINER" permet à la fonction de contourner l'Infinite Recursion 
-- lors de la vérification des politiques sur la table users.
CREATE OR REPLACE FUNCTION public.get_my_cabinet_id()
RETURNS bigint
LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$
  SELECT cabinet_id FROM public.users WHERE auth_id = auth.uid() LIMIT 1;
$$;

-- 2. Réactiver RLS sur les tables importantes
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waiting_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.specialites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parametres_cabinet ENABLE ROW LEVEL SECURITY;

-- 3. Nettoyer les anciennes politiques sur users
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.users;
DROP POLICY IF EXISTS "Secretaries can view all doctors" ON public.users;
DROP POLICY IF EXISTS "Admins have full access" ON public.users;
DROP POLICY IF EXISTS "Isolation cabinet users" ON public.users;

-- 4. Créer la politique d'isolation sur USERS
-- Tout le monde peut lire les infos des utilisateurs de SON PROPRE cabinet
CREATE POLICY "Isolation cabinet users" 
ON public.users FOR SELECT 
USING (
  -- On peut toujours voir son propre profil
  auth_id = auth.uid() 
  OR 
  -- Ou alors les profils du même cabinet
  cabinet_id = public.get_my_cabinet_id()
);

-- Autoriser la modification (UPDATE) uniquement pour soi-même ou les admins du même cabinet
CREATE POLICY "Update own or admin cabinet users" 
ON public.users FOR UPDATE 
USING (
  auth_id = auth.uid() 
  OR 
  (role = 'admin' AND cabinet_id = public.get_my_cabinet_id())
);

-- Autoriser l'insertion uniquement pour les rôles administratifs de ce cabinet (ou par défaut)
CREATE POLICY "Insert cabinet users" 
ON public.users FOR INSERT 
WITH CHECK (
  cabinet_id = public.get_my_cabinet_id()
);


-- 5. Créer les politiques d'isolation sur PATIENTS
DROP POLICY IF EXISTS "Isolation cabinet patients" ON public.patients;
CREATE POLICY "Isolation cabinet patients" 
ON public.patients FOR ALL 
USING (cabinet_id = public.get_my_cabinet_id());

-- 6. Créer les politiques d'isolation sur APPOINTMENTS
DROP POLICY IF EXISTS "Isolation cabinet appointments" ON public.appointments;
CREATE POLICY "Isolation cabinet appointments" 
ON public.appointments FOR ALL 
USING (cabinet_id = public.get_my_cabinet_id());

-- 7. Créer les politiques d'isolation sur CONSULTATIONS
DROP POLICY IF EXISTS "Isolation cabinet consultations" ON public.consultations;
CREATE POLICY "Isolation cabinet consultations" 
ON public.consultations FOR ALL 
USING (cabinet_id = public.get_my_cabinet_id());

-- 8. Créer les politiques d'isolation sur WAITING_QUEUE
DROP POLICY IF EXISTS "Isolation cabinet waiting queue" ON public.waiting_queue;
CREATE POLICY "Isolation cabinet waiting queue" 
ON public.waiting_queue FOR ALL 
USING (cabinet_id = public.get_my_cabinet_id());

-- 9. Créer les politiques d'isolation sur SPECIALITES
DROP POLICY IF EXISTS "Isolation cabinet specialites" ON public.specialites;
CREATE POLICY "Isolation cabinet specialites" 
ON public.specialites FOR ALL 
USING (cabinet_id = public.get_my_cabinet_id());

-- Note : Pour parametres_cabinet, on ne vérifie pas via 'cabinet_id' car 
-- la table parametres_cabinet n'a pas de colonne cabinet_id (elle EST le cabinet).
-- Sa politique est basée sur son propre ID :
DROP POLICY IF EXISTS "Isolation parametres_cabinet" ON public.parametres_cabinet;
CREATE POLICY "Isolation parametres_cabinet" 
ON public.parametres_cabinet FOR SELECT 
USING (id = public.get_my_cabinet_id());

-- Forcer le rafraîchissement
NOTIFY pgrst, 'reload schema';
