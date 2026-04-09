-- =====================================================
-- PHASE 1 - REPORTING : STATISTIQUES ET RAPPORTS
-- =====================================================

-- =====================================================
-- VUES POUR LES STATISTIQUES DE CONSULTATIONS
-- =====================================================

-- Vue pour les consultations par spécialité
CREATE OR REPLACE VIEW statistiques_consultations_specialites AS
SELECT 
    s.id as specialite_id,
    s.nom as nom_specialite,
    COUNT(c.id) as nombre_consultations,
    COUNT(DISTINCT c.patient_id) as nombre_patients_uniques,
    AVG(c.duree_consultation) as duree_moyenne_minutes,
    MIN(c.date_consultation) as premiere_consultation,
    MAX(c.date_consultation) as derniere_consultation
FROM specialites s
LEFT JOIN users u ON s.id = u.specialite_id AND u.role = 'doctor'
LEFT JOIN consultations c ON u.id = c.medecin_id
GROUP BY s.id, s.nom
ORDER BY nombre_consultations DESC;

-- Vue pour les consultations par médecin
CREATE OR REPLACE VIEW statistiques_consultations_medecins AS
SELECT 
    u.id as medecin_id,
    u.nom as nom_medecin,
    u.prenom as prenom_medecin,
    s.nom as specialite,
    COUNT(c.id) as nombre_consultations,
    COUNT(DISTINCT c.patient_id) as nombre_patients_uniques,
    AVG(c.duree_consultation) as duree_moyenne_minutes,
    MIN(c.date_consultation) as premiere_consultation,
    MAX(c.date_consultation) as derniere_consultation
FROM users u
LEFT JOIN specialites s ON u.specialite_id = s.id
LEFT JOIN consultations c ON u.id = c.medecin_id
WHERE u.role = 'doctor'
GROUP BY u.id, u.nom, u.prenom, s.nom
ORDER BY nombre_consultations DESC;

-- Vue pour les actes par type d'acte
CREATE OR REPLACE VIEW statistiques_actes_types AS
SELECT 
    ta.id as type_acte_id,
    ta.nom as nom_type_acte,
    ta.tarif_defaut as tarif_defaut,
    s.nom as specialite,
    COUNT(a.id) as nombre_actes,
    COUNT(DISTINCT a.consultation_id) as nombre_consultations,
    COUNT(DISTINCT c.patient_id) as nombre_patients,
    AVG(a.montant) as tarif_moyen,
    SUM(a.montant) as montant_total,
    AVG(c.duree_consultation) as duree_moyenne_consultation_minutes
FROM types_actes ta
LEFT JOIN specialites s ON ta.specialite_id = s.id
LEFT JOIN actes a ON ta.nom = a.type_acte
LEFT JOIN consultations c ON a.consultation_id = c.id
GROUP BY ta.id, ta.nom, ta.tarif_defaut, s.nom
ORDER BY nombre_actes DESC;

-- =====================================================
-- VUES POUR LES STATISTIQUES FINANCIÈRES
-- =====================================================

-- Vue pour les montants des consultations par spécialité
CREATE OR REPLACE VIEW statistiques_finances_specialites AS
SELECT 
    s.id as specialite_id,
    s.nom as nom_specialite,
    COUNT(c.id) as nombre_consultations,
    SUM(COALESCE(f.montant_ttc, 0)) as montant_total_consultations,
    AVG(COALESCE(f.montant_ttc, 0)) as montant_moyen_consultation,
    SUM(COALESCE(f.montant_paye, 0)) as montant_total_paye,
    SUM(COALESCE(f.montant_ttc, 0) - COALESCE(f.montant_paye, 0)) as montant_restant_a_payer
FROM specialites s
LEFT JOIN users u ON s.id = u.specialite_id AND u.role = 'doctor'
LEFT JOIN consultations c ON u.id = c.medecin_id
LEFT JOIN factures f ON c.id = f.consultation_id
GROUP BY s.id, s.nom
ORDER BY montant_total_consultations DESC;

-- Vue pour les montants des consultations par médecin
CREATE OR REPLACE VIEW statistiques_finances_medecins AS
SELECT 
    u.id as medecin_id,
    u.nom as nom_medecin,
    u.prenom as prenom_medecin,
    s.nom as specialite,
    COUNT(c.id) as nombre_consultations,
    SUM(COALESCE(f.montant_ttc, 0)) as montant_total_consultations,
    AVG(COALESCE(f.montant_ttc, 0)) as montant_moyen_consultation,
    SUM(COALESCE(f.montant_paye, 0)) as montant_total_paye,
    SUM(COALESCE(f.montant_ttc, 0) - COALESCE(f.montant_paye, 0)) as montant_restant_a_payer
