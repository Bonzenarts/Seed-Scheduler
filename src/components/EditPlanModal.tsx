import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useSettings } from '../context/settings';
import { formatDate } from '../utils/dateFormat';
import type { Plan, SowingPlan, TaskPlan } from '../types';

interface EditPlanModalProps {
  plan: Plan;
  onSave: (plan: Plan) => void;
  onClose: () => void;
  isMultiEdit?: boolean;
}

export default function EditPlanModal({ plan, onSave, onClose, isMultiEdit = false }: EditPlanModalProps) {
  const { settings } = useSettings();
  const [formData, setFormData] = useState({
    date: plan.type === 'sowing' ? (plan as SowingPlan).sowingDate : (plan as TaskPlan).startDate,
    successionInterval: plan.successionInterval,
    successionCount: plan.successionCount,
  });

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (plan.type === 'sowing') {
      onSave({
        ...plan,
        sowingDate: formData.date,
        successionInterval: formData.successionInterval,
        successionCount: formData.successionCount,
      });
    } else {
      onSave({
        ...plan,
        startDate: formData.date,
        successionInterval: formData.successionInterval,
        successionCount: formData.successionCount,
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            {isMultiEdit ? 'Edit Multiple Plans' : `Edit ${plan.type === 'sowing' ? 'Sowing' : 'Task'} Plan`}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
            <X className="h-5 w-5" />
          </button>
        </div>

        {isMultiEdit && (
          <div className="mb-4 p-3 bg-blue-50 text-blue-700 rounded-md">
            Changes will be applied to all selected plans of the same type
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {plan.type === 'sowing' ? 'Sowing Date' : 'Task Date'}
              </label>
              <input
                type="date"
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
              <p className="mt-1 text-sm text-gray-500">
                Selected: {formatDate(new Date(formData.date), settings.dateFormat)}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {plan.type === 'sowing' ? 'Succession Interval (days)' : 'Repeat Every (days)'}
              </label>
              <input
                type="number"
                min="1"
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                value={formData.successionInterval}
                onChange={(e) => setFormData({ ...formData, successionInterval: parseInt(e.target.value) })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {plan.type === 'sowing' ? 'Number of Successions' : 'Number of Occurrences'}
              </label>
              <input
                type="number"
                min="1"
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                value={formData.successionCount}
                onChange={(e) => setFormData({ ...formData, successionCount: parseInt(e.target.value) })}
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
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
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}