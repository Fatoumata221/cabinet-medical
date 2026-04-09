import { useState, useEffect, useCallback } from 'react';
import { fetchConsultations as fetchConsultationsService } from '../../services/consultation/consultationService';

export const useConsultations = (options) => {
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadConsultations = useCallback(async (currentOptions) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchConsultationsService(currentOptions);
      setConsultations(data);
    } catch (err) {
      setError(err);
      console.error('Erreur lors du chargement des consultations:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConsultations(options);
  }, [options, loadConsultations]);

  return { consultations, loading, error, refetch: () => loadConsultations(options) };
};
