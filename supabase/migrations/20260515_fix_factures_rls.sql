-- Migration: Correction des politiques RLS pour les factures
-- Date: 2025-05-15
-- Description: Correction des politiques RLS pour permettre aux secrétaires et comptables de voir toutes les factures

-- Supprimer les anciennes politiques sur les factures
DROP POLICY IF EXISTS "Les médecins peuvent voir les factures de leurs consultations" ON factures;
DROP POLICY IF EXISTS "Les secrétaires peuvent voir toutes les factures" ON factures;
DROP POLICY IF EXISTS "Les comptables peuvent voir et gérer toutes les factures" ON factures;
DROP POLICY IF EXISTS "Les admins peuvent gérer toutes les factures" ON factures;

-- Créer une fonction pour obtenir le rôle de l'utilisateur actuel
CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS TEXT AS $$
BEGIN
    RETURN (
        SELECT role FROM users 
        WHERE auth_id = auth.uid()
        LIMIT 1
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Nouvelles politiques pour les factures
CREATE POLICY "Les médecins peuvent voir les factures de leurs consultations" ON factures
    FOR SELECT USING (
        get_current_user_role() = 'doctor' AND
        consultation_id IN (
            SELECT id FROM consultations WHERE medecin_id = auth.uid()
        )
    );

CREATE POLICY "Les secrétaires peuvent voir toutes les factures" ON factures
    FOR SELECT USING (
        get_current_user_role() = 'secretary'
    );

CREATE POLICY "Les comptables peuvent voir toutes les factures" ON factures
    FOR SELECT USING (
        get_current_user_role() = 'accounting'
    );

CREATE POLICY "Les admins peuvent voir toutes les factures" ON factures
    FOR SELECT USING (
        get_current_user_role() = 'admin'
    );

CREATE POLICY "Les comptables peuvent gérer toutes les factures" ON factures
    FOR ALL USING (
        get_current_user_role() = 'accounting'
    );

CREATE POLICY "Les admins peuvent gérer toutes les factures" ON factures
    FOR ALL USING (
        get_current_user_role() = 'admin'
    );

-- Supprimer les anciennes politiques sur les lignes de facture
DROP POLICY IF EXISTS "Les médecins peuvent voir les lignes de leurs factures" ON lignes_facture;
DROP POLICY IF EXISTS "Les secrétaires peuvent voir toutes les lignes de facture" ON lignes_facture;
DROP POLICY IF EXISTS "Les comptables peuvent voir toutes les lignes de facture" ON lignes_facture;
DROP POLICY IF EXISTS "Les admins peuvent voir toutes les lignes de facture" ON lignes_facture;

-- Nouvelles politiques pour les lignes de facture
CREATE POLICY "Les médecins peuvent voir les lignes de leurs factures" ON lignes_facture
    FOR SELECT USING (
        get_current_user_role() = 'doctor' AND
        facture_id IN (
            SELECT id FROM factures WHERE consultation_id IN (
                SELECT id FROM consultations WHERE medecin_id = auth.uid()
            )
        )
    );

CREATE POLICY "Les secrétaires peuvent voir toutes les lignes de facture" ON lignes_facture
    FOR SELECT USING (
        get_current_user_role() = 'secretary'
    );

CREATE POLICY "Les comptables peuvent voir toutes les lignes de facture" ON lignes_facture
    FOR SELECT USING (
        get_current_user_role() = 'accounting'
    );

CREATE POLICY "Les admins peuvent voir toutes les lignes de facture" ON lignes_facture
    FOR SELECT USING (
        get_current_user_role() = 'admin'
    );
