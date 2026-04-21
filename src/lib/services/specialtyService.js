//import { supabase } from '../supabase';
//import { supabaseQuery as supabase } from '../supabase';
import { supabase } from '../supabase'
export const specialtyService = {
  async getAll() {
    try {
      const { data, error } = await supabase
        .from('specialites')
        .select('id, nom, color, actif')
        .eq('actif', true)
        .order('nom', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (fetchError) {
      console.error('Erreur lors du chargement des spécialités:', fetchError);
      throw fetchError;
    }
  },
};
