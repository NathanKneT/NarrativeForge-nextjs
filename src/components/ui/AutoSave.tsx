'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Save, CheckCircle, AlertCircle, Clock, Wifi, WifiOff } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error' | 'offline';

interface EnhancedAutoSaveProps {
  data: any;
  projectName: string;
  onSave: (data: any) => Promise<void>;
  autoSaveInterval?: number;
  showDetailedStatus?: boolean;
}

// Debounce utility
function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

export const useEnhancedAutoSave = (
  data: any,
  projectName: string,
  onSave: (data: any) => Promise<void>,
  autoSaveInterval: number = 3000
) => {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [saveCount, setSaveCount] = useState(0);

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const performSave = useCallback(async (dataToSave: any) => {
    if (!isOnline) {
      setSaveStatus('offline');
      return;
    }

    setSaveStatus('saving');
    try {
      await onSave(dataToSave);
      setSaveStatus('saved');
      setLastSaved(new Date());
      setSaveCount(prev => prev + 1);
      
      // Auto-hide success after 3 seconds
      setTimeout(() => {
        setSaveStatus('idle');
      }, 3000);
    } catch (error) {
      setSaveStatus('error');
      console.error('Auto-save failed:', error);
      
      // Auto-hide error after 5 seconds
      setTimeout(() => {
        setSaveStatus('idle');
      }, 5000);
    }
  }, [onSave, isOnline]);

  const debouncedSave = useMemo(
    () => debounce(performSave, autoSaveInterval),
    [performSave, autoSaveInterval]
  );

  useEffect(() => {
    if (data && Object.keys(data).length > 0 && projectName) {
      debouncedSave(data);
    }
  }, [data, debouncedSave, projectName]);

  const forceSave = useCallback(() => {
    if (data && Object.keys(data).length > 0) {
      performSave(data);
    }
  }, [data, performSave]);

  return { 
    saveStatus, 
    lastSaved, 
    isOnline, 
    saveCount, 
    forceSave 
  };
};

export const SaveIndicator: React.FC<{
  status: SaveStatus;
  lastSaved?: Date | null;
  isOnline?: boolean;
  saveCount?: number;
  onForceSave?: () => void;
  showDetailedStatus?: boolean;
}> = ({ 
  status, 
  lastSaved, 
  isOnline = true, 
  saveCount = 0, 
  onForceSave,
  showDetailedStatus = false 
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'saving':
        return {
          icon: Save,
          text: 'Saving...',
          color: 'text-blue-400',
          bgColor: 'bg-blue-900/20',
          borderColor: 'border-blue-600/30'
        };
      case 'saved':
        return {
          icon: CheckCircle,
          text: 'Saved',
          color: 'text-green-400',
          bgColor: 'bg-green-900/20',
          borderColor: 'border-green-600/30'
        };
      case 'error':
        return {
          icon: AlertCircle,
          text: 'Save failed',
          color: 'text-red-400',
          bgColor: 'bg-red-900/20',
          borderColor: 'border-red-600/30'
        };
      case 'offline':
        return {
          icon: WifiOff,
          text: 'Offline',
          color: 'text-orange-400',
          bgColor: 'bg-orange-900/20',
          borderColor: 'border-orange-600/30'
        };
      default:
        return {
          icon: isOnline ? Wifi : WifiOff,
          text: isOnline ? 'Auto-save enabled' : 'Offline',
          color: isOnline ? 'text-gray-400' : 'text-orange-400',
          bgColor: 'bg-gray-800/50',
          borderColor: 'border-gray-600/30'
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  if (!showDetailedStatus && status === 'idle') {
    return (
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <Icon size={12} />
        <span>Auto-save</span>
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={status}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm ${config.bgColor} ${config.borderColor}`}
      >
        {/* Animated Icon */}
        <motion.div
          animate={status === 'saving' ? { rotate: 360 } : {}}
          transition={status === 'saving' ? { duration: 1, repeat: Infinity, ease: "linear" } : {}}
        >
          <Icon size={14} className={config.color} />
        </motion.div>

        {/* Status Text */}
        <span className={config.color}>{config.text}</span>

        {/* Last Saved Time */}
        {lastSaved && (status === 'saved' || status === 'idle') && (
          <span className="text-gray-500 text-xs">
            {formatDistanceToNow(lastSaved, { addSuffix: true })}
          </span>
        )}

        {/* Save Count (for development/debugging) */}
        {showDetailedStatus && saveCount > 0 && (
          <span className="text-xs text-gray-500 bg-gray-700 px-1.5 py-0.5 rounded">
            {saveCount}
          </span>
        )}

        {/* Force Save Button (on error) */}
        {status === 'error' && onForceSave && (
          <button
            onClick={onForceSave}
            className="text-xs bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded transition-colors"
          >
            Retry
          </button>
        )}

        {/* Offline Indicator */}
        {!isOnline && (
          <div className="flex items-center gap-1 text-xs text-orange-300">
            <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
            <span>Changes saved locally</span>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

// Complete Auto-Save Component
export const EnhancedAutoSave: React.FC<EnhancedAutoSaveProps> = ({
  data,
  projectName,
  onSave,
  autoSaveInterval = 3000,
  showDetailedStatus = false
}) => {
  const { saveStatus, lastSaved, isOnline, saveCount, forceSave } = useEnhancedAutoSave(
    data,
    projectName,
    onSave,
    autoSaveInterval
  );

  return (
    <SaveIndicator
      status={saveStatus}
      lastSaved={lastSaved}
      isOnline={isOnline}
      saveCount={saveCount}
      onForceSave={forceSave}
      showDetailedStatus={showDetailedStatus}
    />
  );
};