FROM users u
LEFT JOIN specialites s ON u.specialite_id = s.id
LEFT JOIN consultations c ON u.id = c.medecin_id
LEFT JOIN factures f ON c.id = f.consultation_id
WHERE u.role = 'doctor'
GROUP BY u.id, u.nom, u.prenom, s.nom
ORDER BY montant_total_consultations DESC;

-- Vue pour les montants des actes par type d'acte
CREATE OR REPLACE VIEW statistiques_finances_actes AS
SELECT 
    ta.id as type_acte_id,
    ta.nom as nom_type_acte,
    ta.tarif_defaut as tarif_defaut,
    s.nom as specialite,
    COUNT(a.id) as nombre_actes,
    SUM(a.montant) as montant_total_actes,
    AVG(a.montant) as tarif_moyen,
    COUNT(DISTINCT a.consultation_id) as nombre_consultations,
    COUNT(DISTINCT c.patient_id) as nombre_patients
FROM types_actes ta
LEFT JOIN specialites s ON ta.specialite_id = s.id
LEFT JOIN actes a ON ta.nom = a.type_acte
LEFT JOIN consultations c ON a.consultation_id = c.id
GROUP BY ta.id, ta.nom, ta.tarif_defaut, s.nom
ORDER BY montant_total_actes DESC;

-- =====================================================
-- FONCTIONS POUR LES RAPPORTS AVANCÉS
-- =====================================================

