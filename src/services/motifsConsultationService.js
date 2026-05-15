import { supabase } from '../lib/supabase';

<<<<<<< HEAD
/**
 * Service pour gérer les motifs de consultation de manière centralisée
 */
export const motifsConsultationService = {
  /**
   * Récupère tous les motifs de consultation pour une spécialité
   * @param {string} specialite - Nom de la spécialité (ex: 'Dentiste')
   * @returns {Promise<Array>} Liste des motifs
   */
  async getMotifsForSelect(specialite = 'Dentiste') {
=======
const motifsConsultationService = {
  /**
   * Récupère les motifs de consultation pour une spécialité donnée
   */
  getMotifsForSelect: async (specialite = 'Généraliste') => {
>>>>>>> dev
    try {
      const { data, error } = await supabase
        .from('motifs_consultation')
        .select('*')
<<<<<<< HEAD
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
      // Fallback vers les motifs par défaut
      return this.getDefaultMotifsForSelect();
    }
  },

  /**
   * Récupère l'ID d'une spécialité par son nom
   * @param {string} specialiteName - Nom de la spécialité
   * @returns {Promise<string>} ID de la spécialité
   */
  async getSpecialiteId(specialiteName) {
    try {
      const { data, error } = await supabase
        .from('specialites')
        .select('id')
        .eq('nom', specialiteName)
        .single();

      if (error) {
        console.error('Erreur récupération spécialité:', error);
        return null;
      }

      return data?.id;
    } catch (error) {
      console.error('Erreur service spécialité:', error);
      return null;
    }
  },

  /**
   * Récupère tous les motifs (pour admin)
   * @returns {Promise<Array>} Liste complète des motifs
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
      console.error('Erreur récupération tous les motifs:', error);
=======
        .eq('specialite', specialite)
        .or('specialite.is.null,specialite.eq.Généraliste');

      if (error) throw error;

      return (data || []).map(motif => ({
        id: motif.id,
        label: motif.nom,
        description: motif.description
      }));
    } catch (error) {
      console.error('Erreur lors du chargement des motifs:', error);
>>>>>>> dev
      return [];
    }
  },

  /**
<<<<<<< HEAD
   * Crée un nouveau motif de consultation
   * @param {Object} motifData - Données du motif
   * @returns {Promise<Object>} Résultat de la création
   */
  async createMotif(motifData) {
=======
   * Retourne les motifs par défaut pour le select
   */
  getDefaultMotifsForSelect: () => {
    return [
      { id: 1, label: 'Consultation générale', description: 'Examen médical général' },
      { id: 2, label: 'Suivi post-consultation', description: 'Suivi après une consultation précédente' },
      { id: 3, label: 'Urgence', description: 'Consultation urgente' },
      { id: 4, label: 'Contrôle', description: 'Contrôle de routine' },
      { id: 5, label: 'Vaccination', description: 'Administration de vaccins' },
      { id: 6, label: 'Ordonnance', description: 'Renouvellement d\'ordonnance' },
      { id: 7, label: 'Certificat', description: 'Délivrance de certificat médical' },
      { id: 8, label: 'Autre', description: 'Autre motif de consultation' }
    ];
  },

  /**
   * Crée un nouveau motif de consultation
   */
  createMotif: async (motifData) => {
>>>>>>> dev
    try {
      const { data, error } = await supabase
        .from('motifs_consultation')
        .insert([motifData])
        .select()
        .single();

      if (error) throw error;
<<<<<<< HEAD
      return { success: true, data };
    } catch (error) {
      console.error('Erreur création motif:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Met à jour un motif de consultation
   * @param {string} id - ID du motif
   * @param {Object} motifData - Données à mettre à jour
   * @returns {Promise<Object>} Résultat de la mise à jour
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
      console.error('Erreur mise à jour motif:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Supprime un motif de consultation
   * @param {string} id - ID du motif
   * @returns {Promise<Object>} Résultat de la suppression
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
   * Retourne les motifs par défaut (fallback)
   * @returns {Array} Liste des motifs par défaut
   */
  getDefaultMotifsForSelect() {
    return [
      { value: 'Examen dentaire', label: 'Examen dentaire', description: 'Consultation dentaire générale' },
      { value: 'Nettoyage dentaire', label: 'Nettoyage dentaire', description: 'Détartrage et nettoyage' },
      { value: 'Extraction dentaire', label: 'Extraction dentaire', description: 'Extraction de dent' },
      { value: 'Soins dentaires', label: 'Soins dentaires', description: 'Soins dentaires divers' },
      { value: 'Orthodontie', label: 'Orthodontie', description: 'Consultation orthodontique' },
      { value: 'Implant dentaire', label: 'Implant dentaire', description: 'Consultation pour implant' },
      { value: 'Prothèse dentaire', label: 'Prothèse dentaire', description: 'Consultation pour prothèse' },
      { value: 'Blanchiment dentaire', label: 'Blanchiment dentaire', description: 'Blanchiment des dents' },
      { value: 'Urgence dentaire', label: 'Urgence dentaire', description: 'Urgence dentaire (douleur, traumatisme)' },
      { value: 'Contrôle post-traitement', label: 'Contrôle post-traitement', description: 'Suivi après traitement' },
      { value: 'Panoramique dentaire', label: 'Panoramique dentaire', description: 'Radiographie panoramique' },
      { value: 'Détartrage', label: 'Détartrage', description: 'Détartrage simple' },
      { value: 'Soins caries', label: 'Soins caries', description: 'Soins des caries dentaires' },
      { value: 'Pose de couronne', label: 'Pose de couronne', description: 'Pose de couronne dentaire' },
      { value: 'Traitement de canal', label: 'Traitement de canal', description: 'Traitement de canal (endodontie)' },
      { value: 'Première consultation', label: 'Première consultation', description: 'Première consultation dentaire' },
      { value: 'Radiographie dentaire', label: 'Radiographie dentaire', description: 'Radiographie dentaire' },
      { value: 'Consultation de contrôle', label: 'Consultation de contrôle', description: 'Consultation de contrôle dentaire' },
      { value: 'Autre', label: 'Autre', description: 'Autre motif de consultation' }
    ];
=======
      return data;
    } catch (error) {
      console.error('Erreur lors de la création du motif:', error);
      throw error;
    }
>>>>>>> dev
  }
};

export default motifsConsultationService;
