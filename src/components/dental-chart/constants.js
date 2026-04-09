// VISUAL PROPERTIES (color, name, etc.) ARE NOW LOADED FROM THE DATABASE (tooth_states table).
// These constants serve as:
// 1. System Codes reference (use TOOTH_STATES.CODE.id) for logic checks.
// 2. Fallback/Default values if the database is unreachable.
export const TOOTH_STATES = {
  HEALTHY: { id: 'HEALTHY', name: 'Sain', color: '#FAFAFA', borderColor: '#E5E7EB' }, // Natural White
  SELECTED: { id: 'SELECTED', name: 'Sélectionné', color: '#BFDBFE', borderColor: '#3B82F6' }, // Blue 200/500
  CARIES: { id: 'CARIES', name: 'Carie', color: '#FECACA', borderColor: '#EF4444' }, // Red 200/500
  EXTRACTED: { id: 'EXTRACTED', name: 'Extraite', color: '#E5E7EB', borderColor: '#9CA3AF' }, // Grey 200/400
  IMPLANT: { id: 'IMPLANT', name: 'Implant', color: '#E0F2FE', borderColor: '#0EA5E9' }, // Sky 100/500
  CROWN: { id: 'CROWN', name: 'Couronne', color: '#FEF08A', borderColor: '#EAB308' }, // Yellow 200/500
  ROOT_CANAL: { id: 'ROOT_CANAL', name: 'Trait. Racine', color: '#E9D5FF', borderColor: '#A855F7' }, // Purple 200/500
  BRIDGE: { id: 'BRIDGE', name: 'Bridge', color: '#FBCFE8', borderColor: '#EC4899' }, // Pink 200/500
};

export const TOOTH_NAMES = {
  // Adultes - Haut Droite
  18: "3ème Molaire (Sagesse) sup. droite",
  17: "2ème Molaire sup. droite",
  16: "1ère Molaire sup. droite",
  15: "2ème Prémolaire sup. droite",
  14: "1ère Prémolaire sup. droite",
  13: "Canine sup. droite",
  12: "Incisive Latérale sup. droite",
  11: "Incisive Centrale sup. droite",
  // Adultes - Haut Gauche
  21: "Incisive Centrale sup. gauche",
  22: "Incisive Latérale sup. gauche",
  23: "Canine sup. gauche",
  24: "1ère Prémolaire sup. gauche",
  25: "2ème Prémolaire sup. gauche",
  26: "1ère Molaire sup. gauche",
  27: "2ème Molaire sup. gauche",
  28: "3ème Molaire (Sagesse) sup. gauche",
  // Adultes - Bas Gauche
  31: "Incisive Centrale inf. gauche",
  32: "Incisive Latérale inf. gauche",
  33: "Canine inf. gauche",
  34: "1ère Prémolaire inf. gauche",
  35: "2ème Prémolaire inf. gauche",
  36: "1ère Molaire inf. gauche",
  37: "2ème Molaire inf. gauche",
  38: "3ème Molaire (Sagesse) inf. gauche",
  // Adultes - Bas Droite
  41: "Incisive Centrale inf. droite",
  42: "Incisive Latérale inf. droite",
  43: "Canine inf. droite",
  44: "1ère Prémolaire inf. droite",
  45: "2ème Prémolaire inf. droite",
  46: "1ère Molaire inf. droite",
  47: "2ème Molaire inf. droite",
  48: "3ème Molaire (Sagesse) inf. droite",
   // Enfants - Haut Droite
  55: "2ème Molaire lait sup. droite",
  54: "1ère Molaire lait sup. droite",
  53: "Canine lait sup. droite",
  52: "Incisive Latérale lait sup. droite",
  51: "Incisive Centrale lait sup. droite",
  // Enfants - Haut Gauche
  61: "Incisive Centrale lait sup. gauche",
  62: "Incisive Latérale lait sup. gauche",
  63: "Canine lait sup. gauche",
  64: "1ère Molaire lait sup. gauche",
  65: "2ème Molaire lait sup. gauche",
  // Enfants - Bas Gauche
  71: "Incisive Centrale lait inf. gauche",
  72: "Incisive Latérale lait inf. gauche",
  73: "Canine lait inf. gauche",
  74: "1ère Molaire lait inf. gauche",
  75: "2ème Molaire lait inf. gauche",
  // Enfants - Bas Droite
  81: "Incisive Centrale lait inf. droite",
  82: "Incisive Latérale lait inf. droite",
  83: "Canine lait inf. droite",
  84: "1ère Molaire lait inf. droite",
  85: "2ème Molaire lait inf. droite",
};



export const FDI_PERMANENT_UPPER_RIGHT = [18, 17, 16, 15, 14, 13, 12, 11];
export const FDI_PERMANENT_UPPER_LEFT = [21, 22, 23, 24, 25, 26, 27, 28];
export const FDI_PERMANENT_LOWER_LEFT = [31, 32, 33, 34, 35, 36, 37, 38];
export const FDI_PERMANENT_LOWER_RIGHT = [48, 47, 46, 45, 44, 43, 42, 41];

export const FDI_PRIMARY_UPPER_RIGHT = [55, 54, 53, 52, 51];
export const FDI_PRIMARY_UPPER_LEFT = [61, 62, 63, 64, 65];
export const FDI_PRIMARY_LOWER_LEFT = [71, 72, 73, 74, 75];
export const FDI_PRIMARY_LOWER_RIGHT = [85, 84, 83, 82, 81];

export const ALL_TEETH_IDS = [
  ...FDI_PERMANENT_UPPER_RIGHT,
  ...FDI_PERMANENT_UPPER_LEFT,
  ...FDI_PERMANENT_LOWER_LEFT,
  ...FDI_PERMANENT_LOWER_RIGHT,
  ...FDI_PRIMARY_UPPER_RIGHT,
  ...FDI_PRIMARY_UPPER_LEFT,
  ...FDI_PRIMARY_LOWER_LEFT,
  ...FDI_PRIMARY_LOWER_RIGHT,
];
