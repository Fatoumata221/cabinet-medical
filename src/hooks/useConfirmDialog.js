import { useState } from 'react';

/**
 * Hook personnalisé pour gérer les dialogues de confirmation
 * @returns {object} - Objet contenant les états et fonctions du dialogue
 */
export const useConfirmDialog = () => {
  const [dialogState, setDialogState] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
    confirmText: 'OK',
    cancelText: 'Annuler',
    showCancel: true,
    onConfirm: () => {},
    onCancel: () => {}
  });

  /**
   * Afficher un dialogue de confirmation
   */
  const showConfirm = ({
    title,
    message,
    type = 'info',
    confirmText = 'OK',
    cancelText = 'Annuler',
    showCancel = true,
    onConfirm = () => {},
    onCancel = () => {}
  }) => {
    return new Promise((resolve) => {
      setDialogState({
        isOpen: true,
        title,
        message,
        type,
        confirmText,
        cancelText,
        showCancel,
        onConfirm: () => {
          onConfirm();
          resolve(true);
        },
        onCancel: () => {
          onCancel();
          resolve(false);
        }
      });
    });
  };

  /**
   * Afficher un dialogue de succès
   */
  const showSuccess = (title, message, onConfirm = () => {}) => {
    return showConfirm({
      title,
      message,
      type: 'success',
      confirmText: 'OK',
      showCancel: false,
      onConfirm
    });
  };

  /**
   * Afficher un dialogue d'avertissement
   */
  const showWarning = (title, message, onConfirm = () => {}) => {
    return showConfirm({
      title,
      message,
      type: 'warning',
      confirmText: 'Continuer',
      cancelText: 'Annuler',
      showCancel: true,
      onConfirm
    });
  };

  /**
   * Afficher un dialogue d'erreur
   */
  const showError = (title, message, onConfirm = () => {}) => {
    return showConfirm({
      title,
      message,
      type: 'error',
      confirmText: 'OK',
      showCancel: false,
      onConfirm
    });
  };

  /**
   * Fermer le dialogue
   */
  const closeDialog = () => {
    setDialogState(prev => ({ ...prev, isOpen: false }));
  };

  return {
    dialogState,
    showConfirm,
    showSuccess,
    showWarning,
    showError,
    closeDialog
  };
};
