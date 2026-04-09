-- Migration pour corriger la contrainte de clé étrangère de lignes_facture
-- La contrainte pointe actuellement vers factures_old au lieu de factures

-- Supprimer l'ancienne contrainte incorrecte
ALTER TABLE public.lignes_facture 
DROP CONSTRAINT IF EXISTS fk_lignes_facture_facture;

-- Ajouter la nouvelle contrainte correcte pointant vers factures
ALTER TABLE public.lignes_facture
ADD CONSTRAINT fk_lignes_facture_facture 
FOREIGN KEY (facture_id) 
REFERENCES public.factures(id) 
ON DELETE CASCADE;


