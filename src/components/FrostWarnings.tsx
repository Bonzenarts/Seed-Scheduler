import React from 'react';
import { usePlanning } from '../context/PlanningContext';
import { useInventory } from '../context/InventoryContext';
import { useSettings } from '../context/settings';
import { Snowflake, AlertTriangle } from 'lucide-react';
import { formatDate } from '../utils/dateFormat';
import type { SowingPlan } from '../types';

interface FrostWarningsProps {
  currentDate: Date;
}

export default function FrostWarnings({ currentDate }: FrostWarningsProps) {
  const { plans } = usePlanning();
  const { customCrops, defaultCrops: crops } = useInventory();
  const { settings } = useSettings();

  const allCrops = [...crops, ...customCrops];
  const currentMonth = currentDate.getMonth() + 1;

  // Get all sowing plans that have frost-sensitive crops
  const frostSensitivePlans = plans.filter((plan): plan is SowingPlan => {
    if (plan.type !== 'sowing') return false;

    const crop = allCrops.find(c => c.id === plan.cropId);
    const variety = crop?.varieties.find(v => v.id === plan.varietyId);

    if (!variety || !['high', 'moderate'].includes(variety.frostSensitivity)) return false;

    // Calculate growing period dates
    const sowingDate = new Date(plan.sowingDate);
    const harvestDate = new Date(sowingDate);
    harvestDate.setDate(harvestDate.getDate() + variety.daysToHarvest);

    // Check if the crop is still growing in the current month
    return sowingDate <= currentDate && harvestDate >= currentDate;
  });

  if (!settings.lastSpringFrost || !settings.firstAutumnFrost || frostSensitivePlans.length === 0) {
    return null;
  }

  const lastSpringFrost = new Date(settings.lastSpringFrost);
  const firstAutumnFrost = new Date(settings.firstAutumnFrost);

  // Set years to current year for comparison
  lastSpringFrost.setFullYear(currentDate.getFullYear());
  firstAutumnFrost.setFullYear(currentDate.getFullYear());

  // Check if we're in a frost risk period
  const isSpringFrostRisk = currentDate <= lastSpringFrost;
  const isAutumnFrostRisk = currentDate >= firstAutumnFrost;

  if (!isSpringFrostRisk && !isAutumnFrostRisk) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-blue-800 flex items-center gap-2">
          <Snowflake className="h-6 w-6" />
          Frost Warnings
        </h2>
      </div>

      <div className="space-y-4">
        {isSpringFrostRisk && (
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-blue-800">Spring Frost Risk</h3>
                <p className="text-sm text-blue-600 mt-1">
                  Last spring frost expected around {formatDate(lastSpringFrost, settings.dateFormat)}
                </p>
                <div className="mt-2 space-y-2">
                  {frostSensitivePlans.map(plan => {
                    const crop = allCrops.find(c => c.id === plan.cropId);
                    const variety = crop?.varieties.find(v => v.id === plan.varietyId);
                    if (!crop || !variety) return null;

                    return (
                      <div key={plan.id} className="text-sm">
                        <span className="font-medium">{crop.name} - {variety.name}</span>
                        <span className="text-blue-500 ml-2">
                          (Frost Sensitivity: {variety.frostSensitivity})
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {isAutumnFrostRisk && (
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-blue-800">Autumn Frost Risk</h3>
                <p className="text-sm text-blue-600 mt-1">
                  First autumn frost expected around {formatDate(firstAutumnFrost, settings.dateFormat)}
                </p>
                <div className="mt-2 space-y-2">
                  {frostSensitivePlans.map(plan => {
                    const crop = allCrops.find(c => c.id === plan.cropId);
                    const variety = crop?.varieties.find(v => v.id === plan.varietyId);
                    if (!crop || !variety) return null;

                    return (
                      <div key={plan.id} className="text-sm">
                        <span className="font-medium">{crop.name} - {variety.name}</span>
                        <span className="text-blue-500 ml-2">
                          (Frost Sensitivity: {variety.frostSensitivity})
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}