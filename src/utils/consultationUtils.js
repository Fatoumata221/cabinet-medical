/**
 * Helpers partagés pour les consultations et les rendez-vous.
 */

export const normalizeConsultationType = (type) => {
  if (!type) return '';
  const normalized = String(type).toLowerCase().trim();
  if (normalized === 'preventive' || normalized === 'preventif') {
    return 'preventif';
  }
  return normalized;
};

export const getConsultationType = (consultation) => {
  if (!consultation) return '';
  return consultation.type_consultation || consultation.type_rdv || consultation.rdv_type || '';
};

export const getConsultationTypeLabel = (type) => {
  switch (normalizeConsultationType(type)) {
    case 'standard':
      return 'Standard';
    case 'suivi':
      return 'Suivi';
    case 'urgence':
      return 'Urgence';
    case 'preventif':
      return 'Préventive';
    case 'consultation':
      return 'Consultation';
    default:
      return type || 'Non spécifié';
  }
};

export const getConsultationMotif = (consultation) => {
  if (!consultation) return '';
  return consultation.motif_consultation || consultation.motif || '';
};
