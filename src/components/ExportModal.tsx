import React, { useState } from 'react';
import { X, Clock, Calendar, Bell } from 'lucide-react';
import { useSettings } from '../context/settings';
import { formatDate } from '../utils/dateFormat';
import type { SowingPlan } from '../types';

interface ExportModalProps {
  plans: SowingPlan[];
  onExport: (plans: SowingPlan[], type: 'csv' | 'ics', options: ExportOptions) => void;
  onClose: () => void;
}

export interface ExportOptions {
  isAllDay: boolean;
  eventTime: string;
  reminderTime: string | null;
}

export default function ExportModal({ plans, onExport, onClose }: ExportModalProps) {
  const { settings } = useSettings();
  const [exportType, setExportType] = useState<'csv' | 'ics'>('csv');
  const [isAllDay, setIsAllDay] = useState(true);
  const [eventTime, setEventTime] = useState('09:00');
  const [reminderTime, setReminderTime] = useState<string | null>('1:hour');

  const handleExport = () => {
    onExport(plans, exportType, {
      isAllDay,
      eventTime,
      reminderTime
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Export Plans</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Export Format
            </label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  checked={exportType === 'csv'}
                  onChange={() => setExportType('csv')}
                  className="mr-2"
                />
                CSV File
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  checked={exportType === 'ics'}
                  onChange={() => setExportType('ics')}
                  className="mr-2"
                />
                Calendar (ICS)
              </label>
            </div>
          </div>

          {exportType === 'ics' && (
            <>
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Calendar className="h-4 w-4" />
                  Event Type
                </label>
                <div className="mt-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={isAllDay}
                      onChange={(e) => setIsAllDay(e.target.checked)}
                      className="mr-2"
                    />
                    All-day event
                  </label>
                </div>
              </div>

              {!isAllDay && (
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <Clock className="h-4 w-4" />
                    Event Time
                  </label>
                  <input
                    type="time"
                    value={eventTime}
                    onChange={(e) => setEventTime(e.target.value)}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                  />
                </div>
              )}

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Bell className="h-4 w-4" />
                  Reminder
                </label>
                <select
                  value={reminderTime || ''}
                  onChange={(e) => setReminderTime(e.target.value || null)}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                >
                  <option value="">No reminder</option>
                  <option value="0">At time of event</option>
                  <option value="15:minute">15 minutes before</option>
                  <option value="30:minute">30 minutes before</option>
                  <option value="1:hour">1 hour before</option>
                  <option value="2:hour">2 hours before</option>
                  <option value="1:day">1 day before</option>
                  <option value="2:day">2 days before</option>
                  <option value="1:week">1 week before</option>
                </select>
              </div>
            </>
          )}
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
            onClick={handleExport}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Export
          </button>
        </div>
      </div>
    </div>
  );
}