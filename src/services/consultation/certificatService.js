import { supabase } from '../../lib/supabase';

export const updateCertificat = async (id, updates) => {
  try {
    const { data, error } = await supabase
      .from('certificats')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating certificat:', error);
    throw error;
  }
};
