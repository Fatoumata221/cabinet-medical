-- Migration to add appearance and document settings to parametres_cabinet
-- Date: 2026-01-21

ALTER TABLE public.parametres_cabinet
ADD COLUMN IF NOT EXISTS favicon_url VARCHAR(500),
ADD COLUMN IF NOT EXISTS titre_page VARCHAR(255),

-- Couleurs principales
ADD COLUMN IF NOT EXISTS couleur_principale VARCHAR(50),
ADD COLUMN IF NOT EXISTS couleur_secondaire VARCHAR(50),
ADD COLUMN IF NOT EXISTS couleur_accent VARCHAR(50),
ADD COLUMN IF NOT EXISTS couleur_success VARCHAR(50),
ADD COLUMN IF NOT EXISTS couleur_warning VARCHAR(50),
ADD COLUMN IF NOT EXISTS couleur_danger VARCHAR(50),
ADD COLUMN IF NOT EXISTS couleur_info VARCHAR(50),

-- Couleurs de l'interface
ADD COLUMN IF NOT EXISTS couleur_background VARCHAR(50),
ADD COLUMN IF NOT EXISTS couleur_surface VARCHAR(50),
ADD COLUMN IF NOT EXISTS couleur_texte VARCHAR(50),
ADD COLUMN IF NOT EXISTS couleur_texte_secondaire VARCHAR(50),
ADD COLUMN IF NOT EXISTS couleur_bordure VARCHAR(50),

-- Sidebar
ADD COLUMN IF NOT EXISTS couleur_sidebar_fond VARCHAR(50),
ADD COLUMN IF NOT EXISTS couleur_sidebar_texte VARCHAR(50),
ADD COLUMN IF NOT EXISTS titre_sidebar VARCHAR(255),

-- Header
ADD COLUMN IF NOT EXISTS couleur_header_fond VARCHAR(50),
ADD COLUMN IF NOT EXISTS couleur_header_texte VARCHAR(50),
ADD COLUMN IF NOT EXISTS afficher_logo_header BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS afficher_nom_cabinet_header BOOLEAN DEFAULT true,

-- Login
ADD COLUMN IF NOT EXISTS couleur_login_gradient_debut VARCHAR(50),
ADD COLUMN IF NOT EXISTS couleur_login_gradient_milieu VARCHAR(50),
ADD COLUMN IF NOT EXISTS couleur_login_gradient_fin VARCHAR(50),

-- Typographie
ADD COLUMN IF NOT EXISTS police_famille VARCHAR(100),
ADD COLUMN IF NOT EXISTS taille_police_base INTEGER,

-- Thème
ADD COLUMN IF NOT EXISTS theme VARCHAR(20) DEFAULT 'light',

-- Documents
ADD COLUMN IF NOT EXISTS document_logo_url VARCHAR(500),
ADD COLUMN IF NOT EXISTS document_cachet_url VARCHAR(500),
ADD COLUMN IF NOT EXISTS document_lieu_par_defaut VARCHAR(100),
ADD COLUMN IF NOT EXISTS document_afficher_logo BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS document_afficher_cachet BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS document_afficher_adresse_complete BOOLEAN DEFAULT true,

ADD COLUMN IF NOT EXISTS document_couleur_principale VARCHAR(50),
ADD COLUMN IF NOT EXISTS document_couleur_secondaire VARCHAR(50),
ADD COLUMN IF NOT EXISTS document_couleur_bordure VARCHAR(50),

ADD COLUMN IF NOT EXISTS certificat_titre VARCHAR(255),
ADD COLUMN IF NOT EXISTS certificat_texte_introduction TEXT,
ADD COLUMN IF NOT EXISTS certificat_texte_mention TEXT,
ADD COLUMN IF NOT EXISTS certificat_footer_texte TEXT,
ADD COLUMN IF NOT EXISTS certificat_afficher_numero_dossier BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS certificat_afficher_date_emission BOOLEAN DEFAULT true,

ADD COLUMN IF NOT EXISTS ordonnance_titre VARCHAR(255),
ADD COLUMN IF NOT EXISTS ordonnance_footer_texte TEXT,
ADD COLUMN IF NOT EXISTS ordonnance_afficher_numero BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS ordonnance_afficher_date_prescription BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS ordonnance_afficher_prochain_rdv BOOLEAN DEFAULT true,

ADD COLUMN IF NOT EXISTS document_police VARCHAR(100),
ADD COLUMN IF NOT EXISTS document_taille_police INTEGER,
ADD COLUMN IF NOT EXISTS document_marge_haut INTEGER,
ADD COLUMN IF NOT EXISTS document_marge_bas INTEGER,
ADD COLUMN IF NOT EXISTS document_marge_gauche INTEGER,
ADD COLUMN IF NOT EXISTS document_marge_droite INTEGER,
ADD COLUMN IF NOT EXISTS document_largeur_max INTEGER,
ADD COLUMN IF NOT EXISTS document_afficher_fond BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS document_couleur_fond VARCHAR(50),

ADD COLUMN IF NOT EXISTS document_texte_footer_general TEXT,
ADD COLUMN IF NOT EXISTS document_afficher_telephone BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS document_afficher_email BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS document_afficher_site_web BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS document_afficher_numero_agrement BOOLEAN DEFAULT false;
