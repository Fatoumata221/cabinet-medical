import { supabase } from '../lib/supabase';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { getTitrePraticien } from '../utils/traductions';
import { CheckCircle, XCircle, AlertTriangle, Info, Bell } from 'lucide-react';

/**
 * Service de notifications unifié utilisant react-toastify uniquement
 * Remplace tous les autres systèmes de notifications
 */

// Configuration par défaut
const defaultToastOptions = {
  position: "top-right",
  autoClose: 5000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  newestOnTop: true
};

// Vérifier si les notifications sont activées
const areNotificationsEnabled = () => {
  try {
    const v = (typeof window !== 'undefined' && window.localStorage)
      ? localStorage.getItem('notifications_enabled')
      : null;
    return v !== 'false'; // Par défaut activé si non défini
  } catch (_e) {
    return true; // Par défaut activé en cas d'erreur
  }
};

// Vérifier si les toasts sont activés
const areToastsEnabled = () => {
  try {
    const v = (typeof window !== 'undefined' && window.localStorage)
      ? localStorage.getItem('toast_enabled')
      : null;
    return v !== 'false'; // Par défaut activé si non défini
  } catch (_e) {
    return true; // Par défaut activé en cas d'erreur
  }
};

// Politique: le son n'est activé que si les notifications ET le son sont activés
const shouldPlaySound = () => {
  if (!areNotificationsEnabled()) {
    return false;
  }
  try {
    const v = (typeof window !== 'undefined' && window.localStorage)
      ? localStorage.getItem('notification_sound_enabled')
      : null;
    return v !== 'false'; // Par défaut activé si non défini
  } catch (_e) {
    return true; // Par défaut activé en cas d'erreur
  }
};

// Types de notifications avec styles cohérents
export const UNIFIED_NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error', 
  WARNING: 'warning',
  INFO: 'info',
  URGENT: 'urgent',
  MEDICAL: 'medical',
  MEDICAL_WORKFLOW: 'medical_workflow'
};

