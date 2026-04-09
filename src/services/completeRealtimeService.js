import { supabase } from '../lib/supabase';

class CompleteRealtimeService {
  constructor() {
    this.channels = new Map();
    this.subscribers = new Map();
    this.isConnected = false;
    this.connectionAttempts = 0;
    this.maxRetries = 3;
    this.reconnectTimeouts = new Map();
    this.heartbeatInterval = null;
    this.connectionStatus = 'disconnected'; // 'disconnected', 'connecting', 'connected', 'error'
  }

  // ==================== INITIALISATION ====================
  
  async initialize() {
    console.log('🚀 [CompleteRealtime] Initialisation du service complet...');
    
    try {
      // Vérifier la session utilisateur
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.error('❌ [CompleteRealtime] Erreur session:', error);
        this.connectionStatus = 'error';
        return false;
      }

      if (!data.session) {
        console.warn('⚠️ [CompleteRealtime] Aucune session active');
        this.connectionStatus = 'disconnected';
        return false;
      }

      console.log('✅ [CompleteRealtime] Session active détectée');
      this.connectionStatus = 'connecting';
      
      // Démarrer le heartbeat
      this.startHeartbeat();
      
      return true;
    } catch (error) {
      console.error('❌ [CompleteRealtime] Erreur initialisation:', error);
      this.connectionStatus = 'error';
      return false;
    }
  }

  // ==================== GESTION DES CONNEXIONS ====================

  startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      this.checkConnectionHealth();
    }, 30000); // Vérification toutes les 30 secondes
  }

  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  async checkConnectionHealth() {
    try {
      const { data, error } = await supabase
        .from('waiting_queue')
        .select('count')
        .limit(1);
        
      if (error) {
        console.warn('⚠️ [CompleteRealtime] Heartbeat échoué:', error);
        this.connectionStatus = 'error';
        this.handleConnectionError('heartbeat');
      } else {
        this.connectionStatus = 'connected';
        this.connectionAttempts = 0;
      }
    } catch (error) {
      console.warn('⚠️ [CompleteRealtime] Erreur heartbeat:', error);
      this.connectionStatus = 'error';
    }
  }

  // ==================== ABONNEMENTS FILE D'ATTENTE ====================

  subscribeToWaitingQueue(callback) {
    const channelName = 'waiting_queue_realtime';
    this.unsubscribeFromChannel(channelName);

    console.log('🔔 [CompleteRealtime] Abonnement file d\'attente...');

    const channel = supabase.channel(channelName, {
      config: {
        broadcast: { self: false },
        presence: { key: 'waiting_queue' }
      }
    })
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'waiting_queue'
    }, (payload) => {
      console.log('🔄 [CompleteRealtime] File d\'attente:', payload.eventType, payload.new || payload.old);
      this.notifySubscribers('waiting_queue', {
        type: payload.eventType,
        data: payload.new || payload.old,
        oldData: payload.old,
        newData: payload.new,
        timestamp: new Date().toISOString()
      });
    })
    .subscribe((status, err) => {
      console.log('📊 [CompleteRealtime] Statut abonnement waiting_queue:', status, err);
      this.handleSubscriptionStatus('waiting_queue', status, err);
    });

    this.channels.set(channelName, channel);
    this.subscribers.set('waiting_queue', callback);
    
    return channel;
  }

  // ==================== ABONNEMENTS RENDEZ-VOUS ====================

  subscribeToAppointments(callback) {
    const channelName = 'appointments_realtime';
    this.unsubscribeFromChannel(channelName);

    console.log('🔔 [CompleteRealtime] Abonnement rendez-vous...');

    const channel = supabase.channel(channelName, {
      config: {
        broadcast: { self: false },
        presence: { key: 'appointments' }
      }
    })
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'appointments'
    }, (payload) => {
      console.log('🔄 [CompleteRealtime] Rendez-vous:', payload.eventType, payload.new || payload.old);
      this.notifySubscribers('appointments', {
        type: payload.eventType,
        data: payload.new || payload.old,
        oldData: payload.old,
        newData: payload.new,
        timestamp: new Date().toISOString()
      });
    })
    .subscribe((status, err) => {
      console.log('📊 [CompleteRealtime] Statut abonnement appointments:', status, err);
      this.handleSubscriptionStatus('appointments', status, err);
    });

    this.channels.set(channelName, channel);
    this.subscribers.set('appointments', callback);
    
    return channel;
  }

  // ==================== ABONNEMENTS PATIENTS ====================

  subscribeToPatients(callback) {
    const channelName = 'patients_realtime';
    this.unsubscribeFromChannel(channelName);

    console.log('🔔 [CompleteRealtime] Abonnement patients...');

    const channel = supabase.channel(channelName, {
      config: {
        broadcast: { self: false },
        presence: { key: 'patients' }
      }
    })
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'patients'
    }, (payload) => {
      console.log('🔄 [CompleteRealtime] Patient:', payload.eventType, payload.new || payload.old);
      this.notifySubscribers('patients', {
        type: payload.eventType,
        data: payload.new || payload.old,
        oldData: payload.old,
        newData: payload.new,
        timestamp: new Date().toISOString()
      });
    })
    .subscribe((status) => {
      this.handleSubscriptionStatus('patients', status);
    });

    this.channels.set(channelName, channel);
    this.subscribers.set('patients', callback);
    
    return channel;
  }

  // ==================== ABONNEMENTS MÉDECINS ====================

  subscribeToDoctors(callback) {
    const channelName = 'doctors_realtime';
    this.unsubscribeFromChannel(channelName);

    console.log('🔔 [CompleteRealtime] Abonnement médecins...');

    const channel = supabase.channel(channelName, {
      config: {
        broadcast: { self: false },
        presence: { key: 'doctors' }
      }
    })
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'users',
      filter: 'role=eq.doctor'
    }, (payload) => {
      console.log('🔄 [CompleteRealtime] Médecin:', payload.eventType, payload.new || payload.old);
      this.notifySubscribers('doctors', {
        type: payload.eventType,
        data: payload.new || payload.old,
        oldData: payload.old,
        newData: payload.new,
        timestamp: new Date().toISOString()
      });
    })
    .subscribe((status) => {
      this.handleSubscriptionStatus('doctors', status);
    });

    this.channels.set(channelName, channel);
    this.subscribers.set('doctors', callback);
    
    return channel;
  }

  // ==================== ABONNEMENTS NOTIFICATIONS ====================

  subscribeToNotifications(callback) {
    const channelName = 'notifications_realtime';
    this.unsubscribeFromChannel(channelName);

    console.log('🔔 [CompleteRealtime] Abonnement notifications...');

    const channel = supabase.channel(channelName, {
      config: {
        broadcast: { self: false },
        presence: { key: 'notifications' }
      }
    })
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'notifications_realtime'
    }, (payload) => {
      console.log('🔄 [CompleteRealtime] Notification:', payload.eventType, payload.new || payload.old);
      this.notifySubscribers('notifications', {
        type: payload.eventType,
        data: payload.new || payload.old,
        oldData: payload.old,
        newData: payload.new,
        timestamp: new Date().toISOString()
      });
    })
    .subscribe((status) => {
      this.handleSubscriptionStatus('notifications', status);
    });

    this.channels.set(channelName, channel);
    this.subscribers.set('notifications', callback);
    
    return channel;
  }

  // ==================== ABONNEMENTS FACTURATION ====================

  subscribeToBilling(callback) {
    const channelName = 'billing_realtime';
    this.unsubscribeFromChannel(channelName);

    console.log('🔔 [CompleteRealtime] Abonnement facturation...');

    const channel = supabase.channel(channelName, {
      config: {
        broadcast: { self: false },
        presence: { key: 'billing' }
      }
    })
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'billing'
    }, (payload) => {
      console.log('🔄 [CompleteRealtime] Facturation:', payload.eventType, payload.new || payload.old);
      this.notifySubscribers('billing', {
        type: payload.eventType,
        data: payload.new || payload.old,
        oldData: payload.old,
        newData: payload.new,
        timestamp: new Date().toISOString()
      });
    })
    .subscribe((status) => {
      this.handleSubscriptionStatus('billing', status);
    });

    this.channels.set(channelName, channel);
    this.subscribers.set('billing', callback);
    
    return channel;
  }

  // ==================== GESTION DES STATUTS ====================

  handleSubscriptionStatus(subscriptionType, status, err) {
    console.log(`📡 [CompleteRealtime] ${subscriptionType}:`, status, err ? `Error: ${err}` : '');

    switch (status) {
      case 'SUBSCRIBED':
        console.log(`✅ [CompleteRealtime] ${subscriptionType} connecté`);
        this.isConnected = true;
        this.connectionStatus = 'connected';
        this.connectionAttempts = 0;
        break;
        
      case 'CHANNEL_ERROR':
        console.error(`❌ [CompleteRealtime] Erreur ${subscriptionType}:`, status, err);
        this.isConnected = false;
        this.connectionStatus = 'error';
        this.handleConnectionError(subscriptionType);
        break;
        
      case 'TIMED_OUT':
        console.warn(`⏰ [CompleteRealtime] Timeout ${subscriptionType}:`, status, err);
        this.isConnected = false;
        this.connectionStatus = 'error';
        this.handleConnectionError(subscriptionType);
        break;
        
      case 'CLOSED':
        console.log(`🔒 [CompleteRealtime] ${subscriptionType} fermé`, err ? `- Raison: ${err}` : '');
        // Ne pas marquer comme déconnecté si c'est une fermeture normale
        // Seulement si c'est une fermeture inattendue
        if (err) {
          this.isConnected = false;
          this.connectionStatus = 'error';
          this.handleConnectionError(subscriptionType);
        } else {
          // Fermeture normale, ne pas traiter comme une erreur
          console.log(`ℹ️ [CompleteRealtime] ${subscriptionType} fermé normalement`);
        }
        break;
        
      default:
        console.log(`ℹ️ [CompleteRealtime] ${subscriptionType}:`, status, err ? `Error: ${err}` : '');
    }
  }

  // ==================== GESTION DES ERREURS ====================

  handleConnectionError(subscriptionType) {
    if (this.connectionAttempts < this.maxRetries) {
      this.connectionAttempts++;
      const delay = Math.min(1000 * Math.pow(2, this.connectionAttempts), 10000);
      
      console.log(`🔄 [CompleteRealtime] Reconnexion ${subscriptionType} dans ${delay}ms (${this.connectionAttempts}/${this.maxRetries})`);
      
      const timeoutId = setTimeout(() => {
        this.reconnect(subscriptionType);
        this.reconnectTimeouts.delete(subscriptionType);
      }, delay);
      
      this.reconnectTimeouts.set(subscriptionType, timeoutId);
    } else {
      console.error(`❌ [CompleteRealtime] Échec définitif ${subscriptionType} après ${this.maxRetries} tentatives`);
      this.connectionStatus = 'error';
    }
  }

  reconnect(subscriptionType) {
    const callback = this.subscribers.get(subscriptionType);
    if (callback) {
      switch (subscriptionType) {
        case 'waiting_queue':
          this.subscribeToWaitingQueue(callback);
          break;
        case 'appointments':
          this.subscribeToAppointments(callback);
          break;
        case 'patients':
          this.subscribeToPatients(callback);
          break;
        case 'doctors':
          this.subscribeToDoctors(callback);
          break;
        case 'notifications':
          this.subscribeToNotifications(callback);
          break;
        case 'billing':
          this.subscribeToBilling(callback);
          break;
        default:
          console.warn(`⚠️ [CompleteRealtime] Type de reconnexion inconnu: ${subscriptionType}`);
      }
    }
  }

  // ==================== NOTIFICATIONS ====================

  notifySubscribers(subscriptionType, data) {
    const callback = this.subscribers.get(subscriptionType);
    if (callback && typeof callback === 'function') {
      try {
        callback(data);
      } catch (error) {
        console.error(`❌ [CompleteRealtime] Erreur callback ${subscriptionType}:`, error);
      }
    }
  }

  // ==================== GESTION DES CANAUX ====================

  unsubscribeFromChannel(channelName) {
    const channel = this.channels.get(channelName);
    if (channel) {
      supabase.removeChannel(channel);
      this.channels.delete(channelName);
      console.log(`🧹 [CompleteRealtime] Canal ${channelName} supprimé`);
    }
  }

  // ==================== MÉTHODES PUBLIQUES ====================

  // S'abonner à tous les services
  subscribeToAll(callbacks) {
    console.log('🚀 [CompleteRealtime] Abonnement à tous les services...');
    
    if (callbacks.waitingQueue) {
      this.subscribeToWaitingQueue(callbacks.waitingQueue);
    }
    
    if (callbacks.appointments) {
      this.subscribeToAppointments(callbacks.appointments);
    }
    
    if (callbacks.patients) {
      this.subscribeToPatients(callbacks.patients);
    }
    
    if (callbacks.doctors) {
      this.subscribeToDoctors(callbacks.doctors);
    }
    
    if (callbacks.notifications) {
      this.subscribeToNotifications(callbacks.notifications);
    }
    
    if (callbacks.billing) {
      this.subscribeToBilling(callbacks.billing);
    }
  }

  // Nettoyer tous les abonnements
  cleanup() {
    console.log('🧹 [CompleteRealtime] Nettoyage complet...');
    
    // Nettoyer les timeouts de reconnexion
    this.reconnectTimeouts.forEach((timeoutId) => {
      clearTimeout(timeoutId);
    });
    this.reconnectTimeouts.clear();
    
    // Nettoyer les canaux
    this.channels.forEach((channel, channelName) => {
      supabase.removeChannel(channel);
      console.log(`🧹 [CompleteRealtime] Canal ${channelName} supprimé`);
    });
    
    // Nettoyer les abonnés
    this.channels.clear();
    this.subscribers.clear();
    
    // Arrêter le heartbeat
    this.stopHeartbeat();
    
    // Réinitialiser l'état
    this.isConnected = false;
    this.connectionAttempts = 0;
    this.connectionStatus = 'disconnected';
  }

  // Obtenir le statut de connexion
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      connectionStatus: this.connectionStatus,
      connectionAttempts: this.connectionAttempts,
      activeChannels: this.channels.size,
      activeSubscribers: this.subscribers.size,
      channelNames: Array.from(this.channels.keys())
    };
  }

  // Tester la connexion
  async testConnection() {
    try {
      const { data, error } = await supabase
        .from('waiting_queue')
        .select('count')
        .limit(1);
        
      if (error) {
        console.error('❌ [CompleteRealtime] Test connexion échoué:', error);
        return false;
      }
      
      console.log('✅ [CompleteRealtime] Test connexion réussi');
      return true;
    } catch (error) {
      console.error('❌ [CompleteRealtime] Erreur test connexion:', error);
      return false;
    }
  }

  // Forcer la reconnexion
  async forceReconnect() {
    console.log('🔄 [CompleteRealtime] Reconnexion forcée...');
    this.cleanup();
    await this.initialize();
  }
}

// Export d'une instance singleton
export default new CompleteRealtimeService();

