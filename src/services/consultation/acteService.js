import { supabase } from '../../lib/supabase';

export const updateActe = async (id, updates) => {
  try {
    const { data, error } = await supabase
      .from('actes_medicaux') // Assuming the table name is 'actes_medicaux'
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating acte:', error);
    throw error;
  }
};
