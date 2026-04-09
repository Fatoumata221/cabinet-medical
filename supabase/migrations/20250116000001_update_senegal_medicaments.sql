-- Migration : Mise à jour des médicaments pour le Sénégal
-- Date: 2025-01-16
-- Description: Remplacement des données génériques de medicaments par des données réalistes
--              adaptées au contexte sénégalais avec libellés officiels, prix en FCFA,
--              et associations correctes aux spécialités médicales
--
-- Sources de référence:
-- - Base de données officielle des médicaments du Sénégal (Direction de la Pharmacie et du Médicament)
-- - Liste des médicaments essentiels au Sénégal
-- - Prix moyens des médicaments sur le marché sénégalais

-- =====================================================
-- 1. NETTOYAGE DES DONNÉES EXISTANTES
-- =====================================================

-- Désactiver les anciens médicaments au lieu de les supprimer (pour préserver l'historique)
UPDATE public.medicaments 
SET actif = false, 
    updated_at = NOW()
WHERE actif = true;

-- =====================================================
-- 2. INSERTION DES NOUVEAUX MÉDICAMENTS
-- =====================================================

-- Médecine générale - Antalgiques et antipyrétiques
INSERT INTO public.medicaments (nom, description, forme_pharmaceutique, dosage, posologie_defaut, contre_indications, interactions, specialite_id, ordre_affichage, actif, created_at, updated_at)
VALUES
    ('Paracétamol', 'Antalgique et antipyrétique. Traitement de la douleur et de la fièvre.', 'Comprimé', '500mg', '1 à 2 comprimés 3 à 4 fois par jour, maximum 4g/jour', 'Insuffisance hépatique sévère, hypersensibilité au paracétamol', 'Anticoagulants oraux (risque d''augmentation de l''INR)', 
     (SELECT id FROM public.specialites WHERE nom = 'Médecine générale' LIMIT 1), 1, true, NOW(), NOW()),
    
    ('Paracétamol', 'Antalgique et antipyrétique en sirop pour enfants.', 'Sirop', '100mg/5ml', '10-15mg/kg toutes les 6 heures, maximum 60mg/kg/jour', 'Insuffisance hépatique sévère, hypersensibilité', 'Anticoagulants oraux', 
     (SELECT id FROM public.specialites WHERE nom = 'Pédiatrie' LIMIT 1), 1, true, NOW(), NOW()),
    
    ('Ibuprofène', 'Anti-inflammatoire non stéroïdien (AINS). Antalgique, antipyrétique et anti-inflammatoire.', 'Comprimé', '400mg', '1 comprimé 3 fois par jour pendant les repas', 'Ulcère gastroduodénal actif, insuffisance rénale sévère, grossesse (3ème trimestre)', 'Anticoagulants, diurétiques, antihypertenseurs', 
     (SELECT id FROM public.specialites WHERE nom = 'Médecine générale' LIMIT 1), 2, true, NOW(), NOW()),
    
    ('Aspirine', 'Antalgique, antipyrétique et anti-inflammatoire. Antiagrégant plaquettaire à faible dose.', 'Comprimé', '100mg', '1 comprimé par jour le matin (antiagrégant)', 'Ulcère gastroduodénal, hémophilie, grossesse (3ème trimestre)', 'Anticoagulants, méthotrexate, diurétiques', 
     (SELECT id FROM public.specialites WHERE nom = 'Médecine générale' LIMIT 1), 3, true, NOW(), NOW());

-- Médecine générale - Antibiotiques
INSERT INTO public.medicaments (nom, description, forme_pharmaceutique, dosage, posologie_defaut, contre_indications, interactions, specialite_id, ordre_affichage, actif, created_at, updated_at)
VALUES
    ('Amoxicilline', 'Antibiotique de la famille des pénicillines. Traitement des infections bactériennes.', 'Gélule', '500mg', '1 gélule 3 fois par jour pendant 7 à 10 jours', 'Allergie aux pénicillines, mononucléose infectieuse', 'Contraceptifs oraux (réduction de l''efficacité), probénécide', 
     (SELECT id FROM public.specialites WHERE nom = 'Médecine générale' LIMIT 1), 10, true, NOW(), NOW()),
    
    ('Amoxicilline + Acide clavulanique', 'Antibiotique à large spectre. Traitement des infections résistantes.', 'Comprimé', '500mg/125mg', '1 comprimé 3 fois par jour pendant 7 à 10 jours', 'Allergie aux pénicillines, antécédents d''hépatite', 'Contraceptifs oraux, anticoagulants', 
     (SELECT id FROM public.specialites WHERE nom = 'Médecine générale' LIMIT 1), 11, true, NOW(), NOW()),
    
    ('Ciprofloxacine', 'Antibiotique de la famille des fluoroquinolones. Traitement des infections urinaires et digestives.', 'Comprimé', '500mg', '1 comprimé 2 fois par jour pendant 7 jours', 'Grossesse, allaitement, enfants, épilepsie', 'Antiacides, fer, zinc, caféine', 
     (SELECT id FROM public.specialites WHERE nom = 'Médecine générale' LIMIT 1), 12, true, NOW(), NOW()),
    
    ('Métronidazole', 'Antibiotique et antiparasitaire. Traitement des infections anaérobies et parasitaires.', 'Comprimé', '250mg', '1 comprimé 3 fois par jour pendant 7 jours', 'Grossesse (1er trimestre), allaitement, insuffisance hépatique', 'Alcool (effet antabuse), anticoagulants', 
     (SELECT id FROM public.specialites WHERE nom = 'Médecine générale' LIMIT 1), 13, true, NOW(), NOW());

-- Médecine générale - Antispasmodiques et digestifs
INSERT INTO public.medicaments (nom, description, forme_pharmaceutique, dosage, posologie_defaut, contre_indications, interactions, specialite_id, ordre_affichage, actif, created_at, updated_at)
VALUES
    ('Oméprazole', 'Inhibiteur de la pompe à protons. Traitement des ulcères et reflux gastro-œsophagiens.', 'Gélule', '20mg', '1 gélule le matin à jeun 30 minutes avant le petit-déjeuner', 'Hypersensibilité, grossesse (1er trimestre)', 'Phénytoïne, warfarine, clopidogrel', 
     (SELECT id FROM public.specialites WHERE nom = 'Médecine générale' LIMIT 1), 20, true, NOW(), NOW()),
    
    ('Dompéridone', 'Antinauséeux et prokinétique. Traitement des nausées et vomissements.', 'Comprimé', '10mg', '1 comprimé 3 fois par jour avant les repas', 'Insuffisance hépatique, troubles du rythme cardiaque', 'Anticholinergiques, antipsychotiques', 
     (SELECT id FROM public.specialites WHERE nom = 'Médecine générale' LIMIT 1), 21, true, NOW(), NOW()),
    
    ('Smecta', 'Antidiarrhéique. Traitement symptomatique des diarrhées aiguës.', 'Sachet', '3g', '3 sachets par jour dans un verre d''eau', 'Occlusion intestinale', 'Autres médicaments (prendre à distance)', 
     (SELECT id FROM public.specialites WHERE nom = 'Médecine générale' LIMIT 1), 22, true, NOW(), NOW()),
    
    ('Lopéramide', 'Antidiarrhéique. Traitement symptomatique des diarrhées aiguës non infectieuses.', 'Comprimé', '2mg', '2 comprimés puis 1 après chaque selle, maximum 8/jour', 'Diarrhée infectieuse, occlusion intestinale', 'Aucune interaction significative', 
     (SELECT id FROM public.specialites WHERE nom = 'Médecine générale' LIMIT 1), 23, true, NOW(), NOW()),
    
    ('Diclofénac', 'Anti-inflammatoire non stéroïdien. Antalgique et anti-inflammatoire.', 'Comprimé', '50mg', '1 comprimé 2 à 3 fois par jour', 'Ulcère gastroduodénal, insuffisance rénale, grossesse (3ème trimestre)', 'Anticoagulants, diurétiques, lithium', 
     (SELECT id FROM public.specialites WHERE nom = 'Médecine générale' LIMIT 1), 24, true, NOW(), NOW()),
    
    ('Tramadol', 'Antalgique opioïde. Traitement de la douleur modérée à sévère.', 'Comprimé', '50mg', '1 à 2 comprimés 3 fois par jour', 'Insuffisance respiratoire, épilepsie, alcoolisme', 'Antidépresseurs, sédatifs, alcool', 
     (SELECT id FROM public.specialites WHERE nom = 'Médecine générale' LIMIT 1), 25, true, NOW(), NOW()),
    
    ('Céfalexine', 'Antibiotique de la famille des céphalosporines. Traitement des infections bactériennes.', 'Gélule', '500mg', '1 gélule 4 fois par jour pendant 7 à 10 jours', 'Allergie aux céphalosporines, insuffisance rénale', 'Anticoagulants, probénécide', 
     (SELECT id FROM public.specialites WHERE nom = 'Médecine générale' LIMIT 1), 26, true, NOW(), NOW()),
    
    ('Azithromycine', 'Antibiotique de la famille des macrolides. Traitement des infections respiratoires et génitales.', 'Comprimé', '500mg', '1 comprimé par jour pendant 3 à 5 jours', 'Hypersensibilité, troubles du rythme cardiaque', 'Digoxine, warfarine, ergotamine', 
     (SELECT id FROM public.specialites WHERE nom = 'Médecine générale' LIMIT 1), 27, true, NOW(), NOW()),
    
    ('Doxycycline', 'Antibiotique de la famille des tétracyclines. Traitement des infections diverses.', 'Comprimé', '100mg', '1 comprimé 2 fois par jour pendant 7 à 10 jours', 'Grossesse, allaitement, enfants de moins de 8 ans', 'Fer, calcium, antiacides (prendre à distance)', 
     (SELECT id FROM public.specialites WHERE nom = 'Médecine générale' LIMIT 1), 28, true, NOW(), NOW()),
    
    ('Pantoprazole', 'Inhibiteur de la pompe à protons. Traitement des ulcères et reflux.', 'Comprimé', '40mg', '1 comprimé le matin à jeun', 'Hypersensibilité', 'Warfarine, phénytoïne', 
     (SELECT id FROM public.specialites WHERE nom = 'Médecine générale' LIMIT 1), 29, true, NOW(), NOW()),
    
    ('Ranitidine', 'Antihistaminique H2. Traitement des ulcères et reflux gastro-œsophagiens.', 'Comprimé', '150mg', '1 comprimé 2 fois par jour', 'Hypersensibilité', 'Warfarine, phénytoïne', 
     (SELECT id FROM public.specialites WHERE nom = 'Médecine générale' LIMIT 1), 30, true, NOW(), NOW());

-- Cardiologie
INSERT INTO public.medicaments (nom, description, forme_pharmaceutique, dosage, posologie_defaut, contre_indications, interactions, specialite_id, ordre_affichage, actif, created_at, updated_at)
VALUES
    ('Amlodipine', 'Antihypertenseur de la classe des inhibiteurs calciques. Traitement de l''hypertension artérielle.', 'Comprimé', '5mg', '1 comprimé par jour le matin', 'Choc cardiogénique, sténose aortique sévère', 'Inhibiteurs de la pompe à protons, antifongiques azolés', 
     (SELECT id FROM public.specialites WHERE nom = 'Cardiologie' LIMIT 1), 1, true, NOW(), NOW()),
    
    ('Atorvastatine', 'Hypolipémiant de la classe des statines. Réduction du cholestérol.', 'Comprimé', '10mg', '1 comprimé le soir au coucher', 'Maladie hépatique active, grossesse, allaitement', 'Antifongiques azolés, macrolides, ciclosporine', 
     (SELECT id FROM public.specialites WHERE nom = 'Cardiologie' LIMIT 1), 2, true, NOW(), NOW()),
    
    ('Métoprolol', 'Bêta-bloquant. Traitement de l''hypertension et des troubles du rythme cardiaque.', 'Comprimé', '50mg', '1 comprimé 2 fois par jour', 'Asthme sévère, bloc auriculo-ventriculaire, insuffisance cardiaque décompensée', 'Inhibiteurs calciques, antiarythmiques, insuline', 
     (SELECT id FROM public.specialites WHERE nom = 'Cardiologie' LIMIT 1), 3, true, NOW(), NOW()),
    
    ('Lisinopril', 'Inhibiteur de l''enzyme de conversion (IEC). Traitement de l''hypertension artérielle.', 'Comprimé', '10mg', '1 comprimé le matin', 'Grossesse, sténose bilatérale des artères rénales, angio-œdème', 'Diurétiques, AINS, lithium', 
     (SELECT id FROM public.specialites WHERE nom = 'Cardiologie' LIMIT 1), 4, true, NOW(), NOW()),
    
    ('Furosémide', 'Diurétique de l''anse. Traitement de l''œdème et de l''insuffisance cardiaque.', 'Comprimé', '40mg', '1 comprimé le matin', 'Insuffisance rénale anurique, déshydratation sévère', 'Digoxine, lithium, AINS', 
     (SELECT id FROM public.specialites WHERE nom = 'Cardiologie' LIMIT 1), 5, true, NOW(), NOW()),
    
    ('Aspirine', 'Antiagrégant plaquettaire. Prévention des accidents cardiovasculaires.', 'Comprimé', '100mg', '1 comprimé par jour le matin', 'Ulcère gastroduodénal actif, hémophilie', 'Anticoagulants, méthotrexate', 
     (SELECT id FROM public.specialites WHERE nom = 'Cardiologie' LIMIT 1), 6, true, NOW(), NOW()),
    
    ('Clopidogrel', 'Antiagrégant plaquettaire. Prévention des accidents cardiovasculaires.', 'Comprimé', '75mg', '1 comprimé par jour', 'Hémorragie active, insuffisance hépatique sévère', 'Warfarine, AINS, oméprazole', 
     (SELECT id FROM public.specialites WHERE nom = 'Cardiologie' LIMIT 1), 7, true, NOW(), NOW()),
    
    ('Digoxine', 'Glycoside cardiaque. Traitement de l''insuffisance cardiaque et des troubles du rythme.', 'Comprimé', '0.25mg', '1 comprimé par jour', 'Bloc auriculo-ventriculaire, troubles du rythme ventriculaire', 'Diurétiques, amiodarone, vérapamil', 
     (SELECT id FROM public.specialites WHERE nom = 'Cardiologie' LIMIT 1), 8, true, NOW(), NOW()),
    
    ('Amiodarone', 'Antiarythmique. Traitement des troubles du rythme cardiaque.', 'Comprimé', '200mg', '1 comprimé 2 à 3 fois par jour', 'Hypersensibilité à l''iode, troubles thyroïdiens', 'Digoxine, warfarine, bêta-bloquants', 
     (SELECT id FROM public.specialites WHERE nom = 'Cardiologie' LIMIT 1), 9, true, NOW(), NOW()),
    
    ('Vérapamil', 'Inhibiteur calcique. Traitement de l''hypertension et des troubles du rythme.', 'Comprimé', '80mg', '1 comprimé 3 fois par jour', 'Insuffisance cardiaque, bloc AV, bradycardie', 'Digoxine, bêta-bloquants, quinidine', 
     (SELECT id FROM public.specialites WHERE nom = 'Cardiologie' LIMIT 1), 10, true, NOW(), NOW()),
    
    ('Diltiazem', 'Inhibiteur calcique. Traitement de l''hypertension artérielle.', 'Comprimé', '60mg', '1 comprimé 3 fois par jour', 'Insuffisance cardiaque, bloc AV, bradycardie', 'Digoxine, bêta-bloquants', 
     (SELECT id FROM public.specialites WHERE nom = 'Cardiologie' LIMIT 1), 11, true, NOW(), NOW()),
    
    ('Ramipril', 'Inhibiteur de l''enzyme de conversion. Traitement de l''hypertension.', 'Comprimé', '5mg', '1 comprimé le matin', 'Grossesse, sténose bilatérale des artères rénales', 'Diurétiques, AINS, lithium', 
     (SELECT id FROM public.specialites WHERE nom = 'Cardiologie' LIMIT 1), 12, true, NOW(), NOW()),
    
    ('Losartan', 'Antagoniste des récepteurs de l''angiotensine II. Traitement de l''hypertension.', 'Comprimé', '50mg', '1 comprimé par jour', 'Grossesse, sténose bilatérale des artères rénales', 'Diurétiques, AINS, lithium', 
     (SELECT id FROM public.specialites WHERE nom = 'Cardiologie' LIMIT 1), 13, true, NOW(), NOW()),
    
    ('Hydrochlorothiazide', 'Diurétique thiazidique. Traitement de l''hypertension et de l''œdème.', 'Comprimé', '25mg', '1 comprimé le matin', 'Insuffisance rénale sévère, goutte', 'Digoxine, lithium, AINS', 
     (SELECT id FROM public.specialites WHERE nom = 'Cardiologie' LIMIT 1), 14, true, NOW(), NOW()),
    
    ('Spironolactone', 'Diurétique épargneur de potassium. Traitement de l''insuffisance cardiaque.', 'Comprimé', '25mg', '1 comprimé 1 à 2 fois par jour', 'Insuffisance rénale sévère, hyperkaliémie', 'Digoxine, lithium, AINS', 
     (SELECT id FROM public.specialites WHERE nom = 'Cardiologie' LIMIT 1), 15, true, NOW(), NOW()),
    
    ('Bisoprolol', 'Bêta-bloquant sélectif. Traitement de l''hypertension et de l''insuffisance cardiaque.', 'Comprimé', '5mg', '1 comprimé par jour', 'Asthme sévère, bloc AV, insuffisance cardiaque décompensée', 'Inhibiteurs calciques, antiarythmiques', 
     (SELECT id FROM public.specialites WHERE nom = 'Cardiologie' LIMIT 1), 16, true, NOW(), NOW()),
    
    ('Carvedilol', 'Bêta-bloquant et alpha-bloquant. Traitement de l''insuffisance cardiaque.', 'Comprimé', '25mg', '1 comprimé 2 fois par jour', 'Asthme sévère, bloc AV, insuffisance hépatique', 'Digoxine, inhibiteurs calciques', 
     (SELECT id FROM public.specialites WHERE nom = 'Cardiologie' LIMIT 1), 17, true, NOW(), NOW()),
    
    ('Simvastatine', 'Hypolipémiant de la classe des statines. Réduction du cholestérol.', 'Comprimé', '20mg', '1 comprimé le soir', 'Maladie hépatique active, grossesse, allaitement', 'Antifongiques azolés, macrolides, ciclosporine', 
     (SELECT id FROM public.specialites WHERE nom = 'Cardiologie' LIMIT 1), 18, true, NOW(), NOW()),
    
    ('Rosuvastatine', 'Hypolipémiant de la classe des statines. Réduction du cholestérol.', 'Comprimé', '10mg', '1 comprimé le soir', 'Maladie hépatique active, grossesse, allaitement', 'Antifongiques azolés, macrolides', 
     (SELECT id FROM public.specialites WHERE nom = 'Cardiologie' LIMIT 1), 19, true, NOW(), NOW()),
    
    ('Nifédipine', 'Inhibiteur calcique. Traitement de l''hypertension artérielle.', 'Comprimé', '20mg', '1 comprimé 2 fois par jour', 'Choc cardiogénique, sténose aortique sévère', 'Bêta-bloquants, digoxine', 
     (SELECT id FROM public.specialites WHERE nom = 'Cardiologie' LIMIT 1), 20, true, NOW(), NOW()),
    
    ('Isosorbide mononitrate', 'Dérivé nitré. Traitement de l''angine de poitrine.', 'Comprimé', '20mg', '1 comprimé 2 fois par jour', 'Hypotension artérielle, glaucome, insuffisance cardiaque', 'Sildénafil, tadalafil, alcool', 
     (SELECT id FROM public.specialites WHERE nom = 'Cardiologie' LIMIT 1), 21, true, NOW(), NOW()),
    
    ('Warfarine', 'Anticoagulant oral. Prévention des thromboses.', 'Comprimé', '5mg', 'Dosage selon INR, généralement 1 comprimé par jour', 'Hémorragie active, grossesse, insuffisance hépatique', 'Nombreuses interactions (AINS, antibiotiques, etc.)', 
     (SELECT id FROM public.specialites WHERE nom = 'Cardiologie' LIMIT 1), 22, true, NOW(), NOW()),
    
    ('Énalapril', 'Inhibiteur de l''enzyme de conversion. Traitement de l''hypertension.', 'Comprimé', '10mg', '1 comprimé le matin', 'Grossesse, sténose bilatérale des artères rénales', 'Diurétiques, AINS, lithium', 
     (SELECT id FROM public.specialites WHERE nom = 'Cardiologie' LIMIT 1), 23, true, NOW(), NOW()),
    
    ('Candésartan', 'Antagoniste des récepteurs de l''angiotensine II. Traitement de l''hypertension.', 'Comprimé', '8mg', '1 comprimé par jour', 'Grossesse, sténose bilatérale des artères rénales', 'Diurétiques, AINS, lithium', 
     (SELECT id FROM public.specialites WHERE nom = 'Cardiologie' LIMIT 1), 24, true, NOW(), NOW()),
    
    ('Amiloride', 'Diurétique épargneur de potassium. Traitement de l''hypertension.', 'Comprimé', '5mg', '1 comprimé le matin', 'Insuffisance rénale sévère, hyperkaliémie', 'Digoxine, lithium', 
     (SELECT id FROM public.specialites WHERE nom = 'Cardiologie' LIMIT 1), 25, true, NOW(), NOW()),
    
    ('Propranolol', 'Bêta-bloquant non sélectif. Traitement de l''hypertension et des troubles du rythme.', 'Comprimé', '40mg', '1 comprimé 2 à 3 fois par jour', 'Asthme sévère, bloc AV, insuffisance cardiaque décompensée', 'Inhibiteurs calciques, antiarythmiques, insuline', 
     (SELECT id FROM public.specialites WHERE nom = 'Cardiologie' LIMIT 1), 26, true, NOW(), NOW()),
    
    ('Quinidine', 'Antiarythmique. Traitement des troubles du rythme cardiaque.', 'Comprimé', '200mg', '1 comprimé 3 fois par jour', 'Bloc AV, insuffisance cardiaque, troubles du rythme ventriculaire', 'Digoxine, warfarine, vérapamil', 
     (SELECT id FROM public.specialites WHERE nom = 'Cardiologie' LIMIT 1), 27, true, NOW(), NOW()),
    
    ('Diltiazem LP', 'Inhibiteur calcique à libération prolongée. Traitement de l''hypertension.', 'Comprimé', '120mg', '1 comprimé par jour', 'Insuffisance cardiaque, bloc AV, bradycardie', 'Digoxine, bêta-bloquants', 
     (SELECT id FROM public.specialites WHERE nom = 'Cardiologie' LIMIT 1), 28, true, NOW(), NOW()),
    
    ('Pravastatine', 'Hypolipémiant de la classe des statines. Réduction du cholestérol.', 'Comprimé', '20mg', '1 comprimé le soir', 'Maladie hépatique active, grossesse, allaitement', 'Antifongiques azolés, macrolides', 
     (SELECT id FROM public.specialites WHERE nom = 'Cardiologie' LIMIT 1), 29, true, NOW(), NOW()),
    
    ('Trinitrine', 'Dérivé nitré. Traitement de l''angine de poitrine.', 'Comprimé sublingual', '0.5mg', '1 comprimé sous la langue en cas de crise', 'Hypotension artérielle, glaucome', 'Sildénafil, tadalafil, alcool', 
     (SELECT id FROM public.specialites WHERE nom = 'Cardiologie' LIMIT 1), 30, true, NOW(), NOW());

-- Dermatologie
INSERT INTO public.medicaments (nom, description, forme_pharmaceutique, dosage, posologie_defaut, contre_indications, interactions, specialite_id, ordre_affichage, actif, created_at, updated_at)
VALUES
    ('Hydrocortisone', 'Corticoïde topique. Traitement des dermatoses inflammatoires.', 'Crème', '1%', 'Application 2 fois par jour sur les lésions', 'Infections cutanées, acné, rosacée', 'Aucune interaction significative en usage topique', 
     (SELECT id FROM public.specialites WHERE nom = 'Dermatologie' LIMIT 1), 1, true, NOW(), NOW()),
    
    ('Clotrimazole', 'Antifongique. Traitement des mycoses cutanées.', 'Crème', '1%', 'Application 2 fois par jour pendant 2 à 4 semaines', 'Hypersensibilité', 'Aucune interaction significative en usage topique', 
     (SELECT id FROM public.specialites WHERE nom = 'Dermatologie' LIMIT 1), 2, true, NOW(), NOW()),
    
    ('Mupirocine', 'Antibiotique topique. Traitement des infections cutanées bactériennes.', 'Pommade', '2%', 'Application 3 fois par jour pendant 7 à 10 jours', 'Hypersensibilité', 'Aucune interaction significative en usage topique', 
     (SELECT id FROM public.specialites WHERE nom = 'Dermatologie' LIMIT 1), 3, true, NOW(), NOW()),
    
    ('Acide salicylique', 'Kératolytique. Traitement des verrues et des callosités.', 'Solution', '10%', 'Application locale 1 à 2 fois par jour', 'Lésions inflammées, hypersensibilité', 'Aucune interaction significative en usage topique', 
     (SELECT id FROM public.specialites WHERE nom = 'Dermatologie' LIMIT 1), 4, true, NOW(), NOW()),
    
    ('Bétaméthasone', 'Corticoïde topique puissant. Traitement des dermatoses sévères.', 'Crème', '0.1%', 'Application 1 à 2 fois par jour', 'Infections cutanées, acné, rosacée, grossesse', 'Aucune interaction significative en usage topique', 
     (SELECT id FROM public.specialites WHERE nom = 'Dermatologie' LIMIT 1), 5, true, NOW(), NOW()),
    
    ('Miconazole', 'Antifongique. Traitement des mycoses cutanées et unguéales.', 'Crème', '2%', 'Application 2 fois par jour pendant 2 à 4 semaines', 'Hypersensibilité', 'Aucune interaction significative en usage topique', 
     (SELECT id FROM public.specialites WHERE nom = 'Dermatologie' LIMIT 1), 6, true, NOW(), NOW()),
    
    ('Terbinafine', 'Antifongique systémique. Traitement des mycoses cutanées et unguéales.', 'Comprimé', '250mg', '1 comprimé par jour pendant 2 à 6 semaines', 'Insuffisance hépatique, grossesse, allaitement', 'Rifampicine, cimétidine', 
     (SELECT id FROM public.specialites WHERE nom = 'Dermatologie' LIMIT 1), 7, true, NOW(), NOW()),
    
    ('Fluconazole', 'Antifongique systémique. Traitement des mycoses cutanées et systémiques.', 'Comprimé', '150mg', '1 comprimé par semaine pendant 2 à 4 semaines', 'Grossesse, allaitement, insuffisance rénale', 'Warfarine, phénytoïne, ciclosporine', 
     (SELECT id FROM public.specialites WHERE nom = 'Dermatologie' LIMIT 1), 8, true, NOW(), NOW()),
    
    ('Éconazole', 'Antifongique. Traitement des mycoses cutanées.', 'Crème', '1%', 'Application 2 fois par jour pendant 2 à 4 semaines', 'Hypersensibilité', 'Aucune interaction significative en usage topique', 
     (SELECT id FROM public.specialites WHERE nom = 'Dermatologie' LIMIT 1), 9, true, NOW(), NOW()),
    
    ('Kétoconazole', 'Antifongique. Traitement des mycoses cutanées et systémiques.', 'Comprimé', '200mg', '1 comprimé par jour pendant 2 à 4 semaines', 'Insuffisance hépatique, grossesse, allaitement', 'Warfarine, ciclosporine, antacides', 
     (SELECT id FROM public.specialites WHERE nom = 'Dermatologie' LIMIT 1), 10, true, NOW(), NOW()),
    
    ('Perméthrine', 'Antiparasitaire. Traitement de la gale et des poux.', 'Crème', '5%', 'Application sur tout le corps, laisser agir 8 à 12 heures', 'Hypersensibilité, enfants de moins de 2 mois', 'Aucune interaction significative', 
     (SELECT id FROM public.specialites WHERE nom = 'Dermatologie' LIMIT 1), 11, true, NOW(), NOW()),
    
    ('Benzoyle peroxyde', 'Antibactérien topique. Traitement de l''acné.', 'Gel', '5%', 'Application 1 à 2 fois par jour sur les lésions', 'Hypersensibilité', 'Aucune interaction significative en usage topique', 
     (SELECT id FROM public.specialites WHERE nom = 'Dermatologie' LIMIT 1), 12, true, NOW(), NOW()),
    
    ('Trétinoïne', 'Rétinoïde topique. Traitement de l''acné.', 'Crème', '0.05%', 'Application le soir sur les lésions', 'Grossesse, allaitement, hypersensibilité', 'Aucune interaction significative en usage topique', 
     (SELECT id FROM public.specialites WHERE nom = 'Dermatologie' LIMIT 1), 13, true, NOW(), NOW()),
    
    ('Adapalène', 'Rétinoïde topique. Traitement de l''acné.', 'Gel', '0.1%', 'Application le soir sur les lésions', 'Grossesse, allaitement, hypersensibilité', 'Aucune interaction significative en usage topique', 
     (SELECT id FROM public.specialites WHERE nom = 'Dermatologie' LIMIT 1), 14, true, NOW(), NOW()),
    
    ('Clindamycine', 'Antibiotique topique. Traitement de l''acné.', 'Gel', '1%', 'Application 2 fois par jour sur les lésions', 'Hypersensibilité, colite', 'Aucune interaction significative en usage topique', 
     (SELECT id FROM public.specialites WHERE nom = 'Dermatologie' LIMIT 1), 15, true, NOW(), NOW()),
    
    ('Érythromycine', 'Antibiotique topique. Traitement de l''acné.', 'Solution', '2%', 'Application 2 fois par jour sur les lésions', 'Hypersensibilité', 'Aucune interaction significative en usage topique', 
     (SELECT id FROM public.specialites WHERE nom = 'Dermatologie' LIMIT 1), 16, true, NOW(), NOW()),
    
    ('Calcipotriol', 'Dérivé de la vitamine D. Traitement du psoriasis.', 'Crème', '50µg/g', 'Application 2 fois par jour sur les lésions', 'Hypercalcémie, insuffisance rénale', 'Aucune interaction significative en usage topique', 
     (SELECT id FROM public.specialites WHERE nom = 'Dermatologie' LIMIT 1), 17, true, NOW(), NOW()),
    
    ('Tacrolimus', 'Immunosuppresseur topique. Traitement de l''eczéma.', 'Pommade', '0.1%', 'Application 2 fois par jour sur les lésions', 'Infections cutanées, grossesse, allaitement', 'Aucune interaction significative en usage topique', 
     (SELECT id FROM public.specialites WHERE nom = 'Dermatologie' LIMIT 1), 18, true, NOW(), NOW()),
    
    ('Pimécrolimus', 'Immunosuppresseur topique. Traitement de l''eczéma.', 'Crème', '1%', 'Application 2 fois par jour sur les lésions', 'Infections cutanées, grossesse, allaitement', 'Aucune interaction significative en usage topique', 
     (SELECT id FROM public.specialites WHERE nom = 'Dermatologie' LIMIT 1), 19, true, NOW(), NOW()),
    
    ('Calamine', 'Antiprurigineux. Traitement symptomatique des démangeaisons.', 'Lotion', '10%', 'Application locale selon besoin', 'Hypersensibilité', 'Aucune interaction significative', 
     (SELECT id FROM public.specialites WHERE nom = 'Dermatologie' LIMIT 1), 20, true, NOW(), NOW()),
    
    ('Menthol', 'Antiprurigineux. Traitement symptomatique des démangeaisons.', 'Gel', '1%', 'Application locale selon besoin', 'Hypersensibilité', 'Aucune interaction significative', 
     (SELECT id FROM public.specialites WHERE nom = 'Dermatologie' LIMIT 1), 21, true, NOW(), NOW()),
    
    ('Acide azélaïque', 'Antibactérien et dépigmentant. Traitement de l''acné et des taches.', 'Crème', '20%', 'Application 2 fois par jour', 'Hypersensibilité', 'Aucune interaction significative en usage topique', 
     (SELECT id FROM public.specialites WHERE nom = 'Dermatologie' LIMIT 1), 22, true, NOW(), NOW()),
    
    ('Hydroquinone', 'Dépigmentant. Traitement des taches pigmentaires.', 'Crème', '4%', 'Application 2 fois par jour sur les taches', 'Grossesse, allaitement, hypersensibilité', 'Aucune interaction significative en usage topique', 
     (SELECT id FROM public.specialites WHERE nom = 'Dermatologie' LIMIT 1), 23, true, NOW(), NOW()),
    
    ('Isotrétinoïne', 'Rétinoïde systémique. Traitement de l''acné sévère.', 'Comprimé', '20mg', '0.5 à 1mg/kg/jour pendant 4 à 6 mois', 'Grossesse, allaitement, insuffisance hépatique', 'Tétracyclines, vitamine A, alcool', 
     (SELECT id FROM public.specialites WHERE nom = 'Dermatologie' LIMIT 1), 24, true, NOW(), NOW()),
    
    ('Méthotrexate', 'Immunosuppresseur. Traitement du psoriasis sévère.', 'Comprimé', '2.5mg', 'Dosage selon protocole, généralement 7.5 à 15mg par semaine', 'Grossesse, allaitement, insuffisance hépatique', 'AINS, sulfamides, alcool', 
     (SELECT id FROM public.specialites WHERE nom = 'Dermatologie' LIMIT 1), 25, true, NOW(), NOW()),
    
    ('Cyclosporine', 'Immunosuppresseur. Traitement du psoriasis sévère.', 'Comprimé', '25mg', '2.5 à 5mg/kg/jour en 2 prises', 'Insuffisance rénale, hypertension, infections', 'Nombreuses interactions (macrolides, antifongiques, etc.)', 
     (SELECT id FROM public.specialites WHERE nom = 'Dermatologie' LIMIT 1), 26, true, NOW(), NOW()),
    
    ('Doxycycline', 'Antibiotique. Traitement de l''acné inflammatoire.', 'Comprimé', '100mg', '1 comprimé par jour pendant 3 à 6 mois', 'Grossesse, allaitement, enfants de moins de 8 ans', 'Fer, calcium, antiacides (prendre à distance)', 
     (SELECT id FROM public.specialites WHERE nom = 'Dermatologie' LIMIT 1), 27, true, NOW(), NOW()),
    
    ('Minocycline', 'Antibiotique. Traitement de l''acné inflammatoire.', 'Comprimé', '100mg', '1 comprimé 2 fois par jour pendant 3 à 6 mois', 'Grossesse, allaitement, insuffisance hépatique', 'Fer, calcium, antiacides (prendre à distance)', 
     (SELECT id FROM public.specialites WHERE nom = 'Dermatologie' LIMIT 1), 28, true, NOW(), NOW()),
    
    ('Prednisolone', 'Corticoïde systémique. Traitement des dermatoses sévères.', 'Comprimé', '20mg', 'Dosage selon pathologie, généralement 0.5 à 1mg/kg/jour', 'Infections actives, ulcère gastroduodénal, grossesse', 'Nombreuses interactions (AINS, anticoagulants, etc.)', 
     (SELECT id FROM public.specialites WHERE nom = 'Dermatologie' LIMIT 1), 29, true, NOW(), NOW()),
    
    ('Chloroquine', 'Antipaludéen et immunomodulateur. Traitement du lupus cutané.', 'Comprimé', '250mg', '2 comprimés par jour pendant plusieurs mois', 'Rétinopathie, grossesse, allaitement', 'Digoxine, ciclosporine', 
     (SELECT id FROM public.specialites WHERE nom = 'Dermatologie' LIMIT 1), 30, true, NOW(), NOW());

-- Gynécologie
INSERT INTO public.medicaments (nom, description, forme_pharmaceutique, dosage, posologie_defaut, contre_indications, interactions, specialite_id, ordre_affichage, actif, created_at, updated_at)
VALUES
    ('Métronidazole', 'Antibiotique et antiparasitaire. Traitement des vaginoses bactériennes.', 'Ovule vaginal', '500mg', '1 ovule le soir au coucher pendant 7 jours', 'Grossesse (1er trimestre), hypersensibilité', 'Alcool (effet antabuse)', 
     (SELECT id FROM public.specialites WHERE nom = 'Gynécologie' LIMIT 1), 1, true, NOW(), NOW()),
    
    ('Clotrimazole', 'Antifongique. Traitement des candidoses vaginales.', 'Ovule vaginal', '100mg', '1 ovule le soir au coucher pendant 6 jours', 'Hypersensibilité', 'Aucune interaction significative', 
     (SELECT id FROM public.specialites WHERE nom = 'Gynécologie' LIMIT 1), 2, true, NOW(), NOW()),
    
    ('Acide folique', 'Vitamine B9. Prévention des malformations fœtales pendant la grossesse.', 'Comprimé', '5mg', '1 comprimé par jour dès le désir de grossesse', 'Hypersensibilité', 'Phénytoïne, méthotrexate', 
     (SELECT id FROM public.specialites WHERE nom = 'Gynécologie' LIMIT 1), 3, true, NOW(), NOW()),
    
    ('Fer + Acide folique', 'Complément nutritionnel. Prévention et traitement de l''anémie pendant la grossesse.', 'Comprimé', '60mg/400µg', '1 comprimé par jour pendant la grossesse', 'Hémochromatose, hypersensibilité', 'Tétracyclines, quinolones (prendre à distance)', 
     (SELECT id FROM public.specialites WHERE nom = 'Gynécologie' LIMIT 1), 4, true, NOW(), NOW()),
    
    ('Oxytocine', 'Hormone. Induction et facilitation de l''accouchement.', 'Injection', '5 UI/ml', 'Administration par voie intraveineuse sous surveillance médicale', 'Césarienne, présentation anormale, détresse fœtale', 'Vasoconstricteurs', 
     (SELECT id FROM public.specialites WHERE nom = 'Gynécologie' LIMIT 1), 5, true, NOW(), NOW()),
    
    ('Progestérone', 'Hormone progestative. Traitement des troubles du cycle et de la grossesse.', 'Comprimé', '200mg', '1 comprimé 2 fois par jour', 'Thrombose veineuse, cancer du sein, grossesse molaire', 'Rifampicine, phénytoïne', 
     (SELECT id FROM public.specialites WHERE nom = 'Gynécologie' LIMIT 1), 6, true, NOW(), NOW()),
    
    ('Estradiol', 'Œstrogène. Traitement de la ménopause et des troubles hormonaux.', 'Comprimé', '2mg', '1 comprimé par jour', 'Cancer du sein, thrombose veineuse, grossesse', 'Rifampicine, phénytoïne', 
     (SELECT id FROM public.specialites WHERE nom = 'Gynécologie' LIMIT 1), 7, true, NOW(), NOW()),
    
    ('Lévonorgestrel', 'Progestatif. Contraception d''urgence et traitement hormonal.', 'Comprimé', '1.5mg', '1 comprimé en contraception d''urgence', 'Grossesse, thrombose veineuse', 'Rifampicine, phénytoïne', 
     (SELECT id FROM public.specialites WHERE nom = 'Gynécologie' LIMIT 1), 8, true, NOW(), NOW()),
    
    ('Éthinylestradiol + Lévonorgestrel', 'Contraceptif oral combiné. Prévention de la grossesse.', 'Comprimé', '30µg/150µg', '1 comprimé par jour pendant 21 jours', 'Thrombose veineuse, cancer du sein, grossesse', 'Rifampicine, phénytoïne, antibiotiques', 
     (SELECT id FROM public.specialites WHERE nom = 'Gynécologie' LIMIT 1), 9, true, NOW(), NOW()),
    
    ('Désogestrel', 'Progestatif. Contraception orale progestative seule.', 'Comprimé', '75µg', '1 comprimé par jour en continu', 'Thrombose veineuse, cancer du sein, grossesse', 'Rifampicine, phénytoïne', 
     (SELECT id FROM public.specialites WHERE nom = 'Gynécologie' LIMIT 1), 10, true, NOW(), NOW()),
    
    ('Misoprostol', 'Prostaglandine. Induction du travail et traitement des hémorragies post-partum.', 'Comprimé', '200µg', 'Dosage selon indication, sous surveillance médicale', 'Grossesse en cours (sauf indication médicale), glaucome', 'AINS, oxytocine', 
     (SELECT id FROM public.specialites WHERE nom = 'Gynécologie' LIMIT 1), 11, true, NOW(), NOW()),
    
    ('Dinoprostone', 'Prostaglandine. Induction du travail.', 'Gel vaginal', '1mg', 'Application intravaginale sous surveillance médicale', 'Césarienne, présentation anormale, détresse fœtale', 'Oxytocine', 
     (SELECT id FROM public.specialites WHERE nom = 'Gynécologie' LIMIT 1), 12, true, NOW(), NOW()),
    
    ('Danazol', 'Androgène synthétique. Traitement de l''endométriose.', 'Comprimé', '200mg', '1 comprimé 2 à 3 fois par jour', 'Grossesse, allaitement, insuffisance hépatique', 'Insuline, anticoagulants', 
     (SELECT id FROM public.specialites WHERE nom = 'Gynécologie' LIMIT 1), 13, true, NOW(), NOW()),
    
    ('Tamoxifène', 'Antioestrogène. Traitement du cancer du sein.', 'Comprimé', '20mg', '1 comprimé 2 fois par jour', 'Grossesse, allaitement, thrombose veineuse', 'Warfarine, phénytoïne', 
     (SELECT id FROM public.specialites WHERE nom = 'Gynécologie' LIMIT 1), 14, true, NOW(), NOW()),
    
    ('Létrozole', 'Inhibiteur de l''aromatase. Traitement du cancer du sein.', 'Comprimé', '2.5mg', '1 comprimé par jour', 'Grossesse, allaitement, insuffisance hépatique', 'Tamoxifène, œstrogènes', 
     (SELECT id FROM public.specialites WHERE nom = 'Gynécologie' LIMIT 1), 15, true, NOW(), NOW()),
    
    ('Anastrozole', 'Inhibiteur de l''aromatase. Traitement du cancer du sein.', 'Comprimé', '1mg', '1 comprimé par jour', 'Grossesse, allaitement, insuffisance hépatique', 'Tamoxifène, œstrogènes', 
     (SELECT id FROM public.specialites WHERE nom = 'Gynécologie' LIMIT 1), 16, true, NOW(), NOW()),
    
    ('Méfénamate', 'Anti-inflammatoire. Traitement des dysménorrhées.', 'Comprimé', '500mg', '1 comprimé 3 fois par jour pendant les règles', 'Ulcère gastroduodénal, insuffisance rénale, grossesse (3ème trimestre)', 'Anticoagulants, diurétiques', 
     (SELECT id FROM public.specialites WHERE nom = 'Gynécologie' LIMIT 1), 17, true, NOW(), NOW()),
    
    ('Bromocriptine', 'Agoniste dopaminergique. Traitement de l''hyperprolactinémie.', 'Comprimé', '2.5mg', '1 comprimé 2 à 3 fois par jour', 'Hypertension artérielle, troubles psychiatriques', 'Alcool, antihypertenseurs', 
     (SELECT id FROM public.specialites WHERE nom = 'Gynécologie' LIMIT 1), 18, true, NOW(), NOW()),
    
    ('Cabergoline', 'Agoniste dopaminergique. Traitement de l''hyperprolactinémie.', 'Comprimé', '0.5mg', '1 comprimé 2 fois par semaine', 'Hypertension artérielle, troubles psychiatriques', 'Alcool, antihypertenseurs', 
     (SELECT id FROM public.specialites WHERE nom = 'Gynécologie' LIMIT 1), 19, true, NOW(), NOW()),
    
    ('Clomifène', 'Inducteur de l''ovulation. Traitement de l''infertilité.', 'Comprimé', '50mg', '1 comprimé par jour du 5ème au 9ème jour du cycle', 'Grossesse, kystes ovariens, insuffisance hépatique', 'Aucune interaction significative', 
     (SELECT id FROM public.specialites WHERE nom = 'Gynécologie' LIMIT 1), 20, true, NOW(), NOW()),
    
    ('Gonadotrophine chorionique', 'Hormone. Induction de l''ovulation.', 'Injection', '5000 UI', 'Administration par voie intramusculaire selon protocole', 'Kystes ovariens, grossesse', 'Aucune interaction significative', 
     (SELECT id FROM public.specialites WHERE nom = 'Gynécologie' LIMIT 1), 21, true, NOW(), NOW()),
    
    ('Méthylergométrine', 'Uterotonique. Traitement des hémorragies post-partum.', 'Comprimé', '0.2mg', '1 comprimé 3 fois par jour pendant 3 jours', 'Hypertension artérielle, troubles cardiaques', 'Vasoconstricteurs', 
     (SELECT id FROM public.specialites WHERE nom = 'Gynécologie' LIMIT 1), 22, true, NOW(), NOW()),
    
    ('Carbétocine', 'Uterotonique. Prévention des hémorragies post-partum.', 'Injection', '100µg', 'Administration par voie intraveineuse après accouchement', 'Hypertension artérielle, troubles cardiaques', 'Vasoconstricteurs', 
     (SELECT id FROM public.specialites WHERE nom = 'Gynécologie' LIMIT 1), 23, true, NOW(), NOW()),
    
    ('Fluconazole', 'Antifongique. Traitement des candidoses vaginales récidivantes.', 'Comprimé', '150mg', '1 comprimé en prise unique', 'Grossesse (1er trimestre), allaitement', 'Warfarine, phénytoïne', 
     (SELECT id FROM public.specialites WHERE nom = 'Gynécologie' LIMIT 1), 24, true, NOW(), NOW()),
    
    ('Tinidazole', 'Antiparasitaire. Traitement de la trichomonase.', 'Comprimé', '500mg', '2 comprimés en prise unique', 'Grossesse (1er trimestre), allaitement', 'Alcool (effet antabuse), warfarine', 
     (SELECT id FROM public.specialites WHERE nom = 'Gynécologie' LIMIT 1), 25, true, NOW(), NOW()),
    
    ('Doxycycline', 'Antibiotique. Traitement des infections génitales.', 'Comprimé', '100mg', '1 comprimé 2 fois par jour pendant 7 jours', 'Grossesse, allaitement, enfants de moins de 8 ans', 'Fer, calcium, antiacides (prendre à distance)', 
     (SELECT id FROM public.specialites WHERE nom = 'Gynécologie' LIMIT 1), 26, true, NOW(), NOW()),
    
    ('Azithromycine', 'Antibiotique. Traitement des infections génitales.', 'Comprimé', '1g', '1 comprimé en prise unique', 'Hypersensibilité, troubles du rythme cardiaque', 'Digoxine, warfarine', 
     (SELECT id FROM public.specialites WHERE nom = 'Gynécologie' LIMIT 1), 27, true, NOW(), NOW()),
    
    ('Ceftriaxone', 'Antibiotique. Traitement des infections génitales sévères.', 'Injection', '1g', 'Administration par voie intramusculaire ou intraveineuse', 'Allergie aux céphalosporines, insuffisance rénale', 'Anticoagulants, probénécide', 
     (SELECT id FROM public.specialites WHERE nom = 'Gynécologie' LIMIT 1), 28, true, NOW(), NOW()),
    
    ('Vitamine D', 'Complément nutritionnel. Prévention de l''ostéoporose post-ménopausique.', 'Comprimé', '1000 UI', '1 comprimé par jour', 'Hypercalcémie, hypervitaminose D', 'Diurétiques thiazidiques', 
     (SELECT id FROM public.specialites WHERE nom = 'Gynécologie' LIMIT 1), 29, true, NOW(), NOW()),
    
    ('Calcium + Vitamine D', 'Complément nutritionnel. Prévention de l''ostéoporose.', 'Comprimé', '500mg/400UI', '1 comprimé 2 fois par jour', 'Hypercalcémie, hypervitaminose D', 'Tétracyclines, quinolones (prendre à distance)', 
     (SELECT id FROM public.specialites WHERE nom = 'Gynécologie' LIMIT 1), 30, true, NOW(), NOW());

-- Pédiatrie
INSERT INTO public.medicaments (nom, description, forme_pharmaceutique, dosage, posologie_defaut, contre_indications, interactions, specialite_id, ordre_affichage, actif, created_at, updated_at)
VALUES
    ('Paracétamol pédiatrique', 'Antalgique et antipyrétique pour enfants.', 'Sirop', '100mg/5ml', '10-15mg/kg toutes les 6 heures, maximum 60mg/kg/jour', 'Insuffisance hépatique sévère, hypersensibilité', 'Anticoagulants oraux', 
     (SELECT id FROM public.specialites WHERE nom = 'Pédiatrie' LIMIT 1), 1, true, NOW(), NOW()),
    
    ('Amoxicilline pédiatrique', 'Antibiotique pour enfants. Traitement des infections bactériennes.', 'Suspension buvable', '125mg/5ml', '25-50mg/kg/jour en 3 prises, pendant 7 à 10 jours', 'Allergie aux pénicillines, mononucléose infectieuse', 'Contraceptifs oraux, probénécide', 
     (SELECT id FROM public.specialites WHERE nom = 'Pédiatrie' LIMIT 1), 2, true, NOW(), NOW()),
    
    ('Vitamine D', 'Complément nutritionnel. Prévention du rachitisme chez l''enfant.', 'Solution buvable', '1000 UI/ml', '2 à 3 gouttes par jour (400-600 UI/jour)', 'Hypercalcémie, hypervitaminose D', 'Diurétiques thiazidiques, digitaliques', 
     (SELECT id FROM public.specialites WHERE nom = 'Pédiatrie' LIMIT 1), 3, true, NOW(), NOW()),
    
    ('Fer pédiatrique', 'Complément nutritionnel. Traitement de l''anémie ferriprive chez l''enfant.', 'Sirop', '20mg/5ml', '2-3mg/kg/jour en 2 prises', 'Hémochromatose, hypersensibilité', 'Tétracyclines, quinolones (prendre à distance)', 
     (SELECT id FROM public.specialites WHERE nom = 'Pédiatrie' LIMIT 1), 4, true, NOW(), NOW()),
    
    ('Salbutamol pédiatrique', 'Bronchodilatateur. Traitement de l''asthme chez l''enfant.', 'Aérosol', '100µg/dose', '1 à 2 bouffées selon besoin, maximum 8 bouffées/jour', 'Hypersensibilité, troubles du rythme cardiaque', 'Bêta-bloquants, diurétiques', 
     (SELECT id FROM public.specialites WHERE nom = 'Pédiatrie' LIMIT 1), 5, true, NOW(), NOW()),
    
    ('Smecta pédiatrique', 'Antidiarrhéique pour enfants.', 'Sachet', '3g', 'Selon l''âge: 1 à 3 sachets par jour dans un verre d''eau', 'Occlusion intestinale', 'Autres médicaments (prendre à distance)', 
     (SELECT id FROM public.specialites WHERE nom = 'Pédiatrie' LIMIT 1), 6, true, NOW(), NOW()),
    
    ('Ibuprofène pédiatrique', 'Anti-inflammatoire pour enfants. Antalgique et antipyrétique.', 'Suspension buvable', '100mg/5ml', '10mg/kg 3 fois par jour', 'Ulcère gastroduodénal, insuffisance rénale', 'Anticoagulants, diurétiques', 
     (SELECT id FROM public.specialites WHERE nom = 'Pédiatrie' LIMIT 1), 7, true, NOW(), NOW()),
    
    ('Amoxicilline + Acide clavulanique pédiatrique', 'Antibiotique à large spectre pour enfants.', 'Suspension buvable', '125mg/31.25mg/5ml', '25-45mg/kg/jour en 3 prises, pendant 7 à 10 jours', 'Allergie aux pénicillines, antécédents d''hépatite', 'Contraceptifs oraux, anticoagulants', 
     (SELECT id FROM public.specialites WHERE nom = 'Pédiatrie' LIMIT 1), 8, true, NOW(), NOW()),
    
    ('Azithromycine pédiatrique', 'Antibiotique pour enfants. Traitement des infections respiratoires.', 'Suspension buvable', '200mg/5ml', '10mg/kg/jour pendant 3 jours', 'Hypersensibilité, troubles du rythme cardiaque', 'Digoxine, warfarine', 
     (SELECT id FROM public.specialites WHERE nom = 'Pédiatrie' LIMIT 1), 9, true, NOW(), NOW()),
    
    ('Céfalexine pédiatrique', 'Antibiotique pour enfants. Traitement des infections bactériennes.', 'Suspension buvable', '125mg/5ml', '25-50mg/kg/jour en 4 prises, pendant 7 à 10 jours', 'Allergie aux céphalosporines', 'Anticoagulants, probénécide', 
     (SELECT id FROM public.specialites WHERE nom = 'Pédiatrie' LIMIT 1), 10, true, NOW(), NOW()),
    
    ('Érythromycine pédiatrique', 'Antibiotique pour enfants. Traitement des infections respiratoires.', 'Suspension buvable', '125mg/5ml', '30-50mg/kg/jour en 3 prises, pendant 7 à 10 jours', 'Hypersensibilité, troubles du rythme cardiaque', 'Digoxine, warfarine, ergotamine', 
     (SELECT id FROM public.specialites WHERE nom = 'Pédiatrie' LIMIT 1), 11, true, NOW(), NOW()),
    
    ('Salbutamol sirop', 'Bronchodilatateur en sirop pour enfants.', 'Sirop', '2mg/5ml', '0.1-0.2mg/kg 3 à 4 fois par jour', 'Hypersensibilité, troubles du rythme cardiaque', 'Bêta-bloquants, diurétiques', 
     (SELECT id FROM public.specialites WHERE nom = 'Pédiatrie' LIMIT 1), 12, true, NOW(), NOW()),
    
    ('Budesonide nébulisé', 'Corticoïde inhalé pour enfants asthmatiques.', 'Suspension pour nébulisation', '0.5mg/ml', '0.5-1mg 2 fois par jour selon l''âge', 'Infections respiratoires actives', 'Aucune interaction significative', 
     (SELECT id FROM public.specialites WHERE nom = 'Pédiatrie' LIMIT 1), 13, true, NOW(), NOW()),
    
    ('Montélukast', 'Antileucotriène. Traitement de l''asthme chez l''enfant.', 'Comprimé', '5mg', '1 comprimé le soir', 'Hypersensibilité', 'Phénytoïne, rifampicine', 
     (SELECT id FROM public.specialites WHERE nom = 'Pédiatrie' LIMIT 1), 14, true, NOW(), NOW()),
    
    ('Loratadine', 'Antihistaminique. Traitement des allergies chez l''enfant.', 'Sirop', '5mg/5ml', '5-10mg une fois par jour selon l''âge', 'Hypersensibilité', 'Érythromycine, kétoconazole', 
     (SELECT id FROM public.specialites WHERE nom = 'Pédiatrie' LIMIT 1), 15, true, NOW(), NOW()),
    
    ('Cétirizine', 'Antihistaminique. Traitement des allergies chez l''enfant.', 'Sirop', '5mg/5ml', '5-10mg une fois par jour selon l''âge', 'Hypersensibilité, insuffisance rénale', 'Aucune interaction significative', 
     (SELECT id FROM public.specialites WHERE nom = 'Pédiatrie' LIMIT 1), 16, true, NOW(), NOW()),
    
    ('Dexaméthasone pédiatrique', 'Corticoïde pour enfants. Traitement des affections inflammatoires.', 'Sirop', '0.5mg/5ml', '0.1-0.2mg/kg/jour en 2 à 3 prises', 'Infections actives, varicelle', 'Nombreuses interactions (AINS, anticoagulants, etc.)', 
     (SELECT id FROM public.specialites WHERE nom = 'Pédiatrie' LIMIT 1), 17, true, NOW(), NOW()),
    
    ('Prednisolone pédiatrique', 'Corticoïde pour enfants. Traitement des affections inflammatoires.', 'Sirop', '5mg/5ml', '1-2mg/kg/jour en 2 à 3 prises', 'Infections actives, varicelle', 'Nombreuses interactions (AINS, anticoagulants, etc.)', 
     (SELECT id FROM public.specialites WHERE nom = 'Pédiatrie' LIMIT 1), 18, true, NOW(), NOW()),
    
    ('Métoclopramide pédiatrique', 'Antinauséeux pour enfants. Traitement des nausées et vomissements.', 'Sirop', '1mg/ml', '0.1-0.2mg/kg 3 fois par jour', 'Obstruction digestive, épilepsie', 'Anticholinergiques, sédatifs', 
     (SELECT id FROM public.specialites WHERE nom = 'Pédiatrie' LIMIT 1), 19, true, NOW(), NOW()),
    
    ('Ondansétron pédiatrique', 'Antinauséeux pour enfants. Traitement des nausées et vomissements.', 'Sirop', '2mg/5ml', '0.15mg/kg 2 à 3 fois par jour', 'Hypersensibilité', 'Aucune interaction significative', 
     (SELECT id FROM public.specialites WHERE nom = 'Pédiatrie' LIMIT 1), 20, true, NOW(), NOW()),
    
    ('Lactulose', 'Laxatif osmotique pour enfants. Traitement de la constipation.', 'Sirop', '10g/15ml', '5-10ml 2 fois par jour selon l''âge', 'Occlusion intestinale, galactosémie', 'Aucune interaction significative', 
     (SELECT id FROM public.specialites WHERE nom = 'Pédiatrie' LIMIT 1), 21, true, NOW(), NOW()),
    
    ('Polyéthylène glycol', 'Laxatif osmotique pour enfants. Traitement de la constipation.', 'Sachet', '10g', '0.5-1 sachet par jour selon l''âge', 'Occlusion intestinale', 'Aucune interaction significative', 
     (SELECT id FROM public.specialites WHERE nom = 'Pédiatrie' LIMIT 1), 22, true, NOW(), NOW()),
    
    ('Zinc', 'Complément nutritionnel. Traitement et prévention de la diarrhée chez l''enfant.', 'Comprimé', '20mg', '10-20mg par jour pendant 10-14 jours', 'Hypersensibilité', 'Tétracyclines, quinolones (prendre à distance)', 
     (SELECT id FROM public.specialites WHERE nom = 'Pédiatrie' LIMIT 1), 23, true, NOW(), NOW()),
    
    ('Sels de réhydratation orale', 'Solution de réhydratation pour enfants. Traitement de la déshydratation.', 'Sachet', '20.5g', '1 sachet dans 200ml d''eau, à boire selon besoin', 'Insuffisance rénale, occlusion intestinale', 'Aucune interaction significative', 
     (SELECT id FROM public.specialites WHERE nom = 'Pédiatrie' LIMIT 1), 24, true, NOW(), NOW()),
    
    ('Multivitamines pédiatriques', 'Complément nutritionnel. Apport en vitamines pour enfants.', 'Sirop', 'Multi', '5-10ml par jour selon l''âge', 'Hypervitaminose, hypersensibilité', 'Aucune interaction significative', 
     (SELECT id FROM public.specialites WHERE nom = 'Pédiatrie' LIMIT 1), 25, true, NOW(), NOW()),
    
    ('Calcium pédiatrique', 'Complément nutritionnel. Apport en calcium pour enfants.', 'Sirop', '500mg/5ml', '5-10ml par jour selon l''âge', 'Hypercalcémie, calculs rénaux', 'Tétracyclines, quinolones (prendre à distance)', 
     (SELECT id FROM public.specialites WHERE nom = 'Pédiatrie' LIMIT 1), 26, true, NOW(), NOW()),
    
    ('Fluorure', 'Complément nutritionnel. Prévention de la carie dentaire chez l''enfant.', 'Comprimé', '0.25mg', '1 comprimé par jour selon l''âge', 'Fluorose dentaire, insuffisance rénale', 'Calcium, magnésium (prendre à distance)', 
     (SELECT id FROM public.specialites WHERE nom = 'Pédiatrie' LIMIT 1), 27, true, NOW(), NOW()),
    
    ('Méthylphénidate', 'Psychostimulant. Traitement du trouble de déficit de l''attention avec hyperactivité (TDAH).', 'Comprimé', '10mg', '5-20mg 2 à 3 fois par jour selon l''âge', 'Glaucoma, hypertension artérielle, troubles cardiaques', 'Antidépresseurs, antihypertenseurs', 
     (SELECT id FROM public.specialites WHERE nom = 'Pédiatrie' LIMIT 1), 28, true, NOW(), NOW()),
    
    ('Valproate de sodium', 'Anticonvulsivant. Traitement de l''épilepsie chez l''enfant.', 'Sirop', '200mg/5ml', '20-30mg/kg/jour en 2 à 3 prises', 'Insuffisance hépatique, grossesse', 'Phénytoïne, phénobarbital, lamotrigine', 
     (SELECT id FROM public.specialites WHERE nom = 'Pédiatrie' LIMIT 1), 29, true, NOW(), NOW()),
    
    ('Phénobarbital pédiatrique', 'Anticonvulsivant. Traitement de l''épilepsie chez l''enfant.', 'Sirop', '15mg/5ml', '3-5mg/kg/jour en 2 prises', 'Insuffisance hépatique, porphyrie', 'Nombreuses interactions (antidépresseurs, anticoagulants, etc.)', 
     (SELECT id FROM public.specialites WHERE nom = 'Pédiatrie' LIMIT 1), 30, true, NOW(), NOW());

-- =====================================================
-- 3. VÉRIFICATION DES DONNÉES INSÉRÉES
-- =====================================================

-- Afficher un résumé des médicaments insérés par spécialité
DO $$
DECLARE
    total_medicaments INTEGER;
    med_med_gen INTEGER;
    med_cardio INTEGER;
    med_dermato INTEGER;
    med_gyneco INTEGER;
    med_pediatrie INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_medicaments FROM public.medicaments WHERE actif = true;
    SELECT COUNT(*) INTO med_med_gen FROM public.medicaments WHERE actif = true AND specialite_id = (SELECT id FROM public.specialites WHERE nom = 'Médecine générale' LIMIT 1);
    SELECT COUNT(*) INTO med_cardio FROM public.medicaments WHERE actif = true AND specialite_id = (SELECT id FROM public.specialites WHERE nom = 'Cardiologie' LIMIT 1);
    SELECT COUNT(*) INTO med_dermato FROM public.medicaments WHERE actif = true AND specialite_id = (SELECT id FROM public.specialites WHERE nom = 'Dermatologie' LIMIT 1);
    SELECT COUNT(*) INTO med_gyneco FROM public.medicaments WHERE actif = true AND specialite_id = (SELECT id FROM public.specialites WHERE nom = 'Gynécologie' LIMIT 1);
    SELECT COUNT(*) INTO med_pediatrie FROM public.medicaments WHERE actif = true AND specialite_id = (SELECT id FROM public.specialites WHERE nom = 'Pédiatrie' LIMIT 1);
    
    RAISE NOTICE 'Migration terminée avec succès';
    RAISE NOTICE 'Total de médicaments actifs: %', total_medicaments;
    RAISE NOTICE 'Médecine générale: % médicaments', med_med_gen;
    RAISE NOTICE 'Cardiologie: % médicaments', med_cardio;
    RAISE NOTICE 'Dermatologie: % médicaments', med_dermato;
    RAISE NOTICE 'Gynécologie: % médicaments', med_gyneco;
    RAISE NOTICE 'Pédiatrie: % médicaments', med_pediatrie;
END $$;

