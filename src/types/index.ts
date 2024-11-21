// Add to existing types
export interface Coordinates {
  lat: number;
  lon: number;
}

// Update Settings interface
export interface Settings {
  location: string;
  coordinates?: Coordinates;
  lastSpringFrost: string;
  firstAutumnFrost: string;
  dateFormat: DateFormat;
  defaultTaskDay: WeekDay;
  enabledSeasons: Season[];
  defaultTasks: DefaultTask[];
  lastSync: string | null;
  privacy: PrivacySettings;
}