// Service unifié
export const unifiedNotificationService = {
  
  // Notification de succès
  success: (message, options = {}) => {
    if (!areNotificationsEnabled()) {
      return null;
    }
    if (shouldPlaySound()) { try { playMedicalNotificationSound(); } catch (_) {} }
    if (!areToastsEnabled()) {
      return null;
    }
    const content = (
      <div className="flex items-center space-x-3">
        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
        <div className="flex-1">
          <div className="text-sm font-medium text-green-800">{message}</div>
        </div>
      </div>
    );
    return toast.success(content, {
      ...defaultToastOptions,
      ...options
    });
  },

  // Notification d'erreur
  error: (message, options = {}) => {
    if (!areNotificationsEnabled()) {
      return null;
    }
    if (shouldPlaySound()) { try { playMedicalNotificationSound(); } catch (_) {} }
    if (!areToastsEnabled()) {
      return null;
    }
    const content = (
      <div className="flex items-center space-x-3">
        <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
        <div className="flex-1">
          <div className="text-sm font-medium text-red-800">{message}</div>
        </div>
      </div>
    );
    return toast.error(content, {
      ...defaultToastOptions,
      ...options
    });
  },

  // Notification d'avertissement
  warning: (message, options = {}) => {
    if (!areNotificationsEnabled()) {
      return null;
    }
    if (shouldPlaySound()) { try { playMedicalNotificationSound(); } catch (_) {} }
    if (!areToastsEnabled()) {
      return null;
    }
    const content = (
      <div className="flex items-center space-x-3">
        <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0" />
        <div className="flex-1">
          <div className="text-sm font-medium text-yellow-800">{message}</div>
        </div>
      </div>
    );
    return toast.warning(content, {
      ...defaultToastOptions,
      ...options
    });
  },

  // Notification d'information
  info: (message, options = {}) => {
    if (!areNotificationsEnabled()) {
      return null;
    }
    if (shouldPlaySound()) { try { playMedicalNotificationSound(); } catch (_) {} }
    if (!areToastsEnabled()) {
      return null;
    }
    const content = (
      <div className="flex items-center space-x-3">
        <Info className="w-5 h-5 text-blue-500 flex-shrink-0" />
        <div className="flex-1">
          <div className="text-sm font-medium text-blue-800">{message}</div>
        </div>
      </div>
    );
    return toast.info(content, {
      ...defaultToastOptions,
      ...options
    });
  },

  // Notification urgente (ne se ferme pas automatiquement)
  urgent: (message, options = {}) => {
    if (!areNotificationsEnabled()) {
      return null;
    }
    if (shouldPlaySound()) { try { playMedicalNotificationSound(); } catch (_) {} }
    if (!areToastsEnabled()) {
      return null;
    }
    const content = (
      <div className="flex items-center space-x-3">
        <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 animate-pulse" />
        <div className="flex-1">
          <div className="text-sm font-bold text-red-900 uppercase">🚨 URGENT</div>
          <div className="text-sm font-medium text-red-800 mt-1">{message}</div>
        </div>
      </div>
    );
    return toast.error(content, {
      ...defaultToastOptions,
      autoClose: false,
      ...options
    });
  },

  // Notification médicale spécialisée
  medical: (title, message, type = 'info', options = {}) => {
    if (!areNotificationsEnabled()) {
      return null;
    }
    if (shouldPlaySound()) { try { playMedicalNotificationSound(); } catch (_) {} }
    if (!areToastsEnabled()) {
      return null;
    }
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

    const content = (
      <div className="flex items-start space-x-3">
        <div className="text-xl flex-shrink-0 mt-1">{getIcon()}</div>
        <div className="flex-1">
          <div className="text-sm font-semibold text-gray-900">{title}</div>
          <div className="text-sm text-gray-700 mt-1">{message}</div>
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

    return toastMethod(content, {
      ...defaultToastOptions,
      autoClose: type === 'urgent' ? false : 8000,
      ...options,
      className: type === 'urgent' ? 'bg-red-50 border-l-4 border-red-500' :
        type === 'consultation_finished' ? 'bg-green-50 border-l-4 border-green-500' :
        type === 'patient_entered' ? 'bg-blue-50 border-l-4 border-blue-500' :
        'bg-gray-50 border-l-4 border-gray-500',
      progressClassName: type === 'urgent' ? 'bg-red-500' :
        type === 'consultation_finished' ? 'bg-green-500' :
        type === 'patient_entered' ? 'bg-blue-500' :
        'bg-gray-500'
    });
  },

  // Notification de chargement
  loading: (message, options = {}) => {
    const content = (
      <div className="flex items-center space-x-3">
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
        <div className="flex-1">
          <div className="text-sm font-medium text-blue-800">{message}</div>
        </div>
      </div>
    );
    
    return toast.loading(content, {
      ...defaultToastOptions,
      autoClose: false,
      ...options,
      className: 'bg-blue-50 border-l-4 border-blue-500',
      progressClassName: 'bg-blue-500'
    });
  },

  // Notification médicale avec son pour workflow patient
  medicalWorkflow: (type, patientName, doctorName = '', doctorSpecialite = '', options = {}) => {
    console.log('🔊 [medicalWorkflow] Déclenchement notification:', { type, patientName, doctorName, doctorSpecialite });
    
    if (!areNotificationsEnabled()) {
      return null;
    }
    
    // Jouer le son de notification
    if (shouldPlaySound()) {
      try {
        playMedicalNotificationSound();
        console.log('🎵 [medicalWorkflow] Son joué avec succès');
      } catch (error) {
        console.error('❌ [medicalWorkflow] Erreur son:', error);
      }
    }
    
    const normalizedType = type?.toLowerCase() || '';
    const titrePraticien = getTitrePraticien(doctorSpecialite);
    
    const getWorkflowIcon = () => {
      switch (normalizedType) {
        case 'patient_en_route': return '🚶';
        case 'souhaite_recevoir': return '�';
        case 'consultation_terminee': return '✅';
        case 'urgence': return '🚨';
        default: return '📋';
      }
    };

    const getWorkflowMessage = () => {
      switch (normalizedType) {
        case 'patient_en_route':
          return `${patientName} se dirige vers le bureau${doctorName ? ` du ${titrePraticien} ${doctorName}` : ''}`;
        case 'souhaite_recevoir':
          return `${titrePraticien} ${doctorName} va recevoir ${patientName}`;
        case 'consultation_terminee':
          return `Consultation de ${patientName} terminée${doctorName ? ` avec le ${titrePraticien} ${doctorName}` : ''}`;
        default:
          return `Notification concernant ${patientName}`;
      }
    };

    const icon = getWorkflowIcon();
    const message = getWorkflowMessage();
    
    console.log('📝 [medicalWorkflow] Message généré:', message);

    // Version simplifiée sans classes CSS complexes
    const content = (
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
        <div style={{ fontSize: '24px', marginTop: '4px' }}>
          {icon}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#1f2937', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            🔔 NOTIFICATION MÉDICALE
          </div>
          <div style={{ fontSize: '14px', fontWeight: '500', color: '#374151', marginTop: '4px' }}>
            {message}
          </div>
          <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px', display: 'flex', alignItems: 'center' }}>
            <span style={{ 
              display: 'inline-block', 
              width: '8px', 
              height: '8px', 
              backgroundColor: '#ef4444', 
              borderRadius: '50%',
              marginRight: '8px',
              animation: 'pulse 2s infinite'
            }}></span>
            {new Date().toLocaleTimeString('fr-FR')}
          </div>
        </div>
      </div>
    );

    if (!areToastsEnabled()) {
      return null;
    }
    
    const toastMethod = normalizedType === 'consultation_terminee' ? toast.success : toast.info;
    
    console.log('🍞 [medicalWorkflow] Affichage toast...');
    
    const toastId = toastMethod(content, {
      ...defaultToastOptions,
      autoClose: 8000,
      ...options,
      style: {
        borderRadius: '8px',
        boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
        borderLeft: normalizedType === 'patient_en_route' ? '4px solid #3b82f6' :
                   normalizedType === 'souhaite_recevoir' ? '4px solid #8b5cf6' :
                   normalizedType === 'consultation_terminee' ? '4px solid #10b981' :
                   '4px solid #6b7280',
        backgroundColor: normalizedType === 'patient_en_route' ? '#eff6ff' :
                        normalizedType === 'souhaite_recevoir' ? '#f3e8ff' :
                        normalizedType === 'consultation_terminee' ? '#ecfdf5' :
                        '#f9fafb'
      }
    });
    
    console.log('✅ [medicalWorkflow] Toast créé avec ID:', toastId);
    return toastId;
  },

  // Fermer tous les toasts
  dismissAll: () => toast.dismiss(),
  
  // Fermer un toast spécifique
  dismiss: (toastId) => toast.dismiss(toastId)
};

// Fonction pour jouer le son de notification médicale
const playMedicalNotificationSound = () => {
  try {
    // Créer un contexte audio
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    // Séquence de notes pour notification médicale
    const notes = [
      { frequency: 800, duration: 200 },
      { frequency: 1000, duration: 200 },
      { frequency: 800, duration: 300 }
    ];
    
    let currentTime = audioContext.currentTime;
    
    notes.forEach((note, index) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = note.frequency;
      oscillator.type = 'sine';
      
      // Envelope pour un son plus doux
      gainNode.gain.setValueAtTime(0, currentTime);
      gainNode.gain.linearRampToValueAtTime(0.3, currentTime + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.01, currentTime + note.duration / 1000);
      
      oscillator.start(currentTime);
      oscillator.stop(currentTime + note.duration / 1000);
      
      currentTime += (note.duration + 100) / 1000; // Pause entre les notes
    });
  } catch (error) {
    console.warn('Son de notification non disponible:', error);
  }
};

// Export par défaut pour compatibilité
export default unifiedNotificationService;
