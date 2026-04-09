import { useState, useCallback } from 'react';
import { consultationWorkflowService } from '../../services/consultation/consultationWorkflowService';
import { unifiedNotificationService } from '../../services/unifiedNotificationService';
import { useConsultations } from './useConsultations'; // Import the new hook

const INITIAL_WORKFLOWS = {
  constantes: [], ordonnances: [], certificats: [], actes: [],
  examens: [], analysesLabo: [], prescriptionsPharmacie: [],
  signesCliniques: [], examensAppareils: [], syntheses: [],
  diagnostics: [], antecedents: []
};

export const useConsultationWorkflow = () => {
  const { consultations, loading: loadingList, refetch: fetchConsultations } = useConsultations({ status: 'terminee' });

  const [workflows, setWorkflows] = useState(INITIAL_WORKFLOWS);
  const [facture, setFacture] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false); // Renamed to avoid conflict
  const [error, setError] = useState(null);

  const loadConsultationDetails = useCallback(async (consultationId) => {
    setLoadingDetails(true); // Use loadingDetails
    setError(null);
    try {
      // Chargement parallèle des workflows et de la facture
      const [workflowData, factureData] = await Promise.all([
        consultationWorkflowService.fetchWorkflowDetails(consultationId),
        consultationWorkflowService.fetchFacture(consultationId)
      ]);

      setWorkflows(workflowData);
      setFacture(factureData);
    } catch (err) {
      console.error('Erreur chargement détails:', err);
      setError("Impossible de charger les détails de la consultation.");
      unifiedNotificationService.error("Erreur lors du chargement des détails");
    } finally {
      setLoadingDetails(false); // Use loadingDetails
    }
  }, []);

  const generateFacture = async (consultation) => {
    try {
      const montantTotal = workflows.actes.reduce((sum, acte) => sum + (acte.montant_total || 0), 0);
      const newFacture = await consultationWorkflowService.createFacture(consultation, montantTotal);
      setFacture(newFacture);
      unifiedNotificationService.success('Facture créée avec succès');
      return newFacture;
    } catch (err) {
      console.error('Erreur création facture:', err);
      unifiedNotificationService.error('Erreur lors de la création de la facture');
      throw err;
    }
  };

  const resetWorkflow = useCallback(() => {
    setWorkflows(INITIAL_WORKFLOWS);
    setFacture(null);
    setError(null);
  }, []);
  

  return {
    consultations, // Expose consultations
    loadingList,   // Expose loadingList
    fetchConsultations, // Expose fetchConsultations
    workflows,
    facture,
    loadingDetails, // Expose loadingDetails
    error,
    loadConsultationDetails,
    generateFacture,
    resetWorkflow
  };
};