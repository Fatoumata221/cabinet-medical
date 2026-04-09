import React, { useState, useEffect } from 'react';
import { Bell, PhoneCall, CheckCircle, X, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getUnreadNotifications, markAsRead, subscribeToNotifications, unsubscribeFromNotifications } from '../../lib/notifications';
import useUserProfile from '../../hooks/useUserProfile';

const NotificationPanel = ({ onNotificationAction }) => {
  const { currentUser } = useAuth();
  const { userProfile } = useUserProfile();
  const [notifications, setNotifications] = useState([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (userProfile?.id && userProfile?.role) {
      loadNotifications();
      const cleanup = setupRealtimeSubscription();
      return cleanup;
    }
  }, [userProfile?.id, userProfile?.role]);

  const loadNotifications = async () => {
    try {
      if (!userProfile?.id || !userProfile?.role) return;
      const data = await getUnreadNotifications(userProfile.id, userProfile.role);
      setNotifications(data || []);
      setIsVisible(data && data.length > 0);
    } catch (error) {
      console.error('❌ [NotificationPanel] Erreur chargement notifications:', error);
      setNotifications([]);
    }
  };

  const setupRealtimeSubscription = () => {
    if (!userProfile?.id || !userProfile?.role) return () => {};
    
    const channel = subscribeToNotifications(userProfile.id, userProfile.role, (payload) => {
      console.log('🔔 [NotificationPanel] Nouvelle notification:', payload);
      
      if (payload.eventType === 'INSERT') {
        loadNotifications(); // Recharger les notifications
      }
    });

    return () => {
      if (channel) {
        unsubscribeFromNotifications(channel);
      }
    };
  };

  const handleConfirmCall = async (notification) => {
    try {
      // Marquer la notification comme lue
      await markAsRead(notification.id);

      // Appeler la fonction parent pour mettre à jour l'interface
      if (onNotificationAction) {
        onNotificationAction('patient_called', notification);
      }

      // Recharger les notifications
      loadNotifications();
      
      console.log('✅ [NotificationPanel] Appel confirmé');
    } catch (error) {
      console.error('❌ [NotificationPanel] Erreur confirmation appel:', error);
    }
  };

  const handleDismiss = async (notificationId) => {
    try {
      await markAsRead(notificationId);
      loadNotifications();
    } catch (error) {
      console.error('❌ [NotificationPanel] Erreur suppression notification:', error);
    }
  };

  if (!isVisible || notifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-3 max-w-sm">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`bg-white border-l-4 rounded-lg shadow-lg p-4 animate-pulse ${
            notification.type_notification === 'call_patient' 
              ? 'border-orange-500 bg-orange-50' 
              : 'border-blue-500 bg-blue-50'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${
                notification.type_notification === 'call_patient' 
                  ? 'bg-orange-100 text-orange-600' 
                  : 'bg-blue-100 text-blue-600'
              }`}>
                {notification.type_notification === 'call_patient' ? (
                  <PhoneCall className="w-5 h-5" />
                ) : (
                  <Bell className="w-5 h-5" />
                )}
              </div>
              <div>
                <p className="font-medium text-gray-900">
                  {notification.type_notification === 'call_patient' 
                    ? 'Appeler le patient' 
                    : 'Notification'
                  }
                </p>
                <p className="text-sm text-gray-600">
                  {notification.message}
                </p>
                {notification.data?.patientName && (
                  <p className="text-xs text-gray-500 mt-1">
                    Patient: {notification.data.patientName}
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex gap-2">
              {(notification.type_notification === 'patient_called' || notification.data?.original_type === 'call_patient') && (
                <button
                  onClick={() => handleConfirmCall(notification)}
                  className="px-3 py-1 bg-green-600 text-white text-xs rounded-full hover:bg-green-700 transition-colors flex items-center gap-1"
                >
                  <CheckCircle className="w-3 h-3" />
                  Appelé
                </button>
              )}
              <button
                onClick={() => handleDismiss(notification.id)}
                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          {/* Animation de clignotement pour les appels urgents */}
          {(notification.type_notification === 'patient_called' || notification.data?.original_type === 'call_patient') && (
            <div className="mt-2 flex items-center gap-2 text-xs text-orange-600">
              <AlertCircle className="w-3 h-3 animate-pulse" />
              <span>Action requise - Appeler le patient</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default NotificationPanel;
