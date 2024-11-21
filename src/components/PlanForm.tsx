import React, { useState, useMemo, useEffect } from 'react';
import { usePlanning } from '../context/PlanningContext';
import { useInventory } from '../context/InventoryContext';
import { useSettings } from '../context/settings';
import { cropGroups } from '../data/cropGroups';
import { gardenTasks } from '../data/gardenTasks';
import { CalendarDays, Flower2, Plus, AlertTriangle, ListTodo, Edit3, Filter } from 'lucide-react';
import { formatDate, dateInputStyle, dateDisplayStyle } from '../utils/dateFormat';
import type { Crop, TabType } from '../types';
import { auth } from '../config/firebase';

interface PlanFormProps {
  currentDate: Date;
}

export default function PlanForm({ currentDate }: PlanFormProps) {
  const { addPlan } = usePlanning();
  const { customCrops, defaultCrops: crops } = useInventory();
  const { settings } = useSettings();
  const [activeTab, setActiveTab] = useState<TabType>('sowing');
  const [selectedCrop, setSelectedCrop] = useState<Crop | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [selectedTaskId, setSelectedTaskId] = useState('');
  const [isCustomTask, setIsCustomTask] = useState(false);
  const [customTaskData, setCustomTaskData] = useState({
    name: '',
    description: '',
    category: 'Custom'
  });
  const [sowingFormData, setSowingFormData] = useState({
    varietyId: '',
    sowingDate: currentDate.toISOString().split('T')[0],
    successionInterval: 14,
    successionCount: 1,
  });
  const [taskFormData, setTaskFormData] = useState({
    startDate: currentDate.toISOString().split('T')[0],
    successionInterval: 30,
    successionCount: 1,
  });
  const [skipSowingDate, setSkipSowingDate] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const newDate = currentDate.toISOString().split('T')[0];
    setSowingFormData(prev => ({ ...prev, sowingDate: newDate }));
    setTaskFormData(prev => ({ ...prev, startDate: newDate }));
  }, [currentDate]);

  const allCrops = useMemo(() => 
    [...crops, ...customCrops].sort((a, b) => a.name.localeCompare(b.name)),
    [customCrops, crops]
  );

  const isWithinSowingPeriod = (date: Date, startMonth: number, endMonth: number): boolean => {
    const month = date.getMonth() + 1;
    return startMonth <= endMonth 
      ? month >= startMonth && month <= endMonth
      : month >= startMonth || month <= endMonth;
  };

  const sowableCrops = useMemo(() => {
    const selectedDate = new Date(sowingFormData.sowingDate);
    let filtered = allCrops;
    
    if (selectedGroupId) {
      filtered = filtered.filter(crop => crop.groupId === selectedGroupId);
    }
    
    if (!skipSowingDate) {
      filtered = filtered.filter(crop => 
        crop.varieties.some(variety => 
          isWithinSowingPeriod(selectedDate, variety.startMonth, variety.endMonth)
        )
      );
    }
    
    return filtered.sort((a, b) => a.name.localeCompare(b.name));
  }, [sowingFormData.sowingDate, allCrops, selectedGroupId, skipSowingDate]);

  const sowableVarieties = useMemo(() => {
    if (!selectedCrop) return [];
    const selectedDate = new Date(sowingFormData.sowingDate);
    let varieties = selectedCrop.varieties;
    
    if (!skipSowingDate) {
      varieties = varieties.filter(variety => 
        isWithinSowingPeriod(selectedDate, variety.startMonth, variety.endMonth)
      );
    }
    
    return varieties.sort((a, b) => a.name.localeCompare(b.name));
  }, [selectedCrop, sowingFormData.sowingDate, skipSowingDate]);

  const handleTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      if (!isCustomTask && !selectedTaskId) {
        setError('Please select a task');
        return;
      }
      if (isCustomTask && !customTaskData.name) {
        setError('Please enter a task name');
        return;
      }

      const taskPlan = {
        id: crypto.randomUUID(),
        type: 'task' as const,
        taskId: isCustomTask ? `custom-${crypto.randomUUID()}` : selectedTaskId,
        taskName: isCustomTask ? customTaskData.name : gardenTasks.find(t => t.id === selectedTaskId)?.name,
        taskDescription: isCustomTask ? customTaskData.description : gardenTasks.find(t => t.id === selectedTaskId)?.description,
        taskCategory: isCustomTask ? customTaskData.category : gardenTasks.find(t => t.id === selectedTaskId)?.category || 'Custom',
        startDate: taskFormData.startDate,
        successionInterval: taskFormData.successionInterval,
        successionCount: taskFormData.successionCount,
        userId: auth.currentUser?.uid || 'offline',
        lastModified: new Date().toISOString()
      };

      await addPlan(taskPlan);

      // Reset form
      setSelectedTaskId('');
      setCustomTaskData({
        name: '',
        description: '',
        category: 'Custom'
      });
      setTaskFormData({
        startDate: currentDate.toISOString().split('T')[0],
        successionInterval: 30,
        successionCount: 1,
      });
      setIsCustomTask(false);
      setError('');
    } catch (error: any) {
      setError(error.message || 'Failed to add task');
    }
  };

  const handleSowingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      if (!selectedCrop) {
        setError('Please select a crop');
        return;
      }
      if (!sowingFormData.varietyId) {
        setError('Please select a variety');
        return;
      }

      const variety = selectedCrop.varieties.find(v => v.id === sowingFormData.varietyId);
      if (!variety) {
        setError('Invalid variety selected');
        return;
      }

      const sowingDate = new Date(sowingFormData.sowingDate);
      if (!skipSowingDate && !isWithinSowingPeriod(sowingDate, variety.startMonth, variety.endMonth)) {
        setError(`This variety can only be sown between ${getMonthName(variety.startMonth)} and ${getMonthName(variety.endMonth)}`);
        return;
      }

      const sowingPlan = {
        id: crypto.randomUUID(),
        type: 'sowing' as const,
        cropId: selectedCrop.id,
        varietyId: sowingFormData.varietyId,
        sowingDate: skipSowingDate ? 
          new Date(new Date(sowingFormData.sowingDate).getTime() - (variety.daysToTransplant * 24 * 60 * 60 * 1000)).toISOString().split('T')[0] :
          sowingFormData.sowingDate,
        successionInterval: sowingFormData.successionInterval,
        successionCount: sowingFormData.successionCount,
        skipSowingDate,
        userId: auth.currentUser?.uid || 'offline',
        lastModified: new Date().toISOString()
      };

      await addPlan(sowingPlan);

      // Reset form
      setSowingFormData({
        ...sowingFormData,
        varietyId: '',
      });
      setSelectedCrop(null);
      setSkipSowingDate(false);
      setError('');
    } catch (error: any) {
      setError(error.message || 'Failed to add sowing plan');
    }
  };

  const getMonthName = (monthNumber: number): string => {
    return new Date(2024, monthNumber - 1, 1).toLocaleString('default', { month: 'long' });
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-green-800 flex items-center gap-2">
          <Flower2 className="h-6 w-6" />
          New Garden Plan
        </h2>
      </div>

      <div className="flex border-b mb-6">
        <button
          className={`px-4 py-2 border-b-2 ${
            activeTab === 'sowing'
              ? 'border-green-500 text-green-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('sowing')}
        >
          Sowing Dates
        </button>
        <button
          className={`px-4 py-2 border-b-2 ${
            activeTab === 'tasks'
              ? 'border-green-500 text-green-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('tasks')}
        >
          Garden Tasks
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          {error}
        </div>
      )}

      {activeTab === 'tasks' ? (
        <form onSubmit={handleTaskSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <div className="flex items-center gap-4 mb-4">
                <button
                  type="button"
                  className={`px-4 py-2 rounded-md ${
                    !isCustomTask
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                  onClick={() => setIsCustomTask(false)}
                >
                  Select from List
                </button>
                <button
                  type="button"
                  className={`px-4 py-2 rounded-md ${
                    isCustomTask
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                  onClick={() => setIsCustomTask(true)}
                >
                  Create Custom Task
                </button>
              </div>

              {isCustomTask ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                      <Edit3 className="h-4 w-4" />
                      Task Name
                    </label>
                    <input
                      type="text"
                      className="w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                      value={customTaskData.name}
                      onChange={(e) => setCustomTaskData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter task name"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      className="w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                      value={customTaskData.description}
                      onChange={(e) => setCustomTaskData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Enter task description"
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category
                    </label>
                    <input
                      type="text"
                      className="w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                      value={customTaskData.category}
                      onChange={(e) => setCustomTaskData(prev => ({ ...prev, category: e.target.value }))}
                      placeholder="Enter category"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                    <ListTodo className="h-4 w-4" />
                    Task
                  </label>
                  <select
                    className="w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                    value={selectedTaskId}
                    onChange={(e) => setSelectedTaskId(e.target.value)}
                    required={!isCustomTask}
                  >
                    <option value="">Select a task</option>
                    {Object.entries(
                      gardenTasks.reduce((acc, task) => {
                        if (!acc[task.category]) acc[task.category] = [];
                        acc[task.category].push(task);
                        return acc;
                      }, {} as Record<string, typeof gardenTasks>)
                    ).map(([category, tasks]) => (
                      <optgroup key={category} label={category}>
                        {tasks.map(task => (
                          <option key={task.id} value={task.id}>
                            {task.name}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                  {selectedTaskId && (
                    <p className="mt-1 text-sm text-gray-500">
                      {gardenTasks.find(t => t.id === selectedTaskId)?.description}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                <CalendarDays className="h-4 w-4" />
                Start Date
              </label>
              <div className="relative w-full">
                <input
                  type="date"
                  style={dateInputStyle}
                  value={taskFormData.startDate}
                  onChange={(e) => setTaskFormData(prev => ({ ...prev, startDate: e.target.value }))}
                  required
                />
                <div style={dateDisplayStyle}>
                  {formatDate(new Date(taskFormData.startDate), settings.dateFormat)}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Repeat Every (days)
              </label>
              <input
                type="number"
                min="1"
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                value={taskFormData.successionInterval}
                onChange={(e) => setTaskFormData(prev => ({ ...prev, successionInterval: parseInt(e.target.value) }))}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Number of Occurrences
              </label>
              <input
                type="number"
                min="1"
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                value={taskFormData.successionCount}
                onChange={(e) => setTaskFormData(prev => ({ ...prev, successionCount: parseInt(e.target.value) }))}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors duration-200 flex items-center justify-center gap-2"
          >
            <Plus className="h-5 w-5" />
            Add Task to Schedule
          </button>
        </form>
      ) : (
        <form onSubmit={handleSowingSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                <CalendarDays className="h-4 w-4" />
                {skipSowingDate ? 'Transplant Date' : 'First Sowing Date'}
              </label>
              <div className="relative w-full">
                <input
                  type="date"
                  style={dateInputStyle}
                  value={sowingFormData.sowingDate}
                  onChange={(e) => {
                    setSowingFormData({ ...sowingFormData, sowingDate: e.target.value });
                    setSelectedCrop(null);
                    setSowingFormData(prev => ({ ...prev, varietyId: '' }));
                  }}
                />
                <div style={dateDisplayStyle}>
                  {formatDate(new Date(sowingFormData.sowingDate), settings.dateFormat)}
                </div>
              </div>
              <div className="mt-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={skipSowingDate}
                    onChange={(e) => setSkipSowingDate(e.target.checked)}
                    className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <span className="text-sm text-gray-600">
                    Skip sowing date (for established plants)
                  </span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Crop Group
              </label>
              <select
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                value={selectedGroupId}
                onChange={(e) => {
                  setSelectedGroupId(e.target.value);
                  setSelectedCrop(null);
                  setSowingFormData(prev => ({ ...prev, varietyId: '' }));
                }}
              >
                <option value="">All Groups</option>
                {cropGroups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Crop
              </label>
              <select
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                value={selectedCrop?.id || ''}
                onChange={(e) => {
                  const crop = sowableCrops.find(c => c.id === e.target.value);
                  setSelectedCrop(crop || null);
                  setSowingFormData(prev => ({ ...prev, varietyId: '' }));
                  if (crop) {
                    setSelectedGroupId(crop.groupId);
                  }
                }}
                required
              >
                <option value="">Select a crop</option>
                {Object.entries(
                  sowableCrops.reduce((acc, crop) => {
                    const group = cropGroups.find(g => g.id === crop.groupId);
                    const groupName = group?.name || 'Other';
                    if (!acc[groupName]) acc[groupName] = [];
                    acc[groupName].push(crop);
                    return acc;
                  }, {} as Record<string, typeof sowableCrops>)
                ).map(([groupName, crops]) => (
                  <optgroup key={groupName} label={groupName}>
                    {crops.map(crop => (
                      <option key={crop.id} value={crop.id}>
                        {crop.name} {crop.id.startsWith('custom-') ? '(Custom)' : ''}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Variety
              </label>
              <select
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                value={sowingFormData.varietyId}
                onChange={(e) => setSowingFormData(prev => ({ ...prev, varietyId: e.target.value }))}
                disabled={!selectedCrop}
                required
              >
                <option value="">Select a variety</option>
                {sowableVarieties.map((variety) => (
                  <option key={variety.id} value={variety.id}>
                    {variety.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Succession Interval (days)
              </label>
              <input
                type="number"
                min="1"
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                value={sowingFormData.successionInterval}
                onChange={(e) => setSowingFormData(prev => ({ ...prev, successionInterval: parseInt(e.target.value) }))}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Number of Successions
              </label>
              <input
                type="number"
                min="1"
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                value={sowingFormData.successionCount}
                onChange={(e) => setSowingFormData(prev => ({ ...prev, successionCount: parseInt(e.target.value) }))}
                required
              />
            </div>
          </div>

          {selectedCrop && sowingFormData.varietyId && (
            <div className="bg-gray-50 rounded-md p-4 space-y-2">
              <p className="text-sm text-gray-600">
                <strong>Growing Information:</strong>
              </p>
              {!skipSowingDate && (
                <p className="text-sm text-gray-600">
                  • Days to germination: {sowableVarieties.find(v => v.id === sowingFormData.varietyId)?.daysToGermination}
                </p>
              )}
              <p className="text-sm text-gray-600">
                • Days to transplant: {sowableVarieties.find(v => v.id === sowingFormData.varietyId)?.daysToTransplant}
              </p>
              <p className="text-sm text-gray-600">
                • Days to harvest: {sowableVarieties.find(v => v.id === sowingFormData.varietyId)?.daysToHarvest}
              </p>
              <p className="text-sm text-gray-600">
                • Growing method: {sowableVarieties.find(v => v.id === sowingFormData.varietyId)?.method}
              </p>
              <p className="text-sm text-gray-600">
                • Sowing type: {sowableVarieties.find(v => v.id === sowingFormData.varietyId)?.sowingType}
              </p>
              {!skipSowingDate && (
                <p className="text-sm text-gray-600">
                  • Sowing period: {getMonthName(sowableVarieties.find(v => v.id === sowingFormData.varietyId)?.startMonth || 1)} to {getMonthName(sowableVarieties.find(v => v.id === sowingFormData.varietyId)?.endMonth || 12)}
                </p>
              )}
              {sowableVarieties.find(v => v.id === sowingFormData.varietyId)?.overwinter && (
                <p className="text-sm text-green-600 font-medium">
                  • Suitable for overwintering
                </p>
              )}
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors duration-200 flex items-center justify-center gap-2"
          >
            <Plus className="h-5 w-5" />
            Add to Schedule
          </button>
        </form>
      )}
    </div>
  );
}