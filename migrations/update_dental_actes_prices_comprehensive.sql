-- Migration complète pour mettre à jour les tarifs des actes dentaires
-- Basée sur les tarifs pratiqués dans les cabinets dentaires au Sénégal
-- Tarifs en FCFA (Francs CFA d'Afrique de l'Ouest)

-- Consultation dentaire
UPDATE public.types_actes 
SET tarif_defaut = 8000, 
    updated_at = NOW()
WHERE nom ILIKE '%consultation%' 
  AND (nom ILIKE '%dent%' OR nom ILIKE '%dentaire%')
  AND (tarif_defaut IS NULL OR tarif_defaut = 0);

-- Détartrage
UPDATE public.types_actes 
SET tarif_defaut = 12000, 
    updated_at = NOW()
WHERE nom ILIKE '%détartrage%' 
  AND (tarif_defaut IS NULL OR tarif_defaut = 0);

-- Obturation Composite (1 face)
UPDATE public.types_actes 
SET tarif_defaut = 15000, 
    updated_at = NOW()
WHERE nom ILIKE '%obturation%' 
  AND nom ILIKE '%1 face%'
  AND (tarif_defaut IS NULL OR tarif_defaut = 0);

-- Obturation Composite (2 faces)
UPDATE public.types_actes 
SET tarif_defaut = 20000, 
    updated_at = NOW()
WHERE nom ILIKE '%obturation%' 
  AND nom ILIKE '%2 faces%'
  AND (tarif_defaut IS NULL OR tarif_defaut = 0);

-- Obturation Composite (3 faces+)
UPDATE public.types_actes 
SET tarif_defaut = 25000, 
    updated_at = NOW()
WHERE nom ILIKE '%obturation%' 
  AND (nom ILIKE '%3 faces%' OR nom ILIKE '%3 faces+%')
  AND (tarif_defaut IS NULL OR tarif_defaut = 0);

-- Obturation (générique)
UPDATE public.types_actes 
SET tarif_defaut = 18000, 
    updated_at = NOW()
WHERE nom ILIKE '%obturation%' 
  AND tarif_defaut IS NULL OR tarif_defaut = 0;

-- Traitement Canalaire (Mono-radiculé)
UPDATE public.types_actes 
SET tarif_defaut = 30000, 
    updated_at = NOW()
WHERE nom ILIKE '%traitement canalaire%' 
  AND nom ILIKE '%mono%'
  AND (tarif_defaut IS NULL OR tarif_defaut = 0);

-- Traitement Canalaire (Bi-radiculé)
UPDATE public.types_actes 
SET tarif_defaut = 40000, 
    updated_at = NOW()
WHERE nom ILIKE '%traitement canalaire%' 
  AND nom ILIKE '%bi%'
  AND (tarif_defaut IS NULL OR tarif_defaut = 0);

-- Traitement Canalaire (Multi-radiculé)
UPDATE public.types_actes 
SET tarif_defaut = 50000, 
    updated_at = NOW()
WHERE nom ILIKE '%traitement canalaire%' 
  AND nom ILIKE '%multi%'
  AND (tarif_defaut IS NULL OR tarif_defaut = 0);

-- Traitement canalaire (générique)
UPDATE public.types_actes 
SET tarif_defaut = 35000, 
    updated_at = NOW()
WHERE (nom ILIKE '%canal%' OR nom ILIKE '%dévitalisation%')
  AND tarif_defaut IS NULL OR tarif_defaut = 0;

-- Couronne Métallique
UPDATE public.types_actes 
SET tarif_defaut = 50000, 
    updated_at = NOW()
WHERE nom ILIKE '%couronne%' 
  AND nom ILIKE '%métallique%'
  AND (tarif_defaut IS NULL OR tarif_defaut = 0);

-- Couronne Céramo-métallique
UPDATE public.types_actes 
SET tarif_defaut = 75000, 
    updated_at = NOW()
WHERE nom ILIKE '%couronne%' 
  AND nom ILIKE '%céramo-métallique%'
  AND (tarif_defaut IS NULL OR tarif_defaut = 0);

-- Couronne Zircone
UPDATE public.types_actes 
SET tarif_defaut = 100000, 
    updated_at = NOW()
WHERE nom ILIKE '%couronne%' 
  AND nom ILIKE '%zircone%'
  AND (tarif_defaut IS NULL OR tarif_defaut = 0);

-- Couronne (générique)
UPDATE public.types_actes 
SET tarif_defaut = 70000, 
    updated_at = NOW()
WHERE nom ILIKE '%couronne%' 
  AND tarif_defaut IS NULL OR tarif_defaut = 0;

-- Prothèse Amovible (par dent)
UPDATE public.types_actes 
SET tarif_defaut = 15000, 
    updated_at = NOW()
WHERE nom ILIKE '%prothèse%' 
  AND nom ILIKE '%amovible%'
  AND (tarif_defaut IS NULL OR tarif_defaut = 0);

-- Prothèse Complète (1 arcade)
UPDATE public.types_actes 
SET tarif_defaut = 150000, 
    updated_at = NOW()
WHERE nom ILIKE '%prothèse%' 
  AND nom ILIKE '%complète%'
  AND (tarif_defaut IS NULL OR tarif_defaut = 0);

-- Prothèse (générique)
UPDATE public.types_actes 
SET tarif_defaut = 80000, 
    updated_at = NOW()
WHERE nom ILIKE '%prothèse%' 
  AND tarif_defaut IS NULL OR tarif_defaut = 0;

-- Blanchiment dentaire
UPDATE public.types_actes 
SET tarif_defaut = 75000, 
    updated_at = NOW()
