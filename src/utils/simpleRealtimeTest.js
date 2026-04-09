// Test simple pour identifier le problème Realtime côté client
import { supabase } from '../lib/supabase';

export const simpleRealtimeTest = async () => {
  console.log('🧪 [SimpleRealtimeTest] Début du test simple...');
  
  return new Promise((resolve) => {
    let resolved = false;
    
    // Test 1: Vérifier la session
    const { data: session } = supabase.auth.getSession();
    console.log('📊 [SimpleRealtimeTest] Session:', session);
    
    if (!session?.session) {
      resolve({
        success: false,
        message: 'Aucune session utilisateur',
        step: 'session'
      });
      return;
    }
    
    // Test 2: Créer un canal simple
    const channel = supabase.channel('simple_test');
    
    // Test 3: S'abonner aux changements
    channel.on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'waiting_queue'
    }, (payload) => {
      console.log('✅ [SimpleRealtimeTest] Changement reçu:', payload);
    });
    
    // Test 4: S'abonner au canal
    channel.subscribe((status, err) => {
      console.log('📊 [SimpleRealtimeTest] Statut:', status, err);
      
      if (resolved) return;
      resolved = true;
      
      if (status === 'SUBSCRIBED') {
        console.log('✅ [SimpleRealtimeTest] Abonnement réussi');
        
        // Nettoyer après 2 secondes
        setTimeout(() => {
          supabase.removeChannel(channel);
          console.log('🧹 [SimpleRealtimeTest] Canal nettoyé');
        }, 2000);
        
        resolve({
          success: true,
          message: 'Abonnement Realtime réussi',
          step: 'subscription',
          status
        });
        
      } else if (status === 'CLOSED') {
        console.log('❌ [SimpleRealtimeTest] Abonnement fermé');
        supabase.removeChannel(channel);
        
        resolve({
          success: false,
          message: 'Abonnement fermé immédiatement',
          step: 'subscription',
          status,
          error: err
        });
        
      } else if (status === 'CHANNEL_ERROR') {
        console.log('❌ [SimpleRealtimeTest] Erreur canal:', err);
        supabase.removeChannel(channel);
        
        resolve({
          success: false,
          message: 'Erreur canal Realtime',
          step: 'subscription',
          status,
          error: err
        });
        
      } else {
        console.log('ℹ️ [SimpleRealtimeTest] Statut inattendu:', status);
        
        // Attendre un peu pour voir si ça change
        setTimeout(() => {
          if (!resolved) {
            resolved = true;
            supabase.removeChannel(channel);
            resolve({
              success: false,
              message: `Statut inattendu: ${status}`,
              step: 'subscription',
              status,
              error: err
            });
          }
        }, 3000);
      }
    });
    
    // Timeout de sécurité
    setTimeout(() => {
      if (!resolved) {
        resolved = true;
        supabase.removeChannel(channel);
        resolve({
          success: false,
          message: 'Timeout - abonnement trop long',
          step: 'timeout'
        });
      }
    }, 10000);
  });
};

// Test avec configuration différente
export const testRealtimeWithConfig = async () => {
  console.log('🧪 [TestRealtimeWithConfig] Test avec configuration...');
  
  return new Promise((resolve) => {
    let resolved = false;
    
    // Canal avec configuration explicite
    const channel = supabase.channel('config_test', {
      config: {
        broadcast: { self: false },
        presence: { key: 'test' }
      }
    });
    
    channel.on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'waiting_queue'
    }, (payload) => {
      console.log('✅ [TestRealtimeWithConfig] Changement reçu:', payload);
    });
    
    channel.subscribe((status, err) => {
      console.log('📊 [TestRealtimeWithConfig] Statut:', status, err);
      
      if (resolved) return;
      resolved = true;
      
      // Nettoyer
      setTimeout(() => {
        supabase.removeChannel(channel);
      }, 2000);
      
      resolve({
        success: status === 'SUBSCRIBED',
        message: status === 'SUBSCRIBED' ? 'Abonnement réussi avec config' : `Échec: ${status}`,
        status,
        error: err
      });
    });
    
    // Timeout
    setTimeout(() => {
      if (!resolved) {
        resolved = true;
        supabase.removeChannel(channel);
        resolve({
          success: false,
          message: 'Timeout avec configuration'
        });
      }
    }, 8000);
  });
};

// Test de la table notifications_realtime
export const testNotificationsRealtime = async () => {
  console.log('🧪 [TestNotificationsRealtime] Test table notifications...');
  
  return new Promise((resolve) => {
    let resolved = false;
    
    const channel = supabase.channel('notifications_test');
    
    channel.on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'notifications_realtime'
    }, (payload) => {
      console.log('✅ [TestNotificationsRealtime] Changement reçu:', payload);
    });
    
    channel.subscribe((status, err) => {
      console.log('📊 [TestNotificationsRealtime] Statut:', status, err);
      
      if (resolved) return;
      resolved = true;
      
      setTimeout(() => {
        supabase.removeChannel(channel);
      }, 2000);
      
      resolve({
        success: status === 'SUBSCRIBED',
        message: status === 'SUBSCRIBED' ? 'Abonnement notifications réussi' : `Échec notifications: ${status}`,
        status,
        error: err
      });
    });
    
    setTimeout(() => {
      if (!resolved) {
        resolved = true;
        supabase.removeChannel(channel);
        resolve({
          success: false,
          message: 'Timeout notifications'
        });
      }
    }, 8000);
  });
};

// Exécuter tous les tests simples
export const runSimpleTests = async () => {
  console.log('🚀 [RunSimpleTests] Exécution de tous les tests simples...');
  
  const results = {
    simple: null,
    withConfig: null,
    notifications: null,
    summary: null
  };
  
  // Test 1: Simple
  results.simple = await simpleRealtimeTest();
  console.log('📊 [RunSimpleTests] Test simple:', results.simple);
  
  // Test 2: Avec configuration
  results.withConfig = await testRealtimeWithConfig();
  console.log('📊 [RunSimpleTests] Test avec config:', results.withConfig);
  
  // Test 3: Notifications
  results.notifications = await testNotificationsRealtime();
  console.log('📊 [RunSimpleTests] Test notifications:', results.notifications);
  
  // Résumé
  const allSuccess = results.simple.success && results.withConfig.success && results.notifications.success;
  results.summary = {
    success: allSuccess,
    message: allSuccess ? 'Tous les tests simples réussis' : 'Certains tests simples ont échoué',
    details: {
      simple: results.simple.message,
      withConfig: results.withConfig.message,
      notifications: results.notifications.message
    }
  };
  
  console.log('📊 [RunSimpleTests] Résultats complets:', results);
  return results;
};


