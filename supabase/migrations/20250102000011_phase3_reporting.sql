-- =====================================================
-- PHASE 3 - REPORTING : FONCTIONNALITÉS AVANCÉES ET AUTOMATISATION
-- =====================================================

-- =====================================================
-- TABLES POUR LES RAPPORTS AUTOMATISÉS (CRON JOBS)
-- =====================================================

-- Table pour les tâches automatisées
CREATE TABLE IF NOT EXISTS taches_automatisees (
    id BIGSERIAL PRIMARY KEY,
    nom_tache VARCHAR(255) NOT NULL,
    description TEXT,
    type_tache VARCHAR(50) NOT NULL CHECK (type_tache IN ('rapport', 'alerte', 'nettoyage', 'sauvegarde', 'analyse')),
    frequence VARCHAR(50) NOT NULL CHECK (frequence IN ('quotidien', 'hebdomadaire', 'mensuel', 'trimestriel', 'annuel')),
    parametres_execution JSONB,
    derniere_execution TIMESTAMP WITH TIME ZONE,
    prochaine_execution TIMESTAMP WITH TIME ZONE,
    statut VARCHAR(20) DEFAULT 'actif' CHECK (statut IN ('actif', 'inactif', 'pause', 'erreur')),
    nombre_executions INTEGER DEFAULT 0,
    nombre_erreurs INTEGER DEFAULT 0,
    duree_moyenne_execution INTEGER, -- en secondes
    created_by BIGINT REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table pour l'historique des tâches automatisées
CREATE TABLE IF NOT EXISTS historique_taches_automatisees (
    id BIGSERIAL PRIMARY KEY,
    tache_id BIGINT REFERENCES taches_automatisees(id),
    date_debut_execution TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    date_fin_execution TIMESTAMP WITH TIME ZONE,
    statut VARCHAR(20) NOT NULL CHECK (statut IN ('en_cours', 'termine', 'erreur', 'annule')),
    resultat JSONB,
    message_erreur TEXT,
    duree_execution INTEGER, -- en secondes
    ressources_utilisees JSONB -- CPU, mémoire, etc.
);

-- =====================================================
-- TABLES POUR LES NOTIFICATIONS EN TEMPS RÉEL
-- =====================================================

-- Table pour les notifications push
CREATE TABLE IF NOT EXISTS notifications_push (
    id BIGSERIAL PRIMARY KEY,
    titre VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type_notification VARCHAR(50) NOT NULL CHECK (type_notification IN ('alerte', 'rapport', 'systeme', 'utilisateur')),
    priorite VARCHAR(20) DEFAULT 'normale' CHECK (priorite IN ('basse', 'normale', 'haute', 'critique')),
    destinataires JSONB, -- liste des utilisateurs ou groupes
    donnees_contexte JSONB,
    statut VARCHAR(20) DEFAULT 'en_attente' CHECK (statut IN ('en_attente', 'envoyee', 'lue', 'traitee')),
    date_creation TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    date_envoi TIMESTAMP WITH TIME ZONE,
    date_lecture TIMESTAMP WITH TIME ZONE,
    created_by BIGINT REFERENCES users(id)
);

-- Table pour les préférences de notifications
CREATE TABLE IF NOT EXISTS preferences_notifications (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    type_notification VARCHAR(50) NOT NULL,
    canal_notification VARCHAR(50) NOT NULL CHECK (canal_notification IN ('email', 'push', 'sms', 'webhook')),
    actif BOOLEAN DEFAULT true,
    frequence VARCHAR(20) DEFAULT 'immediate' CHECK (frequence IN ('immediate', 'quotidien', 'hebdomadaire')),
    heures_autorisees JSONB, -- plages horaires autorisées
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, type_notification, canal_notification)
);

-- =====================================================
-- TABLES POUR L'INTELLIGENCE ARTIFICIELLE
-- =====================================================

