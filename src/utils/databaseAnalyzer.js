import { supabase } from '../lib/supabase.js';

// Fonction pour analyser complètement la base de données
export const analyzeDatabaseCompletely = async () => {
  console.log('🔍 Analyse complète de la base de données...');
  
  try {
    // 1. Vérifier la connexion
    console.log('1️⃣ Test de connexion...');
    const { data: testData, error: testError } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (testError) {
      console.error('❌ Erreur de connexion:', testError);
      return { success: false, error: testError };
    }
    console.log('✅ Connexion réussie');

    // 2. Lister toutes les tables
    console.log('2️⃣ Analyse des tables...');
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');
    
    if (tablesError) {
      console.error('❌ Erreur lors de la récupération des tables:', tablesError);
      return { success: false, error: tablesError };
    }

    console.log('📋 Tables trouvées:', tables.map(t => t.table_name));

    // 3. Analyser chaque table importante
    const analysis = {};
    
    const importantTables = ['users', 'patients', 'appointments', 'consultations'];
    
    for (const tableName of importantTables) {
      console.log(`3️⃣ Analyse de la table ${tableName}...`);
      
      // Vérifier si la table existe
      const tableExists = tables.some(t => t.table_name === tableName);
      if (!tableExists) {
        console.warn(`⚠️ Table ${tableName} n'existe pas`);
        analysis[tableName] = { exists: false, count: 0, sample: [] };
        continue;
      }

      // Compter les lignes
      const { count, error: countError } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true });
      
      if (countError) {
        console.error(`❌ Erreur lors du comptage de ${tableName}:`, countError);
        analysis[tableName] = { exists: true, count: 0, error: countError, sample: [] };
        continue;
      }

      // Récupérer un échantillon
      const { data: sample, error: sampleError } = await supabase
        .from(tableName)
        .select('*')
        .limit(3);
      
      if (sampleError) {
        console.error(`❌ Erreur lors de la récupération d'échantillon de ${tableName}:`, sampleError);
        analysis[tableName] = { exists: true, count, error: sampleError, sample: [] };
        continue;
      }

      analysis[tableName] = { exists: true, count, sample };
      console.log(`✅ ${tableName}: ${count} lignes`);
    }

    // 4. Vérifier les relations
    console.log('4️⃣ Vérification des relations...');
    
    // Vérifier les médecins
    const { data: doctors, error: doctorsError } = await supabase
      .from('users')
      .select('id, nom, prenom, role')
      .eq('role', 'doctor');
    
    if (doctorsError) {
      console.error('❌ Erreur lors de la récupération des médecins:', doctorsError);
    } else {
      console.log(`✅ Médecins trouvés: ${doctors.length}`);
      console.log('📋 Médecins:', doctors.map(d => `${d.prenom} ${d.nom} (${d.role})`));
    }

    // Vérifier les patients
    const { data: patients, error: patientsError } = await supabase
      .from('patients')
      .select('id, nom, prenom, telephone')
      .limit(5);
    
    if (patientsError) {
      console.error('❌ Erreur lors de la récupération des patients:', patientsError);
    } else {
      console.log(`✅ Patients trouvés: ${patients.length}`);
      console.log('📋 Patients:', patients.map(p => `${p.prenom} ${p.nom}`));
    }

    // Vérifier les rendez-vous
    const { data: appointments, error: appointmentsError } = await supabase
      .from('appointments')
      .select('id, patient_id, medecin_id, date_heure, motif')
      .limit(5);
    
    if (appointmentsError) {
      console.error('❌ Erreur lors de la récupération des rendez-vous:', appointmentsError);
    } else {
      console.log(`✅ Rendez-vous trouvés: ${appointments.length}`);
      console.log('📋 Rendez-vous:', appointments.map(a => `${a.date_heure} - ${a.motif}`));
    }

    console.log('🎉 Analyse terminée avec succès');
    return { success: true, analysis, doctors, patients, appointments };

  } catch (error) {
    console.error('❌ Erreur lors de l\'analyse:', error);
    return { success: false, error };
  }
};

