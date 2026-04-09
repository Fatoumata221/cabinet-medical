import { unifiedNotificationService } from '../services/unifiedNotificationService';
import { CheckCircle, AlertTriangle, Info, XCircle, Bell } from 'lucide-react';
import { toast } from 'react-toastify';

/**
 * Hook personnalisé pour gérer les notifications toast
 * Simplifie l'utilisation des toasts avec des styles cohérents
 */
export const useToast = () => {
  
  // Configuration par défaut des toasts
  const defaultOptions = {
    position: "top-right",
    autoClose: 5000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    newestOnTop: true
  };

  // Toast de succès
  const showSuccess = (message, options = {}) => {
    const toastContent = (
      <div className="flex items-center space-x-3">
        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
        <div className="flex-1">
          <div className="text-sm font-medium text-green-800">
            {message}
          </div>
        </div>
      </div>
    );

    return unifiedNotificationService.success(toastContent);
  };

  // Toast d'erreur
  const showError = (message, options = {}) => {
    const toastContent = (
      <div className="flex items-center space-x-3">
        <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
        <div className="flex-1">
          <div className="text-sm font-medium text-red-800">
            {message}
          </div>
        </div>
      </div>
    );

    return unifiedNotificationService.error(toastContent);
  };

  // Toast d'information
  const showInfo = (message, options = {}) => {
    const toastContent = (
      <div className="flex items-center space-x-3">
        <Info className="w-5 h-5 text-blue-500 flex-shrink-0" />
        <div className="flex-1">
          <div className="text-sm font-medium text-blue-800">
            {message}
          </div>
        </div>
      </div>
    );

    return unifiedNotificationService.info(toastContent);
  };

  // Toast d'avertissement
  const showWarning = (message, options = {}) => {
    const toastContent = (
      <div className="flex items-center space-x-3">
        <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0" />
        <div className="flex-1">
          <div className="text-sm font-medium text-yellow-800">
            {message}
          </div>
        </div>
      </div>
    );

    return unifiedNotificationService.warning(toastContent);
  };

  // Toast urgent (ne se ferme pas automatiquement)
  const showUrgent = (message, options = {}) => {
    const toastContent = (
      <div className="flex items-center space-x-3">
        <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 animate-pulse" />
        <div className="flex-1">
          <div className="text-sm font-bold text-red-900 uppercase">
            🚨 URGENT
          </div>
          <div className="text-sm font-medium text-red-800 mt-1">
            {message}
          </div>
        </div>
      </div>
    );

    return unifiedNotificationService.error(toastContent);
  };

  // Toast de notification médicale
  const showMedicalNotification = (title, message, type = 'info', options = {}) => {
    const getIcon = () => {
      switch (type) {
        case 'patient_arrived': return '🏥';
        case 'patient_called': return '📞';
        case 'patient_entered': return '🚶';
        case 'consultation_finished': return '✅';
        case 'urgent': return '🚨';
        default: return '🔔';
      }
    };

    const toastContent = (
      <div className="flex items-start space-x-3">
        <div className="text-xl flex-shrink-0 mt-1">
          {getIcon()}
        </div>
        <div className="flex-1">
          <div className="text-sm font-semibold text-gray-900">
            {title}
          </div>
          <div className="text-sm text-gray-700 mt-1">
            {message}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {new Date().toLocaleTimeString('fr-FR')}
          </div>
        </div>
      </div>
    );

    const toastMethod = type === 'urgent' ? toast.error : 
                      type === 'consultation_finished' ? toast.success :
                      type === 'patient_entered' ? toast.success :
                      toast.info;

    return toastMethod(toastContent, {
      ...defaultOptions,
      autoClose: type === 'urgent' ? false : 8000,
      ...options,
      className: `${
        type === 'urgent' ? 'bg-red-50 border-l-4 border-red-500' :
        type === 'consultation_finished' ? 'bg-green-50 border-l-4 border-green-500' :
        type === 'patient_entered' ? 'bg-blue-50 border-l-4 border-blue-500' :
        'bg-gray-50 border-l-4 border-gray-500'
      }`,
      progressClassName: `${
        type === 'urgent' ? 'bg-red-500' :
        type === 'consultation_finished' ? 'bg-green-500' :
        type === 'patient_entered' ? 'bg-blue-500' :
        'bg-gray-500'
      }`
    });
  };

  // Toast de chargement
  const showLoading = (message, options = {}) => {
    const toastContent = (
      <div className="flex items-center space-x-3">
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
        <div className="flex-1">
          <div className="text-sm font-medium text-blue-800">
            {message}
          </div>
        </div>
      </div>
    );

    return toast.loading(toastContent, {
      ...defaultOptions,
      autoClose: false,
      ...options,
      className: 'bg-blue-50 border-l-4 border-blue-500',
      progressClassName: 'bg-blue-500'
    });
  };

  // Fermer tous les toasts
  const dismissAll = () => {
    toast.dismiss();
  };

  // Fermer un toast spécifique
  const dismiss = (toastId) => {
    toast.dismiss(toastId);
  };

  return {
    showSuccess,
    showError,
    showInfo,
    showWarning,
    showUrgent,
    showMedicalNotification,
    showLoading,
    dismiss,
    dismissAll,
    // Accès direct à toast pour des cas spéciaux
    toast
  };
};

export default useToast;

