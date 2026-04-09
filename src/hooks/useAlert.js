import { useState } from 'react';

/**
 * Hook personnalisé pour gérer les alertes modales
 * @returns {object} - Objet contenant les états et fonctions de l'alerte
 */
export const useAlert = () => {
  const [alertState, setAlertState] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
    buttonText: 'OK'
  });

  /**
   * Afficher une alerte
   */
  const showAlert = ({
    title,
    message,
    type = 'info',
    buttonText = 'OK'
  }) => {
    return new Promise((resolve) => {
      setAlertState({
        isOpen: true,
        title,
        message,
        type,
        buttonText,
        onClose: () => {
          setAlertState(prev => ({ ...prev, isOpen: false }));
          resolve();
        }
      });
    });
  };

  /**
   * Afficher une alerte de succès
   */
  const showSuccess = (message, title) => {
    return showAlert({
      title,
      message,
      type: 'success',
      buttonText: 'OK'
    });
  };

  /**
   * Afficher une alerte d'avertissement
   */
  const showWarning = (message, title) => {
    return showAlert({
      title,
      message,
      type: 'warning',
      buttonText: 'OK'
    });
  };

  /**
   * Afficher une alerte d'erreur
   */
  const showError = (message, title) => {
    return showAlert({
      title,
      message,
      type: 'error',
      buttonText: 'OK'
    });
  };

  /**
   * Afficher une alerte d'information
   */
  const showInfo = (message, title) => {
    return showAlert({
      title,
      message,
      type: 'info',
      buttonText: 'OK'
    });
  };

  /**
   * Fermer l'alerte
   */
  const closeAlert = () => {
    setAlertState(prev => ({ ...prev, isOpen: false }));
  };

  return {
    alertState,
    showAlert,
    showSuccess,
    showWarning,
    showError,
    showInfo,
    closeAlert
  };
};

