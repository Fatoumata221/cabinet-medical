import { supabase } from '../lib/supabase';

export const fetchPatients = async () => {
  const { data, error } = await supabase
    .from('patients')
    .select('id, nom, prenom, date_naissance, numero_dossier')
    .eq('actif', true)
    .order('nom');

  if (error) {
    console.error('Erreur lors du chargement des patients:', error);
    throw error;
  }
  
  return data || [];
};
