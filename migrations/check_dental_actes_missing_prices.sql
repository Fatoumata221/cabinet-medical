-- Vérification des actes dentaires sans prix ou avec prix à 0
SELECT 
    id,
    nom,
    description,
    tarif_defaut,
    specialite_id
FROM public.types_actes
WHERE (tarif_defaut IS NULL OR tarif_defaut = 0)
  AND (nom ILIKE '%dent%' 
       OR nom ILIKE '%dentaire%'
       OR nom ILIKE '%obturation%'
       OR nom ILIKE '%couronne%'
       OR nom ILIKE '%implant%'
       OR nom ILIKE '%prothèse%'
       OR nom ILIKE '%détartrage%'
       OR nom ILIKE '%canal%'
       OR nom ILIKE '%radio%'
       OR nom ILIKE '%panoramique%'
       OR nom ILIKE '%extraction%'
       OR nom ILIKE '%scellement%'
       OR nom ILIKE '%blanchiment%'
       OR nom ILIKE '%fluoruration%'
       OR nom ILIKE '%gingivectomie%'
       OR nom ILIKE '%alvéolectomie%'
       OR nom ILIKE '%pulpotomie%'
       OR nom ILIKE '%curetage%'
       OR nom ILIKE '%attelle%'
       OR nom ILIKE '%inlay%'
       OR nom ILIKE '%bridge%'
       OR id BETWEEN 266 AND 295)
ORDER BY nom;
