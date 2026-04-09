import { supabase } from '../lib/supabase.js';

// Test simple de connexion
export const simpleConnectionTest = async () => {
  console.log('🔍 Test de connexion simple...');
  
  try {
    // Test 1: Connexion de base
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('❌ Erreur de connexion:', error);
      return { success: false, error };
    }
    
    console.log('✅ Connexion réussie!');
    return { success: true, data };
    
  } catch (error) {
    console.error('❌ Erreur inattendue:', error);
    return { success: false, error };
  }
};

// Test de récupération des données
export const testDataRetrieval = async () => {
  console.log('📥 Test de récupération des données...');
  
  try {
    // Test médecins
    const { data: doctors, error: doctorsError } = await supabase
      .from('users')
      .select('id, nom, prenom, role')
      .eq('role', 'doctor');
    
    if (doctorsError) {
      console.error('❌ Erreur médecins:', doctorsError);
    } else {
      console.log(`✅ Médecins: ${doctors.length} trouvés`);
    }
    
    // Test patients
    const { data: patients, error: patientsError } = await supabase
      .from('patients')
      .select('id, nom, prenom')
      .limit(5);
    
    if (patientsError) {
      console.error('❌ Erreur patients:', patientsError);
    } else {
      console.log(`✅ Patients: ${patients.length} trouvés`);
    }
    
    // Test rendez-vous
    const { data: appointments, error: appointmentsError } = await supabase
      .from('appointments')
      .select('id, date_heure, motif')
      .limit(5);
    
    if (appointmentsError) {
      console.error('❌ Erreur rendez-vous:', appointmentsError);
    } else {
      console.log(`✅ Rendez-vous: ${appointments.length} trouvés`);
    }
    
    return {
      success: true,
      doctors: doctors || [],
      patients: patients || [],
      appointments: appointments || []
    };
    
  } catch (error) {
    console.error('❌ Erreur lors du test de récupération:', error);
    return { success: false, error };
  }
};

// Test complet
export const runCompleteTest = async () => {
  console.log('🧪 Test complet de la base de données...');
  
  const connectionTest = await simpleConnectionTest();
  if (!connectionTest.success) {
    return connectionTest;
  }
  
  const dataTest = await testDataRetrieval();
  return dataTest;
};

