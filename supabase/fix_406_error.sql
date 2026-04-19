-- CORRECTIF : Retirer cabinet_id de parametres_cabinet (c'est la table parent)
-- et rafraîchir le cache PostgREST

ALTER TABLE public.parametres_cabinet DROP COLUMN IF EXISTS cabinet_id;

-- Forcer PostgREST à recharger le schema
NOTIFY pgrst, 'reload schema';
