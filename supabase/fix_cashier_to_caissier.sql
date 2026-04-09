-- Remplacer le rôle 'cashier' par 'caissier' pour les utilisateurs concernés
UPDATE public.users
SET role = 'caissier'
WHERE role::text = 'cashier';
