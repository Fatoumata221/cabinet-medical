export const getIsoString = (date) => {
  if (!date) return '';
  return new Date(date).toISOString();
};

export const clampDuration = (minutes) => {
  if (!minutes || Number.isNaN(minutes)) return 30; // DEFAULT_APPOINTMENT_DURATION
  return Math.min(Math.max(15, minutes), 120); // MAX_SELECTION_MINUTES
};
