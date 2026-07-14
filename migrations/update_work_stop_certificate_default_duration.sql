-- Migration pour mettre à jour la durée par défaut du certificat d'arrêt de travail
-- Change la valeur par défaut de 7 jours à 1 jour

UPDATE public.types_certificats 
SET duree_defaut = 1 
WHERE nom LIKE '%arrêt de travail%' 
   OR nom LIKE '%Arrêt de travail%'
   OR nom LIKE '%Certificat d''arrêt de travail%'
   OR nom LIKE '%Certificat de maladie%';