WHERE nom ILIKE '%blanchiment%' 
  AND (tarif_defaut IS NULL OR tarif_defaut = 0);

-- Scellement de sillons
UPDATE public.types_actes 
SET tarif_defaut = 8000, 
    updated_at = NOW()
WHERE nom ILIKE '%scellement%' 
  AND (tarif_defaut IS NULL OR tarif_defaut = 0);

-- Radiographie rétro-alvéolaire
UPDATE public.types_actes 
SET tarif_defaut = 5000, 
    updated_at = NOW()
WHERE (nom ILIKE '%radio%' OR nom ILIKE '%radiographie%')
  AND nom ILIKE '%rétro-alvéolaire%'
  AND (tarif_defaut IS NULL OR tarif_defaut = 0);

-- Panoramique dentaire
UPDATE public.types_actes 
SET tarif_defaut = 15000, 
    updated_at = NOW()
WHERE nom ILIKE '%panoramique%' 
  AND (tarif_defaut IS NULL OR tarif_defaut = 0);

-- Radiographie dentaire (générique)
UPDATE public.types_actes 
SET tarif_defaut = 5000, 
    updated_at = NOW()
WHERE (nom ILIKE '%radio%' OR nom ILIKE '%radiographie%')
  AND (nom ILIKE '%dent%' OR nom ILIKE '%dentaire%')
  AND tarif_defaut IS NULL OR tarif_defaut = 0;

-- Incision abcès
UPDATE public.types_actes 
SET tarif_defaut = 15000, 
    updated_at = NOW()
WHERE nom ILIKE '%incision%' 
  AND nom ILIKE '%abcès%'
  AND (tarif_defaut IS NULL OR tarif_defaut = 0);

-- Alvéolectomie
UPDATE public.types_actes 
SET tarif_defaut = 25000, 
    updated_at = NOW()
WHERE nom ILIKE '%alvéolectomie%' 
  AND (tarif_defaut IS NULL OR tarif_defaut = 0);

-- Gingivectomie (secteur)
UPDATE public.types_actes 
SET tarif_defaut = 20000, 
    updated_at = NOW()
WHERE nom ILIKE '%gingivectomie%' 
  AND (tarif_defaut IS NULL OR tarif_defaut = 0);

-- Pose Implant
UPDATE public.types_actes 
SET tarif_defaut = 200000, 
    updated_at = NOW()
WHERE nom ILIKE '%implant%' 
  AND (tarif_defaut IS NULL OR tarif_defaut = 0);

-- Bridge (par élément)
UPDATE public.types_actes 
SET tarif_defaut = 80000, 
    updated_at = NOW()
WHERE nom ILIKE '%bridge%' 
  AND (tarif_defaut IS NULL OR tarif_defaut = 0);

-- Inlay-Core
UPDATE public.types_actes 
SET tarif_defaut = 40000, 
    updated_at = NOW()
WHERE nom ILIKE '%inlay%' 
  AND (tarif_defaut IS NULL OR tarif_defaut = 0);

-- Pulpotomie
UPDATE public.types_actes 
SET tarif_defaut = 20000, 
    updated_at = NOW()
WHERE nom ILIKE '%pulpotomie%' 
  AND (tarif_defaut IS NULL OR tarif_defaut = 0);

-- Curetage parodontal (quadrant)
UPDATE public.types_actes 
SET tarif_defaut = 30000, 
    updated_at = NOW()
WHERE nom ILIKE '%curetage%' 
  AND nom ILIKE '%parodontal%'
  AND (tarif_defaut IS NULL OR tarif_defaut = 0);

-- Attelle de contention
UPDATE public.types_actes 
SET tarif_defaut = 20000, 
    updated_at = NOW()
WHERE nom ILIKE '%attelle%' 
  AND (tarif_defaut IS NULL OR tarif_defaut = 0);

-- Fluoruration
UPDATE public.types_actes 
SET tarif_defaut = 5000, 
    updated_at = NOW()
WHERE nom ILIKE '%fluoruration%' 
  AND (tarif_defaut IS NULL OR tarif_defaut = 0);

-- Extraction dentaire
UPDATE public.types_actes 
SET tarif_defaut = 15000, 
    updated_at = NOW()
WHERE nom ILIKE '%extraction%' 
  AND (nom ILIKE '%dent%' OR nom ILIKE '%dentaire%')
  AND (tarif_defaut IS NULL OR tarif_defaut = 0);

-- Urgence dentaire
UPDATE public.types_actes 
SET tarif_defaut = 20000, 
    updated_at = NOW()
WHERE nom ILIKE '%urgence%' 
  AND (nom ILIKE '%dent%' OR nom ILIKE '%dentaire%')
  AND (tarif_defaut IS NULL OR tarif_defaut = 0);

-- Mise à jour générique pour tous les actes dentaires restants sans prix
UPDATE public.types_actes 
SET tarif_defaut = 10000, 
    updated_at = NOW()
WHERE (nom ILIKE '%dent%' 
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
  AND (tarif_defaut IS NULL OR tarif_defaut = 0);

-- Vérification des actes mis à jour
SELECT 
    'Actes dentaires mis à jour' as statut,
    COUNT(*) as nombre,
    AVG(tarif_defaut) as tarif_moyen
FROM public.types_actes
WHERE (nom ILIKE '%dent%' 
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
  AND tarif_defaut IS NOT NULL 
  AND tarif_defaut > 0;

-- Afficher les actes qui n'ont toujours pas de prix
SELECT 
    id,
    nom,
    description,
    tarif_defaut
FROM public.types_actes
WHERE (nom ILIKE '%dent%' 
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
  AND (tarif_defaut IS NULL OR tarif_defaut = 0)
ORDER BY nom;
