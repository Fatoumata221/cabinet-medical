import { useState, useEffect, useCallback } from 'react';
import { typesActesService } from '../services/parametrage/typesActesService';
import { supabase } from '../lib/supabase'; // Gardé pour fetchSpecialites si besoin, ou déplacer dans un service de référence
import { useAuth } from '../contexts/AuthContext';

/**
 * Hook pour gérer la logique des types d'actes.
 * Sépare la logique de données de la vue.
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
      const data = await typesActesService.getAll();
      
      // Filtrer selon la spécialité de l'utilisateur connecté
      let filteredData = data;
      if (userProfile?.specialite) {
        const userSpec = userProfile.specialite.toLowerCase();
        filteredData = data.filter(acte => 
          // Garder les actes sans spécialité (génériques) ou liés à la spécialité de l'utilisateur
          acte.specialites_data.length === 0 || 
          acte.specialites_data.some(s => s.nom.toLowerCase() === userSpec)
        );
      }
      
      setActes(filteredData);
    } catch (err) {
      console.error('Erreur chargement actes:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [userProfile?.specialite]);

  const fetchSpecialites = useCallback(async () => {
    try {
      // Idéalement, ceci devrait être dans un specialitesService
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

  // --- Actions ---

  const createTypeActe = async (data) => {
    try {
      setLoading(true);
      await typesActesService.create(data);
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
      await typesActesService.update(id, data);
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
      await typesActesService.delete(id);
      setActes(prev => prev.filter(a => a.id !== id)); // Optimistic UI update
      return { success: true };
    } catch (err) {
      console.error('Erreur suppression acte:', err);
      setError(err);
      // En cas d'erreur, on recharge pour être sûr de l'état
      await fetchActes(); 
      return { success: false, error: err };
    } finally {
      setLoading(false);
    }
  };

  return {
    // Noms actuels
    actes,
    specialites,
    loading,
    error,
    refresh: fetchActes,
    createTypeActe,
    updateTypeActe,
    deleteTypeActe
    ,
    // Aliases pour compatibilité avec l'ancien code (ex: ActesModal, FacturationActes)
    typesActes: actes,
    refetch: fetchActes
  };
};
