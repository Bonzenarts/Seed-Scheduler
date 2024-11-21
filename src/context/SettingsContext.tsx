import React, { createContext, useContext, useCallback, useRef } from 'react';
import { create } from 'zustand';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import { defaultTasks, seasons } from '../data/defaultTasks';
import { useAuth } from './AuthContext';
import type { Settings } from '../types';

const defaultSettings: Settings = {
  location: '',
  lastSpringFrost: '2024-04-01',
  firstAutumnFrost: '2024-11-01',
  dateFormat: 'dd/MM/yyyy',
  defaultTaskDay: 'monday',
  enabledSeasons: [...seasons],
  defaultTasks: [...defaultTasks],
  lastSync: null,
  privacy: {
    analyticsEnabled: false,
    crashReportingEnabled: false,
    marketingEmailsEnabled: false,
    shareGardenDataEnabled: false,
    cookiePreferences: {
      necessary: true,
      analytics: false,
      marketing: false,
      preferences: true
    },
    lastUpdated: new Date().toISOString()
  }
};

interface SettingsState {
  settings: Settings;
  updateSettings: (settings: Partial<Settings>) => Promise<void>;
  updateLastSync: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>()((set, get) => ({
  settings: defaultSettings,
  updateSettings: async (newSettings) => {
    try {
      const currentSettings = get().settings;
      const mergedSettings = {
        ...currentSettings,
        ...newSettings,
        privacy: newSettings.privacy ? {
          ...currentSettings.privacy,
          ...newSettings.privacy,
          cookiePreferences: newSettings.privacy.cookiePreferences ? {
            ...currentSettings.privacy.cookiePreferences,
            ...newSettings.privacy.cookiePreferences,
            necessary: true
          } : currentSettings.privacy.cookiePreferences,
          lastUpdated: new Date().toISOString()
        } : currentSettings.privacy
      };

      // Update local state first for immediate UI feedback
      set({ settings: mergedSettings });

      // Then update Firebase if authenticated
      if (auth.currentUser && !auth.currentUser.isAnonymous) {
        const settingsRef = doc(db, `users/${auth.currentUser.uid}/settings/general`);
        await setDoc(settingsRef, {
          ...mergedSettings,
          lastModified: Timestamp.now()
        });
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
      throw error;
    }
  },
  updateLastSync: async () => {
    try {
      const newTimestamp = new Date().toISOString();
      
      set((state) => ({
        settings: {
          ...state.settings,
          lastSync: newTimestamp
        }
      }));

      if (auth.currentUser && !auth.currentUser.isAnonymous) {
        const settingsRef = doc(db, `users/${auth.currentUser.uid}/settings/general`);
        await setDoc(settingsRef, {
          lastSync: newTimestamp,
          lastModified: Timestamp.now()
        }, { merge: true });
      }
    } catch (error) {
      console.error('Failed to update sync timestamp:', error);
      throw error;
    }
  }
}));

const SettingsContext = createContext<ReturnType<typeof useSettingsStore> | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const store = useSettingsStore();
  const initialLoadRef = useRef(false);

  const loadSettings = useCallback(async () => {
    if (initialLoadRef.current) return;
    initialLoadRef.current = true;

    try {
      if (!auth.currentUser || auth.currentUser.isAnonymous) {
        await store.updateSettings(defaultSettings);
        return;
      }

      const settingsRef = doc(db, `users/${auth.currentUser.uid}/settings/general`);
      const docSnap = await getDoc(settingsRef);

      if (docSnap.exists()) {
        const firestoreSettings = docSnap.data();
        await store.updateSettings({
          ...defaultSettings,
          ...firestoreSettings,
          privacy: {
            ...defaultSettings.privacy,
            ...(firestoreSettings.privacy || {}),
            cookiePreferences: {
              ...defaultSettings.privacy.cookiePreferences,
              ...(firestoreSettings.privacy?.cookiePreferences || {})
            }
          }
        });
      } else {
        // If no settings exist in Firestore, create them
        await store.updateSettings(defaultSettings);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
      await store.updateSettings(defaultSettings);
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