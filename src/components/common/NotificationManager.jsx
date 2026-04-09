import React, { useState, useCallback } from 'react';
import NotificationToast from './NotificationToast';

const NotificationManager = () => {
  const [notifications, setNotifications] = useState([]);

  const addNotification = useCallback((notification) => {
    const id = Date.now() + Math.random();
    const newNotification = {
      id,
      ...notification,
      onClose: () => removeNotification(id)
    };
    
    setNotifications(prev => [...prev, newNotification]);
    
    return id;
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  // Exposer les méthodes globalement pour une utilisation facile
  React.useEffect(() => {
    window.showNotification = addNotification;
    window.clearAllNotifications = clearAll;
    
    return () => {
      delete window.showNotification;
      delete window.clearAllNotifications;
    };
  }, [addNotification, clearAll]);

  return (
    <div className="notification-container">
      {notifications.map((notification) => (
        <NotificationToast
          key={notification.id}
          message={notification.message}
          type={notification.type}
          duration={notification.duration}
          position={notification.position}
          onClose={notification.onClose}
        />
      ))}
    </div>
  );
};

export default NotificationManager;

