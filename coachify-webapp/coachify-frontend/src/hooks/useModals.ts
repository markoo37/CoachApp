import { useState } from 'react';

interface ConfirmationState {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  type: 'danger' | 'warning';
}

interface ErrorState {
  isOpen: boolean;
  title: string;
  message: string;
}

interface NotificationState {
  isVisible: boolean;
  message: string;
  type: 'success' | 'error';
}

export const useModals = () => {
  const [confirmModal, setConfirmModal] = useState<ConfirmationState>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    type: 'danger'
  });

  const [errorModal, setErrorModal] = useState<ErrorState>({
    isOpen: false,
    title: '',
    message: ''
  });

  const [notification, setNotification] = useState<NotificationState>({
    isVisible: false,
    message: '',
    type: 'success'
  });

  // Helper functions
  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ isVisible: true, message, type });
  };

  const hideNotification = () => {
    setNotification(prev => ({ ...prev, isVisible: false }));
  };

  const showError = (title: string, message: string) => {
    setErrorModal({ isOpen: true, title, message });
  };

  const hideError = () => {
    setErrorModal(prev => ({ ...prev, isOpen: false }));
  };

  const showConfirmation = (
    title: string, 
    message: string, 
    onConfirm: () => void, 
    type: 'danger' | 'warning' = 'danger'
  ) => {
    setConfirmModal({ isOpen: true, title, message, onConfirm, type });
  };

  const hideConfirmation = () => {
    setConfirmModal(prev => ({ ...prev, isOpen: false }));
  };

  return {
    // States
    confirmModal,
    errorModal,
    notification,
    
    // Actions
    showNotification,
    hideNotification,
    showError,
    hideError,
    showConfirmation,
    hideConfirmation,
  };
};

export default useModals;