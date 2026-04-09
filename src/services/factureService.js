import { supabase } from "../lib/supabase";

export const updateFacture = async (factureId, updateData) => {
  const { data, error } = await supabase
    .from('factures')
    .update(updateData)
    .eq('id', factureId)
    .select();

  if (error) throw error;
  return data;
};
