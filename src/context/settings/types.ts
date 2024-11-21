import { Settings } from '../../types';

export interface SettingsState {
  settings: Settings;
  isLoading: boolean;
  error: string | null;
  setSettings: (settings: Settings) => void;
  updateSettings: (settings: Partial<Settings>) => Promise<void>;
  updateLastSync: () => Promise<void>;
}

export interface SettingsProviderProps {
  children: React.ReactNode;
}