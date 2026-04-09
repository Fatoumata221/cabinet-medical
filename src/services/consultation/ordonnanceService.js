import { supabase } from '../../lib/supabase';

export const updateOrdonnance = async (id, updates) => {
  try {
    const { data, error } = await supabase
      .from('ordonnances')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating ordonnance:', error);
    throw error;
  }
};
