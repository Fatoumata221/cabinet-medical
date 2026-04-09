import React, { useEffect, useState } from 'react';
import { 
  CheckCircle, 
  AlertTriangle, 
  Info, 
  X, 
  Bell,
  Phone,
  UserCheck,
  Clock
} from 'lucide-react';

const ToastNotification = ({ 
  message, 
  type = 'info', 
  duration = 5000, 
  onClose, 
  show = true 
}) => {
  const [isVisible, setIsVisible] = useState(show);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    setIsVisible(show);
    if (show) {
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 300);
    }
  }, [show]);

  useEffect(() => {
    if (isVisible && duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isVisible, duration]);

  const handleClose = () => {
    setIsAnimating(true);
    setTimeout(() => {
      setIsVisible(false);
      if (onClose) onClose();
    }, 300);
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'patient_called':
        return <Phone className="w-5 h-5 text-blue-500" />;
      case 'patient_entered':
        return <UserCheck className="w-5 h-5 text-green-500" />;
      case 'consultation_finished':
        return <Clock className="w-5 h-5 text-purple-500" />;
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'patient_called':
        return 'bg-blue-50 border-blue-200';
      case 'patient_entered':
        return 'bg-green-50 border-green-200';
      case 'consultation_finished':
        return 'bg-purple-50 border-purple-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  const getTextColor = () => {
    switch (type) {
      case 'success':
        return 'text-green-800';
      case 'error':
        return 'text-red-800';
      case 'warning':
        return 'text-yellow-800';
      case 'patient_called':
        return 'text-blue-800';
      case 'patient_entered':
        return 'text-green-800';
      case 'consultation_finished':
        return 'text-purple-800';
      default:
        return 'text-blue-800';
    }
  };

  if (!isVisible) return null;

  return (
    <div className={`
      fixed top-4 right-4 z-50 max-w-sm w-full
      transform transition-all duration-300 ease-in-out
      ${isAnimating ? 'scale-95 opacity-0' : 'scale-100 opacity-100'}
    `}>
      <div className={`
        flex items-start space-x-3 p-4 rounded-lg border shadow-lg
        ${getBackgroundColor()}
      `}>
        <div className="flex-shrink-0">
          {getIcon()}
        </div>
        
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium ${getTextColor()}`}>
            {message}
          </p>
        </div>
        
        <button
          onClick={handleClose}
          className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default ToastNotification;

