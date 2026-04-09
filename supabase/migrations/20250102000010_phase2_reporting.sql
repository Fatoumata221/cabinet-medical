-- =====================================================
-- PHASE 2 - REPORTING : FONCTIONNALITÉS AVANCÉES
-- =====================================================

-- =====================================================
-- TABLES POUR LES RAPPORTS EXPORTABLES
-- =====================================================

-- Table pour stocker les rapports générés
CREATE TABLE IF NOT EXISTS rapports_exportables (
    id BIGSERIAL PRIMARY KEY,
    nom_rapport VARCHAR(255) NOT NULL,
    type_rapport VARCHAR(50) NOT NULL CHECK (type_rapport IN ('consultations', 'finances', 'actes', 'patients', 'medecins', 'complet')),
    format_export VARCHAR(20) NOT NULL CHECK (format_export IN ('pdf', 'excel', 'csv', 'json')),
    parametres_filtres JSONB,
    date_debut DATE,
    date_fin DATE,
    statut VARCHAR(20) DEFAULT 'en_cours' CHECK (statut IN ('en_cours', 'termine', 'erreur', 'annule')),
    url_fichier VARCHAR(500),
    taille_fichier BIGINT,
    duree_generation INTEGER, -- en secondes
    created_by BIGINT REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Table pour les modèles de rapports
CREATE TABLE IF NOT EXISTS modeles_rapports (
    id BIGSERIAL PRIMARY KEY,
    nom_modele VARCHAR(255) NOT NULL,
    description TEXT,
    type_rapport VARCHAR(50) NOT NULL,
    parametres_defaut JSONB,
    colonnes_a_inclure JSONB,
    filtres_defaut JSONB,
    ordre_tri JSONB,
    actif BOOLEAN DEFAULT true,
    created_by BIGINT REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TABLES POUR LES TABLEAUX DE BORD INTERACTIFS
-- =====================================================

-- Table pour les widgets de tableau de bord
CREATE TABLE IF NOT EXISTS widgets_tableau_bord (
    id BIGSERIAL PRIMARY KEY,
    nom_widget VARCHAR(255) NOT NULL,
    type_widget VARCHAR(50) NOT NULL CHECK (type_widget IN ('graphique', 'metrique', 'tableau', 'calendrier', 'liste')),
    titre VARCHAR(255) NOT NULL,
    description TEXT,
    configuration JSONB NOT NULL, -- configuration du widget (requête, style, etc.)
    position_x INTEGER DEFAULT 0,
    position_y INTEGER DEFAULT 0,
    largeur INTEGER DEFAULT 1,
    hauteur INTEGER DEFAULT 1,
    actif BOOLEAN DEFAULT true,
    created_by BIGINT REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table pour les tableaux de bord personnalisés
CREATE TABLE IF NOT EXISTS tableaux_bord_personnalises (
    id BIGSERIAL PRIMARY KEY,
    nom_tableau VARCHAR(255) NOT NULL,
    description TEXT,
    configuration_layout JSONB, -- disposition des widgets
    parametres_rafraichissement JSONB, -- fréquence de rafraîchissement
    actif BOOLEAN DEFAULT true,
    created_by BIGINT REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table de liaison tableau de bord - widgets
CREATE TABLE IF NOT EXISTS tableau_bord_widgets (
    id BIGSERIAL PRIMARY KEY,
    tableau_bord_id BIGINT REFERENCES tableaux_bord_personnalises(id) ON DELETE CASCADE,
    widget_id BIGINT REFERENCES widgets_tableau_bord(id) ON DELETE CASCADE,
    position_x INTEGER DEFAULT 0,
    position_y INTEGER DEFAULT 0,
    largeur INTEGER DEFAULT 1,
    hauteur INTEGER DEFAULT 1,
    ordre_affichage INTEGER DEFAULT 0,
    UNIQUE(tableau_bord_id, widget_id)
);

-- =====================================================
-- TABLES POUR LES ALERTES ET NOTIFICATIONS
-- =====================================================

-- Table pour les règles d'alertes
CREATE TABLE IF NOT EXISTS regles_alertes (
    id BIGSERIAL PRIMARY KEY,
    nom_regle VARCHAR(255) NOT NULL,
    description TEXT,
    type_alerte VARCHAR(50) NOT NULL CHECK (type_alerte IN ('seuil', 'tendance', 'anomalie', 'absence', 'retard')),
    condition_alerte JSONB NOT NULL, -- conditions de déclenchement
    seuil_valeur DECIMAL,
    periode_verification INTEGER, -- en minutes
    statut VARCHAR(20) DEFAULT 'active' CHECK (statut IN ('active', 'inactive', 'pause')),
    priorite VARCHAR(20) DEFAULT 'normale' CHECK (priorite IN ('basse', 'normale', 'haute', 'critique')),
    destinataires JSONB, -- liste des destinataires
    message_template TEXT,
    actif BOOLEAN DEFAULT true,
    created_by BIGINT REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table pour l'historique des alertes déclenchées
CREATE TABLE IF NOT EXISTS historique_alertes (
    id BIGSERIAL PRIMARY KEY,
    regle_id BIGINT REFERENCES regles_alertes(id),
    type_alerte VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    donnees_contexte JSONB, -- données du contexte de l'alerte
    statut VARCHAR(20) DEFAULT 'nouvelle' CHECK (statut IN ('nouvelle', 'lue', 'traitee', 'ignoree')),
    priorite VARCHAR(20) DEFAULT 'normale',
    date_declenchement TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    date_traitement TIMESTAMP WITH TIME ZONE,
    traite_par BIGINT REFERENCES users(id),
    notes_traitement TEXT
);

-- =====================================================
-- TABLES POUR LES TENDANCES ET PRÉVISIONS
-- =====================================================

-- Table pour les analyses de tendances
CREATE TABLE IF NOT EXISTS analyses_tendances (
    id BIGSERIAL PRIMARY KEY,
    nom_analyse VARCHAR(255) NOT NULL,
    type_metrique VARCHAR(50) NOT NULL CHECK (type_metrique IN ('consultations', 'revenus', 'patients', 'actes', 'duree')),
    periode_analyse VARCHAR(20) NOT NULL CHECK (periode_analyse IN ('jour', 'semaine', 'mois', 'trimestre', 'annee')),
    date_debut_analyse DATE NOT NULL,
    date_fin_analyse DATE NOT NULL,
    donnees_tendance JSONB NOT NULL, -- données calculées de la tendance
    coefficient_tendance DECIMAL, -- pente de la tendance
    r_squared DECIMAL, -- qualité de la régression
    prediction_prochaine_periode DECIMAL,
    intervalle_confiance JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table pour les prévisions
CREATE TABLE IF NOT EXISTS previsions (
    id BIGSERIAL PRIMARY KEY,
    nom_prevision VARCHAR(255) NOT NULL,
    type_prevision VARCHAR(50) NOT NULL CHECK (type_prevision IN ('consultations', 'revenus', 'patients', 'charge_travail')),
    modele_utilise VARCHAR(50) NOT NULL CHECK (modele_utilise IN ('lineaire', 'saisonniere', 'moyenne_mobile', 'exponentielle')),
    horizon_prevision INTEGER NOT NULL, -- nombre de périodes à prévoir
    donnees_historiques JSONB NOT NULL,
    resultats_prevision JSONB NOT NULL,
    precision_modele DECIMAL, -- indicateur de précision
    date_creation TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by BIGINT REFERENCES users(id)
);

-- =====================================================
-- TABLES POUR LES COMPARAISONS TEMPORELLES
-- =====================================================

-- Table pour les périodes de comparaison
CREATE TABLE IF NOT EXISTS periodes_comparaison (
    id BIGSERIAL PRIMARY KEY,
    nom_comparaison VARCHAR(255) NOT NULL,
    description TEXT,
    periode_reference JSONB NOT NULL, -- période de référence (date_debut, date_fin)
    periode_comparaison JSONB NOT NULL, -- période à comparer
    metriques_a_comparer JSONB NOT NULL, -- liste des métriques à comparer
    seuil_significatif DECIMAL DEFAULT 5.0, -- seuil de variation significative (%)
    created_by BIGINT REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table pour les résultats de comparaison
CREATE TABLE IF NOT EXISTS resultats_comparaison (
    id BIGSERIAL PRIMARY KEY,
    periode_comparaison_id BIGINT REFERENCES periodes_comparaison(id),
    metrique VARCHAR(50) NOT NULL,
    valeur_reference DECIMAL NOT NULL,
    valeur_comparaison DECIMAL NOT NULL,
    variation_absolue DECIMAL NOT NULL,
    variation_relative DECIMAL NOT NULL, -- en pourcentage
    significatif BOOLEAN DEFAULT false,
    interpretation TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- FONCTIONS AVANCÉES POUR LES RAPPORTS
-- =====================================================

-- Fonction pour calculer les tendances
CREATE OR REPLACE FUNCTION calculer_tendance(
    p_type_metrique VARCHAR(50),
    p_date_debut DATE,
    p_date_fin DATE,
    p_periode VARCHAR(20) DEFAULT 'jour'
)
RETURNS TABLE (
    date_periode DATE,
    valeur_metrique DECIMAL,
    tendance DECIMAL,
    variation_periode_precedente DECIMAL
) AS $$
DECLARE
    sql_query TEXT;
BEGIN
    -- Construire la requête selon le type de métrique
    CASE p_type_metrique
        WHEN 'consultations' THEN
            sql_query := '
                WITH donnees_periode AS (
                    SELECT 
                        DATE(c.date_consultation) as date_periode,
                        COUNT(*) as valeur_metrique
                    FROM consultations c
                    WHERE c.date_consultation BETWEEN $1 AND $2
                    GROUP BY DATE(c.date_consultation)
                    ORDER BY date_periode
                ),
                donnees_avec_tendance AS (
                    SELECT 
                        date_periode,
                        valeur_metrique,
                        LAG(valeur_metrique) OVER (ORDER BY date_periode) as valeur_precedente,
                        CASE 
                            WHEN LAG(valeur_metrique) OVER (ORDER BY date_periode) > 0 
                            THEN ((valeur_metrique - LAG(valeur_metrique) OVER (ORDER BY date_periode)) / LAG(valeur_metrique) OVER (ORDER BY date_periode)) * 100
                            ELSE 0
                        END as variation_periode_precedente
                    FROM donnees_periode
                )
                SELECT 
                    date_periode,
                    valeur_metrique,
                    AVG(valeur_metrique) OVER (ORDER BY date_periode ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) as tendance,
                    variation_periode_precedente
                FROM donnees_avec_tendance
                ORDER BY date_periode';
        
        WHEN 'revenus' THEN
            sql_query := '
                WITH donnees_periode AS (
                    SELECT 
                        DATE(f.date_facture) as date_periode,
                        SUM(f.montant_ttc) as valeur_metrique
                    FROM factures f
                    WHERE f.date_facture BETWEEN $1 AND $2
                    GROUP BY DATE(f.date_facture)
                    ORDER BY date_periode
                ),
                donnees_avec_tendance AS (
                    SELECT 
                        date_periode,
                        valeur_metrique,
                        LAG(valeur_metrique) OVER (ORDER BY date_periode) as valeur_precedente,
                        CASE 
                            WHEN LAG(valeur_metrique) OVER (ORDER BY date_periode) > 0 
                            THEN ((valeur_metrique - LAG(valeur_metrique) OVER (ORDER BY date_periode)) / LAG(valeur_metrique) OVER (ORDER BY date_periode)) * 100
                            ELSE 0
                        END as variation_periode_precedente
                    FROM donnees_periode
                )
                SELECT 
                    date_periode,
                    valeur_metrique,
                    AVG(valeur_metrique) OVER (ORDER BY date_periode ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) as tendance,
                    variation_periode_precedente
                FROM donnees_avec_tendance
                ORDER BY date_periode';
        
        ELSE
            RAISE EXCEPTION 'Type de métrique non supporté: %', p_type_metrique;
    END CASE;
    
    RETURN QUERY EXECUTE sql_query USING p_date_debut, p_date_fin;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour générer des prévisions simples
CREATE OR REPLACE FUNCTION generer_prevision_simple(
    p_type_prevision VARCHAR(50),
    p_horizon INTEGER DEFAULT 30,
    p_date_debut_historique DATE DEFAULT CURRENT_DATE - INTERVAL '90 days'
)
RETURNS TABLE (
    date_prevision DATE,
    valeur_prevue DECIMAL,
    intervalle_min DECIMAL,
    intervalle_max DECIMAL
) AS $$
DECLARE
    moyenne_quotidienne DECIMAL;
    ecart_type DECIMAL;
    date_courante DATE;
    i INTEGER;
BEGIN
    -- Calculer la moyenne et l'écart-type des données historiques
    CASE p_type_prevision
        WHEN 'consultations' THEN
            SELECT 
                AVG(nombre_quotidien),
                STDDEV(nombre_quotidien)
            INTO moyenne_quotidienne, ecart_type
            FROM (
                SELECT COUNT(*) as nombre_quotidien
                FROM consultations
                WHERE date_consultation >= p_date_debut_historique
                GROUP BY date_consultation
            ) as stats_quotidiennes;
        
        WHEN 'revenus' THEN
            SELECT 
                AVG(revenus_quotidien),
                STDDEV(revenus_quotidien)
            INTO moyenne_quotidienne, ecart_type
            FROM (
                SELECT SUM(montant_ttc) as revenus_quotidien
                FROM factures
                WHERE date_facture >= p_date_debut_historique
                GROUP BY date_facture
            ) as stats_quotidiennes;
        
        ELSE
            RAISE EXCEPTION 'Type de prévision non supporté: %', p_type_prevision;
    END CASE;
    
    -- Générer les prévisions pour chaque jour
    date_courante := CURRENT_DATE + INTERVAL '1 day';
    
    FOR i IN 1..p_horizon LOOP
        RETURN QUERY SELECT 
            date_courante,
            moyenne_quotidienne,
            moyenne_quotidienne - (1.96 * ecart_type),
            moyenne_quotidienne + (1.96 * ecart_type);
        
        date_courante := date_courante + INTERVAL '1 day';
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour comparer deux périodes
CREATE OR REPLACE FUNCTION comparer_periodes(
    p_metrique VARCHAR(50),
    p_date_debut_ref DATE,
    p_date_fin_ref DATE,
    p_date_debut_comp DATE,
    p_date_fin_comp DATE
)
RETURNS TABLE (
    periode VARCHAR(20),
    valeur_totale DECIMAL,
    nombre_jours INTEGER,
    moyenne_quotidienne DECIMAL,
    variation_relative DECIMAL
) AS $$
DECLARE
    valeur_ref DECIMAL;
    valeur_comp DECIMAL;
    jours_ref INTEGER;
    jours_comp INTEGER;
BEGIN
    -- Calculer les valeurs pour la période de référence
    CASE p_metrique
        WHEN 'consultations' THEN
            SELECT COUNT(*), p_date_fin_ref - p_date_debut_ref + 1
            INTO valeur_ref, jours_ref
            FROM consultations
            WHERE date_consultation BETWEEN p_date_debut_ref AND p_date_fin_ref;
        
        WHEN 'revenus' THEN
            SELECT COALESCE(SUM(montant_ttc), 0), p_date_fin_ref - p_date_debut_ref + 1
            INTO valeur_ref, jours_ref
            FROM factures
            WHERE date_facture BETWEEN p_date_debut_ref AND p_date_fin_ref;
        
        WHEN 'patients' THEN
            SELECT COUNT(DISTINCT patient_id), p_date_fin_ref - p_date_debut_ref + 1
            INTO valeur_ref, jours_ref
            FROM consultations
            WHERE date_consultation BETWEEN p_date_debut_ref AND p_date_fin_ref;
        
        ELSE
            RAISE EXCEPTION 'Métrique non supportée: %', p_metrique;
    END CASE;
    
    -- Calculer les valeurs pour la période de comparaison
    CASE p_metrique
        WHEN 'consultations' THEN
            SELECT COUNT(*), p_date_fin_comp - p_date_debut_comp + 1
            INTO valeur_comp, jours_comp
            FROM consultations
            WHERE date_consultation BETWEEN p_date_debut_comp AND p_date_fin_comp;
        
        WHEN 'revenus' THEN
            SELECT COALESCE(SUM(montant_ttc), 0), p_date_fin_comp - p_date_debut_comp + 1
            INTO valeur_comp, jours_comp
            FROM factures
            WHERE date_facture BETWEEN p_date_debut_comp AND p_date_fin_comp;
        
        WHEN 'patients' THEN
            SELECT COUNT(DISTINCT patient_id), p_date_fin_comp - p_date_debut_comp + 1
            INTO valeur_comp, jours_comp
            FROM consultations
            WHERE date_consultation BETWEEN p_date_debut_comp AND p_date_fin_comp;
    END CASE;
    
    -- Retourner les résultats
    RETURN QUERY SELECT 
        'Reference'::VARCHAR(20),
        valeur_ref,
        jours_ref,
        CASE WHEN jours_ref > 0 THEN valeur_ref / jours_ref ELSE 0 END,
        0.0;
    
    RETURN QUERY SELECT 
        'Comparaison'::VARCHAR(20),
        valeur_comp,
        jours_comp,
        CASE WHEN jours_comp > 0 THEN valeur_comp / jours_comp ELSE 0 END,
        CASE 
            WHEN valeur_ref > 0 THEN ((valeur_comp - valeur_ref) / valeur_ref) * 100
            ELSE 0
        END;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- INDEX POUR OPTIMISER LES PERFORMANCES
-- =====================================================

-- Index pour les rapports exportables
CREATE INDEX IF NOT EXISTS idx_rapports_exportables_type ON rapports_exportables(type_rapport);
CREATE INDEX IF NOT EXISTS idx_rapports_exportables_statut ON rapports_exportables(statut);
CREATE INDEX IF NOT EXISTS idx_rapports_exportables_created_by ON rapports_exportables(created_by);
CREATE INDEX IF NOT EXISTS idx_rapports_exportables_date_creation ON rapports_exportables(created_at);

-- Index pour les alertes
CREATE INDEX IF NOT EXISTS idx_regles_alertes_type ON regles_alertes(type_alerte);
CREATE INDEX IF NOT EXISTS idx_regles_alertes_statut ON regles_alertes(statut);
CREATE INDEX IF NOT EXISTS idx_historique_alertes_date ON historique_alertes(date_declenchement);
CREATE INDEX IF NOT EXISTS idx_historique_alertes_statut ON historique_alertes(statut);

-- Index pour les analyses de tendances
CREATE INDEX IF NOT EXISTS idx_analyses_tendances_type ON analyses_tendances(type_metrique);
CREATE INDEX IF NOT EXISTS idx_analyses_tendances_date ON analyses_tendances(date_debut_analyse);

-- Index pour les prévisions
CREATE INDEX IF NOT EXISTS idx_previsions_type ON previsions(type_prevision);
CREATE INDEX IF NOT EXISTS idx_previsions_date_creation ON previsions(date_creation);

-- =====================================================
-- DONNÉES DE TEST POUR LES FONCTIONNALITÉS AVANCÉES
-- =====================================================

-- Modèles de rapports par défaut
INSERT INTO modeles_rapports (nom_modele, description, type_rapport, parametres_defaut, colonnes_a_inclure) VALUES
('Rapport Consultations Mensuel', 'Rapport détaillé des consultations par mois', 'consultations', 
 '{"periode": "mois", "groupement": "medecin"}', 
 '["date_consultation", "medecin", "patient", "duree", "motif"]'),
('Rapport Financier Trimestriel', 'Rapport financier détaillé par trimestre', 'finances',
 '{"periode": "trimestre", "groupement": "specialite"}',
 '["date_facture", "montant_ttc", "montant_paye", "statut_paiement", "mode_paiement"]'),
('Rapport Actes par Type', 'Analyse des actes par type et spécialité', 'actes',
 '{"periode": "mois", "groupement": "type_acte"}',
 '["type_acte", "specialite", "nombre_actes", "montant_total", "tarif_moyen"]')
ON CONFLICT DO NOTHING;

-- Widgets de tableau de bord par défaut
INSERT INTO widgets_tableau_bord (nom_widget, type_widget, titre, description, configuration) VALUES
('Consultations Quotidiennes', 'graphique', 'Consultations du Jour', 'Graphique des consultations par jour',
 '{"type": "line", "requete": "SELECT date_consultation, COUNT(*) FROM consultations GROUP BY date_consultation ORDER BY date_consultation", "rafraichissement": 300}'),
('Revenus Mensuels', 'graphique', 'Revenus Mensuels', 'Évolution des revenus par mois',
 '{"type": "bar", "requete": "SELECT DATE_TRUNC(''month'', date_facture) as mois, SUM(montant_ttc) FROM factures GROUP BY mois ORDER BY mois", "rafraichissement": 3600}'),
('Métriques Clés', 'metrique', 'Métriques du Jour', 'Indicateurs clés de performance',
 '{"metriques": ["consultations_aujourd_hui", "revenus_aujourd_hui", "patients_nouveaux", "taux_occupation"]}'),
('Top Médecins', 'tableau', 'Médecins les Plus Actifs', 'Classement des médecins par activité',
 '{"requete": "SELECT nom, prenom, COUNT(*) as consultations FROM users u JOIN consultations c ON u.id = c.medecin_id WHERE u.role = ''doctor'' GROUP BY u.id, nom, prenom ORDER BY consultations DESC LIMIT 10"}')
ON CONFLICT DO NOTHING;

-- Règles d'alertes par défaut
INSERT INTO regles_alertes (nom_regle, description, type_alerte, condition_alerte, seuil_valeur, periode_verification, priorite, message_template) VALUES
('Consultations Faibles', 'Alerte si le nombre de consultations est faible', 'seuil',
 '{"metrique": "consultations_quotidiennes", "operateur": "<"}', 5, 1440, 'normale',
 'Le nombre de consultations aujourd''hui (%valeur%) est inférieur au seuil de %seuil%'),
('Revenus Exceptionnels', 'Alerte si les revenus sont exceptionnellement élevés', 'seuil',
 '{"metrique": "revenus_quotidiens", "operateur": ">"}', 100000, 1440, 'haute',
 'Les revenus aujourd''hui (%valeur%) dépassent le seuil de %seuil%'),
('Absence Médecin', 'Alerte si un médecin n''a pas de consultations prévues', 'absence',
 '{"duree_absence": 48, "type": "medecin_sans_consultation"}', NULL, 60, 'normale',
 'Le médecin %medecin% n''a pas de consultations prévues depuis %duree% heures')
ON CONFLICT DO NOTHING;
