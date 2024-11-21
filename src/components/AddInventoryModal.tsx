import React, { useState, useMemo } from 'react';
import { X, Filter } from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { useAuth } from '../context/AuthContext';
import { auth } from '../config/firebase';
import { cropGroups } from '../data/cropGroups';

interface AddInventoryModalProps {
  onClose: () => void;
  initialCropId?: string;
}

export default function AddInventoryModal({ onClose, initialCropId }: AddInventoryModalProps) {
  const { addItem, customCrops, defaultCrops: crops } = useInventory();
  const { isAuthenticated } = useAuth();
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [selectedCrop, setSelectedCrop] = useState(initialCropId || '');
  const [selectedVariety, setSelectedVariety] = useState('');
  const [packets, setPackets] = useState(1);
  const [expiryDate, setExpiryDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const allCrops = useMemo(() => 
    [...crops, ...customCrops].sort((a, b) => a.name.localeCompare(b.name)),
    [customCrops, crops]
  );

  // Group crops by their group
  const groupedCrops = useMemo(() => {
    const filtered = selectedGroupId 
      ? allCrops.filter(crop => crop.groupId === selectedGroupId)
      : allCrops;
    
    const grouped: Record<string, typeof allCrops> = {};
    filtered.forEach(crop => {
      if (!grouped[crop.groupId]) {
        grouped[crop.groupId] = [];
      }
      grouped[crop.groupId].push(crop);
    });
    return grouped;
  }, [allCrops, selectedGroupId]);

  const selectedCropData = allCrops.find(c => c.id === selectedCrop);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCrop || !selectedVariety || !expiryDate) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await addItem({
        cropId: selectedCrop,
        varietyId: selectedVariety,
        packets,
        expiryDate,
        lastModified: new Date().toISOString(),
        userId: auth.currentUser?.uid || 'offline' // Add userId to match security rules
      });

      onClose();
    } catch (error: any) {
      console.error('Failed to add inventory item:', error);
      setError(error.message || 'Failed to add item to inventory');
      setLoading(false);
    }
  };

  const handleCropChange = (cropId: string) => {
    setSelectedCrop(cropId);
    setSelectedVariety('');
    
    // Automatically set the crop group
    const crop = allCrops.find(c => c.id === cropId);
    if (crop) {
      setSelectedGroupId(crop.groupId);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Add Seeds to Inventory</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
            <X className="h-5 w-5" />
          </button>
        </div>

        {!isAuthenticated && (
          <div className="mb-4 p-3 bg-yellow-50 text-yellow-700 rounded-md text-sm">
            Note: You're working offline. Data will be synced when you sign in.
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Crop Group
            </label>
            <select
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
              value={selectedGroupId}
              onChange={(e) => setSelectedGroupId(e.target.value)}
            >
              <option value="">All Groups</option>
              {cropGroups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
            {selectedGroupId && (
              <p className="mt-1 text-sm text-gray-500">
                {cropGroups.find(g => g.id === selectedGroupId)?.description}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Crop
            </label>
            <select
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
              value={selectedCrop}
              onChange={(e) => handleCropChange(e.target.value)}
              required
            >
              <option value="">Select a crop</option>
              {Object.entries(groupedCrops).map(([groupId, crops]) => {
                const group = cropGroups.find(g => g.id === groupId);
                return (
                  <optgroup key={groupId} label={group?.name || 'Other'}>
                    {crops.map((crop) => (
                      <option key={crop.id} value={crop.id}>
                        {crop.name} {crop.id.startsWith('custom-') ? '(Custom)' : ''}
                      </option>
                    ))}
                  </optgroup>
                );
              })}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Variety
            </label>
            <select
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
              value={selectedVariety}
              onChange={(e) => setSelectedVariety(e.target.value)}
              disabled={!selectedCrop}
              required
            >
              <option value="">Select a variety</option>
              {selectedCropData?.varieties
                .slice()
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((variety) => (
                  <option key={variety.id} value={variety.id}>
                    {variety.name}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Number of Packets
            </label>
            <input
              type="number"
              min="1"
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
              value={packets}
              onChange={(e) => setPackets(parseInt(e.target.value))}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Expiry Date
            </label>
            <input
              type="date"
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              required
            />
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="animate-spin">⏳</span>
                  Adding...
                </>
              ) : (
                'Add to Inventory'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}