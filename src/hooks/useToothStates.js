import { useState, useEffect, useCallback } from 'react';
import { toothStatesService } from '../services/parametrage/toothStatesService';

export const useToothStates = () => {
  const [states, setStates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStates = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await toothStatesService.getAll();
      
      // Convert array to object map if needed by consumers, but array is better for UI lists
      // Here we keep array but consumers might want a map too.
      // Let's provide both formatted map and raw array.
      
      setStates(data);
    } catch (err) {
      console.error('Erreur chargement états dentaires:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStates();
  }, [fetchStates]);

  const createState = useCallback(async (data) => {
    try {
      setLoading(true);
      const newState = await toothStatesService.create(data);
      await fetchStates();
      return { success: true, data: newState };
    } catch (err) {
      console.error('Erreur création état:', err);
      return { success: false, error: err };
    } finally {
      setLoading(false);
    }
  }, [fetchStates]);

  const updateState = useCallback(async (id, data) => {
    try {
      setLoading(true);
      const updated = await toothStatesService.update(id, data);
      await fetchStates();
      return { success: true, data: updated };
    } catch (err) {
      console.error('Erreur mise à jour état:', err);
      return { success: false, error: err };
    } finally {
      setLoading(false);
    }
  }, [fetchStates]);

  const deleteState = useCallback(async (id) => {
    try {
      setLoading(true);
      await toothStatesService.delete(id);
      setStates(prev => prev.filter(s => s.id !== id));
      return { success: true };
    } catch (err) {
      console.error('Erreur suppression état:', err);
      return { success: false, error: err };
    } finally {
      setLoading(false);
    }
  }, [fetchStates]);

  // Helper to get formatted object for components expecting TOOTH_STATES format
  // Returns object with keys as 'code' (not numerical id to avoid legacy issues if code matches old keys)
  const getFormattedStates = useCallback(() => {
    return states.reduce((acc, state) => {
      acc[state.code] = {
        id: state.code, // Legacy components use code as ID
        dbId: state.id,
        name: state.name,
        color: state.color,
        borderColor: state.border_color
      };
      return acc;
    }, {});
  }, [states]);

  return {
    states, // Raw array for management UI
    formattedStates: getFormattedStates(), // Object map for Chart components
    loading,
    error,
    refresh: fetchStates,
    createState,
    updateState,
    deleteState
  };
};
