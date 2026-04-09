-- Migration: Ajout des permissions pour les comptables sur les factures
-- Date: 2025-01-25
-- Description: Ajout des politiques RLS pour permettre aux comptables de voir et gérer les factures

-- Supprimer les anciennes politiques sur les factures pour les remplacer
DROP POLICY IF EXISTS "Les utilisateurs peuvent voir les factures de leurs consultations" ON factures;
DROP POLICY IF EXISTS "Les admins peuvent gérer toutes les factures" ON factures;

-- Nouvelles politiques pour les factures
CREATE POLICY "Les médecins peuvent voir les factures de leurs consultations" ON factures
    FOR SELECT USING (
        consultation_id IN (
            SELECT id FROM consultations WHERE medecin_id = auth.uid()
        )
    );

CREATE POLICY "Les secrétaires peuvent voir toutes les factures" ON factures
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM users WHERE email = auth.jwt() ->> 'email' AND role = 'secretary')
    );

CREATE POLICY "Les comptables peuvent voir et gérer toutes les factures" ON factures
    FOR ALL USING (
        EXISTS (SELECT 1 FROM users WHERE email = auth.jwt() ->> 'email' AND role = 'accounting')
    );

CREATE POLICY "Les admins peuvent gérer toutes les factures" ON factures
    FOR ALL USING (
        EXISTS (SELECT 1 FROM users WHERE email = auth.jwt() ->> 'email' AND role = 'admin')
    );

-- Supprimer les anciennes politiques sur les lignes de facture
DROP POLICY IF EXISTS "Les utilisateurs peuvent voir les lignes de leurs factures" ON lignes_facture;

-- Nouvelles politiques pour les lignes de facture
CREATE POLICY "Les médecins peuvent voir les lignes de leurs factures" ON lignes_facture
    FOR SELECT USING (
        facture_id IN (
            SELECT id FROM factures WHERE consultation_id IN (
                SELECT id FROM consultations WHERE medecin_id = auth.uid()
            )
        )
    );

CREATE POLICY "Les secrétaires peuvent voir toutes les lignes de facture" ON lignes_facture
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM users WHERE email = auth.jwt() ->> 'email' AND role = 'secretary')
    );

CREATE POLICY "Les comptables peuvent voir toutes les lignes de facture" ON lignes_facture
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM users WHERE email = auth.jwt() ->> 'email' AND role = 'accounting')
    );

CREATE POLICY "Les admins peuvent voir toutes les lignes de facture" ON lignes_facture
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM users WHERE email = auth.jwt() ->> 'email' AND role = 'admin')
    );
