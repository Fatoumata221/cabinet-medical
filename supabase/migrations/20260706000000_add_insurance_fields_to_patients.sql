-- Migration pour ajouter les champs d'assurance/couverture à la table patients
-- Ces champs sont utilisés par le formulaire de modification de patient

-- Ajouter les colonnes manquantes pour la gestion de la couverture médicale
ALTER TABLE public.patients
    ADD COLUMN IF NOT EXISTS nom_assurance TEXT,
    ADD COLUMN IF NOT EXISTS numero_assurance TEXT,
    ADD COLUMN IF NOT EXISTS mutuelle TEXT,
    ADD COLUMN IF NOT EXISTS numero_mutuelle TEXT,
    ADD COLUMN IF NOT EXISTS numero_ipm TEXT,
    ADD COLUMN IF NOT EXISTS email TEXT,
    ADD COLUMN IF NOT EXISTS sexe VARCHAR(1) CHECK (sexe IN ('M', 'F')),
    ADD COLUMN IF NOT EXISTS lieu_naissance TEXT,
    ADD COLUMN IF NOT EXISTS nationalite TEXT,
    ADD COLUMN IF NOT EXISTS profession TEXT,
    ADD COLUMN IF NOT EXISTS situation_familiale VARCHAR(20) CHECK (situation_familiale IN ('celibataire', 'marie', 'divorce', 'veuf')),
    ADD COLUMN IF NOT EXISTS personne_contact TEXT,
    ADD COLUMN IF NOT EXISTS telephone_contact TEXT,
    ADD COLUMN IF NOT EXISTS lien_contact TEXT,
    ADD COLUMN IF NOT EXISTS numero_dossier TEXT UNIQUE,
    ADD COLUMN IF NOT EXISTS medecin_traitant TEXT,
    ADD COLUMN IF NOT EXISTS medecin_traitant_id BIGINT REFERENCES public.users(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS numero_secu TEXT,
    ADD COLUMN IF NOT EXISTS actif BOOLEAN DEFAULT true,
    ADD COLUMN IF NOT EXISTS notes TEXT;

-- Ajouter des commentaires pour documenter l'utilisation
COMMENT ON COLUMN public.patients.nom_assurance IS 'Nom de la compagnie d''assurance privée';
COMMENT ON COLUMN public.patients.numero_assurance IS 'Numéro de police d''assurance';
COMMENT ON COLUMN public.patients.mutuelle IS 'Nom de la mutuelle (IPM, IPRES, etc.)';
COMMENT ON COLUMN public.patients.numero_mutuelle IS 'Numéro d''adhérent à la mutuelle';
COMMENT ON COLUMN public.patients.numero_ipm IS 'Numéro IPM ou CSS pour la couverture sociale';
COMMENT ON COLUMN public.patients.sexe IS 'Sexe du patient (M ou F)';
COMMENT ON COLUMN public.patients.lieu_naissance IS 'Lieu de naissance du patient';
COMMENT ON COLUMN public.patients.nationalite IS 'Nationalité du patient';
COMMENT ON COLUMN public.patients.profession IS 'Profession du patient';
COMMENT ON COLUMN public.patients.situation_familiale IS 'Situation familiale (célibataire, marié, divorcé, veuf)';
COMMENT ON COLUMN public.patients.personne_contact IS 'Nom de la personne à contacter en cas d''urgence';
COMMENT ON COLUMN public.patients.telephone_contact IS 'Numéro de téléphone de la personne de contact';
COMMENT ON COLUMN public.patients.lien_contact IS 'Lien avec la personne de contact (conjoint, parent, etc.)';
COMMENT ON COLUMN public.patients.numero_dossier IS 'Numéro de dossier unique du patient';
COMMENT ON COLUMN public.patients.medecin_traitant IS 'Nom du médecin traitant';
COMMENT ON COLUMN public.patients.medecin_traitant_id IS 'Référence au médecin traitant dans la table users';
COMMENT ON COLUMN public.patients.numero_secu IS 'Numéro de sécurité sociale (FNR)';
COMMENT ON COLUMN public.patients.actif IS 'Indique si le patient est actif dans le système';
COMMENT ON COLUMN public.patients.notes IS 'Notes additionnelles sur le patient';

-- Créer des index pour optimiser les recherches
CREATE INDEX IF NOT EXISTS idx_patients_numero_dossier ON public.patients(numero_dossier);
CREATE INDEX IF NOT EXISTS idx_patients_nom_prenom ON public.patients(nom, prenom);
CREATE INDEX IF NOT EXISTS idx_patients_telephone ON public.patients(telephone);

-- Ajouter une contrainte pour s'assurer qu'au moins un type de couverture est rempli si nécessaire
-- (Optionnel : selon les règles métier, on peut vouloir valider que si un champ de couverture est rempli, les autres sont null)
