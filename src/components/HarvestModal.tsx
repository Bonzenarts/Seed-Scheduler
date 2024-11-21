import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useSettings } from '../context/settings';
import { formatDate } from '../utils/dateFormat';
import type { SowingPlan } from '../types';

interface HarvestModalProps {
  plan: SowingPlan;
  onSave: (planId: string, harvestDate: string) => void;
  onClose: () => void;
}

export default function HarvestModal({ plan, onSave, onClose }: HarvestModalProps) {
  const { settings } = useSettings();
  const [harvestDate, setHarvestDate] = useState(new Date().toISOString().split('T')[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(plan.id, harvestDate);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Mark as Harvested</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Harvest Date
            </label>
            <input
              type="date"
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
              value={harvestDate}
              onChange={(e) => setHarvestDate(e.target.value)}
              required
            />
            <p className="mt-1 text-sm text-gray-500">
              Selected: {formatDate(new Date(harvestDate), settings.dateFormat)}
            </p>
          </div>

          <div className="flex justify-end gap-3">
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
              Mark as Harvested
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}