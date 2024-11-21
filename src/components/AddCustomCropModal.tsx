import React, { useState, useMemo } from 'react';
import { X, Plus, Trash2, Edit2 } from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { cropGroups } from '../data/cropGroups';
import type { CropVariety, CropGroup } from '../types';
import AddInventoryModal from './AddInventoryModal';

interface AddCustomCropModalProps {
  onClose: () => void;
}

const growingMethods = [
  'Direct sow',
  'Modular trays',
  'Direct into the ground or modular trays',
  'Root trainers',
  'Pots',
  'Greenhouse beds',
  'Raised beds'
];

const initialVariety: Omit<CropVariety, 'id'> = {
  name: '',
  daysToGermination: 7,
  daysToTransplant: 21,
  daysToHarvest: 60,
  startMonth: 1,
  endMonth: 12,
  method: growingMethods[0],
  sowingType: 'Indoor/Outdoor',
  overwinter: false,
  transplantingSize: { width: 1, height: 1 },
  harvestingSize: { width: 1, height: 1 },
  frostSensitivity: 'none',
  companionPlants: [],
  incompatiblePlants: [],
  spacing: { row: 6, column: 6 },
  frostWarning: {
    spring: { startMonth: 3, endMonth: 4 },
    fall: { startMonth: 10, endMonth: 11 },
  },
};

const initialCropGroup: Omit<CropGroup, 'id'> = {
  name: '',
  description: '',
};

