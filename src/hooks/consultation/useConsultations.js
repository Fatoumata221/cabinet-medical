import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { fetchConsultations as fetchConsultationsService } from '../../services/consultation/consultationService';

export const useConsultations = (options) => {
  const { userProfile } = useAuth();
  const tenantId = userProfile?.tenant_id || null;
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadConsultations = useCallback(async (currentOptions) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchConsultationsService({ ...currentOptions, tenantId });
      setConsultations(data);
    } catch (err) {
      setError(err);
      console.error('Erreur lors du chargement des consultations:', err);
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    loadConsultations(options);
  }, [options, loadConsultations]);

  return { consultations, loading, error, refetch: () => loadConsultations(options) };
};
