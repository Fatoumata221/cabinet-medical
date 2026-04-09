/**
 * Gestionnaire d'erreurs global pour l'application
 */

// Types d'erreurs
export const ERROR_TYPES = {
  NETWORK: 'NETWORK',
  AUTHENTICATION: 'AUTHENTICATION',
  AUTHORIZATION: 'AUTHORIZATION',
  VALIDATION: 'VALIDATION',
  DATABASE: 'DATABASE',
  UNKNOWN: 'UNKNOWN',
};

// Niveaux de gravité
export const ERROR_SEVERITY = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL',
};

/**
 * Classe pour la gestion des erreurs
 */
class ErrorHandler {
  constructor() {
    this.errorListeners = [];
    this.errorLog = [];
    this.maxLogSize = 100;
  }

  /**
   * Ajouter un listener d'erreur
   * @param {Function} listener - Fonction à appeler quand une erreur survient
   */
  addErrorListener(listener) {
    this.errorListeners.push(listener);
  }

  /**
   * Supprimer un listener d'erreur
   * @param {Function} listener - Fonction à supprimer
   */
  removeErrorListener(listener) {
    const index = this.errorListeners.indexOf(listener);
    if (index > -1) {
      this.errorListeners.splice(index, 1);
    }
  }

  /**
   * Analyser une erreur et déterminer son type et sa gravité
   * @param {Error} error - L'erreur à analyser
   * @returns {Object} - Informations sur l'erreur
   */
  analyzeError(error) {
    const errorInfo = {
      message: error.message || 'Erreur inconnue',
      stack: error.stack,
      timestamp: new Date().toISOString(),
      type: ERROR_TYPES.UNKNOWN,
      severity: ERROR_SEVERITY.MEDIUM,
      context: {},
    };

    // Analyser le type d'erreur
    if (error.message?.includes('network') || error.message?.includes('fetch')) {
      errorInfo.type = ERROR_TYPES.NETWORK;
      errorInfo.severity = ERROR_SEVERITY.HIGH;
    } else if (error.message?.includes('auth') || error.message?.includes('unauthorized')) {
      errorInfo.type = ERROR_TYPES.AUTHENTICATION;
      errorInfo.severity = ERROR_SEVERITY.HIGH;
    } else if (error.message?.includes('forbidden') || error.message?.includes('permission')) {
      errorInfo.type = ERROR_TYPES.AUTHORIZATION;
      errorInfo.severity = ERROR_SEVERITY.HIGH;
    } else if (error.message?.includes('validation') || error.message?.includes('invalid')) {
      errorInfo.type = ERROR_TYPES.VALIDATION;
      errorInfo.severity = ERROR_SEVERITY.LOW;
    } else if (error.message?.includes('database') || error.message?.includes('sql')) {
      errorInfo.type = ERROR_TYPES.DATABASE;
      errorInfo.severity = ERROR_SEVERITY.CRITICAL;
    }

    // Ajouter le contexte
    errorInfo.context = {
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: Date.now(),
    };

    return errorInfo;
  }

  /**
   * Gérer une erreur
   * @param {Error} error - L'erreur à gérer
   * @param {Object} context - Contexte supplémentaire
   */
  handleError(error, context = {}) {
    const errorInfo = this.analyzeError(error);
    errorInfo.context = { ...errorInfo.context, ...context };

    // Ajouter au log
    this.addToLog(errorInfo);

    // Notifier les listeners
    this.notifyListeners(errorInfo);

    // Actions spécifiques selon le type d'erreur
    this.handleSpecificError(errorInfo);

    // Log dans la console en développement
    if (process.env.NODE_ENV === 'development') {
      console.error('Erreur gérée:', errorInfo);
    }

    return errorInfo;
  }

  /**
   * Ajouter une erreur au log
   * @param {Object} errorInfo - Informations sur l'erreur
   */
  addToLog(errorInfo) {
    this.errorLog.push(errorInfo);

    // Limiter la taille du log
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog.shift();
    }

