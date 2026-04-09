// Script de test pour vérifier la connexion à Supabase
import { supabase } from '../lib/supabase.js';
import { 
  appointmentService, 
  patientService, 
  userService,
  waitingQueueService 
} from '../lib/services.js';

export const testSupabaseConnection = async () => {
  console.log('🔍 Test de connexion à Supabase...');
  
  try {
    // Test 1: Connexion de base
    console.log('1️⃣ Test de connexion de base...');
    const { data: testData, error: testError } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (testError) {
      console.error('❌ Erreur de connexion:', testError);
      return false;
    }
    console.log('✅ Connexion réussie!');

    // Test 2: Récupérer les utilisateurs
    console.log('2️⃣ Test de récupération des utilisateurs...');
    const users = await userService.getAll();
    console.log(`✅ ${users.length} utilisateurs trouvés`);
    console.log('📋 Utilisateurs:', users.slice(0, 3).map(u => `${u.prenom} ${u.nom} (${u.role})`));

    // Test 3: Récupérer les patients
    console.log('3️⃣ Test de récupération des patients...');
    const patients = await patientService.getAll();
    console.log(`✅ ${patients.length} patients trouvés`);
    console.log('📋 Patients:', patients.slice(0, 3).map(p => `${p.prenom} ${p.nom}`));

    // Test 4: Récupérer les rendez-vous
    console.log('4️⃣ Test de récupération des rendez-vous...');
    const appointments = await appointmentService.getAll();
    console.log(`✅ ${appointments.length} rendez-vous trouvés`);
    console.log('📋 Rendez-vous:', appointments.slice(0, 3).map(a => 
      `${a.date_heure} - ${a.motif}`
    ));

    // Test 5: Récupérer la file d'attente
    console.log('5️⃣ Test de récupération de la file d\'attente...');
    const waitingQueue = await waitingQueueService.getAll();
    console.log(`✅ ${waitingQueue.length} patients dans la file d'attente`);

    // Test 6: Récupérer les rendez-vous d'aujourd'hui
    console.log('6️⃣ Test de récupération des rendez-vous d\'aujourd\'hui...');
    const todayAppointments = await appointmentService.getToday();
    console.log(`✅ ${todayAppointments.length} rendez-vous aujourd'hui`);

    console.log('🎉 Tous les tests sont passés avec succès!');
    return true;

  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
    return false;
  }
};

// Fonction pour afficher un résumé des données
export const displayDataSummary = async () => {
  try {
    const [users, patients, appointments, waitingQueue] = await Promise.all([
      userService.getAll(),
      patientService.getAll(),
      appointmentService.getAll(),
      waitingQueueService.getAll()
    ]);

    const doctors = users.filter(u => u.role === 'doctor');
    const secretaries = users.filter(u => u.role === 'secretary');
    const todayAppointments = appointments.filter(a => 
      a.date_heure.split('T')[0] === new Date().toISOString().split('T')[0]
    );

    console.log('📊 Résumé des données:');
    console.log(`👨‍⚕️ Médecins: ${doctors.length}`);
    console.log(`👩‍💼 Secrétaires: ${secretaries.length}`);
    console.log(`👥 Patients: ${patients.length}`);
    console.log(`📅 Rendez-vous total: ${appointments.length}`);
    console.log(`📅 Rendez-vous aujourd'hui: ${todayAppointments.length}`);
    console.log(`⏳ File d'attente: ${waitingQueue.length}`);

    return {
      doctors: doctors.length,
      secretaries: secretaries.length,
      patients: patients.length,
      appointments: appointments.length,
      todayAppointments: todayAppointments.length,
      waitingQueue: waitingQueue.length
    };

  } catch (error) {
    console.error('❌ Erreur lors de l\'affichage du résumé:', error);
    return null;
  }
};
