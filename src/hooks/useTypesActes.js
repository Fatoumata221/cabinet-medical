import { useState, useEffect, useCallback } from 'react';
import { typesActesService as typesActesServiceFiltered } from '../lib/services';
import { typesActesService as typesActesServiceCRUD } from '../services/parametrage/typesActesService';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

/**
 * Hook pour gérer la logique des types d'actes.
 * Lecture (getAll) : lib/services.js -> filtre par specialite_id du médecin connecté
 * via le RPC get_types_actes_by_specialite (avec cascade racine -> sous-spécialités).
 * Écriture (create/update/delete) : services/parametrage/typesActesService.js -> gère
 * la relation many-to-many avec la table types_actes_specialites.
 */
export const useTypesActes = () => {
  const [actes, setActes] = useState([]);
  const [specialites, setSpecialites] = useState([]); // Liste de référence pour les sélecteurs
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { userProfile } = useAuth();

  // --- Chargement des données ---

  const fetchActes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await typesActesServiceFiltered.getAll();

      console.log('🔍 [useTypesActes] Actes reçus (déjà filtrés côté serveur):', data?.length || 0);

      setActes(data || []);
    } catch (err) {
      console.error('❌ [useTypesActes] Erreur chargement actes:', err);
      setError(err);
      setActes([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSpecialites = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('specialites')
        .select('id, nom')
        .order('nom', { ascending: true });

      if (error) throw error;
      setSpecialites(data || []);
    } catch (err) {
      console.error('Erreur chargement spécialités:', err);
    }
  }, []);

  useEffect(() => {
    fetchActes();
    fetchSpecialites();
  }, [fetchActes, fetchSpecialites, userProfile]);

  // --- Actions (CRUD via le service qui gère la relation many-to-many) ---

  const createTypeActe = async (data) => {
    try {
      setLoading(true);
      await typesActesServiceCRUD.create(data);
      await fetchActes(); // Recharger la liste
      return { success: true };
    } catch (err) {
      console.error('Erreur création acte:', err);
      setError(err);
      return { success: false, error: err };
    } finally {
      setLoading(false);
    }
  };

  const updateTypeActe = async (id, data) => {
    try {
      setLoading(true);
      await typesActesServiceCRUD.update(id, data);
      await fetchActes();
      return { success: true };
    } catch (err) {
      console.error('Erreur modification acte:', err);
      setError(err);
      return { success: false, error: err };
    } finally {
      setLoading(false);
    }
  };

  const deleteTypeActe = async (id) => {
    try {
      setLoading(true);
      await typesActesServiceCRUD.delete(id);
      setActes(prev => prev.filter(a => a.id !== id)); // Optimistic UI update
      return { success: true };
    } catch (err) {
      console.error('Erreur suppression acte:', err);
      setError(err);
      await fetchActes();
      return { success: false, error: err };
    } finally {
      setLoading(false);
    }
  };

  return {
    actes,
    specialites,
    loading,
    error,
    refresh: fetchActes,
    createTypeActe,
    updateTypeActe,
    deleteTypeActe,
    typesActes: actes,
    refetch: fetchActes
  };
};
