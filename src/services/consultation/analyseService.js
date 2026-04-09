import { supabase } from '../../lib/supabase';

export const updateAnalyse = async (id, updates) => {
  try {
    const { data, error } = await supabase
      .from('analyses_labo_prescrites') // Assuming the table name is 'analyses_labo_prescrites'
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating analyse:', error);
    throw error;
  }
};
