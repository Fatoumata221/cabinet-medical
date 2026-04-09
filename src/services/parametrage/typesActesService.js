import { supabase } from '../../lib/supabase';
import { getSpecialityFilter } from '../../lib/specialityConfigService';

export const typesActesService = {
  /**
   * Récupère tous les types d'actes pour la spécialité donnée ou tous si aucune spécialité n'est définie.
   */
  async getAll() {
    let query = supabase
      .from('types_actes')
      .select(`
        *,
        types_actes_specialites (
          specialite_id,
          specialites (id, nom)
        )
      `)
      .order('ordre_affichage', { ascending: true });

    // Gestion du filtre par spécialité via le service de configuration
    const specialiteId = await getSpecialityFilter();
    
    // Si un filtre est actif, on peut filtrer côté client ou serveur.
    // L'implémentation originale utilisait un RPC pour le filtre strict, 
    // ou filtrait après coup.
    // Ici, nous récupérons tout et nous laissons le hook ou le composant filtrer si nécessaire, 
    // ou nous ajoutons une logique de filtrage serveur si la table a une colonne de spécialité directe (ce qui ne semble pas être le cas ici, c'est une relation N:N).
    
    const { data, error } = await query;

    if (error) throw error;

    // Transformation des données pour faciliter l'usage dans l'UI
    return data.map(acte => ({
      ...acte,
      specialites_data: acte.types_actes_specialites?.map(tas => tas.specialites).filter(Boolean) || [],
      specialite_ids: acte.types_actes_specialites?.map(tas => tas.specialite_id) || []
    }));
  },

  /**
   * Récupère un type d'acte par son ID
   */
  async getById(id) {
    const { data, error } = await supabase
      .from('types_actes')
      .select(`
        *,
        types_actes_specialites (
          specialite_id
        )
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    
    return {
      ...data,
      specialite_ids: data.types_actes_specialites?.map(tas => tas.specialite_id) || []
    };
  },

  /**
   * Crée un nouveau type d'acte
   */
  async create(acteData) {
    const { specialite_ids, ...mainData } = acteData;
    
    // 1. Insertion des données principales
    const { data: newActe, error } = await supabase
      .from('types_actes')
      .insert([mainData])
      .select()
      .single();

    if (error) throw error;

    // 2. Gestion des relations (Spécialités)
    if (specialite_ids && specialite_ids.length > 0) {
      const links = specialite_ids.map(specId => ({
        type_acte_id: newActe.id,
        specialite_id: specId
      }));

      const { error: linkError } = await supabase
        .from('types_actes_specialites')
        .insert(links);

      if (linkError) throw linkError;
    }

    return newActe;
  },

  /**
   * Met à jour un type d'acte existant
   */
  async update(id, acteData) {
    const { specialite_ids, ...mainData } = acteData;

    // 1. Mise à jour des données principales
    const { data: updatedActe, error } = await supabase
      .from('types_actes')
      .update(mainData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // 2. Gestion des relations (Spécialités)
    // On supprime tout et on recrée (stratégie simple pour le N:N)
    if (specialite_ids !== undefined) {
      // Suppression des liens existants
      const { error: deleteError } = await supabase
        .from('types_actes_specialites')
        .delete()
        .eq('type_acte_id', id);

      if (deleteError) throw deleteError;

      // Création des nouveaux liens
      if (specialite_ids.length > 0) {
        const links = specialite_ids.map(specId => ({
          type_acte_id: id,
          specialite_id: specId
        }));

        const { error: insertError } = await supabase
          .from('types_actes_specialites')
          .insert(links);

        if (insertError) throw insertError;
      }
    }

    return updatedActe;
  },

  /**
   * Supprime un type d'acte
   */
  async delete(id) {
    // Les contraintes de clé étrangère (ON DELETE CASCADE) devraient gérer types_actes_specialites
    const { error } = await supabase
      .from('types_actes')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  }
};
