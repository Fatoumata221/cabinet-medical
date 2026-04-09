import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { runAllRealtimeTests } from '../utils/testRealtimeConnection';
import { runSimpleTests } from '../utils/simpleRealtimeTest';
import { runDebugRealtime } from '../utils/debugRealtime';
import { CheckCircle, XCircle, RefreshCw, AlertTriangle, TestTube, Zap, Bug } from 'lucide-react';

const RealtimeTest = () => {
  const [testStatus, setTestStatus] = useState('idle'); // 'idle', 'testing', 'success', 'error'
  const [testResults, setTestResults] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [detailedResults, setDetailedResults] = useState(null);
  const [simpleResults, setSimpleResults] = useState(null);
  const [debugResults, setDebugResults] = useState(null);

  const runRealtimeTest = async () => {
    setTestStatus('testing');
    setTestResults(null);
    setDetailedResults(null);
    
    console.log('🧪 [RealtimeTest] Début du test Realtime...');
    
    try {
      // Utiliser le test complet
      const results = await runAllRealtimeTests();
      setDetailedResults(results);
      
      if (results.summary.success) {
        setIsConnected(true);
        setTestStatus('success');
        setTestResults({
          session: 'OK',
          subscription: 'OK',
          insert: 'OK',
          status: 'SUCCESS',
          error: null
        });
        console.log('✅ [RealtimeTest] Tous les tests réussis');
      } else {
        setIsConnected(false);
        setTestStatus('error');
        setTestResults({
          session: results.connection?.success ? 'OK' : 'ERROR',
          subscription: results.connection?.success ? 'OK' : 'ERROR',
          insert: results.insert?.success ? 'OK' : 'ERROR',
          status: 'ERROR',
          error: results.summary.message
        });
        console.log('❌ [RealtimeTest] Tests échoués:', results.summary.message);
      }
      
    } catch (error) {
      console.error('❌ [RealtimeTest] Erreur:', error);
      setTestStatus('error');
      setTestResults({
        session: 'ERROR',
        subscription: 'ERROR',
        insert: 'ERROR',
        status: 'ERROR',
        error: error.message
      });
    }
  };

  const runSimpleTest = async () => {
    setTestStatus('testing');
    setTestResults(null);
    setDetailedResults(null);
    setSimpleResults(null);
    
    console.log('🧪 [RealtimeTest] Début du test simple...');
    
    try {
      const results = await runSimpleTests();
      setSimpleResults(results);
      
      if (results.summary.success) {
        setIsConnected(true);
        setTestStatus('success');
        setTestResults({
          session: 'OK',
          subscription: 'OK',
          insert: 'OK',
          status: 'SUCCESS',
          error: null
        });
        console.log('✅ [RealtimeTest] Tests simples réussis');
      } else {
        setIsConnected(false);
        setTestStatus('error');
        setTestResults({
          session: 'OK',
          subscription: 'ERROR',
          insert: 'N/A',
          status: 'ERROR',
          error: results.summary.message
        });
        console.log('❌ [RealtimeTest] Tests simples échoués:', results.summary.message);
      }
      
    } catch (error) {
      console.error('❌ [RealtimeTest] Erreur test simple:', error);
      setTestStatus('error');
      setTestResults({
        session: 'ERROR',
        subscription: 'ERROR',
        insert: 'ERROR',
        status: 'ERROR',
        error: error.message
      });
    }
  };

  const runDebugTest = async () => {
    setTestStatus('testing');
    setTestResults(null);
    setDetailedResults(null);
    setSimpleResults(null);
    setDebugResults(null);
    
    console.log('🔍 [RealtimeTest] Début du diagnostic...');
    
    try {
      const debug = await runDebugRealtime();
      setDebugResults(debug);
      
      if (debug.summary.realtimeOk) {
        setIsConnected(true);
        setTestStatus('success');
        setTestResults({
          session: debug.summary.hasSession ? 'OK' : 'ERROR',
          subscription: debug.summary.realtimeOk ? 'OK' : 'ERROR',
          insert: 'N/A',
          status: 'SUCCESS',
          error: null
        });
        console.log('✅ [RealtimeTest] Diagnostic réussi');
      } else {
        setIsConnected(false);
        setTestStatus('error');
        setTestResults({
          session: debug.summary.hasSession ? 'OK' : 'ERROR',
          subscription: 'ERROR',
          insert: 'N/A',
          status: 'ERROR',
          error: `Erreurs: ${debug.errors.join(', ')}`
        });
        console.log('❌ [RealtimeTest] Diagnostic échoué:', debug.errors);
      }
      
    } catch (error) {
      console.error('❌ [RealtimeTest] Erreur diagnostic:', error);
      setTestStatus('error');
      setTestResults({
        session: 'ERROR',
        subscription: 'ERROR',
        insert: 'ERROR',
        status: 'ERROR',
        error: error.message
      });
    }
  };

  const getStatusIcon = () => {
    switch (testStatus) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'testing':
        return <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusText = () => {
    switch (testStatus) {
      case 'success':
        return 'Test réussi';
      case 'error':
        return 'Test échoué';
      case 'testing':
        return 'Test en cours...';
      default:
        return 'Prêt à tester';
    }
  };

  const getStatusColor = () => {
    switch (testStatus) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'testing':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  return (
    <div className={`p-4 rounded-lg border ${getStatusColor()}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <span className="font-medium">Test Realtime Simple</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={runDebugTest}
            disabled={testStatus === 'testing'}
            className="btn btn-sm btn-warning flex items-center gap-2"
          >
            <Bug className={`w-4 h-4 ${testStatus === 'testing' ? 'animate-pulse' : ''}`} />
            Diagnostic
          </button>
          <button
            onClick={runSimpleTest}
            disabled={testStatus === 'testing'}
            className="btn btn-sm btn-primary flex items-center gap-2"
          >
            <Zap className={`w-4 h-4 ${testStatus === 'testing' ? 'animate-pulse' : ''}`} />
            Test Simple
          </button>
          <button
            onClick={runRealtimeTest}
            disabled={testStatus === 'testing'}
            className="btn btn-sm btn-outline flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${testStatus === 'testing' ? 'animate-spin' : ''}`} />
            Test Complet
          </button>
        </div>
      </div>
      
      {testResults && (
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <span className="font-medium">Session:</span>
            <span className={testResults.session === 'OK' ? 'text-green-600' : 'text-red-600'}>
              {testResults.session}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium">Abonnement:</span>
            <span className={testResults.subscription === 'OK' ? 'text-green-600' : 'text-red-600'}>
              {testResults.subscription}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium">Insertion:</span>
            <span className={testResults.insert === 'OK' ? 'text-green-600' : 'text-red-600'}>
              {testResults.insert}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium">Statut:</span>
            <span className="text-gray-600">{testResults.status}</span>
          </div>
          {testResults.error && (
            <div className="flex items-center gap-2">
              <span className="font-medium">Erreur:</span>
              <span className="text-red-600 text-xs">{testResults.error}</span>
            </div>
          )}
        </div>
      )}

      {detailedResults && (
        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2 text-blue-800 mb-2">
            <TestTube className="w-4 h-4" />
            <span className="font-medium text-sm">Détails des Tests Complets</span>
          </div>
          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-medium">Connexion:</span>
              <span className={detailedResults.connection?.success ? 'text-green-600' : 'text-red-600'}>
                {detailedResults.connection?.message}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">Insertion:</span>
              <span className={detailedResults.insert?.success ? 'text-green-600' : 'text-red-600'}>
                {detailedResults.insert?.message}
              </span>
            </div>
          </div>
        </div>
      )}

      {simpleResults && (
        <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center gap-2 text-yellow-800 mb-2">
            <Zap className="w-4 h-4" />
            <span className="font-medium text-sm">Détails des Tests Simples</span>
          </div>
          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-medium">Simple:</span>
              <span className={simpleResults.simple?.success ? 'text-green-600' : 'text-red-600'}>
                {simpleResults.simple?.message}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">Avec Config:</span>
              <span className={simpleResults.withConfig?.success ? 'text-green-600' : 'text-red-600'}>
                {simpleResults.withConfig?.message}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">Notifications:</span>
              <span className={simpleResults.notifications?.success ? 'text-green-600' : 'text-red-600'}>
                {simpleResults.notifications?.message}
              </span>
            </div>
          </div>
        </div>
      )}

      {debugResults && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 text-red-800 mb-2">
            <Bug className="w-4 h-4" />
            <span className="font-medium text-sm">Résultats du Diagnostic</span>
          </div>
          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-medium">Session:</span>
              <span className={debugResults.summary?.hasSession ? 'text-green-600' : 'text-red-600'}>
                {debugResults.summary?.hasSession ? '✅ OK' : '❌ Problème'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">Connexion:</span>
              <span className={debugResults.summary?.connectionOk ? 'text-green-600' : 'text-red-600'}>
                {debugResults.summary?.connectionOk ? '✅ OK' : '❌ Problème'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">Realtime:</span>
              <span className={debugResults.summary?.realtimeOk ? 'text-green-600' : 'text-red-600'}>
                {debugResults.summary?.realtimeOk ? '✅ OK' : '❌ Problème'}
              </span>
            </div>
            {debugResults.errors && debugResults.errors.length > 0 && (
              <div className="mt-2">
                <div className="font-medium text-red-600">Erreurs:</div>
                {debugResults.errors.map((error, index) => (
                  <div key={index} className="ml-4 text-red-600 text-xs">
                    • {error}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      
      <div className="mt-3 text-xs text-gray-600">
        <p>Ce test vérifie la connexion Realtime en s'abonnant à la table waiting_queue.</p>
        <p>Statut de connexion: <span className={isConnected ? 'text-green-600' : 'text-red-600'}>
          {isConnected ? 'Connecté' : 'Déconnecté'}
        </span></p>
      </div>
    </div>
  );
};

export default RealtimeTest;
