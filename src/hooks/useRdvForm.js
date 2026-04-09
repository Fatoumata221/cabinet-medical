import { useMemo } from 'react';

export const composeDateTime = (dateObj, timeValue) => {
  if (!dateObj || !timeValue) return '';
  const [hh, mm] = timeValue.split(':');
  if (hh === undefined || mm === undefined) return '';
  const composed = new Date(dateObj);
  composed.setHours(parseInt(hh, 10), parseInt(mm, 10), 0, 0);
  return composed.toISOString();
};

export const isSameDay = (dateA, dateB) => {
  if (!dateA || !dateB) return false;
  const d1 = new Date(dateA);
  const d2 = new Date(dateB);
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
};

export const useRdvFormHelpers = ({ appointments, duree }) => {
  const hasSlotConflict = (doctorId, isoDateTime) => {
    if (!doctorId || !isoDateTime) return false;
    const doctorAppointments = appointments || [];
    const slotStart = new Date(isoDateTime);
    const slotEnd = new Date(slotStart.getTime() + (duree || 30) * 60000);
    return doctorAppointments.some((apt) => {
      if (apt.statut === 'annule') return false;
      const aptStart = new Date(apt.date_heure);
      const aptEnd = new Date(aptStart.getTime() + (apt.duree || 30) * 60000);
      return aptStart < slotEnd && aptEnd > slotStart;
    });
  };

  return {
    composeDateTime,
    isSameDay,
    hasSlotConflict
  };
};
