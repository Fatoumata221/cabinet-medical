import { useState, useEffect, useCallback } from 'react';
import completeRealtimeService from '../services/completeRealtimeService';

export const useRealtimeService = () => {
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [isConnected, setIsConnected] = useState(false);
  const [activeChannels, setActiveChannels] = useState([]);

  // Initialiser le service
  const initialize = useCallback(async () => {
    try {
      const initialized = await completeRealtimeService.initialize();
      if (initialized) {
        const status = completeRealtimeService.getConnectionStatus();
        setConnectionStatus(status.connectionStatus);
        setIsConnected(status.isConnected);
        setActiveChannels(status.channelNames);
      }
      return initialized;
    } catch (error) {
      console.error('❌ [useRealtimeService] Erreur initialisation:', error);
      setConnectionStatus('error');
      setIsConnected(false);
      return false;
    }
  }, []);

  // S'abonner à un service spécifique
  const subscribe = useCallback((serviceType, callback) => {
    switch (serviceType) {
      case 'waitingQueue':
        return completeRealtimeService.subscribeToWaitingQueue(callback);
      case 'appointments':
        return completeRealtimeService.subscribeToAppointments(callback);
      case 'patients':
        return completeRealtimeService.subscribeToPatients(callback);
      case 'doctors':
        return completeRealtimeService.subscribeToDoctors(callback);
      case 'notifications':
        return completeRealtimeService.subscribeToNotifications(callback);
      case 'billing':
        return completeRealtimeService.subscribeToBilling(callback);
      default:
        console.warn(`⚠️ [useRealtimeService] Type de service inconnu: ${serviceType}`);
        return null;
    }
  }, []);

  // S'abonner à plusieurs services
  const subscribeToAll = useCallback((callbacks) => {
    completeRealtimeService.subscribeToAll(callbacks);
    
    // Mettre à jour le statut
    const status = completeRealtimeService.getConnectionStatus();
    setConnectionStatus(status.connectionStatus);
    setIsConnected(status.isConnected);
    setActiveChannels(status.channelNames);
  }, []);

  // Nettoyer les abonnements
  const cleanup = useCallback(() => {
    completeRealtimeService.cleanup();
    setConnectionStatus('disconnected');
    setIsConnected(false);
    setActiveChannels([]);
  }, []);

  // Forcer la reconnexion
  const forceReconnect = useCallback(async () => {
    try {
      await completeRealtimeService.forceReconnect();
      const status = completeRealtimeService.getConnectionStatus();
      setConnectionStatus(status.connectionStatus);
      setIsConnected(status.isConnected);
      setActiveChannels(status.channelNames);
    } catch (error) {
      console.error('❌ [useRealtimeService] Erreur reconnexion:', error);
      setConnectionStatus('error');
      setIsConnected(false);
    }
  }, []);

  // Tester la connexion
  const testConnection = useCallback(async () => {
    try {
      const result = await completeRealtimeService.testConnection();
      if (result) {
        const status = completeRealtimeService.getConnectionStatus();
        setConnectionStatus(status.connectionStatus);
        setIsConnected(status.isConnected);
      }
      return result;
    } catch (error) {
      console.error('❌ [useRealtimeService] Erreur test connexion:', error);
      setConnectionStatus('error');
      setIsConnected(false);
      return false;
    }
  }, []);

  // Obtenir le statut actuel
  const getStatus = useCallback(() => {
    return completeRealtimeService.getConnectionStatus();
  }, []);

  // Nettoyer au démontage
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    // État
    connectionStatus,
    isConnected,
    activeChannels,
    
    // Méthodes
    initialize,
    subscribe,
    subscribeToAll,
    cleanup,
    forceReconnect,
    testConnection,
    getStatus
  };
};

export default useRealtimeService;




