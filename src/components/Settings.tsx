import React, { useState } from 'react';
import { MapPin, Thermometer, Calendar, CheckCircle, Clock, List, Trash2, RefreshCw, Database, Wifi, History } from 'lucide-react';
import { useSettings } from '../context/settings';
import { usePlanning } from '../context/PlanningContext';
import type { Settings as SettingsType, DateFormat, WeekDay, Season } from '../types';
import { seasons } from '../data/defaultTasks';
import { formatDate, dateInputStyle, dateDisplayStyle } from '../utils/dateFormat';
import CropDataManager from './CropDataManager';
import { clearCache, syncWithCloud } from '../services/syncService';
import PrivacySettings from './settings/PrivacySettings';

const weekDays: { value: WeekDay; label: string }[] = [
  { value: 'monday', label: 'Monday' },
  { value: 'tuesday', label: 'Tuesday' },
  { value: 'wednesday', label: 'Wednesday' },
  { value: 'thursday', label: 'Thursday' },
  { value: 'friday', label: 'Friday' },
  { value: 'saturday', label: 'Saturday' },
  { value: 'sunday', label: 'Sunday' },
];

const seasonLabels: Record<Season, string> = {
  'winter': 'Winter (January – February)',
  'early-spring': 'Early Spring (March – Early April)',
  'spring': 'Spring (Mid-April – May)',
  'early-summer': 'Early Summer (June)',
  'summer': 'Summer (July – August)',
  'late-summer': 'Late Summer (September)',
  'autumn': 'Autumn (October – November)',
  'early-winter': 'Early Winter (December)'
};

