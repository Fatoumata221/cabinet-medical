import { normalizeQueueStatus } from './waitingQueueStatus';

const WORKFLOW_PHASES = [
  {
    key: 'waiting',
    label: 'En attente',
    statuses: ['waiting', 'en_attente'],
  },
  {
    key: 'present',
    label: 'Patient présent',
    statuses: ['present', 'arrive', 'authorized'],
  },
  {
    key: 'called',
    label: 'Patient appelé / en route',
    statuses: ['appele', 'called', 'medecin_pret', 'en_route'],
  },
  {
    key: 'consultation',
    label: 'Consultation',
    statuses: ['entre', 'in_consultation', 'en_consultation'],
  },
  {
    key: 'finished',
    label: 'Fin de parcours',
    statuses: ['finished', 'termine', 'absent', 'reporte', 'annule', 'cancelled'],
  },
];

const resolvePhase = (status) => {
  const normalized = normalizeQueueStatus(status);
  return WORKFLOW_PHASES.find((phase) => phase.statuses.includes(normalized)) || null;
};

const indexOfStatus = (status) => {
  const phase = resolvePhase(status);
  if (!phase) return -1;
  return WORKFLOW_PHASES.findIndex((candidate) => candidate.key === phase.key);
};

/**
 * Détecte les étapes sautées entre le statut actuel et la cible.
 */
export const getSkippedWorkflowSteps = (fromStatus, toStatus) => {
  const fromIdx = indexOfStatus(fromStatus);
  const toIdx = indexOfStatus(toStatus);
  if (fromIdx < 0 || toIdx < 0 || toIdx <= fromIdx + 1) {
    return [];
  }
  return WORKFLOW_PHASES.slice(fromIdx + 1, toIdx).map(
    (phase) => phase.label,
  );
};

export const confirmSkippedWorkflowSteps = (
  skippedSteps,
  actionLabel = 'continuer',
) => {
  if (!skippedSteps?.length) return true;
  const list = skippedSteps.join(', ');
  return window.confirm(
    `Certaines étapes n'ont pas été effectuées (${list}).\n\nVoulez-vous quand même ${actionLabel} ?`,
  );
};

export const validateQueueTransition = (fromStatus, toStatus) => {
  const skippedSteps = getSkippedWorkflowSteps(fromStatus, toStatus);
  return {
    allowed: true,
    skippedSteps,
    needsConfirmation: skippedSteps.length > 0,
  };
};
