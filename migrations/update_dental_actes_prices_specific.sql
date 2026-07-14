-- Migration spécifique pour mettre à jour les tarifs des 9 actes dentaires identifiés
-- Basée sur les tarifs pratiqués dans les cabinets dentaires au Sénégal
-- Tarifs en FCFA (Francs CFA d'Afrique de l'Ouest)

-- Consultation dentaire (ID: 2)
UPDATE public.types_actes 
SET tarif_defaut = 8000, 
    updated_at = NOW()
WHERE id = 2;

-- Détartrage (ID: 3)
UPDATE public.types_actes 
SET tarif_defaut = 12000, 
    updated_at = NOW()
WHERE id = 3;

-- Extraction dentaire (ID: 4)
UPDATE public.types_actes 
SET tarif_defaut = 15000, 
    updated_at = NOW()
WHERE id = 4;

-- Obturation (ID: 5)
UPDATE public.types_actes 
SET tarif_defaut = 18000, 
    updated_at = NOW()
WHERE id = 5;

-- Radiographie dentaire (ID: 6)
UPDATE public.types_actes 
SET tarif_defaut = 5000, 
    updated_at = NOW()
WHERE id = 6;

-- Soins canalaires (ID: 7)
UPDATE public.types_actes 
SET tarif_defaut = 35000, 
    updated_at = NOW()
WHERE id = 7;

-- Couronne dentaire (ID: 8)
UPDATE public.types_actes 
SET tarif_defaut = 70000, 
    updated_at = NOW()
WHERE id = 8;

-- Prothèse amovible (ID: 9)
UPDATE public.types_actes 
SET tarif_defaut = 80000, 
    updated_at = NOW()
WHERE id = 9;

-- Implant dentaire (ID: 10)
UPDATE public.types_actes 
SET tarif_defaut = 200000, 
    updated_at = NOW()
WHERE id = 10;

-- Vérification des mises à jour
SELECT 
    id,
    nom,
    tarif_defaut
FROM public.types_actes
WHERE id IN (2, 3, 4, 5, 6, 7, 8, 9, 10)
ORDER BY id;
