/** Préférences d'affichage calendrier / listes RDV */
export const HIDE_PAST_APPOINTMENTS_KEY = 'calendar_hide_past_appointments';

export const getHidePastAppointmentsPreference = () => {
  try {
    return localStorage.getItem(HIDE_PAST_APPOINTMENTS_KEY) !== 'false';
  } catch {
    return true;
  }
};

export const setHidePastAppointmentsPreference = (hide) => {
  try {
    localStorage.setItem(HIDE_PAST_APPOINTMENTS_KEY, hide ? 'true' : 'false');
  } catch {
    /* ignore */
  }
};

export const getAppointmentEndDate = (appointment) => {
  if (!appointment?.date_heure) return null;
  if (appointment.heure_fin) {
    return new Date(appointment.heure_fin);
  }
  const start = new Date(appointment.date_heure);
  const durationMinutes = Number(appointment.duree ?? 30);
  return new Date(start.getTime() + durationMinutes * 60000);
};

/** RDV dont la fin est passée */
export const isPastAppointment = (appointment, now = new Date()) => {
  const end = getAppointmentEndDate(appointment);
  if (!end || Number.isNaN(end.getTime())) return false;
  return end.getTime() < now.getTime();
};

/** Masquer les RDV dépassés (sauf reportés / annulés si on veut les garder hors vue) */
export const shouldHidePastAppointment = (
  appointment,
  hidePast = getHidePastAppointmentsPreference(),
) => {
  if (!hidePast) return false;
  const statut = String(appointment?.statut ?? '').toLowerCase();
  if (['reporte', 'annule', 'termine'].includes(statut)) return true;
  return isPastAppointment(appointment);
};

export const filterVisibleAppointments = (
  appointments,
  hidePast = getHidePastAppointmentsPreference(),
) => (appointments || []).filter((apt) => !shouldHidePastAppointment(apt, hidePast));
