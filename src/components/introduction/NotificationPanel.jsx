import React from 'react';
import { Bell } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const NotificationPanel = ({ notifications, onRefresh }) => {
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
        <div className="space-y-1.5">
          {notifications.slice(0, 3).map((notification) => (
            <div 
              key={notification.id} 
              className={`bg-white p-2 rounded border border-blue-100 text-sm ${
                (notification.type_notification === 'doctor_request' || notification.type_notification === 'demande_autorisation')
                  ? 'cursor-pointer hover:bg-blue-50 transition-colors' 
                  : ''
              }`}
              onClick={() => handleMarkAsRead(notification)}
            >
              <p className="text-gray-800 text-xs">{notification.message}</p>
              <div className="flex justify-between items-center mt-1">
                {(notification.type_notification === 'doctor_request' || notification.type_notification === 'demande_autorisation') && (
                  <p className="text-xs text-blue-600 font-medium">
                    👆 Cliquez pour marquer comme lu
                  </p>
                )}
                {!notification.lu && (
                  <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
                    Non lu
                  </span>
                )}
              </div>
            </div>
          ))}
          {notifications.length > 3 && (
            <p className="text-xs text-blue-600 text-center">
              +{notifications.length - 3} autres notifications
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationPanel;
