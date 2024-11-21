import React, { createContext, useContext, useCallback, useRef } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../../config/firebase';
import { useAuth } from '../AuthContext';
import { useSettingsStore } from './store';
import { defaultSettings } from './defaultSettings';
import type { SettingsProviderProps } from './types';

const SettingsContext = createContext<ReturnType<typeof useSettingsStore> | undefined>(undefined);

export function SettingsProvider({ children }: SettingsProviderProps) {
  const { isAuthenticated } = useAuth();
  const store = useSettingsStore();
  const initialLoadRef = useRef(false);

  const loadSettings = useCallback(async () => {
    if (initialLoadRef.current) return;
    initialLoadRef.current = true;

    store.setSettings(defaultSettings);

    try {
      if (!auth.currentUser || auth.currentUser.isAnonymous) {
        return;
      }

      const settingsRef = doc(db, `users/${auth.currentUser.uid}/settings/general`);
      const docSnap = await getDoc(settingsRef);

      if (docSnap.exists()) {
        const firestoreSettings = docSnap.data();
        store.setSettings({
          ...defaultSettings,
          ...firestoreSettings,
          privacy: {
            ...defaultSettings.privacy,
            ...(firestoreSettings.privacy || {}),
            cookiePreferences: {
              ...defaultSettings.privacy.cookiePreferences,
              ...(firestoreSettings.privacy?.cookiePreferences || {}),
              necessary: true
            }
          }
        });
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
      store.setSettings(defaultSettings);
    }
  }, [store]);

  React.useEffect(() => {
    loadSettings();
  }, [isAuthenticated, loadSettings]);

  return (
    <SettingsContext.Provider value={store}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}