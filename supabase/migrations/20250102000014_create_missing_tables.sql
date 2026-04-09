-- Migration pour créer les tables manquantes: liste_maladies et examens_diagnostic
-- Date: 2025-01-02
-- Description: Création des tables de paramétrage médical manquantes

-- Table liste_maladies
CREATE TABLE IF NOT EXISTS public.liste_maladies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nom VARCHAR(255) NOT NULL,
    code_cim VARCHAR(50),
    description TEXT,
    actif BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index pour optimiser les recherches
CREATE INDEX IF NOT EXISTS idx_liste_maladies_nom ON public.liste_maladies(nom);
CREATE INDEX IF NOT EXISTS idx_liste_maladies_code_cim ON public.liste_maladies(code_cim);
CREATE INDEX IF NOT EXISTS idx_liste_maladies_actif ON public.liste_maladies(actif);

-- Table examens_diagnostic
CREATE TABLE IF NOT EXISTS public.examens_diagnostic (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nom VARCHAR(255) NOT NULL,
    description TEXT,
    preparation TEXT,
    actif BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index pour optimiser les recherches
CREATE INDEX IF NOT EXISTS idx_examens_diagnostic_nom ON public.examens_diagnostic(nom);
CREATE INDEX IF NOT EXISTS idx_examens_diagnostic_actif ON public.examens_diagnostic(actif);

-- Trigger pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Appliquer le trigger aux deux tables
DROP TRIGGER IF EXISTS update_liste_maladies_updated_at ON public.liste_maladies;
CREATE TRIGGER update_liste_maladies_updated_at
    BEFORE UPDATE ON public.liste_maladies
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_examens_diagnostic_updated_at ON public.examens_diagnostic;
CREATE TRIGGER update_examens_diagnostic_updated_at
    BEFORE UPDATE ON public.examens_diagnostic
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Politiques RLS (Row Level Security)
ALTER TABLE public.liste_maladies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.examens_diagnostic ENABLE ROW LEVEL SECURITY;

-- Politique pour liste_maladies - Lecture pour tous les utilisateurs authentifiés
CREATE POLICY "Enable read access for authenticated users" ON public.liste_maladies
    FOR SELECT USING (auth.role() = 'authenticated');

-- Politique pour liste_maladies - Écriture pour admins et médecins
CREATE POLICY "Enable insert/update/delete for admin and doctor" ON public.liste_maladies
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND (users.role = 'admin' OR users.role = 'doctor')
        )
    );

-- Politique pour examens_diagnostic - Lecture pour tous les utilisateurs authentifiés
CREATE POLICY "Enable read access for authenticated users" ON public.examens_diagnostic
    FOR SELECT USING (auth.role() = 'authenticated');

-- Politique pour examens_diagnostic - Écriture pour admins et médecins
CREATE POLICY "Enable insert/update/delete for admin and doctor" ON public.examens_diagnostic
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND (users.role = 'admin' OR users.role = 'doctor')
        )
    );

-- Insérer quelques données de test pour liste_maladies
INSERT INTO public.liste_maladies (nom, code_cim, description, actif) VALUES
('Hypertension artérielle', 'I10', 'Élévation anormale de la pression artérielle', true),
('Diabète de type 2', 'E11', 'Diabète sucré non insulino-dépendant', true),
('Asthme', 'J45', 'Maladie inflammatoire chronique des voies respiratoires', true),
('Migraine', 'G43', 'Céphalée récurrente avec ou sans aura', true),
('Arthrose', 'M15-M19', 'Dégénérescence du cartilage articulaire', true),
('Dépression', 'F32', 'Épisode dépressif majeur', true),
('Rhinite allergique', 'J30', 'Inflammation allergique de la muqueuse nasale', true),
('Gastrite', 'K29', 'Inflammation de la muqueuse gastrique', true),
('Lombalgie', 'M54.5', 'Douleur lombaire', true),
('Anxiété généralisée', 'F41.1', 'Trouble anxieux généralisé', true)
ON CONFLICT (nom) DO NOTHING;

-- Insérer quelques données de test pour examens_diagnostic
INSERT INTO public.examens_diagnostic (nom, description, preparation, actif) VALUES
('Radiographie thoracique', 'Examen radiologique du thorax', 'Aucune préparation particulière', true),
('Échographie abdominale', 'Examen échographique de l''abdomen', 'Jeûne de 12 heures', true),
('Électrocardiogramme (ECG)', 'Enregistrement de l''activité électrique du cœur', 'Aucune préparation', true),
('Prise de sang', 'Prélèvement sanguin pour analyses biologiques', 'Jeûne selon les analyses demandées', true),
('Scanner cérébral', 'Tomodensitométrie du crâne', 'Retirer les objets métalliques', true),
('IRM lombaire', 'Imagerie par résonance magnétique du rachis lombaire', 'Questionnaire de sécurité, retirer objets métalliques', true),
('Mammographie', 'Radiographie des seins', 'Éviter déodorant et crème le jour de l''examen', true),
('Coloscopie', 'Endoscopie du côlon', 'Préparation colique 3 jours avant', true),
('Spirométrie', 'Test de fonction respiratoire', 'Éviter bronchodilatateurs 6h avant', true),
('Échographie cardiaque', 'Échocardiographie transthoracique', 'Aucune préparation particulière', true)
ON CONFLICT (nom) DO NOTHING;

-- Commentaires sur les tables
COMMENT ON TABLE public.liste_maladies IS 'Table contenant la liste des maladies avec codes CIM-10';
COMMENT ON TABLE public.examens_diagnostic IS 'Table contenant la liste des examens de diagnostic disponibles';

COMMENT ON COLUMN public.liste_maladies.nom IS 'Nom de la maladie';
COMMENT ON COLUMN public.liste_maladies.code_cim IS 'Code CIM-10 de la maladie';
COMMENT ON COLUMN public.liste_maladies.description IS 'Description détaillée de la maladie';

COMMENT ON COLUMN public.examens_diagnostic.nom IS 'Nom de l''examen diagnostic';
COMMENT ON COLUMN public.examens_diagnostic.description IS 'Description de l''examen';
COMMENT ON COLUMN public.examens_diagnostic.preparation IS 'Instructions de préparation pour le patient';
