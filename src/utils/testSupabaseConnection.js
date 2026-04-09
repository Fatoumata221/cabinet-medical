// Script de test pour vérifier la configuration Supabase
import { supabase } from '../lib/supabase';

export const testSupabaseConnection = async () => {
  console.log('🔍 [TestSupabase] Début des tests de connexion...');
  
  const results = {
    session: null,
    tables: {},
    realtime: null,
    errors: []
  };

  try {
    // 1. Test de session
    console.log('🔌 [TestSupabase] Test de session...');
    const { data: session, error: sessionError } = await supabase.auth.getSession();
    results.session = { data: session, error: sessionError };
    console.log('📊 [TestSupabase] Session:', session, 'Error:', sessionError);

    // 2. Test des tables principales
    const tablesToTest = [
      'waiting_queue',
      'notifications_realtime',
      'appointments',
      'patients',
      'users'
    ];

    for (const tableName of tablesToTest) {
      console.log(`📋 [TestSupabase] Test table ${tableName}...`);
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);
        
        results.tables[tableName] = { 
          success: !error, 
          data: data, 
          error: error 
        };
        console.log(`📊 [TestSupabase] ${tableName}:`, data, 'Error:', error);
      } catch (err) {
        results.tables[tableName] = { 
          success: false, 
          error: err 
        };
        results.errors.push(`Table ${tableName}: ${err.message}`);
        console.error(`❌ [TestSupabase] Erreur table ${tableName}:`, err);
      }
    }

    // 3. Test Realtime
    console.log('📡 [TestSupabase] Test Realtime...');
    try {
      const testChannel = supabase.channel('connection_test')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'waiting_queue'
        }, (payload) => {
          console.log('✅ [TestSupabase] Realtime test réussi:', payload);
        })
        .subscribe((status, err) => {
          console.log('📊 [TestSupabase] Realtime status:', status, 'Error:', err);
          results.realtime = { status, error: err };
          
          // Nettoyer après 3 secondes
          setTimeout(() => {
            supabase.removeChannel(testChannel);
          }, 3000);
        });
    } catch (err) {
      results.realtime = { error: err };
      results.errors.push(`Realtime: ${err.message}`);
      console.error('❌ [TestSupabase] Erreur Realtime:', err);
    }

  } catch (error) {
    results.errors.push(`Erreur générale: ${error.message}`);
    console.error('❌ [TestSupabase] Erreur générale:', error);
  }

  console.log('🎯 [TestSupabase] Résultats complets:', results);
  return results;
};

// Fonction pour afficher un résumé des résultats
export const displayTestResults = (results) => {
  console.log('\n📊 === RÉSUMÉ DES TESTS SUPABASE ===');
  
  // Session
  console.log(`🔌 Session: ${results.session?.error ? '❌ Erreur' : '✅ OK'}`);
  if (results.session?.error) {
    console.log(`   Erreur: ${results.session.error.message}`);
  }
  
  // Tables
  console.log('\n📋 Tables:');
  Object.entries(results.tables).forEach(([tableName, result]) => {
    console.log(`   ${tableName}: ${result.success ? '✅ OK' : '❌ Erreur'}`);
    if (!result.success && result.error) {
      console.log(`      Erreur: ${result.error.message}`);
    }
  });
  
  // Realtime
  console.log(`\n📡 Realtime: ${results.realtime?.error ? '❌ Erreur' : '✅ OK'}`);
  if (results.realtime?.error) {
    console.log(`   Erreur: ${results.realtime.error.message}`);
  }
  
  // Erreurs
  if (results.errors.length > 0) {
    console.log('\n❌ Erreurs détectées:');
    results.errors.forEach((error, index) => {
      console.log(`   ${index + 1}. ${error}`);
    });
  }
  
  console.log('\n=== FIN DU RÉSUMÉ ===\n');
};

// Fonction pour exécuter tous les tests
export const runAllTests = async () => {
  const results = await testSupabaseConnection();
  displayTestResults(results);
  return results;
};


