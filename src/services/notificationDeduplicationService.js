/**
 * Service de déduplication des notifications
 * Évite les notifications en double côté client et serveur
 */

class NotificationDeduplicationService {
  constructor() {
    // Cache des notifications récentes (TTL: 5 minutes)
    this.notificationCache = new Map();
    this.cacheTTL = 5 * 60 * 1000; // 5 minutes en millisecondes
    
    // Cache des requêtes en cours pour éviter les appels multiples
    this.pendingRequests = new Map();
    
    // Dernière fois qu'on a fetch les notifications
    this.lastFetchTime = 0;
    this.minFetchInterval = 2000; // 2 secondes minimum entre les fetch
    
    // Nettoyage automatique du cache toutes les minutes
    this.startCacheCleanup();
  }

  /**
   * Génère une clé unique pour une notification
   */
  generateNotificationKey(notification) {
    const {
      type_notification,
      medecin_id,
      secretaire_id,
      patient_id,
      waiting_queue_id,
      message
    } = notification;
    
    return `${type_notification}_${medecin_id}_${secretaire_id}_${patient_id}_${waiting_queue_id}_${message}`.replace(/null/g, '');
  }

  /**
   * Vérifie si une notification est un doublon
   */
  isDuplicate(notification) {
    const key = this.generateNotificationKey(notification);
    const cached = this.notificationCache.get(key);
    
    if (!cached) return false;
    
    // Vérifier si le cache n'a pas expiré
    const now = Date.now();
    if (now - cached.timestamp > this.cacheTTL) {
      this.notificationCache.delete(key);
      return false;
    }
    
    return true;
  }

  /**
   * Ajoute une notification au cache
   */
  addToCache(notification) {
    const key = this.generateNotificationKey(notification);
    this.notificationCache.set(key, {
      notification,
      timestamp: Date.now()
    });
  }

  /**
   * Filtre les notifications pour enlever les doublons
   */
  deduplicateNotifications(notifications) {
    if (!Array.isArray(notifications)) return [];
    
    const uniqueNotifications = [];
    const seenKeys = new Set();
    
    // Trier par date décroissante pour garder les plus récentes
    const sortedNotifications = [...notifications].sort((a, b) => 
      new Date(b.created_at) - new Date(a.created_at)
    );
    
    for (const notification of sortedNotifications) {
      const key = this.generateNotificationKey(notification);
      
      if (!seenKeys.has(key)) {
        seenKeys.add(key);
        uniqueNotifications.push(notification);
        this.addToCache(notification);
      }
    }
    
    console.log(`🔍 [Deduplication] ${notifications.length} → ${uniqueNotifications.length} notifications (${notifications.length - uniqueNotifications.length} doublons supprimés)`);
    
    return uniqueNotifications;
  }

  /**
   * Vérifie si on peut faire un nouveau fetch (throttling)
   */
  canFetch() {
    const now = Date.now();
    if (now - this.lastFetchTime < this.minFetchInterval) {
      console.log(`⏳ [Deduplication] Fetch trop récent, attendre ${this.minFetchInterval - (now - this.lastFetchTime)}ms`);
      return false;
    }
    return true;
  }

  /**
   * Marque qu'un fetch a été effectué
   */
  markFetchDone() {
    this.lastFetchTime = Date.now();
  }

  /**
   * Wrapper pour éviter les requêtes multiples simultanées
   */
  async debouncedFetch(fetchFunction, key = 'default') {
    // Si une requête est déjà en cours pour cette clé, l'attendre
    if (this.pendingRequests.has(key)) {
      console.log(`⏳ [Deduplication] Requête en cours pour ${key}, attente...`);
      return await this.pendingRequests.get(key);
    }

    // Vérifier le throttling
    if (!this.canFetch()) {
      return null;
    }

    // Créer et stocker la promesse
    const promise = fetchFunction();
    this.pendingRequests.set(key, promise);

    try {
      const result = await promise;
      this.markFetchDone();
      return result;
    } catch (error) {
      console.error(`❌ [Deduplication] Erreur fetch ${key}:`, error);
      throw error;
    } finally {
      // Nettoyer la requête en cours
      this.pendingRequests.delete(key);
    }
  }

