-- Migration pour ajouter les colonnes de gestion d'arrivée des patients
-- Date: 2026-06-19
-- Description: Ajout de statut_arrivee et heure_arrivee pour gérer l'arrivée des patients

-- Ajouter statut_arrivee si elle n'existe pas
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS statut_arrivee character varying DEFAULT 'non_arrive';

-- Ajouter la contrainte CHECK pour statut_arrivee
ALTER TABLE public.appointments DROP CONSTRAINT IF EXISTS appointments_statut_arrivee_check;
ALTER TABLE public.appointments ADD CONSTRAINT appointments_statut_arrivee_check CHECK (statut_arrivee::text = ANY (ARRAY['non_arrive'::character varying, 'arrive'::character varying]::text[]));

-- Ajouter heure_arrivee si elle n'existe pas
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS heure_arrivee timestamp with time zone;

-- Créer un index pour optimiser les requêtes sur statut_arrivee
CREATE INDEX IF NOT EXISTS idx_appointments_statut_arrivee ON public.appointments(statut_arrivee);

-- Créer un index pour optimiser les requêtes sur heure_arrivee
CREATE INDEX IF NOT EXISTS idx_appointments_heure_arrivee ON public.appointments(heure_arrivee);

RAISE NOTICE '🎉 Migration terminée avec succès!';
RAISE NOTICE '📋 Colonnes ajoutées:';
RAISE NOTICE '   - appointments: statut_arrivee, heure_arrivee';
