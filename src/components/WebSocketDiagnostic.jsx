import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import completeRealtimeService from '../services/completeRealtimeService';
import { runAllTests } from '../utils/testSupabaseConnection';
import { Wifi, WifiOff, AlertTriangle, CheckCircle, RefreshCw, TestTube } from 'lucide-react';

const WebSocketDiagnostic = ({ onStatusChange }) => {
  const [diagnostics, setDiagnostics] = useState({
    supabaseConnection: 'checking',
    realtimeEnabled: 'checking',
    tableExists: 'checking',
    rlsEnabled: 'checking',
    policiesExist: 'checking',
    completeRealtimeService: 'checking',
    waitingQueueTable: 'checking'
  });
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState(null);

  const runDiagnostics = async () => {
    setIsRunning(true);
    console.log('🔍 [WebSocketDiagnostic] Début des diagnostics...');

    try {
      // 1. Vérifier la connexion Supabase
      console.log('🔌 [WebSocketDiagnostic] Test de connexion Supabase...');
      const { data: session, error: sessionError } = await supabase.auth.getSession();
      console.log('📊 [WebSocketDiagnostic] Session:', session, 'Error:', sessionError);
      setDiagnostics(prev => ({ ...prev, supabaseConnection: session?.session ? 'ok' : 'error' }));

      // 2. Vérifier si la table notifications_realtime existe
      console.log('📋 [WebSocketDiagnostic] Vérification de la table notifications_realtime...');
      const { data: tableData, error: tableError } = await supabase
        .from('notifications_realtime')
        .select('id')
        .limit(1);
      
      console.log('📊 [WebSocketDiagnostic] Table test:', tableData, 'Error:', tableError);
      setDiagnostics(prev => ({ 
        ...prev, 
        tableExists: tableError ? 'error' : 'ok' 
      }));

      // 3. Tester un abonnement Realtime
      console.log('📡 [WebSocketDiagnostic] Test d\'abonnement Realtime...');
      const testChannel = supabase.channel('diagnostic_test', {
        config: {
          broadcast: { self: false },
          presence: { key: 'diagnostic' }
        }
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'waiting_queue' // Utiliser une table qui existe et contient des données
      }, (payload) => {
        console.log('✅ [WebSocketDiagnostic] Test Realtime réussi:', payload);
      })
      .subscribe((status, err) => {
        console.log('📊 [WebSocketDiagnostic] Statut test Realtime:', status, err);
        
        if (status === 'SUBSCRIBED') {
          setDiagnostics(prev => ({ 
            ...prev, 
            realtimeEnabled: 'ok' 
          }));
          console.log('✅ [WebSocketDiagnostic] Abonnement Realtime réussi');
        } else if (status === 'CLOSED') {
          setDiagnostics(prev => ({ 
            ...prev, 
            realtimeEnabled: 'error' 
          }));
          console.log('❌ [WebSocketDiagnostic] Abonnement Realtime fermé');
        } else if (status === 'CHANNEL_ERROR') {
          setDiagnostics(prev => ({ 
            ...prev, 
            realtimeEnabled: 'error' 
          }));
          console.log('❌ [WebSocketDiagnostic] Erreur canal Realtime:', err);
        }
        
        // Nettoyer le canal de test après 5 secondes
        setTimeout(() => {
          supabase.removeChannel(testChannel);
          console.log('🧹 [WebSocketDiagnostic] Canal de test nettoyé');
        }, 5000);
      });

      // 4. Vérifier les politiques RLS (test simple)
      console.log('🔒 [WebSocketDiagnostic] Vérification des politiques RLS...');
      try {
        // Test simple : essayer d'insérer et supprimer un enregistrement de test
        const testData = {
          type_notification: 'test',
          user_id: session?.session?.user?.id || 'test',
          data: { test: true },
          created_at: new Date().toISOString()
        };
        
        const { data: insertData, error: insertError } = await supabase
          .from('notifications_realtime')
          .insert([testData])
          .select()
          .single();
        
        if (insertError) {
          console.log('📊 [WebSocketDiagnostic] RLS - Insertion échouée:', insertError);
          setDiagnostics(prev => ({ 
            ...prev, 
            rlsEnabled: 'error',
            policiesExist: 'error'
          }));
        } else {
          console.log('📊 [WebSocketDiagnostic] RLS - Insertion réussie:', insertData);
          
          // Nettoyer l'enregistrement de test
          if (insertData?.id) {
            await supabase
              .from('notifications_realtime')
              .delete()
              .eq('id', insertData.id);
          }
          
          setDiagnostics(prev => ({ 
            ...prev, 
            rlsEnabled: 'ok',
            policiesExist: 'ok'
          }));
        }
      } catch (error) {
        console.warn('⚠️ [WebSocketDiagnostic] Impossible de vérifier les politiques RLS:', error);
        setDiagnostics(prev => ({ 
          ...prev, 
          rlsEnabled: 'warning',
          policiesExist: 'warning'
        }));
      }

      // 5. Test de la table waiting_queue
      console.log('📋 [WebSocketDiagnostic] Test de la table waiting_queue...');
      const { data: waitingQueueData, error: waitingQueueError } = await supabase
        .from('waiting_queue')
        .select('id')
        .limit(1);
      
      console.log('📊 [WebSocketDiagnostic] Waiting queue test:', waitingQueueData, 'Error:', waitingQueueError);
      setDiagnostics(prev => ({ 
        ...prev, 
        waitingQueueTable: waitingQueueError ? 'error' : 'ok' 
      }));

      // 6. Test du service completeRealtimeService
      console.log('🔧 [WebSocketDiagnostic] Test du service completeRealtimeService...');
      try {
        const connectionStatus = completeRealtimeService.getConnectionStatus();
        console.log('📊 [WebSocketDiagnostic] Service status:', connectionStatus);
        
        const testResult = await completeRealtimeService.testConnection();
        console.log('📊 [WebSocketDiagnostic] Test connexion service:', testResult);
        
        setDiagnostics(prev => ({ 
          ...prev, 
          completeRealtimeService: testResult ? 'ok' : 'error' 
        }));
      } catch (error) {
        console.error('❌ [WebSocketDiagnostic] Erreur test service:', error);
        setDiagnostics(prev => ({ 
          ...prev, 
          completeRealtimeService: 'error' 
        }));
      }

    } catch (error) {
      console.error('❌ [WebSocketDiagnostic] Erreur lors des diagnostics:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const runFullTests = async () => {
    console.log('🧪 [WebSocketDiagnostic] Exécution des tests complets...');
    try {
      const results = await runAllTests();
      setTestResults(results);
    } catch (error) {
      console.error('❌ [WebSocketDiagnostic] Erreur tests complets:', error);
    }
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  useEffect(() => {
    // Notifier le composant parent du statut global
    const allOk = Object.values(diagnostics).every(status => status === 'ok');
    const hasError = Object.values(diagnostics).some(status => status === 'error');
    
    if (onStatusChange) {
      onStatusChange({
        allOk,
        hasError,
        diagnostics
      });
    }
  }, [diagnostics, onStatusChange]);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'ok':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      default:
        return <RefreshCw className="w-4 h-4 text-gray-400 animate-spin" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'ok':
        return 'OK';
      case 'error':
        return 'Erreur';
      case 'warning':
        return 'Attention';
      default:
        return 'Vérification...';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ok':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'error':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Wifi className="w-5 h-5" />
          Diagnostic WebSocket
        </h3>
        <div className="flex gap-2">
          <button
            onClick={runDiagnostics}
            disabled={isRunning}
            className="btn btn-sm btn-outline flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isRunning ? 'animate-spin' : ''}`} />
            {isRunning ? 'Vérification...' : 'Vérifier'}
          </button>
          <button
            onClick={runFullTests}
            className="btn btn-sm btn-primary flex items-center gap-2"
          >
            <TestTube className="w-4 h-4" />
            Tests Complets
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <div className={`flex items-center justify-between p-3 rounded-lg border ${getStatusColor(diagnostics.supabaseConnection)}`}>
          <div className="flex items-center gap-3">
            {getStatusIcon(diagnostics.supabaseConnection)}
            <span className="font-medium">Connexion Supabase</span>
          </div>
          <span className="text-sm font-medium">{getStatusText(diagnostics.supabaseConnection)}</span>
        </div>

        <div className={`flex items-center justify-between p-3 rounded-lg border ${getStatusColor(diagnostics.tableExists)}`}>
          <div className="flex items-center gap-3">
            {getStatusIcon(diagnostics.tableExists)}
            <span className="font-medium">Table notifications_realtime</span>
          </div>
          <span className="text-sm font-medium">{getStatusText(diagnostics.tableExists)}</span>
        </div>

        <div className={`flex items-center justify-between p-3 rounded-lg border ${getStatusColor(diagnostics.realtimeEnabled)}`}>
          <div className="flex items-center gap-3">
            {getStatusIcon(diagnostics.realtimeEnabled)}
            <span className="font-medium">Realtime activé</span>
          </div>
          <span className="text-sm font-medium">{getStatusText(diagnostics.realtimeEnabled)}</span>
        </div>

        <div className={`flex items-center justify-between p-3 rounded-lg border ${getStatusColor(diagnostics.rlsEnabled)}`}>
          <div className="flex items-center gap-3">
            {getStatusIcon(diagnostics.rlsEnabled)}
            <span className="font-medium">RLS activé</span>
          </div>
          <span className="text-sm font-medium">{getStatusText(diagnostics.rlsEnabled)}</span>
        </div>

        <div className={`flex items-center justify-between p-3 rounded-lg border ${getStatusColor(diagnostics.policiesExist)}`}>
          <div className="flex items-center gap-3">
            {getStatusIcon(diagnostics.policiesExist)}
            <span className="font-medium">Politiques RLS</span>
          </div>
          <span className="text-sm font-medium">{getStatusText(diagnostics.policiesExist)}</span>
        </div>

        <div className={`flex items-center justify-between p-3 rounded-lg border ${getStatusColor(diagnostics.waitingQueueTable)}`}>
          <div className="flex items-center gap-3">
            {getStatusIcon(diagnostics.waitingQueueTable)}
            <span className="font-medium">Table waiting_queue</span>
          </div>
          <span className="text-sm font-medium">{getStatusText(diagnostics.waitingQueueTable)}</span>
        </div>

        <div className={`flex items-center justify-between p-3 rounded-lg border ${getStatusColor(diagnostics.completeRealtimeService)}`}>
          <div className="flex items-center gap-3">
            {getStatusIcon(diagnostics.completeRealtimeService)}
            <span className="font-medium">Service Realtime Complet</span>
          </div>
          <span className="text-sm font-medium">{getStatusText(diagnostics.completeRealtimeService)}</span>
        </div>
      </div>

      {Object.values(diagnostics).some(status => status === 'error') && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 text-red-800">
            <AlertTriangle className="w-4 h-4" />
            <span className="font-medium">Problèmes détectés</span>
          </div>
          <p className="text-red-700 text-sm mt-1">
            Des erreurs ont été détectées dans la configuration WebSocket. 
            Vérifiez la console pour plus de détails.
          </p>
        </div>
      )}

      {testResults && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2 text-blue-800 mb-3">
            <TestTube className="w-4 h-4" />
            <span className="font-medium">Résultats des Tests Complets</span>
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="font-medium">Session:</span>
              <span className={testResults.session?.error ? 'text-red-600' : 'text-green-600'}>
                {testResults.session?.error ? '❌ Erreur' : '✅ OK'}
              </span>
            </div>
            
            <div className="font-medium">Tables:</div>
            {Object.entries(testResults.tables).map(([tableName, result]) => (
              <div key={tableName} className="ml-4 flex items-center gap-2">
                <span className="text-gray-600">{tableName}:</span>
                <span className={result.success ? 'text-green-600' : 'text-red-600'}>
                  {result.success ? '✅ OK' : '❌ Erreur'}
                </span>
              </div>
            ))}
            
            <div className="flex items-center gap-2">
              <span className="font-medium">Realtime:</span>
              <span className={testResults.realtime?.error ? 'text-red-600' : 'text-green-600'}>
                {testResults.realtime?.error ? '❌ Erreur' : '✅ OK'}
              </span>
            </div>
            
            {testResults.errors.length > 0 && (
              <div className="mt-3">
                <div className="font-medium text-red-600">Erreurs:</div>
                {testResults.errors.map((error, index) => (
                  <div key={index} className="ml-4 text-red-600 text-xs">
                    • {error}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default WebSocketDiagnostic;
