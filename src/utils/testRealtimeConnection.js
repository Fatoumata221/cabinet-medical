// Utilitaire pour tester la connexion Realtime
import { supabase } from '../lib/supabase';

export const testRealtimeConnection = async () => {
  console.log('🧪 [TestRealtime] Début du test de connexion Realtime...');
  
  const results = {
    session: null,
    subscription: null,
    testData: null,
    errors: []
  };

  try {
    // 1. Vérifier la session
    const { data: session, error: sessionError } = await supabase.auth.getSession();
    results.session = { data: session, error: sessionError };
    
    if (sessionError || !session?.session) {
      throw new Error('Session utilisateur manquante');
    }
    
    console.log('✅ [TestRealtime] Session utilisateur OK');

    // 2. Test d'abonnement Realtime
    return new Promise((resolve) => {
      const testChannel = supabase.channel('connection_test', {
        config: {
          broadcast: { self: false },
          presence: { key: 'test' }
        }
      });

      let subscriptionTimeout;
      let testTimeout;

      // Écouter les changements
      testChannel.on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'waiting_queue'
      }, (payload) => {
        console.log('✅ [TestRealtime] Changement détecté:', payload);
        results.testData = payload;
      });

      // S'abonner
      testChannel.subscribe((status, err) => {
        console.log('📊 [TestRealtime] Statut abonnement:', status, err);
        results.subscription = { status, error: err };

        if (status === 'SUBSCRIBED') {
          console.log('✅ [TestRealtime] Abonnement réussi');
          clearTimeout(subscriptionTimeout);
          
          // Attendre 2 secondes puis nettoyer
          testTimeout = setTimeout(() => {
            supabase.removeChannel(testChannel);
            console.log('🧹 [TestRealtime] Canal nettoyé');
            resolve({
              success: true,
              message: 'Connexion Realtime OK',
              results
            });
          }, 2000);
          
        } else if (status === 'CLOSED') {
          console.log('❌ [TestRealtime] Abonnement fermé');
          clearTimeout(subscriptionTimeout);
          clearTimeout(testTimeout);
          
          supabase.removeChannel(testChannel);
          resolve({
            success: false,
            message: 'Abonnement Realtime fermé',
            results
          });
          
        } else if (status === 'CHANNEL_ERROR') {
          console.log('❌ [TestRealtime] Erreur canal:', err);
          clearTimeout(subscriptionTimeout);
          clearTimeout(testTimeout);
          
          supabase.removeChannel(testChannel);
          resolve({
            success: false,
            message: `Erreur canal Realtime: ${err?.message || err}`,
            results
          });
        }
      });

      // Timeout de sécurité
      subscriptionTimeout = setTimeout(() => {
        console.log('⏰ [TestRealtime] Timeout - abonnement trop long');
        clearTimeout(testTimeout);
        supabase.removeChannel(testChannel);
        resolve({
          success: false,
          message: 'Timeout - abonnement trop long',
          results
        });
      }, 10000);
    });

  } catch (error) {
    console.error('❌ [TestRealtime] Erreur:', error);
    results.errors.push(error.message);
    return {
      success: false,
      message: `Erreur: ${error.message}`,
      results
    };
  }
};

// Fonction pour tester l'insertion de données
export const testRealtimeInsert = async () => {
  console.log('🧪 [TestRealtime] Test d\'insertion...');
  
  try {
    const { data: session } = await supabase.auth.getSession();
    if (!session?.session?.user?.id) {
      throw new Error('Session utilisateur manquante');
    }

    // Insérer un enregistrement de test
    const testData = {
      type_notification: 'test_realtime',
      user_id: session.session.user.id,
      data: { 
        test: true, 
        timestamp: new Date().toISOString(),
        source: 'client_test'
      },
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('notifications_realtime')
      .insert([testData])
      .select()
      .single();

    if (error) {
      throw error;
    }

    console.log('✅ [TestRealtime] Insertion réussie:', data);

    // Nettoyer l'enregistrement de test
    await supabase
      .from('notifications_realtime')
      .delete()
      .eq('id', data.id);

    console.log('🧹 [TestRealtime] Enregistrement de test nettoyé');

    return {
      success: true,
      message: 'Test d\'insertion réussi',
      data
    };

  } catch (error) {
    console.error('❌ [TestRealtime] Erreur insertion:', error);
    return {
      success: false,
      message: `Erreur insertion: ${error.message}`,
      error
    };
  }
};

// Fonction pour exécuter tous les tests
export const runAllRealtimeTests = async () => {
  console.log('🚀 [TestRealtime] Exécution de tous les tests...');
  
  const results = {
    connection: null,
    insert: null,
    summary: null
  };

  // Test de connexion
  results.connection = await testRealtimeConnection();
  
  // Test d'insertion
  results.insert = await testRealtimeInsert();
  
  // Résumé
  const allSuccess = results.connection.success && results.insert.success;
  results.summary = {
    success: allSuccess,
    message: allSuccess ? 'Tous les tests Realtime réussis' : 'Certains tests Realtime ont échoué',
    details: {
      connection: results.connection.message,
      insert: results.insert.message
    }
  };

  console.log('📊 [TestRealtime] Résultats complets:', results);
  return results;
};


