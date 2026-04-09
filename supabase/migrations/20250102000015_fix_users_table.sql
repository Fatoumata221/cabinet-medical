-- Migration pour corriger la table users et ajouter les champs manquants
-- Date: 2025-01-02
-- Objectif: Résoudre le problème "profil non trouvé" en ajoutant les champs nécessaires

-- Ajouter les colonnes manquantes à la table users
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS telephone character varying,
ADD COLUMN IF NOT EXISTS duree_consultation integer DEFAULT 30,
ADD COLUMN IF NOT EXISTS actif boolean DEFAULT true;

-- Mettre à jour les contraintes pour s'assurer que nom et prenom ne sont pas null
ALTER TABLE public.users 
ALTER COLUMN nom SET NOT NULL,
ALTER COLUMN prenom SET NOT NULL;

-- Mettre à jour les données existantes pour s'assurer qu'elles ont des valeurs par défaut
UPDATE public.users 
SET 
    nom = COALESCE(nom, 'Nom'),
    prenom = COALESCE(prenom, 'Prénom'),
    duree_consultation = COALESCE(duree_consultation, 30),
    actif = COALESCE(actif, true)
WHERE nom IS NULL OR prenom IS NULL OR duree_consultation IS NULL OR actif IS NULL;

-- Ajouter des téléphones aux médecins existants (format sénégalais)
UPDATE public.users 
SET telephone = CASE 
    WHEN email = 'dr.diallo@cabinet.com' THEN '771234567'
    WHEN email = 'dr.ndiaye@cabinet.com' THEN '772345678'
    WHEN email = 'dr.seck@cabinet.com' THEN '773456789'
    WHEN email = 'dr.fall@cabinet.com' THEN '774567890'
    WHEN email = 'dr.ba@cabinet.com' THEN '775678901'
    WHEN email = 'dr.sarr@cabinet.com' THEN '776789012'
    WHEN email = 'dr.cisse@cabinet.com' THEN '777890123'
    WHEN email = 'dr.thiam@cabinet.com' THEN '778901234'
    WHEN email = 'secretaire1@cabinet.com' THEN '779012345'
    WHEN email = 'secretaire2@cabinet.com' THEN '770123456'
    WHEN email = 'secretaire3@cabinet.com' THEN '771234568'
    WHEN email = 'admin@cabinet.com' THEN '772345679'
    ELSE '77' || LPAD((RANDOM() * 9999999)::int::text, 7, '0')
END
WHERE telephone IS NULL;

-- Créer un index sur le champ actif pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_users_actif ON public.users(actif);
CREATE INDEX IF NOT EXISTS idx_users_role_actif ON public.users(role, actif);

-- Fonction pour valider les données utilisateur
CREATE OR REPLACE FUNCTION validate_user_data()
RETURNS TRIGGER AS $$
BEGIN
    -- S'assurer que nom et prenom ne sont pas vides
    IF NEW.nom IS NULL OR trim(NEW.nom) = '' THEN
        NEW.nom := 'Nom';
    END IF;
    
    IF NEW.prenom IS NULL OR trim(NEW.prenom) = '' THEN
        NEW.prenom := 'Prénom';
    END IF;
    
    -- S'assurer que duree_consultation est raisonnable
    IF NEW.duree_consultation IS NULL OR NEW.duree_consultation < 5 THEN
        NEW.duree_consultation := 30;
    END IF;
    
    -- S'assurer que actif a une valeur
    IF NEW.actif IS NULL THEN
        NEW.actif := true;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger pour valider les données avant insertion/mise à jour
DROP TRIGGER IF EXISTS validate_user_data_trigger ON public.users;
CREATE TRIGGER validate_user_data_trigger 
    BEFORE INSERT OR UPDATE ON public.users 
    FOR EACH ROW EXECUTE FUNCTION validate_user_data();

-- Vérification des données après migration
DO $$
DECLARE
    users_count integer;
    users_with_missing_data integer;
BEGIN
    SELECT COUNT(*) INTO users_count FROM public.users;
    
    SELECT COUNT(*) INTO users_with_missing_data 
    FROM public.users 
    WHERE nom IS NULL OR prenom IS NULL OR duree_consultation IS NULL OR actif IS NULL;
    
    RAISE NOTICE 'Migration terminée:';
    RAISE NOTICE '- Total utilisateurs: %', users_count;
    RAISE NOTICE '- Utilisateurs avec données manquantes: %', users_with_missing_data;
    
    IF users_with_missing_data > 0 THEN
        RAISE WARNING 'Il reste % utilisateurs avec des données manquantes', users_with_missing_data;
    ELSE
        RAISE NOTICE '✅ Tous les utilisateurs ont des données complètes';
    END IF;
END $$;
