import { supabase } from '../lib/supabase';
import { getCurrentSpeciality } from '../lib/specialityConfigService';

const MOTIFS_PAR_SPECIALITE = {
  Dentiste: [
    { id: 'd1', label: 'Consultation générale', description: 'Examen dentaire général' },
    { id: 'd2', label: 'Détartrage', description: 'Détartrage et polissage' },
    { id: 'd3', label: 'Traitement de carie', description: 'Soin des caries' },
    { id: 'd4', label: 'Extraction dentaire', description: 'Extraction d\'une dent' },
    { id: 'd5', label: 'Prothèse dentaire', description: 'Pose ou suivi de prothèse' },
    { id: 'd6', label: 'Orthodontie', description: 'Suivi orthodontique' },
    { id: 'd7', label: 'Urgence dentaire', description: 'Douleur ou urgence' },
    { id: 'd8', label: 'Contrôle de routine', description: 'Contrôle périodique' },
  ],
};

const motifsConsultationService = {
  getDefaultMotifsForSelect: (specialite = 'Généraliste') => {
    if (MOTIFS_PAR_SPECIALITE[specialite]) {
      return MOTIFS_PAR_SPECIALITE[specialite];
    }
    return [
      { id: 1, label: 'Consultation générale', description: 'Examen médical général' },
      { id: 2, label: 'Suivi post-consultation', description: 'Suivi après une consultation précédente' },
      { id: 3, label: 'Urgence', description: 'Consultation urgente' },
      { id: 4, label: 'Contrôle', description: 'Contrôle de routine' },
      { id: 5, label: 'Vaccination', description: 'Administration de vaccins' },
      { id: 6, label: 'Ordonnance', description: 'Renouvellement d\'ordonnance' },
      { id: 7, label: 'Certificat', description: 'Délivrance de certificat médical' },
    ];
  },

  /**
   * Motifs pour une spécialité (liste locale ; enrichissement DB optionnel si la table existe).
   */
  getMotifsForSelect: async (specialite = 'Généraliste') => {
    const spec = specialite || 'Généraliste';
    const defaults = motifsConsultationService.getDefaultMotifsForSelect(spec);

    try {
      const { data, error } = await supabase
        .from('motifs_consultation')
        .select('id, nom, description, specialite')
        .limit(200);

      if (error || !data?.length) {
        return defaults;
      }

      const filtered = data.filter(
        (m) => !m.specialite || m.specialite === spec || m.specialite === 'Généraliste'
      );

      if (filtered.length === 0) return defaults;

      return filtered.map((motif) => ({
        id: motif.id,
        label: motif.nom,
        description: motif.description,
      }));
    } catch {
      return defaults;
    }
  },

  getMotifsForCurrentCabinet: async () => {
    const { specialite } = await getCurrentSpeciality();
    const nom = specialite?.nom || 'Généraliste';
    return motifsConsultationService.getMotifsForSelect(nom);
  },

  createMotif: async (motifData) => {
    try {
      const { data, error } = await supabase
        .from('motifs_consultation')
        .insert([motifData])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erreur lors de la création du motif:', error);
      throw error;
    }
  },
};

export default motifsConsultationService;
