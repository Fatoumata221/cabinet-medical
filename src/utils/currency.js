/** Formatage des montants en franc CFA (FCFA / XOF). */
export const DEVISE_LABEL = 'FCFA';

export function formatMontant(montant) {
  return `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(montant ?? 0)} ${DEVISE_LABEL}`;
}

export function formatMontantDecimal(montant) {
  return `${new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(montant ?? 0)} ${DEVISE_LABEL}`;
}