// Fonction pour corriger les données manquantes
export const fixMissingData = async () => {
  console.log('🔧 Correction des données manquantes...');
  
  try {
    // 1. Vérifier et créer des médecins si nécessaire
    const { data: doctors, error: doctorsError } = await supabase
      .from('users')
      .select('id')
      .eq('role', 'doctor');
    
    if (doctorsError) {
      console.error('❌ Erreur lors de la vérification des médecins:', doctorsError);
      return false;
    }

    if (doctors.length === 0) {
      console.log('⚠️ Aucun médecin trouvé, création de médecins de test...');
      
      const testDoctors = [
        { email: 'dr.martin@cabinet.com', role: 'doctor', nom: 'Martin', prenom: 'Jean', specialite: 'Médecine générale' },
        { email: 'dr.bernard@cabinet.com', role: 'doctor', nom: 'Bernard', prenom: 'Marie', specialite: 'Cardiologie' },
        { email: 'dr.dubois@cabinet.com', role: 'doctor', nom: 'Dubois', prenom: 'Pierre', specialite: 'Dermatologie' }
      ];

      for (const doctor of testDoctors) {
        const { error: insertError } = await supabase
          .from('users')
          .insert([doctor]);
        
        if (insertError) {
          console.error(`❌ Erreur lors de la création du médecin ${doctor.prenom} ${doctor.nom}:`, insertError);
        } else {
          console.log(`✅ Médecin créé: ${doctor.prenom} ${doctor.nom}`);
        }
      }
    }

    // 2. Vérifier et créer des patients si nécessaire
    const { data: patients, error: patientsError } = await supabase
      .from('patients')
      .select('id')
      .limit(1);
    
    if (patientsError) {
      console.error('❌ Erreur lors de la vérification des patients:', patientsError);
      return false;
    }

    if (patients.length === 0) {
      console.log('⚠️ Aucun patient trouvé, création de patients de test...');
      
      const testPatients = [
        { nom: 'Dupont', prenom: 'Marie', date_naissance: '1985-03-15', telephone: '0123456789', adresse: '123 Rue de la Paix, Paris', assurance: 'MGEN' },
        { nom: 'Martin', prenom: 'Jean', date_naissance: '1978-07-22', telephone: '0123456790', adresse: '456 Avenue des Champs, Lyon', assurance: 'CPAM' },
        { nom: 'Bernard', prenom: 'Sophie', date_naissance: '1992-11-08', telephone: '0123456791', adresse: '789 Boulevard Central, Marseille', assurance: 'MGEN' }
      ];

      for (const patient of testPatients) {
        const { error: insertError } = await supabase
          .from('patients')
          .insert([patient]);
        
        if (insertError) {
          console.error(`❌ Erreur lors de la création du patient ${patient.prenom} ${patient.nom}:`, insertError);
        } else {
          console.log(`✅ Patient créé: ${patient.prenom} ${patient.nom}`);
        }
      }
    }

    console.log('✅ Correction des données terminée');
    return true;

  } catch (error) {
    console.error('❌ Erreur lors de la correction des données:', error);
    return false;
  }
};

// Fonction pour exécuter le script de seed si nécessaire
export const runSeedIfNeeded = async () => {
  console.log('🌱 Vérification et exécution du script de seed...');
  
  try {
    // Vérifier si des données existent déjà
    const { data: existingData, error: checkError } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (checkError) {
      console.error('❌ Erreur lors de la vérification des données existantes:', checkError);
      return false;
    }

    // Si aucune donnée n'existe, exécuter le script de seed
    if (existingData.length === 0) {
      console.log('⚠️ Aucune donnée trouvée, exécution du script de seed...');
      
      // Note: Le script de seed doit être exécuté côté serveur
      // Ici on peut seulement suggérer à l'utilisateur de l'exécuter
      console.log('💡 Veuillez exécuter le script de seed manuellement:');
      console.log('   npm run seed-database');
      
      return false;
    }

    console.log('✅ Données existantes trouvées');
    return true;

  } catch (error) {
    console.error('❌ Erreur lors de la vérification du seed:', error);
    return false;
  }
};

