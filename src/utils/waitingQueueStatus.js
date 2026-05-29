/** Statuts terminés — exclus des compteurs « actifs » */
export const WAITING_QUEUE_TERMINAL_STATUSES = [
  'finished',
  'termine',
  'absent',
  'reporte',
  'annule',
  'cancelled',
];

/** Statuts actifs utilisés dans les requêtes Supabase */
export const WAITING_QUEUE_ACTIVE_STATUSES = [
  'waiting',
  'en_attente',
  'present',
  'arrive',
  'authorized',
  'called',
  'appele',
  'en_route',
  'medecin_pret',
  'entre',
  'in_consultation',
  'en_consultation',
];

export const normalizeQueueStatus = (status) =>
  String(status ?? '')
    .toLowerCase()
    .trim();

export const isTerminalQueueStatus = (status) =>
  WAITING_QUEUE_TERMINAL_STATUSES.includes(normalizeQueueStatus(status));

/** Patient encore dans le parcours file / salle d'attente (non terminé) */
export const isActiveQueueStatus = (status) => {
  const normalized = normalizeQueueStatus(status);
  if (!normalized) return false;
  return !isTerminalQueueStatus(normalized);
};

export const isStrictlyWaitingStatus = (status) =>
  ['waiting', 'en_attente'].includes(normalizeQueueStatus(status));

export const isPresentInQueueStatus = (status) =>
  ['present', 'arrive', 'authorized'].includes(normalizeQueueStatus(status));

export const isCalledInQueueStatus = (status) =>
  ['called', 'appele', 'medecin_pret', 'en_route'].includes(
    normalizeQueueStatus(status),
  );

export const isInConsultationQueueStatus = (status) =>
  ['in_consultation', 'en_consultation', 'entre'].includes(
    normalizeQueueStatus(status),
  );

/** En salle d'attente mais pas encore en consultation */
export const isOnWaitingBench = (status) =>
  isActiveQueueStatus(status) && !isInConsultationQueueStatus(status);

export const filterActiveQueueItems = (items) =>
  (items || []).filter((item) => isActiveQueueStatus(item?.status));

export const computeQueueStats = (items) => {
  const active = filterActiveQueueItems(items);
  return {
    total: active.length,
    inWaitingRoom: active.length,
    waiting: active.filter((p) => isStrictlyWaitingStatus(p.status)).length,
    present: active.filter((p) => isPresentInQueueStatus(p.status)).length,
    called: active.filter((p) => isCalledInQueueStatus(p.status)).length,
    inConsultation: active.filter((p) => isInConsultationQueueStatus(p.status))
      .length,
    onBench: active.filter((p) => isOnWaitingBench(p.status)).length,
    urgent: active.filter((p) => isUrgentQueuePriority(p.priority)).length,
  };
};

export const isUrgentQueuePriority = (priority) =>
  priority === 'urgente' || priority === 'tres_urgente';

/** Filtre UI secrétaire (SecretaryDashboard / files d'attente) */
export const matchesQueueFilterStatus = (filterStatus, patientStatus) => {
  if (!filterStatus || filterStatus === 'all') {
    return isActiveQueueStatus(patientStatus);
  }
  if (filterStatus === 'finished') {
    return isTerminalQueueStatus(patientStatus);
  }
  if (filterStatus === 'urgent') {
    return isActiveQueueStatus(patientStatus);
  }

  const status = normalizeQueueStatus(patientStatus);

  switch (filterStatus) {
    case 'waiting':
      return isStrictlyWaitingStatus(status);
    case 'appele':
      return isCalledInQueueStatus(status);
    case 'entre':
      return status === 'entre' || isPresentInQueueStatus(status);
    case 'in_consultation':
      return isInConsultationQueueStatus(status);
    default:
      return status === normalizeQueueStatus(filterStatus);
  }
};