    // Sauvegarder dans localStorage
    try {
      localStorage.setItem('errorLog', JSON.stringify(this.errorLog));
    } catch (e) {
      console.warn('Impossible de sauvegarder le log d\'erreurs:', e);
    }
  }

  /**
   * Notifier tous les listeners
   * @param {Object} errorInfo - Informations sur l'erreur
   */
  notifyListeners(errorInfo) {
    this.errorListeners.forEach(listener => {
      try {
        listener(errorInfo);
      } catch (e) {
        console.error('Erreur dans un listener d\'erreur:', e);
      }
    });
  }

  /**
   * Actions spécifiques selon le type d'erreur
   * @param {Object} errorInfo - Informations sur l'erreur
   */
  handleSpecificError(errorInfo) {
    switch (errorInfo.type) {
      case ERROR_TYPES.NETWORK:
        this.handleNetworkError(errorInfo);
        break;
      case ERROR_TYPES.AUTHENTICATION:
        this.handleAuthError(errorInfo);
        break;
      case ERROR_TYPES.DATABASE:
        this.handleDatabaseError(errorInfo);
        break;
      default:
        this.handleGenericError(errorInfo);
    }
  }

  /**
   * Gérer les erreurs réseau
   * @param {Object} errorInfo - Informations sur l'erreur
   */
  handleNetworkError(errorInfo) {
    // Afficher une notification à l'utilisateur
    if (window.notificationManager) {
      window.notificationManager.add({
        message: 'Problème de connexion. Vérifiez votre connexion internet.',
        type: 'error',
        duration: 10000,
      });
    }
  }

  /**
   * Gérer les erreurs d'authentification
   * @param {Object} errorInfo - Informations sur l'erreur
   */
  handleAuthError(errorInfo) {
    // Rediriger vers la page de connexion
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
  }

  /**
   * Gérer les erreurs de base de données
   * @param {Object} errorInfo - Informations sur l'erreur
   */
  handleDatabaseError(errorInfo) {
    // Afficher une notification critique
    if (window.notificationManager) {
      window.notificationManager.add({
        message: 'Erreur de base de données. Contactez l\'administrateur.',
        type: 'error',
        duration: 15000,
      });
    }
  }

  /**
   * Gérer les erreurs génériques
   * @param {Object} errorInfo - Informations sur l'erreur
   */
  handleGenericError(errorInfo) {
    // Afficher une notification générique
    if (window.notificationManager) {
      window.notificationManager.add({
        message: 'Une erreur est survenue. Veuillez réessayer.',
        type: 'error',
        duration: 5000,
      });
    }
  }

  /**
   * Récupérer le log d'erreurs
   * @returns {Array} - Liste des erreurs
   */
  getErrorLog() {
    return [...this.errorLog];
  }

  /**
   * Vider le log d'erreurs
   */
  clearErrorLog() {
    this.errorLog = [];
    try {
      localStorage.removeItem('errorLog');
    } catch (e) {
      console.warn('Impossible de supprimer le log d\'erreurs:', e);
    }
  }

  /**
   * Récupérer les statistiques d'erreurs
   * @returns {Object} - Statistiques
   */
  getErrorStats() {
    const stats = {
      total: this.errorLog.length,
      byType: {},
      bySeverity: {},
      recent: this.errorLog.filter(e => 
        Date.now() - new Date(e.timestamp).getTime() < 24 * 60 * 60 * 1000
      ).length,
    };

    this.errorLog.forEach(error => {
      stats.byType[error.type] = (stats.byType[error.type] || 0) + 1;
      stats.bySeverity[error.severity] = (stats.bySeverity[error.severity] || 0) + 1;
    });

    return stats;
  }
}

// Instance globale
export const errorHandler = new ErrorHandler();

// Gestionnaire d'erreurs global pour les promesses non gérées
window.addEventListener('unhandledrejection', (event) => {
  errorHandler.handleError(new Error(event.reason), {
    source: 'unhandledrejection',
    promise: event.promise,
  });
});

// Gestionnaire d'erreurs global pour les erreurs JavaScript
window.addEventListener('error', (event) => {
  errorHandler.handleError(event.error || new Error(event.message), {
    source: 'window.error',
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
  });
});

export default errorHandler;

