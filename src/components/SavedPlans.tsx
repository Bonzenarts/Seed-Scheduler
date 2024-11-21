import React, { useState, useMemo } from 'react';
import { usePlanning } from '../context/PlanningContext';
import { useInventory } from '../context/InventoryContext';
import { useSettings } from '../context/settings';
import { gardenTasks } from '../data/gardenTasks';
import { ListChecks, Trash2, Edit2, Download, CheckSquare, Square, X, Eye, Filter } from 'lucide-react';
import { formatDate } from '../utils/dateFormat';
import EditPlanModal from './EditPlanModal';
import ExportModal from './ExportModal';
import type { Plan, SowingPlan, TaskPlan, CalendarViewType } from '../types';

interface SavedPlansProps {
  currentDate: Date;
  viewType: CalendarViewType;
}

type PlanTypeFilter = 'all' | 'sowing' | 'task';

export default function SavedPlans({ currentDate, viewType }: SavedPlansProps) {
  const { plans, deletePlan, updatePlan, exportPlans, isLoading } = usePlanning();
  const { customCrops, defaultCrops: crops } = useInventory();
  const { settings } = useSettings();
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [selectedPlans, setSelectedPlans] = useState<Set<string>>(new Set());
  const [showExportModal, setShowExportModal] = useState(false);
  const [showAllPlans, setShowAllPlans] = useState(false);
  const [planTypeFilter, setPlanTypeFilter] = useState<PlanTypeFilter>('all');

  const allCrops = useMemo(() => 
    [...crops, ...customCrops].sort((a, b) => a.name.localeCompare(b.name)),
    [customCrops, crops]
  );

  const getCropAndVarietyNames = (cropId: string, varietyId: string) => {
    const crop = allCrops.find((c) => c.id === cropId);
    const variety = crop?.varieties.find((v) => v.id === varietyId);
    return { cropName: crop?.name, varietyName: variety?.name };
  };

  const getTaskName = (taskId: string, taskName?: string) => {
    if (taskName) return taskName;
    const task = gardenTasks.find(t => t.id === taskId);
    return task?.name || 'Unknown Task';
  };

  const getTaskDescription = (taskId: string, taskDescription?: string) => {
    if (taskDescription) return taskDescription;
    const task = gardenTasks.find(t => t.id === taskId);
    return task?.description || '';
  };

  const toggleSelectAll = () => {
    if (selectedPlans.size === filteredPlans.length) {
      setSelectedPlans(new Set());
    } else {
      setSelectedPlans(new Set(filteredPlans.map(plan => plan.id)));
    }
  };

  const togglePlanSelection = (planId: string) => {
    const newSelection = new Set(selectedPlans);
    if (newSelection.has(planId)) {
      newSelection.delete(planId);
    } else {
      newSelection.add(planId);
    }
    setSelectedPlans(newSelection);
  };

  const handleBulkDelete = () => {
    const selectedCount = selectedPlans.size;
    if (selectedCount === 0) return;

    if (window.confirm(`Delete ${selectedCount} selected plan${selectedCount > 1 ? 's' : ''}?`)) {
      Array.from(selectedPlans).forEach(id => {
        deletePlan(id);
      });
      setSelectedPlans(new Set());
    }
  };

  const handleBulkEdit = () => {
    const selectedPlansList = plans.filter(plan => selectedPlans.has(plan.id));
    if (selectedPlansList.length > 0) {
      setEditingPlan(selectedPlansList[0]);
    }
  };

  const handleBulkUpdate = (updatedPlan: Plan) => {
    const selectedPlansList = plans.filter(plan => selectedPlans.has(plan.id));
    const date = updatedPlan.type === 'sowing' 
      ? (updatedPlan as SowingPlan).sowingDate 
      : (updatedPlan as TaskPlan).startDate;

    selectedPlansList.forEach(plan => {
      if (plan.type === 'sowing') {
        updatePlan(plan.id, {
          sowingDate: date,
          successionInterval: updatedPlan.type === 'sowing' 
            ? (updatedPlan as SowingPlan).successionInterval 
            : plan.successionInterval,
          successionCount: updatedPlan.type === 'sowing'
            ? (updatedPlan as SowingPlan).successionCount
            : plan.successionCount,
        });
      } else {
        updatePlan(plan.id, {
          startDate: date,
          successionInterval: updatedPlan.type === 'task'
            ? (updatedPlan as TaskPlan).successionInterval
            : plan.successionInterval,
          successionCount: updatedPlan.type === 'task'
            ? (updatedPlan as TaskPlan).successionCount
            : plan.successionCount,
        });
      }
    });

    setEditingPlan(null);
    setSelectedPlans(new Set());
  };

  const handleExport = () => {
    const selectedPlansList = plans.filter(plan => selectedPlans.has(plan.id));
    if (selectedPlansList.length === 0) {
      alert('Please select plans to export');
      return;
    }
    setShowExportModal(true);
  };

  const filteredPlans = useMemo(() => {
    let filtered = plans;

    // Filter by month if in month view and not showing all plans
    if (viewType === 'month' && !showAllPlans) {
      filtered = plans.filter(plan => {
        const planDate = new Date(
          plan.type === 'sowing' 
            ? (plan as SowingPlan).sowingDate 
            : (plan as TaskPlan).startDate
        );
        return planDate.getMonth() === currentDate.getMonth() &&
               planDate.getFullYear() === currentDate.getFullYear();
      });
    }

    // Apply plan type filter
    if (planTypeFilter !== 'all') {
      filtered = filtered.filter(plan => plan.type === planTypeFilter);
    }

    return filtered;
  }, [plans, currentDate, viewType, showAllPlans, planTypeFilter]);

  const renderControls = (isPopup: boolean = false) => (
    <div className={`flex items-center justify-between ${isPopup ? 'mb-4' : 'mb-6'}`}>
      <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-2">
        <button
          onClick={() => setPlanTypeFilter('all')}
          className={`px-3 py-1 rounded-md ${
            planTypeFilter === 'all' ? 'bg-white shadow' : ''
          }`}
        >
          All
        </button>
        <button
          onClick={() => setPlanTypeFilter('sowing')}
          className={`px-3 py-1 rounded-md ${
            planTypeFilter === 'sowing' ? 'bg-white shadow' : ''
          }`}
        >
          Sowing
        </button>
        <button
          onClick={() => setPlanTypeFilter('task')}
          className={`px-3 py-1 rounded-md ${
            planTypeFilter === 'task' ? 'bg-white shadow' : ''
          }`}
        >
          Tasks
        </button>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={toggleSelectAll}
          className="text-gray-600 hover:text-gray-800 flex items-center gap-2"
        >
          {selectedPlans.size === filteredPlans.length ? (
            <CheckSquare className="h-5 w-5" />
          ) : (
            <Square className="h-5 w-5" />
          )}
          {selectedPlans.size === filteredPlans.length ? 'Deselect All' : 'Select All'}
        </button>
        {selectedPlans.size > 0 && (
          <>
            <button
              onClick={handleBulkDelete}
              className="text-red-600 hover:text-red-700 p-2 rounded-full hover:bg-red-50"
              title="Delete selected"
            >
              <Trash2 className="h-5 w-5" />
            </button>
            <button
              onClick={handleBulkEdit}
              className="text-blue-600 hover:text-blue-700 p-2 rounded-full hover:bg-blue-50"
              title="Edit selected"
            >
              <Edit2 className="h-5 w-5" />
            </button>
            <button
              onClick={handleExport}
              className="text-green-600 hover:text-green-700 p-2 rounded-full hover:bg-green-50"
              title="Export selected"
            >
              <Download className="h-5 w-5" />
            </button>
          </>
        )}
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-green-800 flex items-center gap-2">
          <ListChecks className="h-6 w-6" />
          Saved Plans
        </h2>
        
        {plans.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAllPlans(true)}
              className="text-green-600 hover:text-green-700 flex items-center gap-2"
            >
              <Eye className="h-5 w-5" />
              View All Plans
            </button>
          </div>
        )}
      </div>

      {renderControls()}

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
        </div>
      ) : filteredPlans.length === 0 ? (
        <p className="text-gray-500 text-center py-4">No plans for this period</p>
      ) : (
        <div className="space-y-4">
          {filteredPlans.map((plan) => {
            const isSelected = selectedPlans.has(plan.id);
            
            return (
              <div
                key={plan.id}
                className={`flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 ${
                  isSelected ? 'bg-green-50 border-green-200' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => togglePlanSelection(plan.id)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    {isSelected ? (
                      <CheckSquare className="h-5 w-5 text-green-600" />
                    ) : (
                      <Square className="h-5 w-5" />
                    )}
                  </button>
                  <div>
                    {plan.type === 'sowing' ? (
                      <>
                        <h3 className="font-medium text-gray-900">
                          {(() => {
                            const { cropName, varietyName } = getCropAndVarietyNames(
                              plan.cropId,
                              plan.varietyId
                            );
                            return `${cropName} - ${varietyName}`;
                          })()}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {(plan as SowingPlan).skipSowingDate ? 'Transplant Date: ' : 'First Sowing: '}
                          {formatDate(new Date(plan.sowingDate), settings.dateFormat)}
                        </p>
                        <p className="text-sm text-gray-500">
                          {plan.successionCount} succession{plan.successionCount > 1 ? 's' : ''} every{' '}
                          {plan.successionInterval} days
                        </p>
                        {(plan as SowingPlan).harvestDate && (
                          <p className="text-sm text-purple-600">
                            Harvested: {formatDate(new Date((plan as SowingPlan).harvestDate!), settings.dateFormat)}
                          </p>
                        )}
                        {(plan as SowingPlan).estimatedHarvestDate && !(plan as SowingPlan).harvestDate && (
                          <p className="text-sm text-blue-600">
                            Expected Harvest: {formatDate(new Date((plan as SowingPlan).estimatedHarvestDate!), settings.dateFormat)}
                          </p>
                        )}
                        {(plan as SowingPlan).status === 'failed' && (
                          <p className="text-sm text-red-600">
                            Failed: {(plan as SowingPlan).reasonCode}
                          </p>
                        )}
                      </>
                    ) : (
                      <>
                        <h3 className="font-medium text-gray-900">
                          {getTaskName((plan as TaskPlan).taskId, (plan as TaskPlan).taskName)}
                        </h3>
                        <p className="text-sm text-gray-500">
                          Task Date: {formatDate(new Date((plan as TaskPlan).startDate), settings.dateFormat)}
                        </p>
                        {plan.successionCount > 1 ? (
                          <p className="text-sm text-gray-500">
                            {plan.successionCount} occurrence{plan.successionCount > 1 ? 's' : ''} every{' '}
                            {plan.successionInterval} days
                          </p>
                        ) : (
                          <p className="text-sm text-gray-500">
                            {getTaskDescription((plan as TaskPlan).taskId, (plan as TaskPlan).taskDescription)}
                          </p>
                        )}
                      </>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => deletePlan(plan.id)}
                  className="text-red-600 hover:text-red-700 p-1 rounded-full hover:bg-red-50"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {showAllPlans && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="p-6 border-b sticky top-0 bg-white z-10">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-semibold">All Saved Plans</h2>
                <button
                  onClick={() => setShowAllPlans(false)}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {renderControls(true)}
            </div>

            <div className="p-6 overflow-y-auto">
              {filteredPlans.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No plans found</p>
              ) : (
                <div className="space-y-4">
                  {filteredPlans.map((plan) => {
                    const isSelected = selectedPlans.has(plan.id);
                    
                    return (
                      <div
                        key={plan.id}
                        className={`flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 ${
                          isSelected ? 'bg-green-50 border-green-200' : ''
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => togglePlanSelection(plan.id)}
                            className="text-gray-500 hover:text-gray-700"
                          >
                            {isSelected ? (
                              <CheckSquare className="h-5 w-5 text-green-600" />
                            ) : (
                              <Square className="h-5 w-5" />
                            )}
                          </button>
                          <div>
                            {plan.type === 'sowing' ? (
                              <>
                                <h3 className="font-medium text-gray-900">
                                  {(() => {
                                    const { cropName, varietyName } = getCropAndVarietyNames(
                                      plan.cropId,
                                      plan.varietyId
                                    );
                                    return `${cropName} - ${varietyName}`;
                                  })()}
                                </h3>
                                <p className="text-sm text-gray-500">
                                  {(plan as SowingPlan).skipSowingDate ? 'Transplant Date: ' : 'First Sowing: '}
                                  {formatDate(new Date(plan.sowingDate), settings.dateFormat)}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {plan.successionCount} succession{plan.successionCount > 1 ? 's' : ''} every{' '}
                                  {plan.successionInterval} days
                                </p>
                                {(plan as SowingPlan).harvestDate && (
                                  <p className="text-sm text-purple-600">
                                    Harvested: {formatDate(new Date((plan as SowingPlan).harvestDate!), settings.dateFormat)}
                                  </p>
                                )}
                                {(plan as SowingPlan).estimatedHarvestDate && !(plan as SowingPlan).harvestDate && (
                                  <p className="text-sm text-blue-600">
                                    Expected Harvest: {formatDate(new Date((plan as SowingPlan).estimatedHarvestDate!), settings.dateFormat)}
                                  </p>
                                )}
                                {(plan as SowingPlan).status === 'failed' && (
                                  <p className="text-sm text-red-600">
                                    Failed: {(plan as SowingPlan).reasonCode}
                                  </p>
                                )}
                              </>
                            ) : (
                              <>
                                <h3 className="font-medium text-gray-900">
                                  {getTaskName((plan as TaskPlan).taskId, (plan as TaskPlan).taskName)}
                                </h3>
                                <p className="text-sm text-gray-500">
                                  Task Date: {formatDate(new Date((plan as TaskPlan).startDate), settings.dateFormat)}
                                </p>
                                {plan.successionCount > 1 ? (
                                  <p className="text-sm text-gray-500">
                                    {plan.successionCount} occurrence{plan.successionCount > 1 ? 's' : ''} every{' '}
                                    {plan.successionInterval} days
                                  </p>
                                ) : (
                                  <p className="text-sm text-gray-500">
                                    {getTaskDescription((plan as TaskPlan).taskId, (plan as TaskPlan).taskDescription)}
                                  </p>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => deletePlan(plan.id)}
                          className="text-red-600 hover:text-red-700 p-1 rounded-full hover:bg-red-50"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {editingPlan && (
        <EditPlanModal
          plan={editingPlan}
          onSave={handleBulkUpdate}
          onClose={() => {
            setEditingPlan(null);
            setSelectedPlans(new Set());
          }}
          isMultiEdit={selectedPlans.size > 1}
        />
      )}

      {showExportModal && (
        <ExportModal
          plans={plans.filter(plan => selectedPlans.has(plan.id))}
          onExport={exportPlans}
          onClose={() => {
            setShowExportModal(false);
            setSelectedPlans(new Set());
          }}
        />
      )}
    </div>
  );
}