import { supabase } from '../../lib/supabase';

export const toothStatesService = {
  /**
   * Récupère tous les états dentaires.
   */
  async getAll() {
    const { data, error } = await supabase
      .from('tooth_states')
      .select('*')
      .order('order_index', { ascending: true });

    if (error) throw error;
    return data;
  },

  /**
   * Crée un nouvel état dentaire.
   */
  async create(stateData) {
    const { data, error } = await supabase
      .from('tooth_states')
      .insert([stateData])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Met à jour un état dentaire existant.
   */
  async update(id, stateData) {
    const { data, error } = await supabase
      .from('tooth_states')
      .update(stateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Supprime un état dentaire.
   * Les états système ne devraient pas être supprimables via l'UI mais la protection est aussi en base.
   */
  async delete(id) {
    const { error } = await supabase
      .from('tooth_states')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  }
};
