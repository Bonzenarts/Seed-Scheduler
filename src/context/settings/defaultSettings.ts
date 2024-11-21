import { Settings } from '../../types';
import { defaultTasks, seasons } from '../../data/defaultTasks';

export const defaultSettings: Settings = {
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