import React, { createContext, useContext, useState } from 'react';
import AlertModal from '../components/common/AlertModal';

const AlertContext = createContext(null);

export const AlertProvider = ({ children }) => {
  const [alertState, setAlertState] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
    buttonText: 'OK'
  });

  const showAlert = ({
    title,
    message,
    type = 'info',
    buttonText = 'OK'
  }) => {
    return new Promise((resolve) => {
      setAlertState({
        isOpen: true,
        title,
        message,
        type,
        buttonText,
        onClose: () => {
          setAlertState(prev => ({ ...prev, isOpen: false }));
          resolve();
        }
      });
    });
  };

  const showSuccess = (message, title) => {
    return showAlert({
      title,
      message,
      type: 'success',
      buttonText: 'OK'
    });
  };

  const showWarning = (message, title) => {
    return showAlert({
      title,
      message,
      type: 'warning',
      buttonText: 'OK'
    });
  };

  const showError = (message, title) => {
    return showAlert({
      title,
      message,
      type: 'error',
      buttonText: 'OK'
    });
  };

  const showInfo = (message, title) => {
    return showAlert({
      title,
      message,
      type: 'info',
      buttonText: 'OK'
    });
  };

  const closeAlert = () => {
    setAlertState(prev => ({ ...prev, isOpen: false }));
  };

  const handleClose = () => {
    if (alertState.onClose) {
      alertState.onClose();
    } else {
      closeAlert();
    }
  };

  return (
    <AlertContext.Provider
      value={{
        showAlert,
        showSuccess,
        showWarning,
        showError,
        showInfo,
        closeAlert
      }}
    >
      {children}
      <AlertModal
        isOpen={alertState.isOpen}
        onClose={handleClose}
        title={alertState.title}
        message={alertState.message}
        type={alertState.type}
        buttonText={alertState.buttonText}
      />
    </AlertContext.Provider>
  );
};

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
};

