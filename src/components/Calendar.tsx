import React, { useState, useMemo } from 'react';
import { usePlanning } from '../context/PlanningContext';
import { useInventory } from '../context/InventoryContext';
import { useSettings } from '../context/settings';
import { cropGroups } from '../data/cropGroups';
import { gardenTasks } from '../data/gardenTasks';
import { CalendarDays, ChevronLeft, ChevronRight, Edit2, Trash2, Users, X, Eye, Filter } from 'lucide-react';
import { formatDate } from '../utils/dateFormat';
import type { CalendarViewType, Plan, SowingPlan } from '../types';
import EditPlanModal from './EditPlanModal';

interface CalendarProps {
  onDateChange: (date: Date) => void;
  onViewTypeChange: (viewType: CalendarViewType) => void;
}

export default function Calendar({ onDateChange, onViewTypeChange }: CalendarProps) {
  const { plans, deletePlan, updatePlan, isLoading } = usePlanning();
  const { settings } = useSettings();
  const { customCrops, defaultCrops: crops } = useInventory();
  const [viewType, setViewType] = useState<CalendarViewType>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);

  const allCrops = useMemo(() => 
    [...crops, ...customCrops].sort((a, b) => a.name.localeCompare(b.name)),
    [customCrops, crops]
  );

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getMonthData = (date: Date) => {
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
    const daysInMonth = getDaysInMonth(date);
    const days = [];

    // Fill in days from previous month
    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(null);
    }

    // Fill in days of current month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(date.getFullYear(), date.getMonth(), i));
    }

    return days;
  };

  const isFrostDate = (date: Date) => {
    if (!settings.lastSpringFrost || !settings.firstAutumnFrost) return false;

    const dateString = date.toISOString().split('T')[0];
    const springFrost = new Date(settings.lastSpringFrost);
    const autumnFrost = new Date(settings.firstAutumnFrost);

    springFrost.setFullYear(date.getFullYear());
    autumnFrost.setFullYear(date.getFullYear());

    return dateString === springFrost.toISOString().split('T')[0] ||
           dateString === autumnFrost.toISOString().split('T')[0];
  };

  const navigate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (viewType === 'month') {
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
    } else {
      if (direction === 'prev') {
        newDate.setFullYear(newDate.getFullYear() - 1);
      } else {
        newDate.setFullYear(newDate.getFullYear() + 1);
      }
    }
    setCurrentDate(newDate);
    onDateChange(newDate);
  };

  const handleMonthClick = (monthIndex: number) => {
    if (viewType === 'year') {
      const newDate = new Date(currentDate);
      newDate.setMonth(monthIndex);
      setCurrentDate(newDate);
      setViewType('month');
      onViewTypeChange('month');
      onDateChange(newDate);
    }
  };

  const toggleViewType = () => {
    const newViewType = viewType === 'month' ? 'year' : 'month';
    setViewType(newViewType);
    onViewTypeChange(newViewType);
  };

  const getEventType = (date: Date, plan: Plan) => {
    if (plan.type === 'sowing') {
      const sowingPlan = plan as SowingPlan;
      const crop = allCrops.find(c => c.id === sowingPlan.cropId);
      const variety = crop?.varieties.find(v => v.id === sowingPlan.varietyId);
      
      if (!variety) return null;

      for (let i = 0; i < sowingPlan.successionCount; i++) {
        const currentSowingDate = new Date(sowingPlan.sowingDate);
        currentSowingDate.setDate(currentSowingDate.getDate() + (i * sowingPlan.successionInterval));
        
        const transplantDate = new Date(currentSowingDate);
        transplantDate.setDate(transplantDate.getDate() + variety.daysToTransplant);
        
        const harvestDate = sowingPlan.harvestDate ? new Date(sowingPlan.harvestDate) :
                           sowingPlan.estimatedHarvestDate ? new Date(sowingPlan.estimatedHarvestDate) :
                           new Date(currentSowingDate.getTime() + (variety.daysToHarvest * 24 * 60 * 60 * 1000));

        if (!sowingPlan.skipSowingDate && date.toDateString() === currentSowingDate.toDateString()) return 'sowing';
        if (variety.daysToTransplant > 0 && date.toDateString() === transplantDate.toDateString()) return 'transplant';
        if (date.toDateString() === harvestDate.toDateString()) return 'harvest';
      }
    }
    return null;
  };

  const getEventDetails = (date: Date, plan: Plan) => {
    if (plan.type === 'sowing') {
      const sowingPlan = plan as SowingPlan;
      const crop = allCrops.find(c => c.id === sowingPlan.cropId);
      const variety = crop?.varieties.find(v => v.id === sowingPlan.varietyId);
      
      if (!variety) return null;

      const sowingDate = new Date(sowingPlan.sowingDate);
      const transplantDate = new Date(sowingDate);
      transplantDate.setDate(transplantDate.getDate() + variety.daysToTransplant);
      
      const harvestDate = sowingPlan.harvestDate ? new Date(sowingPlan.harvestDate) :
                         sowingPlan.estimatedHarvestDate ? new Date(sowingPlan.estimatedHarvestDate) :
                         new Date(sowingDate.getTime() + (variety.daysToHarvest * 24 * 60 * 60 * 1000));

      const status = sowingPlan.status ? ` (${sowingPlan.status.charAt(0).toUpperCase() + sowingPlan.status.slice(1)})` : '';

      return {
        title: `${crop.name} - ${variety.name}${status}`,
        dates: {
          sowing: formatDate(sowingDate, settings.dateFormat),
          transplant: formatDate(transplantDate, settings.dateFormat),
          harvest: formatDate(harvestDate, settings.dateFormat),
          harvestType: sowingPlan.harvestDate ? 'Harvested' : 
                      sowingPlan.status === 'failed' ? 'Failed' :
                      'Expected Harvest'
        }
      };
    }
    return null;
  };

  const renderMonthView = () => (
    <div className="grid grid-cols-7 gap-1">
      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
        <div key={day} className="text-center font-medium text-gray-500 py-2">
          {day}
        </div>
      ))}
      
      {getMonthData(currentDate).map((date, index) => {
        const isToday = date && 
          date.getDate() === new Date().getDate() &&
          date.getMonth() === new Date().getMonth() &&
          date.getFullYear() === new Date().getFullYear();

        const isFrost = date && isFrostDate(date);

        return (
          <div
            key={index}
            className={`min-h-24 border rounded-lg p-1 ${
              date 
                ? isToday
                  ? 'bg-green-50 border-green-500'
                  : isFrost
                    ? 'bg-blue-50 border-blue-200'
                    : 'bg-white'
                : 'bg-gray-50'
            }`}
          >
            {date && (
              <>
                <div className={`text-right ${
                  isToday 
                    ? 'text-green-600 font-bold'
                    : isFrost
                      ? 'text-blue-600'
                      : 'text-gray-500'
                } text-sm`}>
                  {date.getDate()}
                </div>
                <div className="mt-1 space-y-1">
                  {plans.map((plan) => {
                    const eventType = getEventType(date, plan);
                    if (!eventType) return null;

                    const eventDetails = getEventDetails(date, plan);
                    if (!eventDetails) return null;

                    return (
                      <div
                        key={`${plan.id}-${eventType}`}
                        className={`text-xs p-1 rounded group relative ${
                          eventType === 'sowing'
                            ? 'bg-green-100 text-green-800'
                            : eventType === 'transplant'
                            ? 'bg-blue-100 text-blue-800'
                            : eventType === 'harvest'
                            ? plan.type === 'sowing' && (plan as SowingPlan).status === 'failed'
                              ? 'bg-red-100 text-red-800'
                              : plan.type === 'sowing' && (plan as SowingPlan).harvestDate
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-yellow-100 text-yellow-800'
                            : 'bg-purple-100 text-purple-800'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span>{eventDetails.title}</span>
                          <div className="hidden group-hover:flex items-center gap-1">
                            <button
                              onClick={() => setEditingPlan(plan)}
                              className="p-1 hover:bg-white rounded"
                            >
                              <Edit2 className="h-3 w-3" />
                            </button>
                            <button
                              onClick={() => deletePlan(plan.id)}
                              className="p-1 hover:bg-white rounded"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        );
      })}
    </div>
  );

  const renderYearView = () => {
    const months = Array.from({ length: 12 }, (_, i) => {
      const date = new Date(currentDate.getFullYear(), i, 1);
      return {
        name: date.toLocaleString('default', { month: 'short' }),
        days: getMonthData(date)
      };
    });

    return (
      <div className="grid grid-cols-3 gap-4">
        {months.map((month, monthIndex) => (
          <div key={monthIndex} className="border rounded-lg p-2">
            <h3 
              className="text-center font-medium mb-2 cursor-pointer hover:text-green-600"
              onClick={() => handleMonthClick(monthIndex)}
            >
              {month.name}
            </h3>
            <div className="grid grid-cols-7 gap-px text-xs">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                <div key={i} className="text-center text-gray-500 p-1">
                  {day}
                </div>
              ))}
              {month.days.map((date, dateIndex) => (
                <div
                  key={dateIndex}
                  className={`p-1 text-center ${
                    date ? 'hover:bg-gray-50' : 'text-gray-300'
                  }`}
                >
                  {date?.getDate()}
                  {date && plans.some(plan => getEventType(date, plan)) && (
                    <div className="w-1 h-1 bg-green-500 rounded-full mx-auto mt-1" />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-green-800 flex items-center gap-2">
          <CalendarDays className="h-6 w-6" />
          Garden Calendar
        </h2>
        <div className="flex items-center gap-4">
          <button
            onClick={toggleViewType}
            className="text-green-600 hover:text-green-700"
          >
            {viewType === 'month' ? 'Year View' : 'Month View'}
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('prev')}
              className="p-1 rounded-full hover:bg-gray-100"
              aria-label="Previous month"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <span className="font-medium">
              {viewType === 'month'
                ? currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })
                : currentDate.getFullYear()}
            </span>
            <button
              onClick={() => navigate('next')}
              className="p-1 rounded-full hover:bg-gray-100"
              aria-label="Next month"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
        </div>
      ) : (
        viewType === 'month' ? renderMonthView() : renderYearView()
      )}

      {editingPlan && (
        <EditPlanModal
          plan={editingPlan}
          onSave={updatePlan}
          onClose={() => setEditingPlan(null)}
        />
      )}
    </div>
  );
}