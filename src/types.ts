// Add to existing types
export interface PrivacySettings {
  analyticsEnabled: boolean;
  crashReportingEnabled: boolean;
  marketingEmailsEnabled: boolean;
  shareGardenDataEnabled: boolean;
  cookiePreferences: {
    necessary: boolean; // Always true, can't be changed
    analytics: boolean;
    marketing: boolean;
    preferences: boolean;
  };
  lastUpdated: string;
}

// Update Settings interface
export interface Settings {
  location: string;
  lastSpringFrost: string;
  firstAutumnFrost: string;
  dateFormat: DateFormat;
  defaultTaskDay: WeekDay;
  enabledSeasons: Season[];
  defaultTasks: DefaultTask[];
  lastSync: string | null;
  privacy: PrivacySettings;
}