export default function Settings() {
  const { settings, updateSettings, isLoading, error } = useSettings();
  const { populateDefaultTasks, removeDefaultTasks } = usePlanning();
  const [formData, setFormData] = useState<SettingsType>({
    ...settings,
    enabledSeasons: [...settings.enabledSeasons],
    defaultTasks: [...settings.defaultTasks],
  });
  const [showSaveConfirmation, setShowSaveConfirmation] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateSettings(formData);
      setShowSaveConfirmation(true);
      setTimeout(() => setShowSaveConfirmation(false), 3000);
    } catch (err) {
      console.error('Failed to save settings:', err);
    }
  };

  const handlePopulateDefaultTasks = () => {
    if (window.confirm('This will add all default tasks to your calendar based on your selected settings. Continue?')) {
      updateSettings(formData);
      populateDefaultTasks();
    }
  };

  const handleManualPopulate = () => {
    if (window.confirm('This will attempt to manually populate all default tasks. Any existing default tasks will remain. Continue?')) {
      updateSettings(formData);
      setTimeout(() => {
        populateDefaultTasks();
      }, 100);
    }
  };

  const handleRemoveDefaultTasks = () => {
    if (window.confirm('This will remove all default tasks from your calendar and saved plans. Continue?')) {
      removeDefaultTasks();
    }
  };

  const toggleSeason = (season: Season) => {
    setFormData(prev => ({
      ...prev,
      enabledSeasons: prev.enabledSeasons.includes(season)
        ? prev.enabledSeasons.filter(s => s !== season)
        : [...prev.enabledSeasons, season]
    }));
  };

  const handleSyncWithCloud = async () => {
    setSyncStatus('syncing');
    try {
      await syncWithCloud();
      setSyncStatus('success');
      setTimeout(() => setSyncStatus('idle'), 3000);
    } catch (error) {
      setSyncStatus('error');
      setTimeout(() => setSyncStatus('idle'), 3000);
    }
  };

  const handleClearCache = async () => {
    if (window.confirm('Are you sure? This will clear all local data.')) {
      try {
        await clearCache();
        alert('Cache cleared successfully');
      } catch (error) {
        alert('Failed to clear cache');
      }
    }
  };

  const formatSyncTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return `${formatDate(date, settings.dateFormat)} at ${date.toLocaleTimeString()}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-700 rounded-lg">
        <p>Error loading settings: {error}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          Date Format
        </label>
        <select
          className="w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
          value={formData.dateFormat}
          onChange={(e) => setFormData({ ...formData, dateFormat: e.target.value as DateFormat })}
        >
          <option value="dd/MM/yyyy">DD/MM/YYYY (e.g., 31/12/2024)</option>
          <option value="MM/dd/yyyy">MM/DD/YYYY (e.g., 12/31/2024)</option>
          <option value="yyyy-MM-dd">YYYY-MM-DD (e.g., 2024-12-31)</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          Location
        </label>
        <input
          type="text"
          className="w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
          value={formData.location}
          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
          placeholder="e.g., London, UK"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
          <Thermometer className="h-4 w-4" />
          Last Spring Frost Date
        </label>
        <div className="relative">
          <input
            type="date"
            style={dateInputStyle}
            value={formData.lastSpringFrost}
            onChange={(e) => {
              const date = new Date(e.target.value);
              date.setFullYear(2024);
              setFormData({ ...formData, lastSpringFrost: date.toISOString().split('T')[0] });
            }}
          />
          {formData.lastSpringFrost && (
            <div style={dateDisplayStyle}>
              {formatDate(new Date(formData.lastSpringFrost), formData.dateFormat)}
            </div>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
          <Thermometer className="h-4 w-4" />
          First Autumn Frost Date
        </label>
        <div className="relative">
          <input
            type="date"
            style={dateInputStyle}
            value={formData.firstAutumnFrost}
            onChange={(e) => {
              const date = new Date(e.target.value);
              date.setFullYear(2024);
              setFormData({ ...formData, firstAutumnFrost: date.toISOString().split('T')[0] });
            }}
          />
          {formData.firstAutumnFrost && (
            <div style={dateDisplayStyle}>
              {formatDate(new Date(formData.firstAutumnFrost), formData.dateFormat)}
            </div>
          )}
        </div>
      </div>

      <div className="border-t pt-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
          <List className="h-5 w-5" />
          Default Tasks Settings
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Default Task Day
            </label>
            <select
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
              value={formData.defaultTaskDay}
              onChange={(e) => setFormData({ ...formData, defaultTaskDay: e.target.value as WeekDay })}
            >
              {weekDays.map(day => (
                <option key={day.value} value={day.value}>
                  {day.label}
                </option>
              ))}
            </select>
            <p className="mt-1 text-sm text-gray-500">
              Tasks will be scheduled on this day of the week when populating the calendar
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Enable Seasons
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {seasons.map(season => (
                <label key={season} className="flex items-center space-x-2 p-2 rounded hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={formData.enabledSeasons.includes(season)}
                    onChange={() => toggleSeason(season)}
                    className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <span className="text-sm text-gray-700">{seasonLabels[season]}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleRemoveDefaultTasks}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center gap-2"
            >
              <Trash2 className="h-5 w-5" />
              Remove Default Tasks
            </button>
            <button
              type="button"
              onClick={handlePopulateDefaultTasks}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
            >
              <List className="h-5 w-5" />
              Populate Default Tasks
            </button>
            <button
              type="button"
              onClick={handleManualPopulate}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 flex items-center gap-2"
            >
              <RefreshCw className="h-5 w-5" />
              Force Populate Tasks
            </button>
          </div>
        </div>
      </div>

      <div className="border-t pt-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
          <Database className="h-5 w-5" />
          Crop Data Management
        </h3>
        <CropDataManager />
      </div>

      <div className="border-t pt-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
          <Wifi className="h-5 w-5" />
          Sync Settings
        </h3>
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <History className="h-4 w-4" />
            {settings.lastSync ? (
              <span>Last synchronized: {formatSyncTime(settings.lastSync)}</span>
            ) : (
              <span>Never synchronized</span>
            )}
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-900">Clear Local Cache</h4>
              <p className="text-sm text-gray-500">
                Clear all locally stored data. This will not affect cloud data.
              </p>
            </div>
            <button
              type="button"
              onClick={handleClearCache}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Clear Cache
            </button>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-900">Force Sync</h4>
              <p className="text-sm text-gray-500">
                Force synchronization with cloud storage
              </p>
            </div>
            <button
              type="button"
              onClick={handleSyncWithCloud}
              className={`px-4 py-2 rounded-md text-white flex items-center gap-2 ${
                syncStatus === 'syncing'
                  ? 'bg-yellow-600'
                  : syncStatus === 'success'
                  ? 'bg-green-600'
                  : syncStatus === 'error'
                  ? 'bg-red-600'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
              disabled={syncStatus === 'syncing'}
            >
              {syncStatus === 'syncing' ? (
                <>
                  <RefreshCw className="h-5 w-5 animate-spin" />
                  Syncing...
                </>
              ) : syncStatus === 'success' ? (
                <>
                  <CheckCircle className="h-5 w-5" />
                  Synced
                </>
              ) : syncStatus === 'error' ? (
                'Sync Failed'
              ) : (
                'Sync Now'
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="border-t pt-6">
        <PrivacySettings />
      </div>

      <div className="flex items-center justify-between pt-6">
        <button
          type="submit"
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2"
        >
          Save Settings
        </button>
        
        {showSaveConfirmation && (
          <div className="flex items-center gap-2 text-green-600 animate-fade-in">
            <CheckCircle className="h-5 w-5" />
            <span>Settings saved successfully!</span>
          </div>
        )}
      </div>
    </form>
  );
}