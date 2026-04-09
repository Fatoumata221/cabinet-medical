-- Migration : Mise à jour des actes médicaux pour le Sénégal
-- Date: 2025-01-16
-- Description: Remplacement des données génériques de types_actes par des données réalistes
--              adaptées au contexte sénégalais avec libellés officiels, tarifs en FCFA,
--              et associations correctes aux spécialités médicales
--
-- Sources de référence:
-- - Nomenclature générale des actes professionnels du Sénégal (Ministère de la Santé)
-- - Arrêté Interministériel n° 738
-- - Tarifs officiels des actes médicaux au Sénégal

-- =====================================================
-- 1. NETTOYAGE DES DONNÉES EXISTANTES
-- =====================================================

-- Désactiver les anciens actes au lieu de les supprimer (pour préserver l'historique)
UPDATE public.types_actes 
SET actif = false, 
    updated_at = NOW()
WHERE actif = true;

-- =====================================================
-- 2. INSERTION DES NOUVEAUX ACTES MÉDICAUX
-- =====================================================

-- Médecine générale
INSERT INTO public.types_actes (nom, description, tarif_defaut, specialite_id, duree_estimee, ordre_affichage, actif, created_at, updated_at)
VALUES
    ('Consultation médicale générale', 'Consultation médicale générale avec examen clinique complet', 5000.00, 
     (SELECT id FROM public.specialites WHERE nom = 'Médecine générale' LIMIT 1), 20, 1, true, NOW(), NOW()),
    
    ('Consultation de suivi', 'Consultation de suivi médical pour contrôle et ajustement du traitement', 4000.00,
     (SELECT id FROM public.specialites WHERE nom = 'Médecine générale' LIMIT 1), 15, 2, true, NOW(), NOW()),
    
    ('Visite à domicile', 'Visite médicale à domicile du patient', 25000.00,
     (SELECT id FROM public.specialites WHERE nom = 'Médecine générale' LIMIT 1), 45, 3, true, NOW(), NOW()),
    
    ('Certificat médical', 'Établissement d''un certificat médical', 3000.00,
     (SELECT id FROM public.specialites WHERE nom = 'Médecine générale' LIMIT 1), 10, 4, true, NOW(), NOW()),
    
    ('Vaccination', 'Administration d''un vaccin', 5000.00,
     (SELECT id FROM public.specialites WHERE nom = 'Médecine générale' LIMIT 1), 10, 5, true, NOW(), NOW()),
    
    ('Injection intramusculaire', 'Injection intramusculaire de médicament', 5000.00,
     (SELECT id FROM public.specialites WHERE nom = 'Médecine générale' LIMIT 1), 5, 6, true, NOW(), NOW()),
    
    ('Pansement simple', 'Réfection d''un pansement simple', 3000.00,
     (SELECT id FROM public.specialites WHERE nom = 'Médecine générale' LIMIT 1), 10, 7, true, NOW(), NOW()),
    
    ('Suture de plaie simple', 'Suture d''une plaie simple sous anesthésie locale', 12000.00,
     (SELECT id FROM public.specialites WHERE nom = 'Médecine générale' LIMIT 1), 20, 8, true, NOW(), NOW()),
    
    ('Ablation de points de suture', 'Ablation de points de suture', 2000.00,
     (SELECT id FROM public.specialites WHERE nom = 'Médecine générale' LIMIT 1), 5, 9, true, NOW(), NOW()),
    
    ('Prélèvement sanguin', 'Prélèvement sanguin pour analyses', 3000.00,
     (SELECT id FROM public.specialites WHERE nom = 'Médecine générale' LIMIT 1), 5, 10, true, NOW(), NOW()),
    
    ('Bilan de santé complet', 'Bilan de santé complet avec examens cliniques et biologiques', 15000.00,
     (SELECT id FROM public.specialites WHERE nom = 'Médecine générale' LIMIT 1), 60, 11, true, NOW(), NOW()),
    
    ('Consultation urgente', 'Consultation médicale en urgence', 8000.00,
     (SELECT id FROM public.specialites WHERE nom = 'Médecine générale' LIMIT 1), 30, 12, true, NOW(), NOW()),
    
    ('Injection intraveineuse', 'Injection intraveineuse de médicament', 6000.00,
     (SELECT id FROM public.specialites WHERE nom = 'Médecine générale' LIMIT 1), 10, 13, true, NOW(), NOW()),
    
    ('Pansement complexe', 'Réfection d''un pansement complexe ou spécialisé', 5000.00,
     (SELECT id FROM public.specialites WHERE nom = 'Médecine générale' LIMIT 1), 20, 14, true, NOW(), NOW()),
    
    ('Suture de plaie complexe', 'Suture d''une plaie complexe nécessitant plusieurs points', 18000.00,
     (SELECT id FROM public.specialites WHERE nom = 'Médecine générale' LIMIT 1), 30, 15, true, NOW(), NOW()),
    
    ('Réduction de fracture simple', 'Réduction d''une fracture simple sans anesthésie générale', 25000.00,
     (SELECT id FROM public.specialites WHERE nom = 'Médecine générale' LIMIT 1), 30, 16, true, NOW(), NOW()),
    
    ('Pose de plâtre', 'Pose d''un plâtre pour immobilisation', 20000.00,
     (SELECT id FROM public.specialites WHERE nom = 'Médecine générale' LIMIT 1), 30, 17, true, NOW(), NOW()),
    
    ('Ablation de plâtre', 'Ablation d''un plâtre', 5000.00,
     (SELECT id FROM public.specialites WHERE nom = 'Médecine générale' LIMIT 1), 15, 18, true, NOW(), NOW()),
    
    ('Drainage d''abcès', 'Drainage chirurgical d''un abcès sous anesthésie locale', 15000.00,
     (SELECT id FROM public.specialites WHERE nom = 'Médecine générale' LIMIT 1), 25, 19, true, NOW(), NOW()),
    
    ('Ablation de corps étranger', 'Ablation d''un corps étranger superficiel', 8000.00,
     (SELECT id FROM public.specialites WHERE nom = 'Médecine générale' LIMIT 1), 15, 20, true, NOW(), NOW()),
    
    ('Électrocardiogramme de dépistage', 'Électrocardiogramme de dépistage', 15000.00,
     (SELECT id FROM public.specialites WHERE nom = 'Médecine générale' LIMIT 1), 10, 21, true, NOW(), NOW()),
    
    ('Mesure de la tension artérielle', 'Mesure de la tension artérielle avec suivi', 2000.00,
     (SELECT id FROM public.specialites WHERE nom = 'Médecine générale' LIMIT 1), 5, 22, true, NOW(), NOW()),
    
    ('Test de glycémie capillaire', 'Test de glycémie capillaire au doigt', 2000.00,
     (SELECT id FROM public.specialites WHERE nom = 'Médecine générale' LIMIT 1), 5, 23, true, NOW(), NOW()),
    
    ('Pose de sonde urinaire', 'Pose d''une sonde urinaire à demeure', 12000.00,
     (SELECT id FROM public.specialites WHERE nom = 'Médecine générale' LIMIT 1), 20, 24, true, NOW(), NOW()),
    
    ('Ablation de sonde urinaire', 'Ablation d''une sonde urinaire', 3000.00,
     (SELECT id FROM public.specialites WHERE nom = 'Médecine générale' LIMIT 1), 5, 25, true, NOW(), NOW()),
    
    ('Nebulisation', 'Traitement par nébulisation pour affections respiratoires', 6000.00,
     (SELECT id FROM public.specialites WHERE nom = 'Médecine générale' LIMIT 1), 20, 26, true, NOW(), NOW()),
    
    ('Lavage gastrique', 'Lavage gastrique en cas d''intoxication', 15000.00,
     (SELECT id FROM public.specialites WHERE nom = 'Médecine générale' LIMIT 1), 30, 27, true, NOW(), NOW()),
    
    ('Réanimation cardio-pulmonaire', 'Manœuvres de réanimation cardio-pulmonaire', 30000.00,
     (SELECT id FROM public.specialites WHERE nom = 'Médecine générale' LIMIT 1), 60, 28, true, NOW(), NOW()),
    
    ('Consultation de contrôle post-opératoire', 'Consultation de contrôle après intervention chirurgicale', 5000.00,
     (SELECT id FROM public.specialites WHERE nom = 'Médecine générale' LIMIT 1), 20, 29, true, NOW(), NOW()),
    
    ('Bilan pré-opératoire', 'Bilan médical pré-opératoire complet', 12000.00,
     (SELECT id FROM public.specialites WHERE nom = 'Médecine générale' LIMIT 1), 40, 30, true, NOW(), NOW());

-- Cardiologie
INSERT INTO public.types_actes (nom, description, tarif_defaut, specialite_id, duree_estimee, ordre_affichage, actif, created_at, updated_at)
VALUES
    ('Consultation cardiologique', 'Consultation spécialisée en cardiologie avec examen cardiovasculaire', 10000.00,
     (SELECT id FROM public.specialites WHERE nom = 'Cardiologie' LIMIT 1), 30, 1, true, NOW(), NOW()),
    
    ('Électrocardiogramme (ECG)', 'Électrocardiogramme 12 dérivations avec interprétation', 20000.00,
     (SELECT id FROM public.specialites WHERE nom = 'Cardiologie' LIMIT 1), 15, 2, true, NOW(), NOW()),
    
    ('Échographie cardiaque', 'Échographie cardiaque transthoracique (échocardiographie)', 30000.00,
     (SELECT id FROM public.specialites WHERE nom = 'Cardiologie' LIMIT 1), 30, 3, true, NOW(), NOW()),
    
    ('Holter tensionnel 24h', 'Mise en place et retrait d''un holter tensionnel 24 heures', 40000.00,
     (SELECT id FROM public.specialites WHERE nom = 'Cardiologie' LIMIT 1), 20, 4, true, NOW(), NOW()),
    
    ('Holter ECG 24h', 'Mise en place et retrait d''un holter ECG 24 heures', 35000.00,
     (SELECT id FROM public.specialites WHERE nom = 'Cardiologie' LIMIT 1), 20, 5, true, NOW(), NOW()),
    
    ('Test d''effort', 'Test d''effort sur tapis roulant avec monitoring ECG', 50000.00,
     (SELECT id FROM public.specialites WHERE nom = 'Cardiologie' LIMIT 1), 60, 6, true, NOW(), NOW()),
    
    ('Échographie doppler cardiaque', 'Échographie doppler cardiaque avec étude des flux', 35000.00,
     (SELECT id FROM public.specialites WHERE nom = 'Cardiologie' LIMIT 1), 40, 7, true, NOW(), NOW()),
    
    ('Consultation de suivi cardiologique', 'Consultation de suivi en cardiologie', 8000.00,
     (SELECT id FROM public.specialites WHERE nom = 'Cardiologie' LIMIT 1), 20, 8, true, NOW(), NOW()),
    
    ('Échographie doppler des vaisseaux', 'Échographie doppler des artères et veines', 30000.00,
     (SELECT id FROM public.specialites WHERE nom = 'Cardiologie' LIMIT 1), 30, 9, true, NOW(), NOW()),
    
    ('Radiographie thorax', 'Radiographie du thorax de face et profil', 15000.00,
     (SELECT id FROM public.specialites WHERE nom = 'Cardiologie' LIMIT 1), 15, 10, true, NOW(), NOW()),
    
    ('Épreuve d''effort cardiaque', 'Épreuve d''effort avec monitoring continu', 45000.00,
     (SELECT id FROM public.specialites WHERE nom = 'Cardiologie' LIMIT 1), 60, 11, true, NOW(), NOW()),
    
    ('Échographie de stress', 'Échographie cardiaque de stress', 40000.00,
     (SELECT id FROM public.specialites WHERE nom = 'Cardiologie' LIMIT 1), 45, 12, true, NOW(), NOW()),
    
    ('Cathétérisme cardiaque diagnostique', 'Cathétérisme cardiaque pour diagnostic', 150000.00,
     (SELECT id FROM public.specialites WHERE nom = 'Cardiologie' LIMIT 1), 120, 13, true, NOW(), NOW()),
    
    ('Angioplastie coronaire', 'Angioplastie coronaire avec pose de stent', 200000.00,
     (SELECT id FROM public.specialites WHERE nom = 'Cardiologie' LIMIT 1), 180, 14, true, NOW(), NOW()),
    
    ('Pacemaker temporaire', 'Mise en place d''un pacemaker temporaire', 80000.00,
     (SELECT id FROM public.specialites WHERE nom = 'Cardiologie' LIMIT 1), 60, 15, true, NOW(), NOW()),
    
    ('Défibrillation externe', 'Défibrillation cardiaque externe', 50000.00,
     (SELECT id FROM public.specialites WHERE nom = 'Cardiologie' LIMIT 1), 30, 16, true, NOW(), NOW()),
    
    ('Cardioversion électrique', 'Cardioversion électrique programmée', 60000.00,
     (SELECT id FROM public.specialites WHERE nom = 'Cardiologie' LIMIT 1), 45, 17, true, NOW(), NOW()),
    
    ('Échographie cardiaque transœsophagienne', 'Échographie cardiaque par voie transœsophagienne', 45000.00,
     (SELECT id FROM public.specialites WHERE nom = 'Cardiologie' LIMIT 1), 40, 18, true, NOW(), NOW()),
    
    ('Scintigraphie myocardique', 'Scintigraphie de perfusion myocardique', 80000.00,
     (SELECT id FROM public.specialites WHERE nom = 'Cardiologie' LIMIT 1), 90, 19, true, NOW(), NOW()),
    
    ('IRM cardiaque', 'Imagerie par résonance magnétique cardiaque', 100000.00,
     (SELECT id FROM public.specialites WHERE nom = 'Cardiologie' LIMIT 1), 60, 20, true, NOW(), NOW()),
    
    ('Scanner cardiaque', 'Scanner cardiaque avec injection de produit de contraste', 90000.00,
     (SELECT id FROM public.specialites WHERE nom = 'Cardiologie' LIMIT 1), 30, 21, true, NOW(), NOW()),
    
    ('Épreuve fonctionnelle respiratoire', 'Épreuve fonctionnelle respiratoire complète', 25000.00,
     (SELECT id FROM public.specialites WHERE nom = 'Cardiologie' LIMIT 1), 45, 22, true, NOW(), NOW()),
    
    ('Mesure de la pression artérielle ambulatoire', 'MAPA - Mesure ambulatoire de la pression artérielle 24h', 35000.00,
     (SELECT id FROM public.specialites WHERE nom = 'Cardiologie' LIMIT 1), 20, 23, true, NOW(), NOW()),
    
    ('Échographie doppler artériel', 'Échographie doppler des artères périphériques', 28000.00,
     (SELECT id FROM public.specialites WHERE nom = 'Cardiologie' LIMIT 1), 30, 24, true, NOW(), NOW()),
    
    ('Échographie doppler veineux', 'Échographie doppler des veines périphériques', 28000.00,
     (SELECT id FROM public.specialites WHERE nom = 'Cardiologie' LIMIT 1), 30, 25, true, NOW(), NOW()),
    
    ('Consultation pré-opératoire cardiologique', 'Consultation cardiologique pré-opératoire', 12000.00,
     (SELECT id FROM public.specialites WHERE nom = 'Cardiologie' LIMIT 1), 30, 26, true, NOW(), NOW()),
    
    ('Suivi post-infarctus', 'Consultation de suivi après infarctus du myocarde', 10000.00,
     (SELECT id FROM public.specialites WHERE nom = 'Cardiologie' LIMIT 1), 30, 27, true, NOW(), NOW()),
    
    ('Éducation thérapeutique cardiaque', 'Séance d''éducation thérapeutique en cardiologie', 8000.00,
     (SELECT id FROM public.specialites WHERE nom = 'Cardiologie' LIMIT 1), 45, 28, true, NOW(), NOW()),
    
    ('Réadaptation cardiaque', 'Séance de réadaptation cardiaque', 15000.00,
     (SELECT id FROM public.specialites WHERE nom = 'Cardiologie' LIMIT 1), 60, 29, true, NOW(), NOW()),
    
    ('Bilan lipidique complet', 'Bilan lipidique avec consultation cardiologique', 18000.00,
     (SELECT id FROM public.specialites WHERE nom = 'Cardiologie' LIMIT 1), 30, 30, true, NOW(), NOW());

-- Dermatologie
INSERT INTO public.types_actes (nom, description, tarif_defaut, specialite_id, duree_estimee, ordre_affichage, actif, created_at, updated_at)
VALUES
    ('Consultation dermatologique', 'Consultation spécialisée en dermatologie avec examen cutané', 10000.00,
     (SELECT id FROM public.specialites WHERE nom = 'Dermatologie' LIMIT 1), 25, 1, true, NOW(), NOW()),
    
    ('Examen à la lampe de Wood', 'Examen dermatologique à la lampe de Wood', 5000.00,
     (SELECT id FROM public.specialites WHERE nom = 'Dermatologie' LIMIT 1), 10, 2, true, NOW(), NOW()),
    
    ('Biopsie cutanée', 'Prélèvement biopsique d''une lésion cutanée', 15000.00,
     (SELECT id FROM public.specialites WHERE nom = 'Dermatologie' LIMIT 1), 20, 3, true, NOW(), NOW()),
    
    ('Cryothérapie', 'Traitement par cryothérapie d''une lésion cutanée', 8000.00,
     (SELECT id FROM public.specialites WHERE nom = 'Dermatologie' LIMIT 1), 10, 4, true, NOW(), NOW()),
    
    ('Électrocoagulation', 'Traitement par électrocoagulation d''une lésion cutanée', 10000.00,
     (SELECT id FROM public.specialites WHERE nom = 'Dermatologie' LIMIT 1), 15, 5, true, NOW(), NOW()),
    
    ('Exérèse de lésion cutanée', 'Exérèse chirurgicale d''une lésion cutanée bénigne', 12000.00,
     (SELECT id FROM public.specialites WHERE nom = 'Dermatologie' LIMIT 1), 25, 6, true, NOW(), NOW()),
    
    ('Dermoscopie', 'Examen dermoscopique d''une lésion cutanée', 8000.00,
     (SELECT id FROM public.specialites WHERE nom = 'Dermatologie' LIMIT 1), 15, 7, true, NOW(), NOW()),
    
    ('Consultation de suivi dermatologique', 'Consultation de suivi en dermatologie', 8000.00,
     (SELECT id FROM public.specialites WHERE nom = 'Dermatologie' LIMIT 1), 15, 8, true, NOW(), NOW()),
    
    ('Photothérapie', 'Traitement par photothérapie UV pour dermatoses', 20000.00,
     (SELECT id FROM public.specialites WHERE nom = 'Dermatologie' LIMIT 1), 30, 9, true, NOW(), NOW()),
    
    ('Exérèse de grain de beauté', 'Exérèse chirurgicale d''un grain de beauté', 15000.00,
     (SELECT id FROM public.specialites WHERE nom = 'Dermatologie' LIMIT 1), 20, 10, true, NOW(), NOW()),
    
    ('Exérèse de kyste', 'Exérèse chirurgicale d''un kyste cutané', 18000.00,
     (SELECT id FROM public.specialites WHERE nom = 'Dermatologie' LIMIT 1), 25, 11, true, NOW(), NOW()),
    
    ('Exérèse de lipome', 'Exérèse chirurgicale d''un lipome', 20000.00,
     (SELECT id FROM public.specialites WHERE nom = 'Dermatologie' LIMIT 1), 30, 12, true, NOW(), NOW()),
    
    ('Traitement de verrues', 'Traitement des verrues par cryothérapie ou électrocoagulation', 8000.00,
     (SELECT id FROM public.specialites WHERE nom = 'Dermatologie' LIMIT 1), 15, 13, true, NOW(), NOW()),
    
    ('Traitement de condylomes', 'Traitement des condylomes par cryothérapie', 12000.00,
     (SELECT id FROM public.specialites WHERE nom = 'Dermatologie' LIMIT 1), 20, 14, true, NOW(), NOW()),
    
    ('Peeling chimique', 'Peeling chimique pour traitement de l''acné ou des taches', 25000.00,
     (SELECT id FROM public.specialites WHERE nom = 'Dermatologie' LIMIT 1), 30, 15, true, NOW(), NOW()),
    
    ('Injection intralésionnelle', 'Injection intralésionnelle de corticoïdes', 10000.00,
     (SELECT id FROM public.specialites WHERE nom = 'Dermatologie' LIMIT 1), 10, 16, true, NOW(), NOW()),
    
    ('Curetage de lésion cutanée', 'Curetage d''une lésion cutanée bénigne', 12000.00,
     (SELECT id FROM public.specialites WHERE nom = 'Dermatologie' LIMIT 1), 15, 17, true, NOW(), NOW()),
    
    ('Traitement de l''acné', 'Consultation et traitement de l''acné', 10000.00,
     (SELECT id FROM public.specialites WHERE nom = 'Dermatologie' LIMIT 1), 25, 18, true, NOW(), NOW()),
    
    ('Traitement de l''eczéma', 'Consultation et traitement de l''eczéma', 10000.00,
     (SELECT id FROM public.specialites WHERE nom = 'Dermatologie' LIMIT 1), 25, 19, true, NOW(), NOW()),
    
    ('Traitement du psoriasis', 'Consultation et traitement du psoriasis', 12000.00,
     (SELECT id FROM public.specialites WHERE nom = 'Dermatologie' LIMIT 1), 30, 20, true, NOW(), NOW()),
    
    ('Traitement des mycoses cutanées', 'Consultation et traitement des mycoses cutanées', 10000.00,
     (SELECT id FROM public.specialites WHERE nom = 'Dermatologie' LIMIT 1), 20, 21, true, NOW(), NOW()),
    
    ('Traitement des infections cutanées', 'Consultation et traitement des infections cutanées bactériennes', 10000.00,
     (SELECT id FROM public.specialites WHERE nom = 'Dermatologie' LIMIT 1), 20, 22, true, NOW(), NOW()),
    
    ('Examen mycologique', 'Examen mycologique direct et culture', 8000.00,
     (SELECT id FROM public.specialites WHERE nom = 'Dermatologie' LIMIT 1), 10, 23, true, NOW(), NOW()),
    
    ('Test épicutané', 'Test épicutané pour allergie de contact', 15000.00,
     (SELECT id FROM public.specialites WHERE nom = 'Dermatologie' LIMIT 1), 30, 24, true, NOW(), NOW()),
    
    ('Traitement des cicatrices', 'Traitement des cicatrices par laser ou dermabrasion', 30000.00,
     (SELECT id FROM public.specialites WHERE nom = 'Dermatologie' LIMIT 1), 45, 25, true, NOW(), NOW()),
    
    ('Traitement des taches pigmentaires', 'Traitement des taches pigmentaires par laser', 35000.00,
     (SELECT id FROM public.specialites WHERE nom = 'Dermatologie' LIMIT 1), 30, 26, true, NOW(), NOW()),
    
    ('Traitement des tatouages', 'Traitement d''ablation de tatouage par laser', 40000.00,
     (SELECT id FROM public.specialites WHERE nom = 'Dermatologie' LIMIT 1), 30, 27, true, NOW(), NOW()),
    
    ('Consultation esthétique', 'Consultation en dermatologie esthétique', 15000.00,
     (SELECT id FROM public.specialites WHERE nom = 'Dermatologie' LIMIT 1), 30, 28, true, NOW(), NOW()),
    
    ('Traitement de la chute de cheveux', 'Consultation et traitement de l''alopécie', 12000.00,
     (SELECT id FROM public.specialites WHERE nom = 'Dermatologie' LIMIT 1), 25, 29, true, NOW(), NOW()),
    
    ('Bilan dermatologique complet', 'Bilan dermatologique complet avec examens', 18000.00,
     (SELECT id FROM public.specialites WHERE nom = 'Dermatologie' LIMIT 1), 45, 30, true, NOW(), NOW());

-- Gynécologie
INSERT INTO public.types_actes (nom, description, tarif_defaut, specialite_id, duree_estimee, ordre_affichage, actif, created_at, updated_at)
VALUES
    ('Consultation gynécologique', 'Consultation spécialisée en gynécologie avec examen gynécologique', 10000.00,
     (SELECT id FROM public.specialites WHERE nom = 'Gynécologie' LIMIT 1), 30, 1, true, NOW(), NOW()),
    
    ('Examen gynécologique', 'Examen gynécologique avec spéculum', 8000.00,
     (SELECT id FROM public.specialites WHERE nom = 'Gynécologie' LIMIT 1), 15, 2, true, NOW(), NOW()),
    
    ('Échographie pelvienne', 'Échographie pelvienne par voie endovaginale ou sus-pubienne', 25000.00,
     (SELECT id FROM public.specialites WHERE nom = 'Gynécologie' LIMIT 1), 20, 3, true, NOW(), NOW()),
    
    ('Échographie obstétricale', 'Échographie obstétricale avec biométrie fœtale', 30000.00,
     (SELECT id FROM public.specialites WHERE nom = 'Gynécologie' LIMIT 1), 30, 4, true, NOW(), NOW()),
    
    ('Frottis cervico-vaginal', 'Prélèvement pour frottis cervico-vaginal (dépistage)', 8000.00,
     (SELECT id FROM public.specialites WHERE nom = 'Gynécologie' LIMIT 1), 10, 5, true, NOW(), NOW()),
    
    ('Colposcopie', 'Examen colposcopique du col utérin', 15000.00,
     (SELECT id FROM public.specialites WHERE nom = 'Gynécologie' LIMIT 1), 20, 6, true, NOW(), NOW()),
    
    ('Pose de stérilet', 'Pose d''un dispositif intra-utérin (stérilet)', 20000.00,
     (SELECT id FROM public.specialites WHERE nom = 'Gynécologie' LIMIT 1), 20, 7, true, NOW(), NOW()),
    
    ('Ablation de stérilet', 'Ablation d''un dispositif intra-utérin', 10000.00,
     (SELECT id FROM public.specialites WHERE nom = 'Gynécologie' LIMIT 1), 10, 8, true, NOW(), NOW()),
    
    ('Consultation prénatale', 'Consultation de suivi de grossesse', 8000.00,
     (SELECT id FROM public.specialites WHERE nom = 'Gynécologie' LIMIT 1), 25, 9, true, NOW(), NOW()),
    
    ('Consultation de suivi gynécologique', 'Consultation de suivi en gynécologie', 8000.00,
     (SELECT id FROM public.specialites WHERE nom = 'Gynécologie' LIMIT 1), 20, 10, true, NOW(), NOW()),
    
    ('Échographie doppler obstétricale', 'Échographie doppler pour surveillance fœtale', 35000.00,
     (SELECT id FROM public.specialites WHERE nom = 'Gynécologie' LIMIT 1), 30, 11, true, NOW(), NOW()),
    
    ('Échographie de datation', 'Échographie de datation de grossesse', 25000.00,
     (SELECT id FROM public.specialites WHERE nom = 'Gynécologie' LIMIT 1), 20, 12, true, NOW(), NOW()),
    
    ('Échographie morphologique', 'Échographie morphologique du 2ème trimestre', 35000.00,
     (SELECT id FROM public.specialites WHERE nom = 'Gynécologie' LIMIT 1), 45, 13, true, NOW(), NOW()),
    
    ('Consultation post-partum', 'Consultation de suivi après accouchement', 8000.00,
     (SELECT id FROM public.specialites WHERE nom = 'Gynécologie' LIMIT 1), 25, 14, true, NOW(), NOW()),
    
    ('Consultation de contraception', 'Consultation pour choix et suivi de contraception', 8000.00,
     (SELECT id FROM public.specialites WHERE nom = 'Gynécologie' LIMIT 1), 25, 15, true, NOW(), NOW()),
    
    ('Pose d''implant contraceptif', 'Pose d''un implant contraceptif sous-cutané', 25000.00,
     (SELECT id FROM public.specialites WHERE nom = 'Gynécologie' LIMIT 1), 20, 16, true, NOW(), NOW()),
    
    ('Ablation d''implant contraceptif', 'Ablation d''un implant contraceptif', 15000.00,
     (SELECT id FROM public.specialites WHERE nom = 'Gynécologie' LIMIT 1), 15, 17, true, NOW(), NOW()),
    
    ('Hystéroscopie diagnostique', 'Hystéroscopie diagnostique de la cavité utérine', 40000.00,
     (SELECT id FROM public.specialites WHERE nom = 'Gynécologie' LIMIT 1), 30, 18, true, NOW(), NOW()),
    
    ('Curetage utérin', 'Curetage de la cavité utérine', 35000.00,
     (SELECT id FROM public.specialites WHERE nom = 'Gynécologie' LIMIT 1), 30, 19, true, NOW(), NOW()),
    
    ('Biopsie endométriale', 'Prélèvement biopsique de l''endomètre', 20000.00,
     (SELECT id FROM public.specialites WHERE nom = 'Gynécologie' LIMIT 1), 20, 20, true, NOW(), NOW()),
    
    ('Conisation du col utérin', 'Conisation du col utérin pour lésions précancéreuses', 50000.00,
     (SELECT id FROM public.specialites WHERE nom = 'Gynécologie' LIMIT 1), 45, 21, true, NOW(), NOW()),
    
    ('Cautérisation du col utérin', 'Cautérisation du col utérin', 25000.00,
     (SELECT id FROM public.specialites WHERE nom = 'Gynécologie' LIMIT 1), 20, 22, true, NOW(), NOW()),
    
    ('Dilatation du col utérin', 'Dilatation du col utérin pour gestes endo-utérins', 20000.00,
     (SELECT id FROM public.specialites WHERE nom = 'Gynécologie' LIMIT 1), 15, 23, true, NOW(), NOW()),
    
    ('Hystérosalpingographie', 'Hystérosalpingographie pour exploration de la fertilité', 40000.00,
     (SELECT id FROM public.specialites WHERE nom = 'Gynécologie' LIMIT 1), 30, 24, true, NOW(), NOW()),
    
    ('Consultation d''infertilité', 'Consultation spécialisée pour problèmes d''infertilité', 15000.00,
     (SELECT id FROM public.specialites WHERE nom = 'Gynécologie' LIMIT 1), 45, 25, true, NOW(), NOW()),
    
    ('Suivi de grossesse à risque', 'Consultation de suivi de grossesse à risque', 12000.00,
     (SELECT id FROM public.specialites WHERE nom = 'Gynécologie' LIMIT 1), 30, 26, true, NOW(), NOW()),
    
    ('Consultation de ménopause', 'Consultation spécialisée pour troubles de la ménopause', 10000.00,
     (SELECT id FROM public.specialites WHERE nom = 'Gynécologie' LIMIT 1), 30, 27, true, NOW(), NOW()),
    
    ('Traitement des infections génitales', 'Consultation et traitement des infections génitales', 10000.00,
     (SELECT id FROM public.specialites WHERE nom = 'Gynécologie' LIMIT 1), 25, 28, true, NOW(), NOW()),
    
    ('Consultation de troubles menstruels', 'Consultation pour troubles du cycle menstruel', 10000.00,
     (SELECT id FROM public.specialites WHERE nom = 'Gynécologie' LIMIT 1), 25, 29, true, NOW(), NOW()),
    
    ('Bilan gynécologique complet', 'Bilan gynécologique complet avec examens', 20000.00,
     (SELECT id FROM public.specialites WHERE nom = 'Gynécologie' LIMIT 1), 45, 30, true, NOW(), NOW());

-- Pédiatrie
INSERT INTO public.types_actes (nom, description, tarif_defaut, specialite_id, duree_estimee, ordre_affichage, actif, created_at, updated_at)
VALUES
    ('Consultation pédiatrique', 'Consultation médicale spécialisée pour enfant', 8000.00,
     (SELECT id FROM public.specialites WHERE nom = 'Pédiatrie' LIMIT 1), 25, 1, true, NOW(), NOW()),
    
    ('Consultation nouveau-né', 'Consultation médicale pour nouveau-né (première consultation)', 10000.00,
     (SELECT id FROM public.specialites WHERE nom = 'Pédiatrie' LIMIT 1), 30, 2, true, NOW(), NOW()),
    
    ('Vaccination pédiatrique', 'Administration d''un vaccin à un enfant', 5000.00,
     (SELECT id FROM public.specialites WHERE nom = 'Pédiatrie' LIMIT 1), 10, 3, true, NOW(), NOW()),
    
    ('Courbe de croissance', 'Établissement et suivi de la courbe de croissance de l''enfant', 2000.00,
     (SELECT id FROM public.specialites WHERE nom = 'Pédiatrie' LIMIT 1), 10, 4, true, NOW(), NOW()),
    
    ('Bilan de santé enfant', 'Bilan de santé complet de l''enfant avec examens', 10000.00,
     (SELECT id FROM public.specialites WHERE nom = 'Pédiatrie' LIMIT 1), 40, 5, true, NOW(), NOW()),
    
    ('Examen de développement', 'Évaluation du développement psychomoteur de l''enfant', 6000.00,
     (SELECT id FROM public.specialites WHERE nom = 'Pédiatrie' LIMIT 1), 30, 6, true, NOW(), NOW()),
    
    ('Consultation de suivi pédiatrique', 'Consultation de suivi en pédiatrie', 6000.00,
     (SELECT id FROM public.specialites WHERE nom = 'Pédiatrie' LIMIT 1), 20, 7, true, NOW(), NOW()),
    
    ('Consultation urgente pédiatrique', 'Consultation pédiatrique en urgence', 12000.00,
     (SELECT id FROM public.specialites WHERE nom = 'Pédiatrie' LIMIT 1), 30, 8, true, NOW(), NOW()),
    
    ('Consultation de suivi néonatal', 'Consultation de suivi pour nouveau-né', 10000.00,
     (SELECT id FROM public.specialites WHERE nom = 'Pédiatrie' LIMIT 1), 30, 9, true, NOW(), NOW()),
    
    ('Bilan de santé scolaire', 'Bilan de santé pour entrée à l''école', 12000.00,
     (SELECT id FROM public.specialites WHERE nom = 'Pédiatrie' LIMIT 1), 40, 10, true, NOW(), NOW()),
    
    ('Consultation de puberté', 'Consultation spécialisée pour troubles de la puberté', 10000.00,
     (SELECT id FROM public.specialites WHERE nom = 'Pédiatrie' LIMIT 1), 30, 11, true, NOW(), NOW()),
    
    ('Consultation d''allaitement', 'Consultation pour conseil en allaitement maternel', 8000.00,
     (SELECT id FROM public.specialites WHERE nom = 'Pédiatrie' LIMIT 1), 30, 12, true, NOW(), NOW()),
    
    ('Consultation de nutrition pédiatrique', 'Consultation pour troubles nutritionnels de l''enfant', 10000.00,
     (SELECT id FROM public.specialites WHERE nom = 'Pédiatrie' LIMIT 1), 30, 13, true, NOW(), NOW()),
    
    ('Test de dépistage néonatal', 'Test de dépistage néonatal (phénylcétonurie, hypothyroïdie)', 8000.00,
     (SELECT id FROM public.specialites WHERE nom = 'Pédiatrie' LIMIT 1), 15, 14, true, NOW(), NOW()),
    
    ('Mesure de la taille et du poids', 'Mesure anthropométrique avec interprétation', 3000.00,
     (SELECT id FROM public.specialites WHERE nom = 'Pédiatrie' LIMIT 1), 10, 15, true, NOW(), NOW()),
    
    ('Test de développement psychomoteur', 'Évaluation complète du développement psychomoteur', 12000.00,
     (SELECT id FROM public.specialites WHERE nom = 'Pédiatrie' LIMIT 1), 45, 16, true, NOW(), NOW()),
    
    ('Consultation pour troubles du sommeil', 'Consultation pour troubles du sommeil chez l''enfant', 8000.00,
     (SELECT id FROM public.specialites WHERE nom = 'Pédiatrie' LIMIT 1), 25, 17, true, NOW(), NOW()),
    
    ('Consultation pour troubles du comportement', 'Consultation pour troubles du comportement de l''enfant', 10000.00,
     (SELECT id FROM public.specialites WHERE nom = 'Pédiatrie' LIMIT 1), 40, 18, true, NOW(), NOW()),
    
    ('Consultation d''asthme pédiatrique', 'Consultation spécialisée pour asthme de l''enfant', 10000.00,
     (SELECT id FROM public.specialites WHERE nom = 'Pédiatrie' LIMIT 1), 30, 19, true, NOW(), NOW()),
    
    ('Consultation d''allergie pédiatrique', 'Consultation pour allergies de l''enfant', 10000.00,
     (SELECT id FROM public.specialites WHERE nom = 'Pédiatrie' LIMIT 1), 30, 20, true, NOW(), NOW()),
    
    ('Test cutané allergique', 'Test cutané pour identification d''allergènes', 15000.00,
     (SELECT id FROM public.specialites WHERE nom = 'Pédiatrie' LIMIT 1), 30, 21, true, NOW(), NOW()),
    
    ('Consultation de dermatologie pédiatrique', 'Consultation pour affections cutanées de l''enfant', 10000.00,
     (SELECT id FROM public.specialites WHERE nom = 'Pédiatrie' LIMIT 1), 25, 22, true, NOW(), NOW()),
    
    ('Consultation de gastro-entérologie pédiatrique', 'Consultation pour troubles digestifs de l''enfant', 10000.00,
     (SELECT id FROM public.specialites WHERE nom = 'Pédiatrie' LIMIT 1), 30, 23, true, NOW(), NOW()),
    
    ('Consultation de neurologie pédiatrique', 'Consultation pour troubles neurologiques de l''enfant', 12000.00,
     (SELECT id FROM public.specialites WHERE nom = 'Pédiatrie' LIMIT 1), 40, 24, true, NOW(), NOW()),
    
    ('Électroencéphalogramme pédiatrique', 'EEG pour enfant', 25000.00,
     (SELECT id FROM public.specialites WHERE nom = 'Pédiatrie' LIMIT 1), 45, 25, true, NOW(), NOW()),
    
    ('Consultation de cardiologie pédiatrique', 'Consultation cardiologique pour enfant', 12000.00,
     (SELECT id FROM public.specialites WHERE nom = 'Pédiatrie' LIMIT 1), 30, 26, true, NOW(), NOW()),
    
    ('Échographie cardiaque pédiatrique', 'Échographie cardiaque pour enfant', 30000.00,
     (SELECT id FROM public.specialites WHERE nom = 'Pédiatrie' LIMIT 1), 30, 27, true, NOW(), NOW()),
    
    ('Consultation d''endocrinologie pédiatrique', 'Consultation pour troubles endocriniens de l''enfant', 12000.00,
     (SELECT id FROM public.specialites WHERE nom = 'Pédiatrie' LIMIT 1), 35, 28, true, NOW(), NOW()),
    
    ('Consultation d''hématologie pédiatrique', 'Consultation pour troubles hématologiques de l''enfant', 12000.00,
     (SELECT id FROM public.specialites WHERE nom = 'Pédiatrie' LIMIT 1), 35, 29, true, NOW(), NOW()),
    
    ('Bilan pédiatrique complet', 'Bilan pédiatrique complet avec examens spécialisés', 20000.00,
     (SELECT id FROM public.specialites WHERE nom = 'Pédiatrie' LIMIT 1), 60, 30, true, NOW(), NOW());

-- =====================================================
-- 3. VÉRIFICATION DES DONNÉES INSÉRÉES
-- =====================================================

-- Afficher un résumé des actes insérés par spécialité
DO $$
DECLARE
    total_actes INTEGER;
    actes_med_gen INTEGER;
    actes_cardio INTEGER;
    actes_dermato INTEGER;
    actes_gyneco INTEGER;
    actes_pediatrie INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_actes FROM public.types_actes WHERE actif = true;
    SELECT COUNT(*) INTO actes_med_gen FROM public.types_actes WHERE actif = true AND specialite_id = (SELECT id FROM public.specialites WHERE nom = 'Médecine générale' LIMIT 1);
    SELECT COUNT(*) INTO actes_cardio FROM public.types_actes WHERE actif = true AND specialite_id = (SELECT id FROM public.specialites WHERE nom = 'Cardiologie' LIMIT 1);
    SELECT COUNT(*) INTO actes_dermato FROM public.types_actes WHERE actif = true AND specialite_id = (SELECT id FROM public.specialites WHERE nom = 'Dermatologie' LIMIT 1);
    SELECT COUNT(*) INTO actes_gyneco FROM public.types_actes WHERE actif = true AND specialite_id = (SELECT id FROM public.specialites WHERE nom = 'Gynécologie' LIMIT 1);
    SELECT COUNT(*) INTO actes_pediatrie FROM public.types_actes WHERE actif = true AND specialite_id = (SELECT id FROM public.specialites WHERE nom = 'Pédiatrie' LIMIT 1);
    
    RAISE NOTICE 'Migration terminée avec succès';
    RAISE NOTICE 'Total d''actes actifs: %', total_actes;
    RAISE NOTICE 'Médecine générale: % actes', actes_med_gen;
    RAISE NOTICE 'Cardiologie: % actes', actes_cardio;
    RAISE NOTICE 'Dermatologie: % actes', actes_dermato;
    RAISE NOTICE 'Gynécologie: % actes', actes_gyneco;
    RAISE NOTICE 'Pédiatrie: % actes', actes_pediatrie;
END $$;

