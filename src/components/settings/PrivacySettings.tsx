import React from 'react';
import { Shield, Cookie, Mail, Share, BarChart, AlertTriangle } from 'lucide-react';
import { useSettings } from '../../context/settings';
import type { PrivacySettings as PrivacySettingsType } from '../../types';

export default function PrivacySettings() {
  const { settings, updateSettings } = useSettings();

  const handlePrivacyChange = async (key: keyof PrivacySettingsType, value: boolean) => {
    try {
      await updateSettings({
        privacy: {
          ...settings.privacy,
          [key]: value,
          lastUpdated: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Failed to update privacy settings:', error);
    }
  };

  const handleCookieChange = async (key: keyof PrivacySettingsType['cookiePreferences'], value: boolean) => {
    if (key === 'necessary') return; // Can't change necessary cookies

    try {
      await updateSettings({
        privacy: {
          ...settings.privacy,
          cookiePreferences: {
            ...settings.privacy.cookiePreferences,
            [key]: value
          },
          lastUpdated: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Failed to update cookie preferences:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Privacy Settings
        </h3>

        <div className="space-y-4">
          <div className="flex items-start gap-4">
            <div className="flex-1">
              <label className="flex items-center gap-2">
                <BarChart className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Analytics</span>
              </label>
              <p className="text-sm text-gray-500 mt-1">
                Help us improve by allowing anonymous usage data collection
              </p>
            </div>
            <div className="flex-shrink-0">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={settings.privacy.analyticsEnabled}
                  onChange={(e) => handlePrivacyChange('analyticsEnabled', e.target.checked)}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
              </label>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="flex-1">
              <label className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Crash Reporting</span>
              </label>
              <p className="text-sm text-gray-500 mt-1">
                Send anonymous crash reports to help fix issues
              </p>
            </div>
            <div className="flex-shrink-0">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={settings.privacy.crashReportingEnabled}
                  onChange={(e) => handlePrivacyChange('crashReportingEnabled', e.target.checked)}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
              </label>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="flex-1">
              <label className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Marketing Emails</span>
              </label>
              <p className="text-sm text-gray-500 mt-1">
                Receive updates about new features and gardening tips
              </p>
            </div>
            <div className="flex-shrink-0">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={settings.privacy.marketingEmailsEnabled}
                  onChange={(e) => handlePrivacyChange('marketingEmailsEnabled', e.target.checked)}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
              </label>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="flex-1">
              <label className="flex items-center gap-2">
                <Share className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Garden Data Sharing</span>
              </label>
              <p className="text-sm text-gray-500 mt-1">
                Share anonymous garden data to help improve planting recommendations
              </p>
            </div>
            <div className="flex-shrink-0">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={settings.privacy.shareGardenDataEnabled}
                  onChange={(e) => handlePrivacyChange('shareGardenDataEnabled', e.target.checked)}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
              </label>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
          <Cookie className="h-5 w-5" />
          Cookie Preferences
        </h3>

        <div className="space-y-4">
          <div className="flex items-start gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium text-gray-700">Necessary Cookies</label>
              <p className="text-sm text-gray-500 mt-1">
                Required for the application to function properly
              </p>
            </div>
            <div className="flex-shrink-0">
              <label className="relative inline-flex items-center">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={true}
                  disabled
                />
                <div className="w-11 h-6 bg-green-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
              </label>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium text-gray-700">Analytics Cookies</label>
              <p className="text-sm text-gray-500 mt-1">
                Help us understand how you use the application
              </p>
            </div>
            <div className="flex-shrink-0">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={settings.privacy.cookiePreferences.analytics}
                  onChange={(e) => handleCookieChange('analytics', e.target.checked)}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
              </label>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium text-gray-700">Marketing Cookies</label>
              <p className="text-sm text-gray-500 mt-1">
                Used to deliver relevant advertisements and track their performance
              </p>
            </div>
            <div className="flex-shrink-0">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={settings.privacy.cookiePreferences.marketing}
                  onChange={(e) => handleCookieChange('marketing', e.target.checked)}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
              </label>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium text-gray-700">Preferences Cookies</label>
              <p className="text-sm text-gray-500 mt-1">
                Remember your settings and preferences for a better experience
              </p>
            </div>
            <div className="flex-shrink-0">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={settings.privacy.cookiePreferences.preferences}
                  onChange={(e) => handleCookieChange('preferences', e.target.checked)}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
              </label>
            </div>
          </div>
        </div>

        {settings.privacy.lastUpdated && (
          <p className="text-sm text-gray-500 mt-4">
            Last updated: {new Date(settings.privacy.lastUpdated).toLocaleString()}
          </p>
        )}
      </div>
    </div>
  );
}