// Fichier de traduction pour les termes UI
export const TRADUCTIONS = {
  // Boutons d'action
  boutons: {
    save: 'Enregistrer',
    edit: 'Modifier',
    delete: 'Supprimer',
    create: 'Créer',
    update: 'Mettre à jour',
    cancel: 'Annuler',
    submit: 'Valider',
    close: 'Fermer',
    open: 'Ouvrir',
    view: 'Voir',
    details: 'Détails',
    add: 'Ajouter',
    remove: 'Retirer',
    search: 'Rechercher',
    filter: 'Filtrer',
    confirm: 'Confirmer',
    back: 'Retour',
    next: 'Suivant',
    previous: 'Précédent',
    clear: 'Effacer',
    reset: 'Réinitialiser',
    export: 'Exporter',
    import: 'Importer',
    print: 'Imprimer',
    download: 'Télécharger',
    upload: 'Téléverser'
  },

  // Navigation et menu
  navigation: {
    settings: 'Paramètres',
    profile: 'Profil',
    login: 'Connexion',
    logout: 'Déconnexion',
    dashboard: 'Tableau de bord',
    home: 'Accueil',
    patients: 'Patients',
    appointments: 'Rendez-vous',
    billing: 'Facturation',
    reports: 'Rapports',
    administration: 'Administration'
  },

  // Messages et statuts
  messages: {
    loading: 'Chargement...',
    saving: 'Enregistrement...',
    success: 'Succès',
    error: 'Erreur',
    warning: 'Attention',
    info: 'Information',
    noData: 'Aucune donnée',
    required: 'Obligatoire',
    optional: 'Optionnel',
    active: 'Actif',
    inactive: 'Inactif',
    pending: 'En attente',
    completed: 'Terminé',
    cancelled: 'Annulé',
    confirmed: 'Confirmé',
    rejected: 'Rejeté'
  },

  // Terminologie médicale
  medical: {
    hospitalisation: 'Hospitalisation',
    consultation: 'Consultation',
    examination: 'Examen',
    prescription: 'Prescription',
    vaccination: 'Vaccination',
    diagnosis: 'Diagnostic',
    treatment: 'Traitement',
    symptoms: 'Symptômes',
    allergies: 'Allergies',
    medications: 'Médicaments',
    history: 'Antécédents'
  },

  // Types de cabinet
  cabinetTypes: {
    medical: 'Cabinet Médical',
    dental: 'Cabinet Dentaire',
    clinic: 'Clinique',
    hospital: 'Hôpital',
    center: 'Centre de santé'
  }
};

// Fonction utilitaire pour traduire
export const traduire = (cle, categorie = 'boutons') => {
  return TRADUCTIONS[categorie]?.[cle] || cle;
};

// Fonction pour détecter si c'est un cabinet dentaire
export const estCabinetDentaire = (specialite) => {
  const termesDentaires = ['dent', 'dentaire', 'dentiste', 'odontologie', 'stomatologie'];
  return termesDentaires.some(term => 
    specialite?.toLowerCase().includes(term)
  );
};

// Fonction pour obtenir le nom du cabinet selon la spécialité
export const getNomCabinet = (specialite, nomDefault = null) => {
  if (estCabinetDentaire(specialite)) {
    return TRADUCTIONS.cabinetTypes.dental;
  }
  return nomDefault || TRADUCTIONS.cabinetTypes.medical;
};

// Fonction pour obtenir le titre du praticien selon la spécialité
export const getTitrePraticien = (specialite) => {
  if (estCabinetDentaire(specialite)) {
    return 'Dentiste';
  }
  return 'Médecin';
};

// Fonction pour obtenir le titre abrégé (Dr.) selon la spécialité
export const getTitreAbrege = (specialite) => {
  if (estCabinetDentaire(specialite)) {
    return 'Dr.'; // Dentiste utilise aussi Dr.
  }
  return 'Dr.'; // Médecin utilise Dr.
};

// Fonction pour obtenir le libellé du praticien au pluriel
export const getLibellePraticiens = (specialite) => {
  if (estCabinetDentaire(specialite)) {
    return 'Dentistes';
  }
  return 'Médecins';
};
