import React, { createContext, useContext, useEffect, useState } from 'react';
import { useDatabase } from './DatabaseContext';

interface StoreSettingsContextType {
  settings: Record<string, string>;
  loading: boolean;
  refreshSettings: () => Promise<void>;
  getSetting: (key: string, defaultValue?: string) => string;
}

const StoreSettingsContext = createContext<StoreSettingsContextType | undefined>(undefined);

export const StoreSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { queries, isReady } = useDatabase();
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const refreshSettings = async () => {
    if (!isReady) return;
    try {
      const fetchedSettings = await queries.getStoreSettings();
      const settingsMap: Record<string, string> = {};
      fetchedSettings.forEach(s => {
        settingsMap[s.key] = s.value;
      });
      setSettings(settingsMap);
    } catch (error) {
      console.error("Failed to fetch store settings:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshSettings();
  }, [isReady, queries]);

  // Apply dynamic settings to the application
  useEffect(() => {
    if (!loading && Object.keys(settings).length > 0) {
      // Apply primary color
      const primaryColor = settings['primary_color'];
      if (primaryColor) {
        document.documentElement.style.setProperty('--color-primary', primaryColor);
      }

      // Apply store name to document title
      const storeName = settings['store_name'];
      if (storeName) {
        document.title = storeName;
      }
    }
  }, [settings, loading]);

  const getSetting = (key: string, defaultValue: string = '') => {
    return settings[key] || defaultValue;
  };

  return (
    <StoreSettingsContext.Provider value={{ settings, loading, refreshSettings, getSetting }}>
      {children}
    </StoreSettingsContext.Provider>
  );
};

export const useStoreSettings = () => {
  const context = useContext(StoreSettingsContext);
  if (context === undefined) {
    throw new Error('useStoreSettings must be used within a StoreSettingsProvider');
  }
  return context;
};
