/**
 * Palette de couleurs pour les médecins
 * Chaque médecin se voit attribuer une couleur fixe pour une identification visuelle facile
 */

export const DOCTOR_COLOR_PALETTE = [
  '#EF4444', // Rouge
  '#F97316', // Orange
  '#22C55E', // Vert
  '#8B5CF6', // Violet
  '#EAB308', // Jaune
  '#3B82F6', // Bleu
  '#A16207', // Marron
  '#EC4899', // Rose
  '#06B6D4', // Cyan
  '#84CC16', // Lime
  '#F59E0B', // Ambre
  '#6366F1', // Indigo
];

/**
 * Attribue une couleur à un médecin basée sur son ID
 * @param {number|string} doctorId - ID du médecin
 * @returns {string} Couleur hexadécimale
 */
export const assignDoctorColor = (doctorId) => {
  const id = typeof doctorId === 'string' ? parseInt(doctorId, 10) : doctorId;
  const index = id % DOCTOR_COLOR_PALETTE.length;
  return DOCTOR_COLOR_PALETTE[index];
};

/**
 * Génère une couleur aléatoire depuis la palette
 * @returns {string} Couleur hexadécimale
 */
export const getRandomDoctorColor = () => {
  const index = Math.floor(Math.random() * DOCTOR_COLOR_PALETTE.length);
  return DOCTOR_COLOR_PALETTE[index];
};

/**
 * Vérifie si une couleur est valide (format hexadécimal)
 * @param {string} color - Couleur à vérifier
 * @returns {boolean}
 */
export const isValidHexColor = (color) => {
  return /^#[0-9A-F]{6}$/i.test(color);
};

/**
 * Détermine si le texte doit être blanc ou noir selon la couleur de fond
 * @param {string} backgroundColor - Couleur de fond hexadécimale
 * @returns {string} '#ffffff' ou '#000000'
 */
export const getContrastTextColor = (backgroundColor) => {
  if (!backgroundColor || !isValidHexColor(backgroundColor)) {
    return '#ffffff';
  }

  const hex = backgroundColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);

  // Calcul de la luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  return luminance > 0.5 ? '#000000' : '#ffffff';
};

/**
 * Assombrit une couleur hexadécimale
 * @param {string} color - Couleur hexadécimale
 * @param {number} percent - Pourcentage d'assombrissement (0-1)
 * @returns {string} Couleur hexadécimale assombrie
 */
export const darkenHexColor = (color, percent = 0.2) => {
  if (!color || !isValidHexColor(color)) return color;

  const num = parseInt(color.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent * 100);
  const R = Math.max((num >> 16) - amt, 0);
  const G = Math.max((num >> 8 & 0x00FF) - amt, 0);
  const B = Math.max((num & 0x0000FF) - amt, 0);

  return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
};
