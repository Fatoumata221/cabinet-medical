-- Migration pour ajouter les politiques RLS manquantes sur types_actes et tarifs_actes
-- Date: 2025-01-11

-- Activer RLS sur types_actes si ce n'est pas déjà fait
ALTER TABLE public.types_actes ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes politiques si elles existent
DROP POLICY IF EXISTS "Tous les utilisateurs authentifiés peuvent voir les types d'actes" ON public.types_actes;
DROP POLICY IF EXISTS "Types actes viewable by authenticated users" ON public.types_actes;

-- Politique SELECT pour types_actes
CREATE POLICY "types_actes_select_policy" ON public.types_actes
    FOR SELECT
    USING (auth.role() = 'authenticated');

-- Politique INSERT pour types_actes (permettre aux utilisateurs authentifiés de créer des actes)
CREATE POLICY "types_actes_insert_policy" ON public.types_actes
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- Politique UPDATE pour types_actes
CREATE POLICY "types_actes_update_policy" ON public.types_actes
    FOR UPDATE
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- Politique DELETE pour types_actes
CREATE POLICY "types_actes_delete_policy" ON public.types_actes
    FOR DELETE
    USING (auth.role() = 'authenticated');

-- Activer RLS sur tarifs_actes si ce n'est pas déjà fait
ALTER TABLE public.tarifs_actes ENABLE ROW LEVEL SECURITY;

-- Politique SELECT pour tarifs_actes
CREATE POLICY "tarifs_actes_select_policy" ON public.tarifs_actes
    FOR SELECT
    USING (auth.role() = 'authenticated');

-- Politique INSERT pour tarifs_actes
CREATE POLICY "tarifs_actes_insert_policy" ON public.tarifs_actes
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- Politique UPDATE pour tarifs_actes
CREATE POLICY "tarifs_actes_update_policy" ON public.tarifs_actes
    FOR UPDATE
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- Politique DELETE pour tarifs_actes
CREATE POLICY "tarifs_actes_delete_policy" ON public.tarifs_actes
    FOR DELETE
    USING (auth.role() = 'authenticated');
