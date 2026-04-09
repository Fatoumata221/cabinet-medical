import React from 'react';
import { unifiedNotificationService } from '../services/unifiedNotificationService.jsx';

/**
 * Composant de test pour vérifier le système de notifications unifié
 * À supprimer après validation du bon fonctionnement
 */
const TestNotifications = () => {
  
  const testNotifications = () => {
    console.log('🧪 Test du système de notifications unifié...');
    
    // Test des notifications de base avec délai pour éviter le spam
    setTimeout(() => {
      unifiedNotificationService.success('✅ Test notification de succès');
    }, 500);
    
    setTimeout(() => {
      unifiedNotificationService.info('ℹ️ Test notification d\'information');
    }, 1000);
    
    setTimeout(() => {
      unifiedNotificationService.warning('⚠️ Test notification d\'avertissement');
    }, 1500);
    
    setTimeout(() => {
      unifiedNotificationService.error('❌ Test notification d\'erreur');
    }, 2000);
    
    // Test notification médicale
    setTimeout(() => {
      unifiedNotificationService.medical(
        'Patient Arrivé', 
        'M. Amadou Diallo est arrivé en salle d\'attente', 
        'patient_arrived'
      );
    }, 2500);
    
    // Test notification urgente (ne se ferme pas automatiquement)
    setTimeout(() => {
      unifiedNotificationService.urgent('Patient en état critique - Intervention immédiate requise');
    }, 3000);

    // Test notifications médicales avec son
    setTimeout(() => {
      unifiedNotificationService.medicalWorkflow('patient_en_route', 'Amadou Diallo', 'Aminata Diallo');
    }, 3500);

    setTimeout(() => {
      unifiedNotificationService.medicalWorkflow('souhaite_recevoir', 'Aissatou Sarr', 'Moussa Ndiaye');
    }, 4000);

    setTimeout(() => {
      unifiedNotificationService.medicalWorkflow('consultation_terminee', 'Ousmane Ba', 'Fatou Seck');
    }, 4500);
  };

  const testLoadingNotification = () => {
    const loadingToast = unifiedNotificationService.loading('Chargement en cours...');
    
    // Simuler une opération qui prend du temps
    setTimeout(() => {
      unifiedNotificationService.dismiss(loadingToast);
      unifiedNotificationService.success('Opération terminée avec succès !');
    }, 3000);
  };

  const clearAllNotifications = () => {
    unifiedNotificationService.dismissAll();
  };

  const testBasicNotification = () => {
    console.log('🔧 [TestNotifications] Test notification de base...');
    try {
      const result = unifiedNotificationService.success('Test notification de base - ça marche !');
      console.log('✅ [TestNotifications] Notification de base résultat:', result);
    } catch (error) {
      console.error('❌ [TestNotifications] Erreur notification de base:', error);
    }
  };

  const testMedicalWorkflowOnly = () => {
    console.log('🧪 [TestNotifications] Début test des notifications médicales avec son...');
    
    // Test immédiat pour vérifier si la fonction existe
    if (typeof unifiedNotificationService.medicalWorkflow === 'function') {
      console.log('✅ [TestNotifications] Fonction medicalWorkflow trouvée');
    } else {
      console.error('❌ [TestNotifications] Fonction medicalWorkflow non trouvée!');
      return;
    }
    
    // Test patient en route
    console.log('🚶‍♂️ [TestNotifications] Test 1: Patient en route...');
    setTimeout(() => {
      try {
        const result = unifiedNotificationService.medicalWorkflow('patient_en_route', 'Amadou Diallo', 'Aminata Diallo');
        console.log('✅ [TestNotifications] Test 1 résultat:', result);
      } catch (error) {
        console.error('❌ [TestNotifications] Test 1 erreur:', error);
      }
    }, 500);
    
    // Test médecin va recevoir
    console.log('👨‍⚕️ [TestNotifications] Test 2: Médecin va recevoir...');
    setTimeout(() => {
      try {
        const result = unifiedNotificationService.medicalWorkflow('souhaite_recevoir', 'Aissatou Sarr', 'Moussa Ndiaye');
        console.log('✅ [TestNotifications] Test 2 résultat:', result);
      } catch (error) {
        console.error('❌ [TestNotifications] Test 2 erreur:', error);
      }
    }, 1500);
    
    // Test consultation terminée
    console.log('✅ [TestNotifications] Test 3: Consultation terminée...');
    setTimeout(() => {
      try {
        const result = unifiedNotificationService.medicalWorkflow('consultation_terminee', 'Ousmane Ba', 'Fatou Seck');
        console.log('✅ [TestNotifications] Test 3 résultat:', result);
      } catch (error) {
        console.error('❌ [TestNotifications] Test 3 erreur:', error);
      }
    }, 2500);
    
    console.log('🏁 [TestNotifications] Tous les tests programmés');
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md max-w-md mx-auto mt-8">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        🧪 Test du Système de Notifications Unifié
      </h3>
      
      <div className="space-y-3">
        <button
          onClick={testNotifications}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Tester toutes les notifications
        </button>
        
        <button
          onClick={testLoadingNotification}
          className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
        >
          Tester notification de chargement
        </button>
        
        <button
          onClick={testBasicNotification}
          className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
        >
          🔧 Test notification de base
        </button>
        
        <button
          onClick={testMedicalWorkflowOnly}
          className="w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
        >
          🔊 Tester notifications médicales avec son
        </button>
        
        <button
          onClick={clearAllNotifications}
          className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
        >
          Effacer toutes les notifications
        </button>
      </div>
      
      <div className="mt-4 p-3 bg-gray-50 rounded-md">
        <p className="text-sm text-gray-600">
          <strong>Vérifications :</strong>
        </p>
        <ul className="text-xs text-gray-500 mt-1 space-y-1">
          <li>✅ Un seul style de toast s'affiche</li>
          <li>✅ Maximum 5 toasts simultanés</li>
          <li>✅ Styles cohérents avec bordures colorées</li>
          <li>✅ Notifications urgentes ne se ferment pas</li>
          <li>✅ Icônes et animations fluides</li>
        </ul>
      </div>
    </div>
  );
};

export default TestNotifications;
