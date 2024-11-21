import React, { useState, useMemo } from 'react';
import { usePlanning } from '../context/PlanningContext';
import { useInventory } from '../context/InventoryContext';
import { useSettings } from '../context/settings';
import { cropGroups } from '../data/cropGroups';
import { Clock, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatDate } from '../utils/dateFormat';
import type { SowingPlan, ProgressFilter } from '../types';
import ProgressBar from './ProgressBar';
import StatusUpdateModal from './StatusUpdateModal';
import HarvestModal from './HarvestModal';

const stages = [
  { value: 'sowing', label: 'Sowing' },
  { value: 'growing', label: 'Growing' },
  { value: 'harvest-ready', label: 'Ready to Harvest' },
  { value: 'harvested', label: 'Harvested' },
  { value: 'failed', label: 'Failed' }
] as const;

export default function ProgressTracking() {
  const { plans, updatePlan } = usePlanning();
  const { customCrops, defaultCrops: crops } = useInventory();
  const { settings } = useSettings();
  const [trackingDate, setTrackingDate] = useState(new Date().toISOString().split('T')[0]);
  const [showStagesDropdown, setShowStagesDropdown] = useState(false);
  const [filters, setFilters] = useState<ProgressFilter>({
    stages: new Set(['sowing', 'growing', 'harvest-ready']),
    groupId: '',
    cropId: '',
  });
  const [statusModal, setStatusModal] = useState<{ plan: SowingPlan; type: 'damage' | 'destruction' | 'harvest-estimate' } | null>(null);
  const [harvestModal, setHarvestModal] = useState<SowingPlan | null>(null);

  const allCrops = useMemo(() => 
    [...crops, ...customCrops].sort((a, b) => a.name.localeCompare(b.name)),
    [customCrops, crops]
  );

  const navigateMonth = (direction: 'prev' | 'next') => {
    const date = new Date(trackingDate);
    if (direction === 'prev') {
      date.setMonth(date.getMonth() - 1);
    } else {
      date.setMonth(date.getMonth() + 1);
    }
    setTrackingDate(date.toISOString().split('T')[0]);
  };

  const sowingPlans = useMemo(() => {
    const currentDate = new Date(trackingDate);
    return plans
      .filter((plan): plan is SowingPlan => 
        plan.type === 'sowing' && 
        new Date(plan.sowingDate) <= currentDate
      );
  }, [plans, trackingDate]);

  const filteredCrops = useMemo(() => {
    if (!filters.groupId) return allCrops;
    return allCrops.filter(crop => crop.groupId === filters.groupId);
  }, [allCrops, filters.groupId]);

  const calculateProgress = (plan: SowingPlan): number => {
    if (plan.status === 'failed') return 0;
    
    const currentDate = new Date(trackingDate);
    const sowingDate = new Date(plan.sowingDate);
    const harvestDate = plan.harvestDate 
      ? new Date(plan.harvestDate)
      : plan.estimatedHarvestDate
        ? new Date(plan.estimatedHarvestDate)
        : new Date(sowingDate.getTime() + (60 * 24 * 60 * 60 * 1000));

    const totalDuration = harvestDate.getTime() - sowingDate.getTime();
    const elapsed = currentDate.getTime() - sowingDate.getTime();
    return Math.min(Math.max((elapsed / totalDuration) * 100, 0), 100);
  };

  const getStage = (plan: SowingPlan): 'sowing' | 'growing' | 'harvest-ready' | 'harvested' | 'failed' => {
    const currentDate = new Date(trackingDate);
    
    if (plan.status === 'failed') return 'failed';
    if (plan.harvestDate) return 'harvested';
    
    const progress = calculateProgress(plan);
    
    if (plan.status === 'damaged') {
      return progress === 100 ? 'harvest-ready' : 'growing';
    }
    
    if (progress === 100) return 'harvest-ready';
    if (progress <= 20) return 'sowing';
    return 'growing';
  };

  const toggleAllStages = () => {
    setFilters(prev => ({
      ...prev,
      stages: prev.stages.size === stages.length ? new Set() : new Set(stages.map(s => s.value))
    }));
  };

  const toggleStage = (stage: typeof stages[number]['value']) => {
    setFilters(prev => {
      const newStages = new Set(prev.stages);
      if (newStages.has(stage)) {
        newStages.delete(stage);
      } else {
        newStages.add(stage);
      }
      return { ...prev, stages: newStages };
    });
  };

  const filteredPlans = useMemo(() => {
    return sowingPlans.filter(plan => {
      const stage = getStage(plan);
      if (!filters.stages.has(stage)) return false;
      if (filters.groupId) {
        const crop = allCrops.find(c => c.id === plan.cropId);
        if (!crop || crop.groupId !== filters.groupId) return false;
      }
      if (filters.cropId && plan.cropId !== filters.cropId) return false;
      return true;
    });
  }, [sowingPlans, filters, allCrops, trackingDate]);

  const handleHarvest = async (planId: string, harvestDate: string) => {
    try {
      await updatePlan(planId, { 
        harvestDate,
        status: 'harvested'
      });
    } catch (error) {
      console.error('Failed to update harvest status:', error);
    }
  };

  const handleStatusUpdate = async (planId: string, updates: Partial<SowingPlan>) => {
    try {
      await updatePlan(planId, updates);
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-green-800 flex items-center gap-2">
            <Clock className="h-6 w-6" />
            Progress Tracking
          </h2>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigateMonth('prev')}
                className="p-2 hover:bg-gray-100 rounded-full"
                aria-label="Previous month"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <input
                type="date"
                className="border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                value={trackingDate}
                onChange={(e) => setTrackingDate(e.target.value)}
              />
              <button
                onClick={() => navigateMonth('next')}
                className="p-2 hover:bg-gray-100 rounded-full"
                aria-label="Next month"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-4 mb-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Growth Stages
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowStagesDropdown(!showStagesDropdown)}
                  className="w-full flex items-center justify-between gap-2 px-3 py-2 border border-gray-300 rounded-md bg-white text-left text-sm"
                >
                  <span>
                    {filters.stages.size === 0
                      ? 'Select stages'
                      : filters.stages.size === stages.length
                      ? 'All stages'
                      : `${filters.stages.size} selected`}
                  </span>
                  <Filter className="h-4 w-4" />
                </button>
                
                {showStagesDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
                    <div className="p-2 border-b">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={filters.stages.size === stages.length}
                          onChange={toggleAllStages}
                          className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                        />
                        <span className="text-sm font-medium">All Stages</span>
                      </label>
                    </div>
                    <div className="p-2 space-y-2">
                      {stages.map(({ value, label }) => (
                        <label key={value} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={filters.stages.has(value)}
                            onChange={() => toggleStage(value)}
                            className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                          />
                          <span className="text-sm">{label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Crop Group
              </label>
              <select
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                value={filters.groupId}
                onChange={(e) => setFilters(prev => ({ ...prev, groupId: e.target.value, cropId: '' }))}
              >
                <option value="">All Groups</option>
                {cropGroups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Crop Type
              </label>
              <select
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                value={filters.cropId}
                onChange={(e) => setFilters(prev => ({ ...prev, cropId: e.target.value }))}
              >
                <option value="">All Crops</option>
                {filteredCrops.map((crop) => (
                  <option key={crop.id} value={crop.id}>
                    {crop.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {filteredPlans.map((plan) => {
            const crop = allCrops.find(c => c.id === plan.cropId);
            const variety = crop?.varieties.find(v => v.id === plan.varietyId);
            if (!crop || !variety) return null;

            const progress = calculateProgress(plan);
            const stage = getStage(plan);
            const showDamageButtons = !plan.harvestDate && plan.status !== 'failed';

            return (
              <div key={plan.id} className="border rounded-lg p-4 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {crop.name} - {variety.name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      Sown: {formatDate(new Date(plan.sowingDate), settings.dateFormat)}
                    </p>
                    {plan.harvestDate && (
                      <p className="text-sm text-purple-600">
                        Harvested: {formatDate(new Date(plan.harvestDate), settings.dateFormat)}
                      </p>
                    )}
                    {plan.estimatedHarvestDate && !plan.harvestDate && (
                      <p className="text-sm text-blue-600">
                        Expected Harvest: {formatDate(new Date(plan.estimatedHarvestDate), settings.dateFormat)}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2">
                    {showDamageButtons && (
                      <>
                        <button
                          onClick={() => setStatusModal({ plan, type: 'damage' })}
                          className="px-2 py-1 text-sm text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50 rounded"
                        >
                          Report Damage
                        </button>
                        <button
                          onClick={() => setStatusModal({ plan, type: 'destruction' })}
                          className="px-2 py-1 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded"
                        >
                          Report Loss
                        </button>
                        <button
                          onClick={() => setStatusModal({ plan, type: 'harvest-estimate' })}
                          className="px-2 py-1 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded"
                        >
                          Update Harvest Date
                        </button>
                        {(stage === 'harvest-ready' || plan.status === 'damaged') && (
                          <button
                            onClick={() => setHarvestModal(plan)}
                            className="px-2 py-1 text-sm text-green-600 hover:text-green-700 hover:bg-green-50 rounded"
                          >
                            Mark as Harvested
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>

                <ProgressBar
                  progress={progress}
                  isHarvested={!!plan.harvestDate}
                  status={plan.status}
                />
              </div>
            );
          })}

          {filteredPlans.length === 0 && (
            <p className="text-center text-gray-500 py-4">
              No crops match the selected filters
            </p>
          )}
        </div>
      </div>

      {statusModal && (
        <StatusUpdateModal
          plan={statusModal.plan}
          type={statusModal.type}
          onSave={handleStatusUpdate}
          onClose={() => setStatusModal(null)}
          currentDate={new Date(trackingDate)}
        />
      )}

      {harvestModal && (
        <HarvestModal
          plan={harvestModal}
          onSave={handleHarvest}
          onClose={() => setHarvestModal(null)}
        />
      )}
    </div>
  );
}