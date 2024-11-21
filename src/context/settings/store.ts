import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { doc, setDoc, Timestamp } from 'firebase/firestore';
import { db, auth } from '../../config/firebase';
import { defaultSettings } from './defaultSettings';
import type { Settings } from '../../types';
import type { SettingsState } from './types';

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      settings: defaultSettings,
      isLoading: false,
      error: null,
      setSettings: (settings) => set({ settings, isLoading: false, error: null }),
      updateSettings: async (newSettings) => {
        try {
          const currentSettings = get().settings;
          
          // Deep merge privacy settings
          const mergedPrivacy = newSettings.privacy ? {
            ...currentSettings.privacy,
            ...newSettings.privacy,
            cookiePreferences: {
              ...currentSettings.privacy.cookiePreferences,
              ...(newSettings.privacy.cookiePreferences || {}),
              necessary: true // Always keep necessary cookies enabled
            },
            lastUpdated: new Date().toISOString()
          } : currentSettings.privacy;

          // Merge all settings
          const mergedSettings = {
            ...currentSettings,
            ...newSettings,
            privacy: mergedPrivacy
          };

          // Update local state immediately for better UX
          set({ settings: mergedSettings, isLoading: true, error: null });

          // Update Firestore if authenticated
          if (auth.currentUser && !auth.currentUser.isAnonymous) {
            const settingsRef = doc(db, `users/${auth.currentUser.uid}/settings/general`);
            await setDoc(settingsRef, {
              ...mergedSettings,
              lastModified: Timestamp.now()
            });
          }

          // Confirm update complete
          set({ isLoading: false });
          return mergedSettings;
        } catch (error: any) {
          console.error('Failed to save settings:', error);
          // Revert to previous settings on error
          set({ 
            settings: get().settings,
            error: error.message, 
            isLoading: false 
          });
          throw error;
        }
      },
      updateLastSync: async () => {
        try {
          const newTimestamp = new Date().toISOString();
          
          // Update local state immediately
          set(state => ({
            settings: {
              ...state.settings,
              lastSync: newTimestamp
            },
            isLoading: true
          }));

          if (auth.currentUser && !auth.currentUser.isAnonymous) {
            const settingsRef = doc(db, `users/${auth.currentUser.uid}/settings/general`);
            await setDoc(settingsRef, {
              lastSync: newTimestamp,
              lastModified: Timestamp.now()
            }, { merge: true });
          }

          set({ isLoading: false, error: null });
        } catch (error: any) {
          console.error('Failed to update sync timestamp:', error);
          set({ error: error.message, isLoading: false });
          throw error;
        }
      }
    }),
    {
      name: 'garden-settings',
      version: 2, // Increment version number
      storage: createJSONStorage(() => localStorage),
      migrate: (persistedState: any, version: number) => {
        if (version === 0) {
          // Migrate from version 0 to 1
          return {
            ...persistedState,
            settings: {
              ...defaultSettings,
              ...persistedState.settings,
              privacy: {
                ...defaultSettings.privacy,
                ...(persistedState.settings?.privacy || {}),
                cookiePreferences: {
                  ...defaultSettings.privacy.cookiePreferences,
                  ...(persistedState.settings?.privacy?.cookiePreferences || {})
                }
              }
            }
          };
        }
        if (version === 1) {
          // Migrate from version 1 to 2
          return {
            ...persistedState,
            settings: {
              ...defaultSettings,
              ...persistedState.settings,
              privacy: {
                ...defaultSettings.privacy,
                ...(persistedState.settings?.privacy || {}),
                cookiePreferences: {
                  ...defaultSettings.privacy.cookiePreferences,
                  ...(persistedState.settings?.privacy?.cookiePreferences || {})
                }
              }
            }
          };
        }
        return persistedState;
      }
    }
  )
);