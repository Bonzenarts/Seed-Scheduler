import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, Calendar } from 'lucide-react';
import { useSettings } from '../context/settings';
import { formatDate } from '../utils/dateFormat';
import type { SowingPlan, DamageReport } from '../types';

interface StatusUpdateModalProps {
  plan: SowingPlan;
  type: 'damage' | 'destruction' | 'harvest-estimate';
  onSave: (planId: string, updates: Partial<SowingPlan>) => void;
  onClose: () => void;
  currentDate: Date;
}

const damageTypes: { value: DamageReport['type']; label: string }[] = [
  { value: 'frost', label: 'Frost Damage' },
  { value: 'pests', label: 'Pest Damage' },
  { value: 'disease', label: 'Disease' },
  { value: 'weather', label: 'Weather Damage' },
  { value: 'other', label: 'Other' },
];

export default function StatusUpdateModal({ plan, type, onSave, onClose, currentDate }: StatusUpdateModalProps) {
  const { settings } = useSettings();
  const [damageType, setDamageType] = useState<DamageReport['type']>('frost');
  const [reportDate, setReportDate] = useState(currentDate.toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  // Calculate default harvest date if not set
  const getDefaultHarvestDate = () => {
    if (plan.estimatedHarvestDate) return plan.estimatedHarvestDate;
    if (plan.harvestDate) return plan.harvestDate;
    
    // Calculate based on sowing date
    const sowingDate = new Date(plan.sowingDate);
    const daysToHarvest = 60; // Default to 60 days if not specified
    const defaultHarvestDate = new Date(sowingDate);
    defaultHarvestDate.setDate(defaultHarvestDate.getDate() + daysToHarvest);
    return defaultHarvestDate.toISOString().split('T')[0];
  };

  const [newHarvestDate, setNewHarvestDate] = useState(getDefaultHarvestDate());

  // Update harvest date when plan changes
  useEffect(() => {
    if (type === 'harvest-estimate') {
      setNewHarvestDate(getDefaultHarvestDate());
    }
  }, [type, plan]);

  const calculateNewHarvestDate = (reportDate: string, multiplier: number = 1.25): string => {
    try {
      const report = new Date(reportDate);
      const currentHarvest = new Date(getDefaultHarvestDate());
      
      // Calculate remaining days
      const remainingDays = Math.max(
        0,
        (currentHarvest.getTime() - report.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Calculate new harvest date with multiplier
      const newDate = new Date(report.getTime());
      newDate.setDate(newDate.getDate() + Math.ceil(remainingDays * multiplier));
      
      return newDate.toISOString().split('T')[0];
    } catch (error) {
      console.error('Error calculating new harvest date:', error);
      return new Date().toISOString().split('T')[0];
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    let updates: Partial<SowingPlan> = {};
    
    if (type === 'damage') {
      const adjustedHarvestDate = calculateNewHarvestDate(reportDate);
      updates = {
        status: 'damaged',
        estimatedHarvestDate: adjustedHarvestDate,
        damageMultiplier: 1.25,
        reasonCode: damageType,
        notes: `Reported on: ${reportDate}\n${notes}`
      };
    } else if (type === 'destruction') {
      updates = {
        status: 'failed',
        reasonCode: damageType,
        notes: `Reported on: ${reportDate}\n${notes}`
      };
    } else {
      updates = {
        estimatedHarvestDate: newHarvestDate,
        status: plan.status // Preserve existing status
      };
    }

    onSave(plan.id, updates);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            {type === 'damage' && 'Report Damage'}
            {type === 'destruction' && 'Report Crop Loss'}
            {type === 'harvest-estimate' && 'Update Harvest Estimate'}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {(type === 'damage' || type === 'destruction') && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type of {type === 'damage' ? 'Damage' : 'Loss'}
                </label>
                <select
                  className="w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                  value={damageType}
                  onChange={(e) => setDamageType(e.target.value as DamageReport['type'])}
                  required
                >
                  {damageTypes.map(({ value, label }) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date Reported
                </label>
                <input
                  type="date"
                  className="w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                  value={reportDate}
                  onChange={(e) => setReportDate(e.target.value)}
                  required
                />
                <p className="mt-1 text-sm text-gray-500">
                  Reported: {formatDate(new Date(reportDate), settings.dateFormat)}
                </p>
              </div>

              {type === 'damage' && (
                <div className="p-4 bg-yellow-50 rounded-md">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div>
                      <p className="text-sm text-yellow-700">
                        Reporting damage will extend the estimated harvest date by 25% of the remaining growing time.
                      </p>
                      <p className="text-sm font-medium text-yellow-700 mt-1">
                        New estimated harvest: {formatDate(new Date(calculateNewHarvestDate(reportDate)), settings.dateFormat)}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {type === 'harvest-estimate' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                New Estimated Harvest Date
              </label>
              <input
                type="date"
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                value={newHarvestDate}
                onChange={(e) => setNewHarvestDate(e.target.value)}
                required
              />
              <p className="mt-1 text-sm text-gray-500">
                New date: {formatDate(new Date(newHarvestDate), settings.dateFormat)}
              </p>
              {plan.estimatedHarvestDate && (
                <p className="mt-1 text-sm text-gray-500">
                  Current estimate: {formatDate(new Date(plan.estimatedHarvestDate), settings.dateFormat)}
                </p>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Add any additional notes..."
            />
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
              {type === 'damage' && 'Report Damage'}
              {type === 'destruction' && 'Report Loss'}
              {type === 'harvest-estimate' && 'Update Estimate'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}