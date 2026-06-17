import React, { useState, useEffect } from 'react';
import { Bell, Check, X, Clock } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { sendNotification, NOTIFICATION_TYPES, markAllAsRead } from '../../lib/notifications';

const NotificationPanel = ({ notifications, onRefresh, userProfile, waitingQueue, onAuthorizePatient }) => {
  const hasMarkedAllAsReadRef = React.useRef(false);

  useEffect(() => {
    // Marquer toutes les notifications comme lues automatiquement lors du premier affichage
    if (notifications && notifications.length > 0 && !hasMarkedAllAsReadRef.current && userProfile?.id && userProfile?.role) {
      const markAsReadAsync = async () => {
        try {
          await markAllAsRead(userProfile.id, userProfile.role);
          hasMarkedAllAsReadRef.current = true;
        } catch (error) {
          console.error('❌ [NotificationPanel] Erreur marquage toutes notifications comme lues:', error);
        }
      };
      markAsReadAsync();
    }
  }, [notifications, userProfile?.id, userProfile?.role]);

  const handleMarkAsRead = async (notification) => {
    if (!notification.lu) {
      try {
        await supabase
          .from('notifications_medecin_secretaire')
          .update({ lu: true, lu_at: new Date().toISOString() })
          .eq('id', notification.id);
        onRefresh();
      } catch (error) {
        console.error('Erreur marquage notification:', error);
      }
    }
  };

  const handleConfirm = async (notification) => {
    try {
      const waitingQueueId = notification.waiting_queue_id;
      if (!waitingQueueId) {
        console.error('ID de file d\'attente manquant');
        return;
      }

      // Autoriser le patient (confirmer) - PAS besoin de marquer comme lu ici
      // Le statut changera en temps réel côté médecin via Supabase Realtime
      if (onAuthorizePatient) {
        await onAuthorizePatient(waitingQueueId);
      }
      
      // Marquer la notification comme lue SEULEMENT après succès
      await handleMarkAsRead(notification);
    } catch (error) {
      console.error('Erreur confirmation:', error);
    }
  };

  const handlePostpone = async (notification) => {
    try {
      // Marquer la notification comme lue
      await handleMarkAsRead(notification);
      
      // Mettre le patient en attente (statut 'waiting')
      const waitingQueueId = notification.waiting_queue_id;
      if (waitingQueueId) {
        await supabase
          .from('waiting_queue')
          .update({ status: 'waiting', updated_at: new Date().toISOString() })
          .eq('id', waitingQueueId);
        
        // Rafraîchir la file d'attente
        if (onRefresh) onRefresh();
      }
    } catch (error) {
      console.error('Erreur report:', error);
    }
  };

  if (notifications.length === 0) return null;

  return (
    <div className="mb-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <div className="flex items-center mb-2">
          <Bell className="w-4 h-4 text-blue-600 mr-2" />
          <h3 className="text-sm font-semibold text-blue-900">
            Notifications ({notifications.length})
          </h3>
        </div>
        <div className="space-y-2">
          {notifications.slice(0, 5).map((notification) => (
            <div 
              key={notification.id} 
              className={`bg-white p-3 rounded border border-blue-100 text-sm ${
                !notification.lu ? 'border-l-4 border-l-blue-500' : ''
              }`}
            >
              <p className="text-gray-800 text-sm font-medium">{notification.message}</p>
              <p className="text-xs text-gray-500 mt-1">
                {new Date(notification.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              </p>
              
              {/* Actions pour les notifications de type PATIENT_READY */}
              {notification.type_notification === 'patient_ready' && !notification.lu && (
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => handleConfirm(notification)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded hover:bg-green-700 transition-colors"
                  >
                    <Check className="w-3 h-3" />
                    Confirmer - Je l'introduis
                  </button>
                  <button
                    onClick={() => handlePostpone(notification)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-orange-500 text-white text-xs font-medium rounded hover:bg-orange-600 transition-colors"
                  >
                    <Clock className="w-3 h-3" />
                    Reporter
                  </button>
                </div>
              )}
              
              {!notification.lu && notification.type_notification !== 'patient_ready' && (
                <button
                  onClick={() => handleMarkAsRead(notification)}
                  className="mt-2 text-xs text-blue-600 hover:text-blue-800"
                >
                  Marquer comme lu
                </button>
              )}
            </div>
          ))}
          {notifications.length > 5 && (
            <p className="text-xs text-blue-600 text-center">
              +{notifications.length - 5} autres notifications
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationPanel;
