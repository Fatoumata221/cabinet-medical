const componentToHex = (value) => {
  return Math.max(0, Math.min(255, Math.round(value)))
    .toString(16)
    .padStart(2, '0');
};

export const hslToHex = (h, s, l) => {
  s /= 100;
  l /= 100;
  const k = (n) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n) =>
    l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return `#${componentToHex(f(0) * 255)}${componentToHex(f(8) * 255)}${componentToHex(f(4) * 255)}`;
};

export const hashSpecialtyToColor = (specialiteNom) => {
  if (!specialiteNom) return '#3b82f6';
  let hash = 0;
  for (let i = 0; i < specialiteNom.length; i++) {
    hash = specialiteNom.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return hslToHex(hue, 65, 55);
};

/** Palette distincte pour identifier chaque médecin au calendrier secrétaire */
export const DOCTOR_CALENDAR_PALETTE = [
  '#2563eb',
  '#7c3aed',
  '#db2777',
  '#ea580c',
  '#0891b2',
  '#059669',
  '#ca8a04',
  '#4f46e5',
  '#be185d',
  '#0d9488',
];

export const getDoctorCalendarColor = (doctorId, paletteIndex = 0) => {
  if (!doctorId) return '#3b82f6';
  if (paletteIndex >= 0 && paletteIndex < DOCTOR_CALENDAR_PALETTE.length) {
    return DOCTOR_CALENDAR_PALETTE[paletteIndex];
  }
  return hashSpecialtyToColor(`doctor-${doctorId}`);
};

export const darkenHexColor = (hex, amount = 0.2) => {
  if (!/^#([0-9a-f]{6})$/i.test(hex)) {
    return hex;
  }
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);

  const factor = 1 - amount;
  const nr = componentToHex(r * factor);
  const ng = componentToHex(g * factor);
  const nb = componentToHex(b * factor);

  return `#${nr}${ng}${nb}`;
};
