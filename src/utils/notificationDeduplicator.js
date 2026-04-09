// Utilitaire pour empêcher les doublons de notifications côté frontend
// Prévient l'affichage multiple de la même notification

class NotificationDeduplicator {
  constructor() {
    this.displayedNotifications = new Map();
    this.cleanupInterval = 5 * 60 * 1000; // 5 minutes
    
    // Nettoyage automatique toutes les 5 minutes
    setInterval(() => this.cleanup(), this.cleanupInterval);
  }

  /**
   * Génère une clé unique pour une notification
   */
  generateKey(notification) {
    const key = `${notification.medecin_id || 'null'}_${notification.secretaire_id || 'null'}_${notification.type_notification || notification.type || 'default'}_${notification.patient_id || 'null'}_${notification.message || ''}`;
    return key;
  }

  /**
   * Vérifie si une notification a déjà été affichée récemment
   */
  isDuplicate(notification, windowMinutes = 5) {
    const key = this.generateKey(notification);
    const now = Date.now();
    const windowMs = windowMinutes * 60 * 1000;

    if (this.displayedNotifications.has(key)) {
      const lastShown = this.displayedNotifications.get(key);
      if (now - lastShown < windowMs) {
        console.log('🚫 Notification dupliquée bloquée:', key);
        return true;
      }
    }

    // Marquer comme affichée
    this.displayedNotifications.set(key, now);
    console.log('✅ Notification autorisée:', key);
    return false;
  }

  /**
   * Filtre une liste de notifications pour supprimer les doublons
   */
  filterDuplicates(notifications, windowMinutes = 5) {
    if (!Array.isArray(notifications)) return notifications;

    return notifications.filter(notification => {
      return !this.isDuplicate(notification, windowMinutes);
    });
  }

  /**
   * Nettoie les anciennes entrées du cache
   */
  cleanup() {
    const now = Date.now();
    const maxAge = 10 * 60 * 1000; // 10 minutes
    let cleaned = 0;

    for (const [key, timestamp] of this.displayedNotifications.entries()) {
      if (now - timestamp > maxAge) {
        this.displayedNotifications.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`🧹 Nettoyage cache notifications: ${cleaned} entrées supprimées`);
    }
  }

  /**
   * Vide complètement le cache (pour tests ou reset)
   */
  clear() {
    this.displayedNotifications.clear();
    console.log('🗑️ Cache notifications vidé');
  }

  /**
   * Statistiques du cache
   */
  getStats() {
    return {
      totalCached: this.displayedNotifications.size,
      oldestEntry: Math.min(...this.displayedNotifications.values()),
      newestEntry: Math.max(...this.displayedNotifications.values())
    };
  }
}

// Instance globale
const notificationDeduplicator = new NotificationDeduplicator();

// Fonctions utilitaires
export const preventDuplicateNotification = (notification, windowMinutes = 5) => {
  return !notificationDeduplicator.isDuplicate(notification, windowMinutes);
};

export const filterDuplicateNotifications = (notifications, windowMinutes = 5) => {
  return notificationDeduplicator.filterDuplicates(notifications, windowMinutes);
};

export const clearNotificationCache = () => {
  notificationDeduplicator.clear();
};

export const getNotificationStats = () => {
  return notificationDeduplicator.getStats();
};

// Hook React pour les notifications dédupliquées
export const useNotificationDeduplication = () => {
  const [processedNotifications, setProcessedNotifications] = React.useState([]);

  const processNotifications = React.useCallback((newNotifications) => {
    if (!Array.isArray(newNotifications)) return;

    const filtered = filterDuplicateNotifications(newNotifications);
    setProcessedNotifications(filtered);
  }, []);

  return {
    processedNotifications,
    processNotifications,
    clearCache: clearNotificationCache,
    stats: getNotificationStats()
  };
};

export default notificationDeduplicator;