export default function AddCustomCropModal({ onClose }: AddCustomCropModalProps) {
  const { addCustomCrop, customCrops, defaultCrops: crops } = useInventory();
  const [isNewCrop, setIsNewCrop] = useState(true);
  const [selectedExistingCropId, setSelectedExistingCropId] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [isAddingNewGroup, setIsAddingNewGroup] = useState(false);
  const [newGroup, setNewGroup] = useState(initialCropGroup);
  const [cropName, setCropName] = useState('');
  const [varieties, setVarieties] = useState<Omit<CropVariety, 'id'>[]>([{ ...initialVariety }]);
  const [showAddInventoryModal, setShowAddInventoryModal] = useState(false);
  const [newCropId, setNewCropId] = useState<string | null>(null);
  const [companionPlantInput, setCompanionPlantInput] = useState('');
  const [incompatiblePlantInput, setIncompatiblePlantInput] = useState('');

  const allCrops = useMemo(() => 
    [...crops, ...customCrops].sort((a, b) => a.name.localeCompare(b.name)),
    [customCrops, crops]
  );

  // Group crops by their group
  const groupedCrops = useMemo(() => {
    const grouped: Record<string, typeof allCrops> = {};
    allCrops.forEach(crop => {
      if (!grouped[crop.groupId]) {
        grouped[crop.groupId] = [];
      }
      grouped[crop.groupId].push(crop);
    });
    return grouped;
  }, [allCrops]);

  const handleAddVariety = () => {
    setVarieties([...varieties, { ...initialVariety }]);
  };

  const handleRemoveVariety = (index: number) => {
    setVarieties(varieties.filter((_, i) => i !== index));
  };

  const handleVarietyChange = (index: number, field: keyof CropVariety, value: any) => {
    setVarieties(
      varieties.map((variety, i) => {
        if (i !== index) return variety;
        if (field === 'companionPlants' || field === 'incompatiblePlants') {
          return {
            ...variety,
            [field]: Array.isArray(value) ? value : [value],
          };
        }
        if (field === 'transplantingSize' || field === 'harvestingSize') {
          return {
            ...variety,
            [field]: { ...variety[field], ...value },
          };
        }
        if (field === 'spacing') {
          return {
            ...variety,
            spacing: { ...variety.spacing, ...value },
          };
        }
        if (field === 'frostWarning') {
          return {
            ...variety,
            frostWarning: {
              ...variety.frostWarning,
              ...value,
            },
          };
        }
        return { ...variety, [field]: value };
      })
    );
  };

  const handleAddCompanionPlant = (index: number) => {
    if (!companionPlantInput.trim()) return;
    handleVarietyChange(index, 'companionPlants', [
      ...varieties[index].companionPlants,
      companionPlantInput.trim(),
    ]);
    setCompanionPlantInput('');
  };

  const handleAddIncompatiblePlant = (index: number) => {
    if (!incompatiblePlantInput.trim()) return;
    handleVarietyChange(index, 'incompatiblePlants', [
      ...varieties[index].incompatiblePlants,
      incompatiblePlantInput.trim(),
    ]);
    setIncompatiblePlantInput('');
  };

  const handleRemoveCompanionPlant = (index: number, plant: string) => {
    handleVarietyChange(
      index,
      'companionPlants',
      varieties[index].companionPlants.filter(p => p !== plant)
    );
  };

  const handleRemoveIncompatiblePlant = (index: number, plant: string) => {
    handleVarietyChange(
      index,
      'incompatiblePlants',
      varieties[index].incompatiblePlants.filter(p => p !== plant)
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isNewCrop) {
      if (!cropName) {
        alert('Please enter a crop name');
        return;
      }
      if (!selectedGroupId && !isAddingNewGroup) {
        alert('Please select a crop group or create a new one');
        return;
      }
      if (isAddingNewGroup && !newGroup.name) {
        alert('Please enter a group name');
        return;
      }
    } else if (!selectedExistingCropId) {
      alert('Please select a crop');
      return;
    }
    if (varieties.some(v => !v.name)) {
      alert('Please fill in all variety names');
      return;
    }

    const varietiesWithIds = varieties.map(variety => ({
      ...variety,
      id: crypto.randomUUID(),
    }));

    if (isNewCrop) {
      const newCropId = `custom-${crypto.randomUUID()}`;
      setNewCropId(newCropId);
      addCustomCrop({
        name: cropName,
        groupId: isAddingNewGroup ? `custom-${crypto.randomUUID()}` : selectedGroupId,
        varieties: varietiesWithIds,
      });
    } else {
      const existingCrop = allCrops.find(c => c.id === selectedExistingCropId);
      if (!existingCrop) {
        alert('Selected crop not found');
        return;
      }

      // Check for duplicate variety names
      const duplicateNames = varietiesWithIds.some(newVar => 
        existingCrop.varieties.some(existingVar => 
          existingVar.name.toLowerCase() === newVar.name.toLowerCase()
        )
      );

      if (duplicateNames) {
        alert('One or more variety names already exist for this crop');
        return;
      }

      setNewCropId(selectedExistingCropId);
      addCustomCrop({
        name: existingCrop.name,
        groupId: existingCrop.groupId,
        varieties: [...existingCrop.varieties, ...varietiesWithIds],
      });
    }

    setShowAddInventoryModal(true);
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Add Custom Crop</h2>
            <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  What would you like to do?
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      checked={isNewCrop}
                      onChange={() => {
                        setIsNewCrop(true);
                        setIsAddingNewGroup(false);
                      }}
                      className="mr-2"
                    />
                    Add a new crop
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      checked={!isNewCrop}
                      onChange={() => {
                        setIsNewCrop(false);
                        setIsAddingNewGroup(false);
                      }}
                      className="mr-2"
                    />
                    Add varieties to an existing crop
                  </label>
                </div>
              </div>

              {isNewCrop ? (
                <>
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Crop Group
                      </label>
                      <button
                        type="button"
                        onClick={() => setIsAddingNewGroup(!isAddingNewGroup)}
                        className="text-sm text-green-600 hover:text-green-700"
                      >
                        {isAddingNewGroup ? 'Select Existing Group' : 'Create New Group'}
                      </button>
                    </div>
                    
                    {isAddingNewGroup ? (
                      <div className="space-y-3">
                        <input
                          type="text"
                          placeholder="Group Name"
                          className="w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                          value={newGroup.name}
                          onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                          required
                        />
                        <textarea
                          placeholder="Group Description"
                          className="w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                          value={newGroup.description}
                          onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
                          rows={3}
                        />
                      </div>
                    ) : (
                      <select
                        className="w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                        value={selectedGroupId}
                        onChange={(e) => setSelectedGroupId(e.target.value)}
                        required={!isAddingNewGroup}
                      >
                        <option value="">Select a crop group</option>
                        {cropGroups.map((group) => (
                          <option key={group.id} value={group.id}>
                            {group.name}
                          </option>
                        ))}
                      </select>
                    )}
                    {selectedGroupId && !isAddingNewGroup && (
                      <p className="mt-1 text-sm text-gray-500">
                        {cropGroups.find(g => g.id === selectedGroupId)?.description}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Crop Name
                    </label>
                    <input
                      type="text"
                      className="w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                      value={cropName}
                      onChange={(e) => setCropName(e.target.value)}
                      required={isNewCrop}
                    />
                  </div>
                </>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Existing Crop
                  </label>
                  <select
                    className="w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                    value={selectedExistingCropId}
                    onChange={(e) => setSelectedExistingCropId(e.target.value)}
                    required={!isNewCrop}
                  >
                    <option value="">Select a crop</option>
                    {cropGroups.map((group) => {
                      const groupCrops = groupedCrops[group.id] || [];
                      if (groupCrops.length === 0) return null;
                      
                      return (
                        <optgroup key={group.id} label={group.name}>
                          {groupCrops.map((crop) => (
                            <option key={crop.id} value={crop.id}>
                              {crop.name} {crop.id.startsWith('custom-') ? '(Custom)' : ''}
                            </option>
                          ))}
                        </optgroup>
                      );
                    })}
                  </select>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Varieties</h3>
                <button
                  type="button"
                  onClick={handleAddVariety}
                  className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-1"
                >
                  <Plus className="h-4 w-4" />
                  Add Variety
                </button>
              </div>

              {varieties.map((variety, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-4">
                  <div className="flex justify-between items-start">
                    <h4 className="text-md font-medium">Variety {index + 1}</h4>
                    {varieties.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveVariety(index)}
                        className="text-red-600 hover:text-red-700 p-1"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Variety Name
                      </label>
                      <input
                        type="text"
                        className="w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                        value={variety.name}
                        onChange={(e) => handleVarietyChange(index, 'name', e.target.value)}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Days to Germination
                      </label>
                      <input
                        type="number"
                        min="0"
                        className="w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                        value={variety.daysToGermination}
                        onChange={(e) => handleVarietyChange(index, 'daysToGermination', parseInt(e.target.value))}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Days to Transplant
                      </label>
                      <input
                        type="number"
                        min="0"
                        className="w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                        value={variety.daysToTransplant}
                        onChange={(e) => handleVarietyChange(index, 'daysToTransplant', parseInt(e.target.value))}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Days to Harvest
                      </label>
                      <input
                        type="number"
                        min="0"
                        className="w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                        value={variety.daysToHarvest}
                        onChange={(e) => handleVarietyChange(index, 'daysToHarvest', parseInt(e.target.value))}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Start Month
                      </label>
                      <select
                        className="w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                        value={variety.startMonth}
                        onChange={(e) => handleVarietyChange(index, 'startMonth', parseInt(e.target.value))}
                        required
                      >
                        {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                          <option key={month} value={month}>
                            {new Date(2024, month - 1).toLocaleString('default', { month: 'long' })}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        End Month
                      </label>
                      <select
                        className="w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                        value={variety.endMonth}
                        onChange={(e) => handleVarietyChange(index, 'endMonth', parseInt(e.target.value))}
                        required
                      >
                        {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                          <option key={month} value={month}>
                            {new Date(2024, month - 1).toLocaleString('default', { month: 'long' })}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Growing Method
                      </label>
                      <select
                        className="w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                        value={variety.method}
                        onChange={(e) => handleVarietyChange(index, 'method', e.target.value)}
                        required
                      >
                        {growingMethods.map((method) => (
                          <option key={method} value={method}>
                            {method}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Sowing Type
                      </label>
                      <select
                        className="w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                        value={variety.sowingType}
                        onChange={(e) => handleVarietyChange(index, 'sowingType', e.target.value)}
                        required
                      >
                        <option value="Indoor">Indoor</option>
                        <option value="Outdoor">Outdoor</option>
                        <option value="Indoor/Outdoor">Indoor/Outdoor</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Frost Sensitivity
                      </label>
                      <select
                        className="w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                        value={variety.frostSensitivity}
                        onChange={(e) => handleVarietyChange(index, 'frostSensitivity', e.target.value)}
                        required
                      >
                        <option value="none">None</option>
                        <option value="low">Low</option>
                        <option value="moderate">Moderate</option>
                        <option value="high">High</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Transplanting Size (Grid Blocks)
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          min="1"
                          placeholder="Width"
                          className="w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                          value={variety.transplantingSize.width}
                          onChange={(e) => handleVarietyChange(index, 'transplantingSize', { width: parseInt(e.target.value) })}
                          required
                        />
                        <input
                          type="number"
                          min="1"
                          placeholder="Height"
                          className="w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                          value={variety.transplantingSize.height}
                          onChange={(e) => handleVarietyChange(index, 'transplantingSize', { height: parseInt(e.target.value) })}
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Harvesting Size (Grid Blocks )
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          min="1"
                          placeholder="Width"
                          className="w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                          value={variety.harvestingSize.width}
                          onChange={(e) => handleVarietyChange(index, 'harvestingSize', { width: parseInt(e.target.value) })}
                          required
                        />
                        <input
                          type="number"
                          min="1"
                          placeholder="Height"
                          className="w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                          value={variety.harvestingSize.height}
                          onChange={(e) => handleVarietyChange(index, 'harvestingSize', { height: parseInt(e.target.value) })}
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Plant Spacing (inches)
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          min="1"
                          placeholder="Row"
                          className="w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                          value={variety.spacing.row}
                          onChange={(e) => handleVarietyChange(index, 'spacing', { row: parseInt(e.target.value) })}
                          required
                        />
                        <input
                          type="number"
                          min="1"
                          placeholder="Column"
                          className="w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                          value={variety.spacing.column}
                          onChange={(e) => handleVarietyChange(index, 'spacing', { column: parseInt(e.target.value) })}
                          required
                        />
                      </div>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Companion Plants
                      </label>
                      <div className="flex gap-2 mb-2">
                        <input
                          type="text"
                          className="flex-1 border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                          value={companionPlantInput}
                          onChange={(e) => setCompanionPlantInput(e.target.value)}
                          placeholder="Add companion plant"
                        />
                        <button
                          type="button"
                          onClick={() => handleAddCompanionPlant(index)}
                          className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700"
                        >
                          Add
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {variety.companionPlants.map((plant) => (
                          <span
                            key={plant}
                            className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm flex items-center gap-1"
                          >
                            {plant}
                            <button
                              type="button"
                              onClick={() => handleRemoveCompanionPlant(index, plant)}
                              className="text-green-600 hover:text-green-700"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Incompatible Plants
                      </label>
                      <div className="flex gap-2 mb-2">
                        <input
                          type="text"
                          className="flex-1 border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                          value={incompatiblePlantInput}
                          onChange={(e) => setIncompatiblePlantInput(e.target.value)}
                          placeholder="Add incompatible plant"
                        />
                        <button
                          type="button"
                          onClick={() => handleAddIncompatiblePlant(index)}
                          className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700"
                        >
                          Add
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {variety.incompatiblePlants.map((plant) => (
                          <span
                            key={plant}
                            className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-sm flex items-center gap-1"
                          >
                            {plant}
                            <button
                              type="button"
                              onClick={() => handleRemoveIncompatiblePlant(index, plant)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Frost Warning Periods
                      </label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600 mb-2">Spring Frost Period</p>
                          <div className="flex gap-2">
                            <select
                              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                              value={variety.frostWarning.spring.startMonth}
                              onChange={(e) => handleVarietyChange(index, 'frostWarning', {
                                spring: { ...variety.frostWarning.spring, startMonth: parseInt(e.target.value) }
                              })}
                            >
                              {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                                <option key={month} value={month}>
                                  {new Date(2024, month - 1).toLocaleString('default', { month: 'long' })}
                                </option>
                              ))}
                            </select>
                            <select
                              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                              value={variety.frostWarning.spring.endMonth}
                              onChange={(e) => handleVarietyChange(index, 'frostWarning', {
                                spring: { ...variety.frostWarning.spring, endMonth: parseInt(e.target.value) }
                              })}
                            >
                              {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                                <option key={month} value={month}>
                                  {new Date(2024, month - 1).toLocaleString('default', { month: 'long' })}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 mb-2">Fall Frost Period</p>
                          <div className="flex gap-2">
                            <select
                              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                              value={variety.frostWarning.fall.startMonth}
                              onChange={(e) => handleVarietyChange(index, 'frostWarning', {
                                fall: { ...variety.frostWarning.fall, startMonth: parseInt(e.target.value) }
                              })}
                            >
                              {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                                <option key={month} value={month}>
                                  {new Date(2024, month - 1).toLocaleString('default', { month: 'long' })}
                                </option>
                              ))}
                            </select>
                            <select
                              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                              value={variety.frostWarning.fall.endMonth}
                              onChange={(e) => handleVarietyChange(index, 'frostWarning', {
                                fall: { ...variety.frostWarning.fall, endMonth: parseInt(e.target.value) }
                              })}
                            >
                              {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                                <option key={month} value={month}>
                                  {new Date(2024, month - 1).toLocaleString('default', { month: 'long' })}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="md:col-span-2">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={variety.overwinter}
                          onChange={(e) => handleVarietyChange(index, 'overwinter', e.target.checked)}
                        />
                        <span className="text-sm font-medium text-gray-700">
                          Suitable for overwintering
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              ))}
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
                {isNewCrop ? 'Add New Crop' : 'Add Varieties'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {showAddInventoryModal && newCropId && (
        <AddInventoryModal
          onClose={() => {
            setShowAddInventoryModal(false);
            onClose();
          }}
          initialCropId={newCropId}
        />
      )}
    </>
  );
}