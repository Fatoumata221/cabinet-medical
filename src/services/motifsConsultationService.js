import { supabase } from '../lib/supabase';

/**
 * Service pour g├®rer les motifs de consultation de mani├¿re centralis├®e
 */
export const motifsConsultationService = {
  /**
   * R├®cup├¿re tous les motifs de consultation pour une sp├®cialit├®
   * @param {string} specialite - Nom de la sp├®cialit├® (ex: 'Dentiste')
   * @returns {Promise<Array>} Liste des motifs
   */
  async getMotifsForSelect(specialite = 'Dentiste') {
    try {
      const { data, error } = await supabase
        .from('motifs_consultation')
        .select('*')
        .eq('specialite_id', (await this.getSpecialiteId(specialite)))
        .eq('actif', true)
        .order('ordre', { ascending: true });

      if (error) {
        console.error('Erreur lors du chargement des motifs:', error);
        throw error;
      }

      return data?.map(motif => ({
        value: motif.nom,
        label: motif.nom,
        description: motif.description
      })) || [];
    } catch (error) {
      console.error('Erreur service motifs:', error);
      // Fallback vers les motifs par d├®faut
      return this.getDefaultMotifsForSelect();
    }
  },

  /**
   * R├®cup├¿re l'ID d'une sp├®cialit├® par son nom
   * @param {string} specialiteName - Nom de la sp├®cialit├®
   * @returns {Promise<string>} ID de la sp├®cialit├®
   */
  async getSpecialiteId(specialiteName) {
    try {
      const { data, error } = await supabase
        .from('specialites')
        .select('id')
        .eq('nom', specialiteName)
        .single();

      if (error) {
        console.error('Erreur r├®cup├®ration sp├®cialit├®:', error);
        return null;
      }

      return data?.id;
    } catch (error) {
      console.error('Erreur service sp├®cialit├®:', error);
      return null;
    }
  },

  /**
   * R├®cup├¿re tous les motifs (pour admin)
   * @returns {Promise<Array>} Liste compl├¿te des motifs
   */
  async getAllMotifs() {
    try {
      const { data, error } = await supabase
        .from('motifs_consultation')
        .select('*')
        .order('ordre', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erreur r├®cup├®ration tous les motifs:', error);
      return [];
    }
  },

  /**
   * Cr├®e un nouveau motif de consultation
   * @param {Object} motifData - Donn├®es du motif
   * @returns {Promise<Object>} R├®sultat de la cr├®ation
   */
  async createMotif(motifData) {
    try {
      const { data, error } = await supabase
        .from('motifs_consultation')
        .insert([motifData])
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Erreur cr├®ation motif:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Met ├á jour un motif de consultation
   * @param {string} id - ID du motif
   * @param {Object} motifData - Donn├®es ├á mettre ├á jour
   * @returns {Promise<Object>} R├®sultat de la mise ├á jour
   */
  async updateMotif(id, motifData) {
    try {
      const { data, error } = await supabase
        .from('motifs_consultation')
        .update({ ...motifData, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Erreur mise ├á jour motif:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Supprime un motif de consultation
   * @param {string} id - ID du motif
   * @returns {Promise<Object>} R├®sultat de la suppression
   */
  async deleteMotif(id) {
    try {
      const { error } = await supabase
        .from('motifs_consultation')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Erreur suppression motif:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Retourne les motifs par d├®faut (fallback)
   * @returns {Array} Liste des motifs par d├®faut
   */
  getDefaultMotifsForSelect() {
    return [
      { value: 'Examen dentaire', label: 'Examen dentaire', description: 'Consultation dentaire g├®n├®rale' },
      { value: 'Nettoyage dentaire', label: 'Nettoyage dentaire', description: 'D├®tartrage et nettoyage' },
      { value: 'Extraction dentaire', label: 'Extraction dentaire', description: 'Extraction de dent' },
      { value: 'Soins dentaires', label: 'Soins dentaires', description: 'Soins dentaires divers' },
      { value: 'Orthodontie', label: 'Orthodontie', description: 'Consultation orthodontique' },
      { value: 'Implant dentaire', label: 'Implant dentaire', description: 'Consultation pour implant' },
      { value: 'Proth├¿se dentaire', label: 'Proth├¿se dentaire', description: 'Consultation pour proth├¿se' },
      { value: 'Blanchiment dentaire', label: 'Blanchiment dentaire', description: 'Blanchiment des dents' },
      { value: 'Urgence dentaire', label: 'Urgence dentaire', description: 'Urgence dentaire (douleur, traumatisme)' },
      { value: 'Contr├┤le post-traitement', label: 'Contr├┤le post-traitement', description: 'Suivi apr├¿s traitement' },
      { value: 'Panoramique dentaire', label: 'Panoramique dentaire', description: 'Radiographie panoramique' },
      { value: 'D├®tartrage', label: 'D├®tartrage', description: 'D├®tartrage simple' },
      { value: 'Soins caries', label: 'Soins caries', description: 'Soins des caries dentaires' },
      { value: 'Pose de couronne', label: 'Pose de couronne', description: 'Pose de couronne dentaire' },
      { value: 'Traitement de canal', label: 'Traitement de canal', description: 'Traitement de canal (endodontie)' },
      { value: 'Premi├¿re consultation', label: 'Premi├¿re consultation', description: 'Premi├¿re consultation dentaire' },
      { value: 'Radiographie dentaire', label: 'Radiographie dentaire', description: 'Radiographie dentaire' },
      { value: 'Consultation de contr├┤le', label: 'Consultation de contr├┤le', description: 'Consultation de contr├┤le dentaire' },
      { value: 'Autre', label: 'Autre', description: 'Autre motif de consultation' }
    ];
  }
};

export default motifsConsultationService;