-- Table pour les modèles d'IA
CREATE TABLE IF NOT EXISTS modeles_ia (
    id BIGSERIAL PRIMARY KEY,
    nom_modele VARCHAR(255) NOT NULL,
    description TEXT,
    type_modele VARCHAR(50) NOT NULL CHECK (type_modele IN ('prevision', 'classification', 'anomalie', 'optimisation')),
    algorithme VARCHAR(100) NOT NULL,
    version VARCHAR(20) NOT NULL,
    parametres_modele JSONB,
    metriques_performance JSONB,
    statut VARCHAR(20) DEFAULT 'entraine' CHECK (statut IN ('entraine', 'entrainement', 'test', 'production', 'archive')),
    precision_modele DECIMAL,
    date_entrainement TIMESTAMP WITH TIME ZONE,
    date_mise_production TIMESTAMP WITH TIME ZONE,
    created_by BIGINT REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table pour les prédictions IA
CREATE TABLE IF NOT EXISTS predictions_ia (
    id BIGSERIAL PRIMARY KEY,
    modele_id BIGINT REFERENCES modeles_ia(id),
    type_prediction VARCHAR(50) NOT NULL,
    donnees_entree JSONB NOT NULL,
    prediction JSONB NOT NULL,
    confiance DECIMAL,
    intervalle_confiance JSONB,
    date_prediction TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    date_validation TIMESTAMP WITH TIME ZONE,
    valide BOOLEAN,
    commentaire_validation TEXT
);

-- Table pour l'apprentissage continu
CREATE TABLE IF NOT EXISTS apprentissage_continu (
    id BIGSERIAL PRIMARY KEY,
    modele_id BIGINT REFERENCES modeles_ia(id),
    type_action VARCHAR(50) NOT NULL CHECK (type_action IN ('entrainement', 'evaluation', 'optimisation')),
    donnees_utilisees JSONB,
    parametres_entrainement JSONB,
    resultats JSONB,
    amelioration_performance DECIMAL,
    date_debut TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    date_fin TIMESTAMP WITH TIME ZONE,
    statut VARCHAR(20) DEFAULT 'en_cours' CHECK (statut IN ('en_cours', 'termine', 'erreur'))
);

-- =====================================================
-- TABLES POUR L'EXPORT AVANCÉ
-- =====================================================

-- Table pour les templates d'export
CREATE TABLE IF NOT EXISTS templates_export (
    id BIGSERIAL PRIMARY KEY,
    nom_template VARCHAR(255) NOT NULL,
    description TEXT,
    type_export VARCHAR(50) NOT NULL CHECK (type_export IN ('pdf', 'excel', 'csv', 'json', 'xml', 'api')),
    format_template JSONB NOT NULL, -- structure du template
    parametres_defaut JSONB,
    actif BOOLEAN DEFAULT true,
    created_by BIGINT REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table pour les exports programmés
CREATE TABLE IF NOT EXISTS exports_programmes (
    id BIGSERIAL PRIMARY KEY,
    nom_export VARCHAR(255) NOT NULL,
    template_id BIGINT REFERENCES templates_export(id),
    frequence VARCHAR(50) NOT NULL CHECK (frequence IN ('unique', 'quotidien', 'hebdomadaire', 'mensuel')),
    parametres_export JSONB,
    destinataires JSONB,
    derniere_execution TIMESTAMP WITH TIME ZONE,
    prochaine_execution TIMESTAMP WITH TIME ZONE,
    statut VARCHAR(20) DEFAULT 'actif' CHECK (statut IN ('actif', 'inactif', 'pause')),
    created_by BIGINT REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table pour l'historique des exports
CREATE TABLE IF NOT EXISTS historique_exports (
    id BIGSERIAL PRIMARY KEY,
    export_programme_id BIGINT REFERENCES exports_programmes(id),
    template_id BIGINT REFERENCES templates_export(id),
    date_execution TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    statut VARCHAR(20) NOT NULL CHECK (statut IN ('en_cours', 'termine', 'erreur')),
    url_fichier VARCHAR(500),
    taille_fichier BIGINT,
    duree_generation INTEGER, -- en secondes
    nombre_lignes INTEGER,
    message_erreur TEXT
);

-- =====================================================
-- TABLES POUR LES TABLEAUX DE BORD PERSONNALISABLES
-- =====================================================

-- Table pour les thèmes de tableaux de bord
CREATE TABLE IF NOT EXISTS themes_tableau_bord (
    id BIGSERIAL PRIMARY KEY,
    nom_theme VARCHAR(255) NOT NULL,
    description TEXT,
    configuration_theme JSONB NOT NULL, -- couleurs, polices, styles
    actif BOOLEAN DEFAULT true,
    created_by BIGINT REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table pour les filtres globaux
CREATE TABLE IF NOT EXISTS filtres_globaux (
    id BIGSERIAL PRIMARY KEY,
    nom_filtre VARCHAR(255) NOT NULL,
    description TEXT,
    type_filtre VARCHAR(50) NOT NULL CHECK (type_filtre IN ('date', 'utilisateur', 'specialite', 'statut', 'personnalise')),
    configuration_filtre JSONB NOT NULL,
    valeurs_defaut JSONB,
    actif BOOLEAN DEFAULT true,
    created_by BIGINT REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table pour les permissions de tableaux de bord
CREATE TABLE IF NOT EXISTS permissions_tableau_bord (
    id BIGSERIAL PRIMARY KEY,
    tableau_bord_id BIGINT REFERENCES tableaux_bord_personnalises(id) ON DELETE CASCADE,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    role_permission VARCHAR(20) NOT NULL CHECK (role_permission IN ('lecture', 'modification', 'administration')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tableau_bord_id, user_id)
);

-- =====================================================
-- TABLES POUR LES ALERTES INTELLIGENTES
-- =====================================================

-- Table pour les règles d'alertes avancées
CREATE TABLE IF NOT EXISTS regles_alertes_avancees (
    id BIGSERIAL PRIMARY KEY,
    nom_regle VARCHAR(255) NOT NULL,
    description TEXT,
    type_alerte VARCHAR(50) NOT NULL CHECK (type_alerte IN ('anomalie', 'tendance', 'seuil_dynamique', 'correlation')),
    algorithme_detection VARCHAR(100) NOT NULL,
    parametres_algorithme JSONB NOT NULL,
    seuil_sensibilite DECIMAL DEFAULT 0.8,
    periode_analyse INTEGER, -- en minutes
    conditions_declenchement JSONB,
    actions_automatiques JSONB,
    actif BOOLEAN DEFAULT true,
    created_by BIGINT REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table pour les corrélations détectées
CREATE TABLE IF NOT EXISTS correlations_detectees (
    id BIGSERIAL PRIMARY KEY,
    regle_id BIGINT REFERENCES regles_alertes_avancees(id),
    metrique_1 VARCHAR(100) NOT NULL,
    metrique_2 VARCHAR(100) NOT NULL,
    coefficient_correlation DECIMAL NOT NULL,
    significativite DECIMAL,
    periode_analyse JSONB,
    interpretation TEXT,
    date_detection TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- FONCTIONS AVANCÉES POUR L'IA ET L'AUTOMATISATION
-- =====================================================

-- Fonction pour détecter les anomalies
CREATE OR REPLACE FUNCTION detecter_anomalies(
    p_metrique VARCHAR(50),
    p_periode_analyse INTEGER DEFAULT 30,
    p_seuil_sensibilite DECIMAL DEFAULT 2.0
)
RETURNS TABLE (
    date_anomalie DATE,
    valeur_metrique DECIMAL,
    valeur_moyenne DECIMAL,
    ecart_type DECIMAL,
    score_anomalie DECIMAL,
    type_anomalie VARCHAR(20)
) AS $$
DECLARE
    moyenne_metrique DECIMAL;
    ecart_type_metrique DECIMAL;
BEGIN
    -- Calculer la moyenne et l'écart-type sur la période d'analyse
    CASE p_metrique
        WHEN 'consultations' THEN
            SELECT 
                AVG(nombre_quotidien),
                STDDEV(nombre_quotidien)
            INTO moyenne_metrique, ecart_type_metrique
            FROM (
                SELECT COUNT(*) as nombre_quotidien
                FROM consultations
                WHERE date_consultation >= CURRENT_DATE - (p_periode_analyse || ' days')::INTERVAL
                GROUP BY date_consultation
            ) as stats_quotidiennes;
        
        WHEN 'revenus' THEN
            SELECT 
                AVG(revenus_quotidien),
                STDDEV(revenus_quotidien)
            INTO moyenne_metrique, ecart_type_metrique
            FROM (
                SELECT SUM(montant_ttc) as revenus_quotidien
                FROM factures
                WHERE date_facture >= CURRENT_DATE - (p_periode_analyse || ' days')::INTERVAL
                GROUP BY date_facture
            ) as stats_quotidiennes;
        
        ELSE
            RAISE EXCEPTION 'Métrique non supportée: %', p_metrique;
    END CASE;
    
    -- Détecter les anomalies
    CASE p_metrique
        WHEN 'consultations' THEN
            RETURN QUERY
            WITH donnees_recentes AS (
                SELECT 
                    DATE(date_consultation) as date_anomalie,
                    COUNT(*) as valeur_metrique
                FROM consultations
                WHERE date_consultation >= CURRENT_DATE - (p_periode_analyse || ' days')::INTERVAL
                GROUP BY DATE(date_consultation)
            )
            SELECT 
                dr.date_anomalie,
                dr.valeur_metrique,
                moyenne_metrique,
                ecart_type_metrique,
                ABS(dr.valeur_metrique - moyenne_metrique) / NULLIF(ecart_type_metrique, 0) as score_anomalie,
                CASE 
                    WHEN ABS(dr.valeur_metrique - moyenne_metrique) / NULLIF(ecart_type_metrique, 0) > p_seuil_sensibilite THEN 'anomalie'
                    ELSE 'normal'
                END as type_anomalie
            FROM donnees_recentes dr
            WHERE ABS(dr.valeur_metrique - moyenne_metrique) / NULLIF(ecart_type_metrique, 0) > p_seuil_sensibilite
            ORDER BY score_anomalie DESC;
        
        WHEN 'revenus' THEN
            RETURN QUERY
            WITH donnees_recentes AS (
                SELECT 
                    DATE(date_facture) as date_anomalie,
                    SUM(montant_ttc) as valeur_metrique
                FROM factures
                WHERE date_facture >= CURRENT_DATE - (p_periode_analyse || ' days')::INTERVAL
                GROUP BY DATE(date_facture)
            )
            SELECT 
                dr.date_anomalie,
                dr.valeur_metrique,
                moyenne_metrique,
                ecart_type_metrique,
                ABS(dr.valeur_metrique - moyenne_metrique) / NULLIF(ecart_type_metrique, 0) as score_anomalie,
                CASE 
                    WHEN ABS(dr.valeur_metrique - moyenne_metrique) / NULLIF(ecart_type_metrique, 0) > p_seuil_sensibilite THEN 'anomalie'
                    ELSE 'normal'
                END as type_anomalie
            FROM donnees_recentes dr
            WHERE ABS(dr.valeur_metrique - moyenne_metrique) / NULLIF(ecart_type_metrique, 0) > p_seuil_sensibilite
            ORDER BY score_anomalie DESC;
    END CASE;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour calculer les corrélations
CREATE OR REPLACE FUNCTION calculer_correlations(
    p_metrique_1 VARCHAR(50),
    p_metrique_2 VARCHAR(50),
    p_periode_analyse INTEGER DEFAULT 90
)
RETURNS TABLE (
    coefficient_correlation DECIMAL,
    significativite DECIMAL,
    nombre_observations INTEGER,
    interpretation TEXT
) AS $$
DECLARE
    correlation_result DECIMAL;
    observations_count INTEGER;
BEGIN
    -- Calculer la corrélation entre deux métriques
    WITH donnees_jointes AS (
        SELECT 
            COALESCE(c1.nombre_consultations, 0) as metrique_1,
            COALESCE(f1.revenus_quotidien, 0) as metrique_2
        FROM (
            SELECT 
                DATE(date_consultation) as date_jour,
                COUNT(*) as nombre_consultations
            FROM consultations
            WHERE date_consultation >= CURRENT_DATE - (p_periode_analyse || ' days')::INTERVAL
            GROUP BY DATE(date_consultation)
        ) c1
        FULL OUTER JOIN (
            SELECT 
                DATE(date_facture) as date_jour,
                SUM(montant_ttc) as revenus_quotidien
            FROM factures
            WHERE date_facture >= CURRENT_DATE - (p_periode_analyse || ' days')::INTERVAL
            GROUP BY DATE(date_facture)
        ) f1 ON c1.date_jour = f1.date_jour
    ),
    stats_correlation AS (
        SELECT 
            COUNT(*) as n,
            AVG(metrique_1) as avg_1,
            AVG(metrique_2) as avg_2,
            STDDEV(metrique_1) as std_1,
            STDDEV(metrique_2) as std_2,
            SUM((metrique_1 - AVG(metrique_1) OVER ()) * (metrique_2 - AVG(metrique_2) OVER ())) as covariance
        FROM donnees_jointes
        WHERE metrique_1 IS NOT NULL AND metrique_2 IS NOT NULL
    )
    SELECT 
        CASE 
            WHEN std_1 > 0 AND std_2 > 0 THEN covariance / (std_1 * std_2 * (n - 1))
            ELSE 0
        END,
        n
    INTO correlation_result, observations_count
    FROM stats_correlation;
    
    -- Retourner les résultats
    RETURN QUERY SELECT 
        correlation_result,
        CASE 
            WHEN observations_count > 30 THEN 
                CASE 
                    WHEN ABS(correlation_result) > 0.7 THEN 0.99
                    WHEN ABS(correlation_result) > 0.5 THEN 0.95
                    WHEN ABS(correlation_result) > 0.3 THEN 0.90
                    ELSE 0.80
                END
            ELSE 0.70
        END,
        observations_count,
        CASE 
            WHEN ABS(correlation_result) > 0.7 THEN 'Corrélation forte'
            WHEN ABS(correlation_result) > 0.5 THEN 'Corrélation modérée'
            WHEN ABS(correlation_result) > 0.3 THEN 'Corrélation faible'
            ELSE 'Pas de corrélation significative'
        END;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour générer des rapports automatisés
CREATE OR REPLACE FUNCTION generer_rapport_automatise(
    p_type_rapport VARCHAR(50),
    p_date_debut DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
    p_date_fin DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
    rapport_id BIGINT,
    statut VARCHAR(20),
    url_fichier VARCHAR(500),
    message TEXT
) AS $$
DECLARE
    rapport_id_result BIGINT;
    template_id_result BIGINT;
    url_result VARCHAR(500);
BEGIN
    -- Créer l'enregistrement du rapport
    INSERT INTO rapports_exportables (
        nom_rapport,
        type_rapport,
        format_export,
        date_debut,
        date_fin,
        statut,
        created_by
    ) VALUES (
        'Rapport Automatisé ' || p_type_rapport || ' - ' || CURRENT_DATE,
        p_type_rapport,
        'pdf',
        p_date_debut,
        p_date_fin,
        'en_cours',
        (SELECT id FROM users WHERE role = 'admin' LIMIT 1)
    ) RETURNING id INTO rapport_id_result;
    
    -- Simuler la génération du rapport
    UPDATE rapports_exportables 
    SET 
        statut = 'termine',
        url_fichier = '/rapports/automatiques/' || rapport_id_result || '.pdf',
        completed_at = NOW(),
        duree_generation = 30
    WHERE id = rapport_id_result;
    
    url_result := '/rapports/automatiques/' || rapport_id_result || '.pdf';
    
    RETURN QUERY SELECT 
        rapport_id_result,
        'termine'::VARCHAR(20),
        url_result,
        'Rapport généré avec succès'::TEXT;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- INDEX POUR OPTIMISER LES PERFORMANCES
-- =====================================================

-- Index pour les tâches automatisées
CREATE INDEX IF NOT EXISTS idx_taches_automatisees_statut ON taches_automatisees(statut);
CREATE INDEX IF NOT EXISTS idx_taches_automatisees_prochaine_execution ON taches_automatisees(prochaine_execution);
CREATE INDEX IF NOT EXISTS idx_historique_taches_date ON historique_taches_automatisees(date_debut_execution);

-- Index pour les notifications
CREATE INDEX IF NOT EXISTS idx_notifications_push_statut ON notifications_push(statut);
CREATE INDEX IF NOT EXISTS idx_notifications_push_date_creation ON notifications_push(date_creation);
CREATE INDEX IF NOT EXISTS idx_preferences_notifications_user ON preferences_notifications(user_id);

-- Index pour l'IA
CREATE INDEX IF NOT EXISTS idx_modeles_ia_statut ON modeles_ia(statut);
CREATE INDEX IF NOT EXISTS idx_predictions_ia_date ON predictions_ia(date_prediction);
CREATE INDEX IF NOT EXISTS idx_apprentissage_continu_modele ON apprentissage_continu(modele_id);

-- Index pour les exports
CREATE INDEX IF NOT EXISTS idx_templates_export_type ON templates_export(type_export);
CREATE INDEX IF NOT EXISTS idx_exports_programmes_statut ON exports_programmes(statut);
CREATE INDEX IF NOT EXISTS idx_historique_exports_date ON historique_exports(date_execution);

-- Index pour les tableaux de bord
CREATE INDEX IF NOT EXISTS idx_themes_tableau_bord_actif ON themes_tableau_bord(actif);
CREATE INDEX IF NOT EXISTS idx_filtres_globaux_type ON filtres_globaux(type_filtre);
CREATE INDEX IF NOT EXISTS idx_permissions_tableau_bord_user ON permissions_tableau_bord(user_id);

-- Index pour les alertes avancées
CREATE INDEX IF NOT EXISTS idx_regles_alertes_avancees_type ON regles_alertes_avancees(type_alerte);
CREATE INDEX IF NOT EXISTS idx_correlations_detectees_date ON correlations_detectees(date_detection);

-- =====================================================
-- DONNÉES DE TEST POUR LES FONCTIONNALITÉS AVANCÉES
-- =====================================================

-- Tâches automatisées par défaut
INSERT INTO taches_automatisees (nom_tache, description, type_tache, frequence, parametres_execution, prochaine_execution) VALUES
('Rapport Quotidien Consultations', 'Génération automatique du rapport quotidien des consultations', 'rapport', 'quotidien',
 '{"type_rapport": "consultations", "format": "pdf", "destinataires": ["admin", "secretary"]}',
 CURRENT_DATE + INTERVAL '1 day' + INTERVAL '8 hours'),
('Analyse Hebdomadaire Revenus', 'Analyse hebdomadaire des revenus avec tendances', 'rapport', 'hebdomadaire',
 '{"type_rapport": "finances", "format": "excel", "inclure_tendances": true}',
 CURRENT_DATE + INTERVAL '7 days' + INTERVAL '9 hours'),
('Nettoyage Données Anciennes', 'Nettoyage automatique des données de plus de 2 ans', 'nettoyage', 'mensuel',
 '{"age_maximum_jours": 730, "tables_a_nettoyer": ["historique_alertes", "notifications_push"]}',
 CURRENT_DATE + INTERVAL '1 month' + INTERVAL '2 hours')
ON CONFLICT DO NOTHING;

-- Modèles d'IA par défaut
INSERT INTO modeles_ia (nom_modele, description, type_modele, algorithme, version, parametres_modele, statut, precision_modele) VALUES
('Prévision Consultations', 'Modèle de prévision des consultations basé sur l''historique', 'prevision', 'ARIMA', '1.0',
 '{"ordre": [1,1,1], "periode_saisonniere": 7}', 'production', 0.85),
('Détection Anomalies Revenus', 'Modèle de détection d''anomalies dans les revenus', 'anomalie', 'Isolation Forest', '1.0',
 '{"contamination": 0.1, "n_estimators": 100}', 'production', 0.92),
('Classification Patients', 'Modèle de classification des patients par type de consultation', 'classification', 'Random Forest', '1.0',
 '{"n_estimators": 100, "max_depth": 10}', 'test', 0.78)
ON CONFLICT DO NOTHING;

-- Templates d'export par défaut
INSERT INTO templates_export (nom_template, description, type_export, format_template) VALUES
('Rapport Consultations Standard', 'Template standard pour les rapports de consultations', 'pdf',
 '{"sections": ["resume_executif", "statistiques_detaillees", "graphiques", "tableaux"], "style": "medical"}'),
('Export Excel Financier', 'Template pour l''export Excel des données financières', 'excel',
 '{"onglets": ["revenus", "depenses", "analyse_tendances"], "formules": true, "graphiques": true}'),
('API Données Temps Réel', 'Template pour l''API de données en temps réel', 'api',
 '{"endpoints": ["consultations", "revenus", "alertes"], "format": "json", "authentification": "jwt"}')
ON CONFLICT DO NOTHING;

-- Thèmes de tableaux de bord par défaut
INSERT INTO themes_tableau_bord (nom_theme, description, configuration_theme) VALUES
('Thème Médical', 'Thème adapté au secteur médical', 
 '{"couleurs": {"primaire": "#2E86AB", "secondaire": "#A23B72", "accent": "#F18F01"}, "police": "Roboto", "style": "moderne"}'),
('Thème Sombre', 'Thème sombre pour une meilleure lisibilité', 
 '{"couleurs": {"primaire": "#1a1a1a", "secondaire": "#333333", "accent": "#4CAF50"}, "police": "Inter", "style": "minimaliste"}'),
('Thème Classique', 'Thème classique et professionnel', 
 '{"couleurs": {"primaire": "#2c3e50", "secondaire": "#34495e", "accent": "#3498db"}, "police": "Open Sans", "style": "professionnel"}')
ON CONFLICT DO NOTHING;

-- Filtres globaux par défaut
INSERT INTO filtres_globaux (nom_filtre, description, type_filtre, configuration_filtre, valeurs_defaut) VALUES
('Période de Date', 'Filtre pour sélectionner une période de date', 'date',
 '{"type": "range", "format": "YYYY-MM-DD", "options": ["aujourd_hui", "semaine", "mois", "trimestre", "annee"]}',
 '{"debut": "2024-01-01", "fin": "2024-12-31"}'),
('Spécialité Médicale', 'Filtre pour sélectionner une spécialité', 'specialite',
 '{"type": "select", "multiple": true, "source": "specialites"}',
 '{"valeurs": ["cardiologie", "dermatologie", "pediatrie"]}'),
('Statut Consultation', 'Filtre pour le statut des consultations', 'statut',
 '{"type": "select", "multiple": true, "options": ["planifiee", "en_cours", "terminee", "annulee"]}',
 '{"valeurs": ["terminee"]}')
ON CONFLICT DO NOTHING;

-- Règles d'alertes avancées par défaut
INSERT INTO regles_alertes_avancees (nom_regle, description, type_alerte, algorithme_detection, parametres_algorithme, seuil_sensibilite) VALUES
('Détection Anomalies Consultations', 'Détection automatique d''anomalies dans le nombre de consultations', 'anomalie', 'Isolation Forest',
 '{"contamination": 0.05, "n_estimators": 100, "periode_analyse": 30}', 0.8),
('Tendance Revenus Décroissante', 'Détection de tendances décroissantes dans les revenus', 'tendance', 'Régression Linéaire',
 '{"fenetre_analyse": 14, "seuil_declin": -0.1}', 0.7),
('Corrélation Charge Travail', 'Détection de corrélations entre charge de travail et qualité', 'correlation', 'Pearson',
 '{"metrique_1": "consultations_quotidiennes", "metrique_2": "duree_moyenne_consultation", "periode": 30}', 0.6)
ON CONFLICT DO NOTHING;
