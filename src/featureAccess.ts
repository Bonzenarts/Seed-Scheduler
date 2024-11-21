// Define feature access levels
export const featureAccess = {
  plantDetails: ['premium', 'beta', 'admin'],
  customCrops: ['premium', 'beta', 'admin'],
  dataExport: ['premium', 'beta', 'admin'],
  weatherData: ['premium', 'beta', 'admin'],
  betaFeatures: ['beta', 'admin'],
  adminPanel: ['admin']
} as const;