  /**
   * Nettoyage automatique du cache
   */
  startCacheCleanup() {
    setInterval(() => {
      const now = Date.now();
      let cleanedCount = 0;
      
      for (const [key, cached] of this.notificationCache.entries()) {
        if (now - cached.timestamp > this.cacheTTL) {
          this.notificationCache.delete(key);
          cleanedCount++;
        }
      }
      
      if (cleanedCount > 0) {
        console.log(`🧹 [Deduplication] Cache nettoyé: ${cleanedCount} entrées expirées supprimées`);
      }
    }, 60000); // Nettoyage toutes les minutes
  }

  /**
   * Statistiques du cache
   */
  getCacheStats() {
    return {
      cacheSize: this.notificationCache.size,
      pendingRequests: this.pendingRequests.size,
      lastFetchTime: this.lastFetchTime,
      cacheTTL: this.cacheTTL
    };
  }

  /**
   * Vider le cache manuellement
   */
  clearCache() {
    this.notificationCache.clear();
    this.pendingRequests.clear();
    console.log('🗑️ [Deduplication] Cache vidé manuellement');
  }

  /**
   * Détecte les notifications potentiellement spam
   */
  isSpamNotification(notification) {
    const message = notification.message?.toLowerCase() || '';
    const type = notification.type_notification?.toLowerCase() || '';
    
    // Patterns de spam courants
    const spamPatterns = [
      /patient.*patient/i, // "Patient Patient Nom"
      /undefined|null/i,   // Messages avec undefined/null
      /^\s*$/,             // Messages vides
      /(.+)\1{2,}/i        // Répétitions (ex: "PatientPatientPatient")
    ];
    
    return spamPatterns.some(pattern => 
      pattern.test(message) || pattern.test(type)
    );
  }

  /**
   * Filtre les notifications spam
   */
  filterSpamNotifications(notifications) {
    return notifications.filter(notification => {
      if (this.isSpamNotification(notification)) {
        console.warn('🚫 [Deduplication] Notification spam détectée:', notification);
        return false;
      }
      return true;
    });
  }

  /**
   * Traitement complet des notifications
   */
  processNotifications(notifications) {
    if (!Array.isArray(notifications)) return [];
    
    // 1. Filtrer le spam
    const cleanNotifications = this.filterSpamNotifications(notifications);
    
    // 2. Dédupliquer
    const uniqueNotifications = this.deduplicateNotifications(cleanNotifications);
    
    console.log(`📊 [Deduplication] Traitement: ${notifications.length} → ${cleanNotifications.length} (spam) → ${uniqueNotifications.length} (final)`);
    
    return uniqueNotifications;
  }
}

// Instance singleton
export const notificationDeduplicationService = new NotificationDeduplicationService();

// Fonction utilitaire pour wrapper les fetch de notifications
export const createDebouncedNotificationFetcher = (fetchFunction, componentName = 'Unknown') => {
  return async () => {
    const key = `fetch_notifications_${componentName}`;
    return await notificationDeduplicationService.debouncedFetch(fetchFunction, key);
  };
};

// Hook personnalisé pour les notifications dédupliquées
export const useDeduplicatedNotifications = (originalFetchFunction, componentName) => {
  const debouncedFetch = createDebouncedNotificationFetcher(originalFetchFunction, componentName);
  
  return {
    fetchNotifications: debouncedFetch,
    processNotifications: (notifications) => 
      notificationDeduplicationService.processNotifications(notifications),
    getCacheStats: () => notificationDeduplicationService.getCacheStats(),
    clearCache: () => notificationDeduplicationService.clearCache()
  };
};

export default notificationDeduplicationService;
