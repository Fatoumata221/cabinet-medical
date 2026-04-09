import React, { useState, useEffect } from 'react';
import { AlertTriangle, X, Bell, Clock } from 'lucide-react';

const UrgentNotificationModal = ({ notification, onClose, onMarkRead }) => {
  const [timeLeft, setTimeLeft] = useState(15); // 15 secondes avant auto-fermeture
  const [isBlinking, setIsBlinking] = useState(true);

  useEffect(() => {
    // Clignotement de l'alerte
    const blinkInterval = setInterval(() => {
      setIsBlinking(prev => !prev);
    }, 500);

    // Compte à rebours
    const countdown = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          onClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Son d'alerte continu
    const playAlarmSound = () => {
      const context = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = context.createOscillator();
      const gainNode = context.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(context.destination);
      
      oscillator.frequency.value = 800; // Fréquence d'urgence
      oscillator.type = 'square';
      
      gainNode.gain.setValueAtTime(0.2, context.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.2);
      
      oscillator.start(context.currentTime);
      oscillator.stop(context.currentTime + 0.2);
    };

    // Jouer le son toutes les 2 secondes
    const soundInterval = setInterval(playAlarmSound, 2000);
    playAlarmSound(); // Son initial

    // Vibration continue sur mobile
    if (navigator.vibrate) {
      const vibratePattern = [300, 200, 300, 200, 300];
      navigator.vibrate(vibratePattern);
      
      const vibrateInterval = setInterval(() => {
        navigator.vibrate(vibratePattern);
      }, 3000);
      
      return () => {
        clearInterval(blinkInterval);
        clearInterval(countdown);
        clearInterval(soundInterval);
        clearInterval(vibrateInterval);
        navigator.vibrate(0); // Arrêter la vibration
      };
    }

    return () => {
      clearInterval(blinkInterval);
      clearInterval(countdown);
      clearInterval(soundInterval);
    };
  }, [onClose]);

  const handleAction = (action) => {
    if (action === 'read') {
      onMarkRead(notification.id);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 backdrop-blur-sm">
      {/* Overlay clignotant pour urgence */}
      <div 
        className={`absolute inset-0 transition-opacity duration-500 ${
          isBlinking ? 'bg-red-500 bg-opacity-20' : 'bg-transparent'
        }`}
      />
      
      {/* Modal principale */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 animate-bounce-in">
        {/* En-tête d'urgence */}
        <div className={`p-6 rounded-t-2xl text-white text-center transition-colors duration-500 ${
          isBlinking ? 'bg-red-600' : 'bg-red-500'
        }`}>
          <div className="flex items-center justify-center mb-2">
            <AlertTriangle className="w-12 h-12 animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold">
            🚨 NOTIFICATION URGENTE
          </h2>
          <p className="text-red-100 mt-1">
            Attention requise immédiatement
          </p>
        </div>

        {/* Contenu */}
        <div className="p-6">
          <div className="text-center mb-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-gray-900 font-medium text-lg leading-relaxed">
                {notification.message}
              </p>
            </div>
            
            <div className="flex items-center justify-center text-sm text-gray-500 mb-4">
              <Clock className="w-4 h-4 mr-1" />
              {new Date(notification.created_at).toLocaleString('fr-FR')}
            </div>

            {/* Compte à rebours */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
              <p className="text-yellow-800 text-sm">
                ⏱️ Fermeture automatique dans <span className="font-bold text-lg">{timeLeft}</span> secondes
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-3">
            <button
              onClick={() => handleAction('read')}
              className="flex-1 bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              ✅ Marquer comme lu
            </button>
            <button
              onClick={() => handleAction('close')}
              className="flex-1 bg-gray-600 text-white py-3 px-4 rounded-lg hover:bg-gray-700 transition-colors font-medium"
            >
              ❌ Fermer
            </button>
          </div>

          {/* Instructions */}
          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500">
              💡 Cette alerte disparaîtra automatiquement ou cliquez sur une action
            </p>
          </div>
        </div>

        {/* Bouton fermeture en haut à droite */}
        <button
          onClick={() => handleAction('close')}
          className="absolute top-4 right-4 text-white hover:text-red-200 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Styles pour l'animation */}
      <style jsx>{`
        @keyframes bounce-in {
          0% {
            transform: scale(0.3) rotate(-10deg);
            opacity: 0;
          }
          50% {
            transform: scale(1.1) rotate(5deg);
          }
          100% {
            transform: scale(1) rotate(0deg);
            opacity: 1;
          }
        }
        
        .animate-bounce-in {
          animation: bounce-in 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }
      `}</style>
    </div>
  );
};

export default UrgentNotificationModal;
