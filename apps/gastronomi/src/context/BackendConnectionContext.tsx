import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { gastronomyApiClient } from '../services/api/gastronomyApiClient';
import { contentStore } from '../services/content/contentStore';

interface BackendConnectionContextType {
  isOnline: boolean | null; // null = checking, true = connected, false = offline
  isChecking: boolean;
  lastChecked: Date | null;
  checkConnection: () => Promise<boolean>;
  apiUrl: string;
}

const BackendConnectionContext = createContext<BackendConnectionContextType | undefined>(undefined);

export const BackendConnectionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOnline, setIsOnline] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const checkConnection = useCallback(async (): Promise<boolean> => {
    setIsChecking(true);
    try {
      const online = await gastronomyApiClient.isOnline();
      setIsOnline(online);
      setLastChecked(new Date());

      // Update contentStore with real backend connection status
      contentStore.setBackendConnectionStatus(online);
      if (online) {
        await contentStore.syncWithBackend();
      }

      return online;
    } catch {
      setIsOnline(false);
      setLastChecked(new Date());
      contentStore.setBackendConnectionStatus(false);
      return false;
    } finally {
      setIsChecking(false);
    }
  }, []);

  // Initial probe on mount; only keep polling periodically while online
  useEffect(() => {
    checkConnection();
  }, [checkConnection]);

  useEffect(() => {
    if (isOnline !== true) return;

    const intervalId = setInterval(() => {
      checkConnection();
    }, 15000);

    return () => clearInterval(intervalId);
  }, [isOnline, checkConnection]);

  const apiUrl = (import.meta as any).env?.VITE_GASTRONOMY_API_URL || 'http://localhost:5235';

  return (
    <BackendConnectionContext.Provider
      value={{
        isOnline,
        isChecking,
        lastChecked,
        checkConnection,
        apiUrl,
      }}
    >
      {children}
    </BackendConnectionContext.Provider>
  );
};

export const useBackendConnection = (): BackendConnectionContextType => {
  const context = useContext(BackendConnectionContext);
  if (!context) {
    throw new Error('useBackendConnection must be used within BackendConnectionProvider');
  }
  return context;
};

