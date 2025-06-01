'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Save, X } from 'lucide-react';

interface SaveNotificationProps {
  isVisible: boolean;
  message: string;
  type?: 'success' | 'error' | 'info';
  onClose: () => void;
  autoClose?: boolean;
  duration?: number;
}

export const SaveNotification: React.FC<SaveNotificationProps> = ({
  isVisible,
  message,
  type = 'success',
  onClose,
  autoClose = true,
  duration = 3000,
}) => {
  useEffect(() => {
    if (isVisible && autoClose) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isVisible, autoClose, duration, onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle size={20} className="text-green-400" />;
      case 'error':
        return <X size={20} className="text-red-400" />;
      default:
        return <Save size={20} className="text-blue-400" />;
    }
  };

  const getColors = () => {
    switch (type) {
      case 'success':
        return 'bg-green-800 border-green-600';
      case 'error':
        return 'bg-red-800 border-red-600';
      default:
        return 'bg-blue-800 border-blue-600';
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -50, scale: 0.9 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className={`fixed right-4 top-4 z-50 ${getColors()} max-w-sm rounded-lg border-2 p-4 shadow-lg`}
        >
          <div className="flex items-center gap-3">
            {getIcon()}
            <div className="flex-1">
              <p className="font-medium text-white">{message}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 transition-colors hover:text-white"
            >
              <X size={16} />
            </button>
          </div>

          {/* Barre de progression pour l'auto-close */}
          {autoClose && (
            <motion.div
              className="absolute bottom-0 left-0 h-1 rounded-b-lg bg-white bg-opacity-30"
              initial={{ width: '100%' }}
              animate={{ width: '0%' }}
              transition={{ duration: duration / 1000, ease: 'linear' }}
            />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// 🔧 ADD: Hook pour gérer les notifications
export const useNotification = () => {
  const [notification, setNotification] = useState<{
    isVisible: boolean;
    message: string;
    type: 'success' | 'error' | 'info';
  }>({
    isVisible: false,
    message: '',
    type: 'success',
  });

  const showNotification = (
    message: string,
    type: 'success' | 'error' | 'info' = 'success'
  ) => {
    setNotification({
      isVisible: true,
      message,
      type,
    });
  };

  const hideNotification = () => {
    setNotification((prev) => ({
      ...prev,
      isVisible: false,
    }));
  };

  return {
    notification,
    showNotification,
    hideNotification,
  };
};
