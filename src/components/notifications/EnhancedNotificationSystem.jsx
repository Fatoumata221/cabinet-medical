import React from 'react';
import NotificationSystem from './NotificationSystem';
import UrgentNotificationModal from './UrgentNotificationModal';
import useNotifications from '../../hooks/useNotifications';

const EnhancedNotificationSystem = () => {
  const {
    notifications,
    unreadCount,
    latestNotification,
    showUrgentModal,
    setShowUrgentModal,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    isUrgentNotification
  } = useNotifications();

  // Gérer la fermeture du modal urgent
  const handleCloseUrgentModal = () => {
    setShowUrgentModal(false);
  };

  // Gérer le marquage comme lu depuis le modal urgent
  const handleMarkReadFromModal = (notificationId) => {
    markAsRead(notificationId);
    setShowUrgentModal(false);
  };

  return (
    <>
      {/* Système de notifications principal */}
      <NotificationSystem
        notifications={notifications}
        unreadCount={unreadCount}
        latestNotification={latestNotification}
        onMarkAsRead={markAsRead}
        onMarkAllAsRead={markAllAsRead}
        onDeleteNotification={deleteNotification}
      />

      {/* Modal pour notifications urgentes */}
      {showUrgentModal && latestNotification && isUrgentNotification(latestNotification) && (
        <UrgentNotificationModal
          notification={latestNotification}
          onClose={handleCloseUrgentModal}
          onMarkRead={handleMarkReadFromModal}
        />
      )}
    </>
  );
};

export default EnhancedNotificationSystem;
