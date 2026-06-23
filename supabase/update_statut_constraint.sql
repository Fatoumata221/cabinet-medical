-- Migration pour mettre à jour la contrainte CHECK de la colonne statut
-- Date: 2026-06-22
-- Description: Ajouter 'arrive' comme valeur valide pour la colonne statut

-- Supprimer l'ancienne contrainte
ALTER TABLE public.appointments DROP CONSTRAINT IF EXISTS appointments_statut_check;

-- Ajouter la nouvelle contrainte avec 'arrive' inclus
ALTER TABLE public.appointments ADD CONSTRAINT appointments_statut_check 
CHECK (statut::text = ANY (ARRAY['confirme'::character varying, 'en_attente'::character varying, 'annule'::character varying, 'termine'::character varying, 'arrive'::character varying]::text[]));

RAISE NOTICE '✅ Contrainte statut mise à jour avec succès!';
RAISE NOTICE '📋 Valeurs autorisées:';
RAISE NOTICE '   - confirme, en_attente, annule, termine, arrive';