-- Fonction pour obtenir les statistiques entre deux dates
CREATE OR REPLACE FUNCTION get_statistiques_periode(
    date_debut DATE,
    date_fin DATE
)
RETURNS TABLE (
    type_statistique TEXT,
    categorie TEXT,
    valeur_nombre BIGINT,
    valeur_montant DECIMAL,
    valeur_duree DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    
    -- Consultations par spécialité
    SELECT 
        'consultations_specialite'::TEXT as type_statistique,
        scs.nom_specialite as categorie,
        scs.nombre_consultations::BIGINT as valeur_nombre,
        NULL::DECIMAL as valeur_montant,
        scs.duree_moyenne_minutes as valeur_duree
    FROM statistiques_consultations_specialites scs
    WHERE scs.premiere_consultation >= date_debut 
      AND scs.derniere_consultation <= date_fin
    
    UNION ALL
    
    -- Consultations par médecin
    SELECT 
        'consultations_medecin'::TEXT as type_statistique,
        scm.nom_medecin || ' ' || scm.prenom_medecin as categorie,
        scm.nombre_consultations::BIGINT as valeur_nombre,
        NULL::DECIMAL as valeur_montant,
        scm.duree_moyenne_minutes as valeur_duree
    FROM statistiques_consultations_medecins scm
    WHERE scm.premiere_consultation >= date_debut 
      AND scm.derniere_consultation <= date_fin
    
    UNION ALL
    
    -- Actes par type
    SELECT 
        'actes_type'::TEXT as type_statistique,
        sat.nom_type_acte as categorie,
        sat.nombre_actes::BIGINT as valeur_nombre,
        sat.montant_total as valeur_montant,
        sat.duree_moyenne_consultation_minutes as valeur_duree
    FROM statistiques_actes_types sat
    WHERE sat.nombre_actes > 0
    
    UNION ALL
    
    -- Finances par spécialité
    SELECT 
        'finances_specialite'::TEXT as type_statistique,
        sfs.nom_specialite as categorie,
        sfs.nombre_consultations::BIGINT as valeur_nombre,
        sfs.montant_total_consultations as valeur_montant,
        NULL::DECIMAL as valeur_duree
    FROM statistiques_finances_specialites sfs
    WHERE sfs.nombre_consultations > 0
    
    UNION ALL
    
    -- Finances par médecin
    SELECT 
        'finances_medecin'::TEXT as type_statistique,
        sfm.nom_medecin || ' ' || sfm.prenom_medecin as categorie,
        sfm.nombre_consultations::BIGINT as valeur_nombre,
        sfm.montant_total_consultations as valeur_montant,
        NULL::DECIMAL as valeur_duree
    FROM statistiques_finances_medecins sfm
    WHERE sfm.nombre_consultations > 0
    
    UNION ALL
    
    -- Finances par type d'acte
    SELECT 
        'finances_acte'::TEXT as type_statistique,
        sfa.nom_type_acte as categorie,
        sfa.nombre_actes::BIGINT as valeur_nombre,
        sfa.montant_total_actes as valeur_montant,
        NULL::DECIMAL as valeur_duree
    FROM statistiques_finances_actes sfa
    WHERE sfa.nombre_actes > 0;
    
END;
$$ LANGUAGE plpgsql;

-- Fonction pour obtenir un résumé global
CREATE OR REPLACE FUNCTION get_resume_global(
    date_debut DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
    date_fin DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
    metrique TEXT,
    valeur BIGINT,
    montant DECIMAL,
    pourcentage DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    
    -- Total consultations
    SELECT 
        'Total Consultations'::TEXT as metrique,
        COUNT(c.id)::BIGINT as valeur,
        NULL::DECIMAL as montant,
        NULL::DECIMAL as pourcentage
    FROM consultations c
    WHERE c.date_consultation >= date_debut AND c.date_consultation <= date_fin
    
    UNION ALL
    
    -- Total patients
    SELECT 
        'Total Patients'::TEXT as metrique,
        COUNT(DISTINCT c.patient_id)::BIGINT as valeur,
        NULL::DECIMAL as montant,
        NULL::DECIMAL as pourcentage
    FROM consultations c
    WHERE c.date_consultation >= date_debut AND c.date_consultation <= date_fin
    
    UNION ALL
    
    -- Total actes
    SELECT 
        'Total Actes'::TEXT as metrique,
        COUNT(a.id)::BIGINT as valeur,
        NULL::DECIMAL as montant,
        NULL::DECIMAL as pourcentage
    FROM actes a
    JOIN consultations c ON a.consultation_id = c.id
    WHERE c.date_consultation >= date_debut AND c.date_consultation <= date_fin
    
    UNION ALL
    
    -- Total factures
    SELECT 
        'Total Factures'::TEXT as metrique,
        COUNT(f.id)::BIGINT as valeur,
        NULL::DECIMAL as montant,
        NULL::DECIMAL as pourcentage
    FROM factures f
    JOIN consultations c ON f.consultation_id = c.id
    WHERE c.date_consultation >= date_debut AND c.date_consultation <= date_fin
    
    UNION ALL
    
    -- Chiffre d'affaires
    SELECT 
        'Chiffre d''Affaires'::TEXT as metrique,
        NULL::BIGINT as valeur,
        SUM(f.montant_ttc) as montant,
        NULL::DECIMAL as pourcentage
    FROM factures f
    JOIN consultations c ON f.consultation_id = c.id
    WHERE c.date_consultation >= date_debut AND c.date_consultation <= date_fin
    
    UNION ALL
    
    -- Montant payé
    SELECT 
        'Montant Payé'::TEXT as metrique,
        NULL::BIGINT as valeur,
        SUM(f.montant_paye) as montant,
        NULL::DECIMAL as pourcentage
    FROM factures f
    JOIN consultations c ON f.consultation_id = c.id
    WHERE c.date_consultation >= date_debut AND c.date_consultation <= date_fin
    
    UNION ALL
    
    -- Montant restant
    SELECT 
        'Montant Restant'::TEXT as metrique,
        NULL::BIGINT as valeur,
        SUM(f.montant_ttc - f.montant_paye) as montant,
        NULL::DECIMAL as pourcentage
    FROM factures f
    JOIN consultations c ON f.consultation_id = c.id
    WHERE c.date_consultation >= date_debut AND c.date_consultation <= date_fin;
    
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- INDEX POUR OPTIMISER LES PERFORMANCES
-- =====================================================

-- Index pour optimiser les requêtes de statistiques
CREATE INDEX IF NOT EXISTS idx_consultations_date_consultation ON consultations(date_consultation);
CREATE INDEX IF NOT EXISTS idx_consultations_medecin_id ON consultations(medecin_id);
CREATE INDEX IF NOT EXISTS idx_consultations_patient_id ON consultations(patient_id);

CREATE INDEX IF NOT EXISTS idx_actes_consultation_id ON actes(consultation_id);
CREATE INDEX IF NOT EXISTS idx_actes_type_acte ON actes(type_acte);

CREATE INDEX IF NOT EXISTS idx_factures_consultation_id ON factures(consultation_id);
CREATE INDEX IF NOT EXISTS idx_factures_date_facture ON factures(date_facture);
CREATE INDEX IF NOT EXISTS idx_factures_statut_paiement ON factures(statut_paiement);
