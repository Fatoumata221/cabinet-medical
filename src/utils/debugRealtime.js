// Script de debug pour diagnostiquer les problèmes Realtime
import { supabase } from '../lib/supabase';

export const debugRealtime = async () => {
  console.log('🔍 [DebugRealtime] Début du diagnostic Realtime...');
  
  const debug = {
    timestamp: new Date().toISOString(),
    session: null,
    supabaseConfig: null,
    realtimeTest: null,
    errors: []
  };

  try {
    // 1. Vérifier la configuration Supabase
    console.log('🔧 [DebugRealtime] Vérification configuration Supabase...');
    debug.supabaseConfig = {
      url: supabase.supabaseUrl,
      anonKey: supabase.supabaseKey ? 'Présent' : 'Manquant',
      realtimeUrl: supabase.realtimeUrl || 'Non configuré'
    };
    console.log('📊 [DebugRealtime] Config Supabase:', debug.supabaseConfig);

    // 2. Vérifier la session
    console.log('🔐 [DebugRealtime] Vérification session...');
    const { data: session, error: sessionError } = await supabase.auth.getSession();
    debug.session = {
      hasSession: !!session?.session,
      userId: session?.session?.user?.id || null,
      email: session?.session?.user?.email || null,
      error: sessionError?.message || null
    };
    console.log('📊 [DebugRealtime] Session:', debug.session);

    if (!session?.session) {
      debug.errors.push('Aucune session utilisateur active');
      return debug;
    }

    // 3. Test de connexion basique
    console.log('🌐 [DebugRealtime] Test connexion basique...');
    try {
      const { data, error } = await supabase
        .from('waiting_queue')
        .select('count')
        .limit(1);
      
      if (error) {
        debug.errors.push(`Erreur connexion basique: ${error.message}`);
      } else {
        console.log('✅ [DebugRealtime] Connexion basique OK');
      }
    } catch (err) {
      debug.errors.push(`Exception connexion basique: ${err.message}`);
    }

    // 4. Test Realtime détaillé
    console.log('📡 [DebugRealtime] Test Realtime détaillé...');
    debug.realtimeTest = await new Promise((resolve) => {
      const channel = supabase.channel('debug_test');
      
      let subscriptionResult = null;
      let changeReceived = false;
      
      // Écouter les changements
      channel.on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'waiting_queue'
      }, (payload) => {
        console.log('✅ [DebugRealtime] Changement reçu:', payload);
        changeReceived = true;
      });
      
      // S'abonner
      channel.subscribe((status, err) => {
        console.log('📊 [DebugRealtime] Statut abonnement:', status, err);
        subscriptionResult = { status, error: err };
        
        // Nettoyer après 3 secondes
        setTimeout(() => {
          supabase.removeChannel(channel);
          
          resolve({
            status,
            error: err?.message || null,
            changeReceived,
            timestamp: new Date().toISOString()
          });
        }, 3000);
      });
      
      // Timeout de sécurité
      setTimeout(() => {
        if (!subscriptionResult) {
          supabase.removeChannel(channel);
          resolve({
            status: 'TIMEOUT',
            error: 'Timeout après 5 secondes',
            changeReceived: false,
            timestamp: new Date().toISOString()
          });
        }
      }, 5000);
    });

    console.log('📊 [DebugRealtime] Test Realtime:', debug.realtimeTest);

    // 5. Vérifier les canaux actifs
    console.log('📋 [DebugRealtime] Vérification canaux actifs...');
    const activeChannels = supabase.getChannels();
    debug.activeChannels = activeChannels.map(channel => ({
      topic: channel.topic,
      state: channel.state,
      joinRef: channel.joinRef
    }));
    console.log('📊 [DebugRealtime] Canaux actifs:', debug.activeChannels);

  } catch (error) {
    console.error('❌ [DebugRealtime] Erreur générale:', error);
    debug.errors.push(`Erreur générale: ${error.message}`);
  }

  // 6. Résumé
  debug.summary = {
    hasSession: debug.session?.hasSession || false,
    connectionOk: debug.errors.length === 0,
    realtimeOk: debug.realtimeTest?.status === 'SUBSCRIBED',
    totalErrors: debug.errors.length,
    timestamp: new Date().toISOString()
  };

  console.log('📊 [DebugRealtime] Résumé:', debug.summary);
  console.log('🔍 [DebugRealtime] Diagnostic complet:', debug);
  
  return debug;
};

// Fonction pour afficher le diagnostic dans la console
export const displayDebugResults = (debug) => {
  console.log('\n🔍 === DIAGNOSTIC REALTIME ===');
  console.log(`⏰ Timestamp: ${debug.timestamp}`);
  
  console.log('\n🔧 Configuration Supabase:');
  console.log(`   URL: ${debug.supabaseConfig?.url || 'Non configuré'}`);
  console.log(`   Clé anonyme: ${debug.supabaseConfig?.anonKey || 'Manquant'}`);
  console.log(`   URL Realtime: ${debug.supabaseConfig?.realtimeUrl || 'Non configuré'}`);
  
  console.log('\n🔐 Session utilisateur:');
  console.log(`   Session active: ${debug.session?.hasSession ? '✅ Oui' : '❌ Non'}`);
  if (debug.session?.hasSession) {
    console.log(`   ID utilisateur: ${debug.session.userId || 'Non disponible'}`);
    console.log(`   Email: ${debug.session.email || 'Non disponible'}`);
  }
  if (debug.session?.error) {
    console.log(`   Erreur session: ${debug.session.error}`);
  }
  
  console.log('\n📡 Test Realtime:');
  if (debug.realtimeTest) {
    console.log(`   Statut: ${debug.realtimeTest.status}`);
    console.log(`   Changement reçu: ${debug.realtimeTest.changeReceived ? '✅ Oui' : '❌ Non'}`);
    if (debug.realtimeTest.error) {
      console.log(`   Erreur: ${debug.realtimeTest.error}`);
    }
  } else {
    console.log('   Test non effectué');
  }
  
  console.log('\n📋 Canaux actifs:');
  if (debug.activeChannels && debug.activeChannels.length > 0) {
    debug.activeChannels.forEach((channel, index) => {
      console.log(`   ${index + 1}. ${channel.topic} (${channel.state})`);
    });
  } else {
    console.log('   Aucun canal actif');
  }
  
  if (debug.errors.length > 0) {
    console.log('\n❌ Erreurs détectées:');
    debug.errors.forEach((error, index) => {
      console.log(`   ${index + 1}. ${error}`);
    });
  }
  
  console.log('\n📊 Résumé:');
  console.log(`   Session: ${debug.summary.hasSession ? '✅ OK' : '❌ Problème'}`);
  console.log(`   Connexion: ${debug.summary.connectionOk ? '✅ OK' : '❌ Problème'}`);
  console.log(`   Realtime: ${debug.summary.realtimeOk ? '✅ OK' : '❌ Problème'}`);
  console.log(`   Erreurs totales: ${debug.summary.totalErrors}`);
  
  console.log('\n=== FIN DU DIAGNOSTIC ===\n');
};

// Exécuter le diagnostic complet
export const runDebugRealtime = async () => {
  const debug = await debugRealtime();
  displayDebugResults(debug);
  return debug;
};


