import React, { useState } from 'react';
import { X, MapPin, Thermometer } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import type { Settings } from '../types';

interface SettingsModalProps {
  onClose: () => void;
}

export default function SettingsModal({ onClose }: SettingsModalProps) {
  const { settings, updateSettings } = useSettings();
  const [formData, setFormData] = useState<Settings>(settings);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Garden Settings</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
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
            <input
              type="date"
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
              value={formData.lastSpringFrost}
              onChange={(e) => setFormData({ ...formData, lastSpringFrost: e.target.value })}
            />
            <p className="mt-1 text-sm text-gray-500">
              The average date of the last frost in spring
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
              <Thermometer className="h-4 w-4" />
              First Autumn Frost Date
            </label>
            <input
              type="date"
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
              value={formData.firstAutumnFrost}
              onChange={(e) => setFormData({ ...formData, firstAutumnFrost: e.target.value })}
            />
            <p className="mt-1 text-sm text-gray-500">
              The average date of the first frost in autumn
            </p>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Save Settings
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}