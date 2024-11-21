import React, { useState, useMemo } from 'react';
import { useInventory } from '../context/InventoryContext';
import { useSettings } from '../context/settings';
import { Database, Plus, Trash2, RefreshCw, AlertTriangle, Download, CheckSquare, Square } from 'lucide-react';
import { formatDate } from '../utils/dateFormat';
import AddInventoryModal from './AddInventoryModal';
import AddCustomCropModal from './AddCustomCropModal';

export default function SeedInventory() {
  const { inventory, removeItem, resetToDefaults, customCrops, defaultCrops: crops } = useInventory();
  const { settings } = useSettings();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCustomCropModal, setShowCustomCropModal] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  const allCrops = useMemo(() => 
    [...crops, ...customCrops].sort((a, b) => a.name.localeCompare(b.name)),
    [customCrops, crops]
  );

  const getCropAndVarietyNames = (cropId: string, varietyId: string) => {
    const crop = allCrops.find((c) => c.id === cropId);
    const variety = crop?.varieties.find((v) => v.id === varietyId);
    return { cropName: crop?.name, varietyName: variety?.name };
  };

  const handleReset = () => {
    if (window.confirm('Are you sure? This will delete all inventory items and custom crops.')) {
      resetToDefaults();
      setShowResetConfirm(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedItems.size === inventory.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(inventory.map(item => item.id)));
    }
  };

  const toggleItemSelection = (itemId: string) => {
    const newSelection = new Set(selectedItems);
    if (newSelection.has(itemId)) {
      newSelection.delete(itemId);
    } else {
      newSelection.add(itemId);
    }
    setSelectedItems(newSelection);
  };

  const exportSelectedItems = () => {
    const selectedInventory = inventory.filter(item => selectedItems.has(item.id));
    if (selectedInventory.length === 0) {
      alert('Please select items to export');
      return;
    }

    const csvContent = [
      ['Crop', 'Variety', 'Packets', 'Expiry Date'].join(','),
      ...selectedInventory.map(item => {
        const { cropName, varietyName } = getCropAndVarietyNames(item.cropId, item.varietyId);
        return [
          cropName,
          varietyName,
          item.packets,
          formatDate(new Date(item.expiryDate), settings.dateFormat)
        ].join(',');
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'seed-inventory.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-green-800 flex items-center gap-2">
            <Database className="h-6 w-6" />
            Seed Inventory
          </h2>
          <div className="flex gap-2">
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2"
            >
              <Plus className="h-5 w-5" />
              Add Seeds
            </button>
            <button
              onClick={() => setShowCustomCropModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
            >
              <Plus className="h-5 w-5" />
              Add Custom Crop
            </button>
            <button
              onClick={() => setShowResetConfirm(true)}
              className="px-4 py-2 border border-red-300 text-red-600 rounded-md hover:bg-red-50 flex items-center gap-2"
            >
              <RefreshCw className="h-5 w-5" />
              Reset
            </button>
          </div>
        </div>

        {inventory.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No seeds in inventory</p>
        ) : (
          <>
            <div className="mb-4 flex justify-between items-center">
              <button
                onClick={toggleSelectAll}
                className="text-gray-600 hover:text-gray-800 flex items-center gap-2"
              >
                {selectedItems.size === inventory.length ? (
                  <CheckSquare className="h-5 w-5" />
                ) : (
                  <Square className="h-5 w-5" />
                )}
                {selectedItems.size === inventory.length ? 'Deselect All' : 'Select All'}
              </button>
              {selectedItems.size > 0 && (
                <button
                  onClick={exportSelectedItems}
                  className="text-green-600 hover:text-green-700 flex items-center gap-2"
                >
                  <Download className="h-5 w-5" />
                  Export Selected
                </button>
              )}
            </div>
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {inventory.map((item) => {
                const { cropName, varietyName } = getCropAndVarietyNames(
                  item.cropId,
                  item.varietyId
                );
                const expiryDate = new Date(item.expiryDate);
                const isExpired = expiryDate < new Date();
                const isSelected = selectedItems.has(item.id);

                return (
                  <div
                    key={item.id}
                    className={`p-4 rounded-lg border ${
                      isExpired ? 'border-red-200 bg-red-50' : 'border-gray-200'
                    } ${isSelected ? 'ring-2 ring-green-500' : ''}`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-start gap-2">
                        <button
                          onClick={() => toggleItemSelection(item.id)}
                          className="mt-1"
                        >
                          {isSelected ? (
                            <CheckSquare className="h-5 w-5 text-green-600" />
                          ) : (
                            <Square className="h-5 w-5 text-gray-400" />
                          )}
                        </button>
                        <div>
                          <h3 className="font-medium text-gray-900">
                            {cropName} - {varietyName}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {item.packets} packet{item.packets !== 1 ? 's' : ''}
                          </p>
                          <p
                            className={`text-sm ${
                              isExpired ? 'text-red-600 font-medium' : 'text-gray-500'
                            }`}
                          >
                            Expires: {formatDate(expiryDate, settings.dateFormat)}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-red-600 hover:text-red-700 p-1 rounded-full hover:bg-red-50"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                    {isExpired && (
                      <div className="mt-2 text-sm text-red-600 flex items-center gap-1">
                        <AlertTriangle className="h-4 w-4" />
                        Seeds have expired
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {showAddModal && <AddInventoryModal onClose={() => setShowAddModal(false)} />}
      {showCustomCropModal && (
        <AddCustomCropModal onClose={() => setShowCustomCropModal(false)} />
      )}

      {showResetConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Reset to Defaults?</h3>
            <p className="text-sm text-gray-500 mb-6">
              This will delete all inventory items and custom crops. This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleReset}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}