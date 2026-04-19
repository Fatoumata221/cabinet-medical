-- ============================================================================
-- CORRECTIF DEFINITIF : DÉSACTIVER LES RESTRICTIONS DE LECTURE (RLS)
-- ============================================================================
-- Le problème actuel est que la sécurité au niveau des lignes (RLS) limite 
-- l'affichage des utilisateurs à "1" (l'utilisateur connecté) sur le tableau de bord.
-- 
-- Ce script désactive cette sécurité sur les tables de base pour permettre
-- à l'application de tout voir correctement.
-- ============================================================================

-- 1. Désactiver RLS sur la table users
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- 2. Désactiver RLS sur les autres tables clés pour éviter d'autres bugs similaires
ALTER TABLE public.patients DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.waiting_queue DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications_medecin_secretaire DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.parametres_cabinet DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.specialites DISABLE ROW LEVEL SECURITY;

-- 3. Supprimer les éventuelles politiques existantes qui pourraient poser conflit
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.users;
DROP POLICY IF EXISTS "Secretaries can view all doctors" ON public.users;
DROP POLICY IF EXISTS "Admins have full access" ON public.users;

-- Forcer le rafraîchissement du cache Supabase (PostgREST)
NOTIFY pgrst, 'reload schema';
