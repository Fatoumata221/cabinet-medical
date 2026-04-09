import { supabase } from '../lib/supabase';

class WaitingQueueRealtimeService {
  constructor() {
    this.channels = new Map();
    this.subscribers = new Map();
    this.isConnected = false;
    this.connectionAttempts = 0;
    this.maxRetries = 3;
  }

  // Initialiser le service realtime
  async initialize() {
    console.log('🔔 [RealtimeService] Initialisation du service WebSocket...');
    
    try {
      // Vérifier la connexion Supabase
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.error('❌ [RealtimeService] Erreur session:', error);
        return false;
      }

      if (!data.session) {
        console.warn('⚠️ [RealtimeService] Aucune session active');
        return false;
      }

      console.log('✅ [RealtimeService] Session active détectée');
      return true;
    } catch (error) {
      console.error('❌ [RealtimeService] Erreur initialisation:', error);
      return false;
    }
  }

  // S'abonner aux changements de la file d'attente
  subscribeToWaitingQueue(callback) {
    const channelName = 'waiting_queue_realtime';
    
    // Nettoyer l'ancien canal s'il existe
    this.unsubscribeFromWaitingQueue();

    console.log('🔔 [RealtimeService] Abonnement file d\'attente...');

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
      console.log('🔄 [RealtimeService] Changement file d\'attente:', payload.eventType, payload.new || payload.old);
      
      // Notifier tous les abonnés
      this.notifySubscribers('waiting_queue', {
        type: payload.eventType,
        data: payload.new || payload.old,
        oldData: payload.old,
        newData: payload.new
      });
    })
    .subscribe((status) => {
      this.handleSubscriptionStatus('waiting_queue', status);
    });

    this.channels.set(channelName, channel);
    this.subscribers.set('waiting_queue', callback);
    
    return channel;
  }

  // S'abonner aux changements des rendez-vous
  subscribeToAppointments(callback) {
    const channelName = 'appointments_realtime';
    
    // Nettoyer l'ancien canal s'il existe
    this.unsubscribeFromAppointments();

    console.log('🔔 [RealtimeService] Abonnement rendez-vous...');

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
      console.log('🔄 [RealtimeService] Changement rendez-vous:', payload.eventType, payload.new || payload.old);
      
      // Notifier tous les abonnés
      this.notifySubscribers('appointments', {
        type: payload.eventType,
        data: payload.new || payload.old,
        oldData: payload.old,
        newData: payload.new
      });
    })
    .subscribe((status) => {
      this.handleSubscriptionStatus('appointments', status);
    });

    this.channels.set(channelName, channel);
    this.subscribers.set('appointments', callback);
    
    return channel;
  }

  // Gérer le statut des abonnements
  handleSubscriptionStatus(subscriptionType, status) {
    console.log(`📡 [RealtimeService] Statut ${subscriptionType}:`, status);

    switch (status) {
      case 'SUBSCRIBED':
        console.log(`✅ [RealtimeService] ${subscriptionType} connecté`);
        this.isConnected = true;
        this.connectionAttempts = 0;
        break;
        
      case 'CHANNEL_ERROR':
        console.error(`❌ [RealtimeService] Erreur ${subscriptionType}:`, status);
        this.isConnected = false;
        this.handleConnectionError(subscriptionType);
        break;
        
      case 'TIMED_OUT':
        console.warn(`⏰ [RealtimeService] Timeout ${subscriptionType}:`, status);
        this.isConnected = false;
        this.handleConnectionError(subscriptionType);
        break;
        
      case 'CLOSED':
        console.log(`🔒 [RealtimeService] ${subscriptionType} fermé`);
        this.isConnected = false;
        break;
        
      default:
        console.log(`ℹ️ [RealtimeService] Statut ${subscriptionType}:`, status);
    }
  }

  // Gérer les erreurs de connexion avec retry intelligent
  handleConnectionError(subscriptionType) {
    if (this.connectionAttempts < this.maxRetries) {
      this.connectionAttempts++;
      const delay = Math.min(1000 * Math.pow(2, this.connectionAttempts), 10000); // Backoff exponentiel
      
      console.log(`🔄 [RealtimeService] Reconnexion ${subscriptionType} dans ${delay}ms (tentative ${this.connectionAttempts}/${this.maxRetries})`);
      
      setTimeout(() => {
        this.reconnect(subscriptionType);
      }, delay);
    } else {
      console.error(`❌ [RealtimeService] Échec définitif ${subscriptionType} après ${this.maxRetries} tentatives`);
    }
  }

  // Reconnecter un abonnement spécifique
  reconnect(subscriptionType) {
    const callback = this.subscribers.get(subscriptionType);
    if (callback) {
      if (subscriptionType === 'waiting_queue') {
        this.subscribeToWaitingQueue(callback);
      } else if (subscriptionType === 'appointments') {
        this.subscribeToAppointments(callback);
      }
    }
  }

  // Notifier les abonnés
  notifySubscribers(subscriptionType, data) {
    const callback = this.subscribers.get(subscriptionType);
    if (callback && typeof callback === 'function') {
      try {
        callback(data);
      } catch (error) {
        console.error(`❌ [RealtimeService] Erreur callback ${subscriptionType}:`, error);
      }
    }
  }

  // Se désabonner de la file d'attente
  unsubscribeFromWaitingQueue() {
    const channelName = 'waiting_queue_realtime';
    const channel = this.channels.get(channelName);
    
    if (channel) {
      supabase.removeChannel(channel);
      this.channels.delete(channelName);
      this.subscribers.delete('waiting_queue');
      console.log('🧹 [RealtimeService] Désabonnement file d\'attente');
    }
  }

  // Se désabonner des rendez-vous
  unsubscribeFromAppointments() {
    const channelName = 'appointments_realtime';
    const channel = this.channels.get(channelName);
    
    if (channel) {
      supabase.removeChannel(channel);
      this.channels.delete(channelName);
      this.subscribers.delete('appointments');
      console.log('🧹 [RealtimeService] Désabonnement rendez-vous');
    }
  }

  // Nettoyer tous les abonnements
  cleanup() {
    console.log('🧹 [RealtimeService] Nettoyage complet...');
    
    this.channels.forEach((channel, channelName) => {
      supabase.removeChannel(channel);
      console.log(`🧹 [RealtimeService] Canal ${channelName} supprimé`);
    });
    
    this.channels.clear();
    this.subscribers.clear();
    this.isConnected = false;
    this.connectionAttempts = 0;
  }

  // Obtenir le statut de connexion
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      connectionAttempts: this.connectionAttempts,
      activeChannels: this.channels.size,
      activeSubscribers: this.subscribers.size
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
        console.error('❌ [RealtimeService] Test connexion échoué:', error);
        return false;
      }
      
      console.log('✅ [RealtimeService] Test connexion réussi');
      return true;
    } catch (error) {
      console.error('❌ [RealtimeService] Erreur test connexion:', error);
      return false;
    }
  }
}

// Export d'une instance singleton
export default new WaitingQueueRealtimeService();




