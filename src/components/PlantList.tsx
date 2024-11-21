import React, { useState } from 'react';
import { usePlantFilter } from '../hooks/usePlantSearch';
import { Filter, Loader, AlertTriangle, Sprout, ChevronDown } from 'lucide-react';
import PlantDetails from './PlantDetails';
import type { TreflePlant } from '../types/trefle';

const filterOptions = {
  edible: 'Edible Plants',
  vegetable: 'Vegetables',
  native: 'Native Plants',
  indoor: 'Indoor Plants',
  outdoor: 'Outdoor Plants'
};

export default function PlantList() {
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [showFilters, setShowFilters] = useState(false);
  const [selectedPlant, setSelectedPlant] = useState<number | null>(null);
  const { results, error, isLoading } = usePlantFilter(filters);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => {
      const newFilters = { ...prev };
      if (value) {
        newFilters[key] = value;
      } else {
        delete newFilters[key];
      }
      return newFilters;
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Sprout className="h-6 w-6 text-green-600" />
          Plant Database
        </h2>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-3 py-2 rounded-md border ${
            showFilters 
              ? 'bg-green-50 border-green-200 text-green-700' 
              : 'border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          <Filter className="h-5 w-5" />
          Filters
          <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {showFilters && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
          {Object.entries(filterOptions).map(([key, label]) => (
            <label key={key} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={!!filters[key]}
                onChange={(e) => handleFilterChange(key, e.target.checked ? 'true' : '')}
                className="rounded border-gray-300 text-green-600 focus:ring-green-500"
              />
              <span className="text-sm text-gray-700">{label}</span>
            </label>
          ))}
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-md flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader className="h-8 w-8 animate-spin text-green-600" />
        </div>
      ) : results.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {results.map((plant) => (
            <button
              key={plant.id}
              onClick={() => setSelectedPlant(plant.id)}
              className="text-left p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
            >
              <div className="flex gap-4">
                {plant.image_url ? (
                  <img
                    src={plant.image_url}
                    alt={plant.common_name || plant.scientific_name}
                    className="w-24 h-24 object-cover rounded"
                    onError={(e) => {
                      const img = e.target as HTMLImageElement;
                      img.style.display = 'none';
                      img.parentElement?.classList.add('bg-gray-100', 'flex', 'items-center', 'justify-center');
                      const icon = document.createElement('div');
                      icon.innerHTML = '<svg class="h-8 w-8 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 20h10m-5-3v3M5 9c0-1 2-2 2-2m10 0s2 1 2 2M8 17s-1-4-1-7c0-2 2-4 5-4s5 2 5 4c0 3-1 7-1 7"></path></svg>';
                      img.parentElement?.appendChild(icon);
                    }}
                  />
                ) : (
                  <div className="w-24 h-24 bg-gray-100 rounded flex items-center justify-center">
                    <Sprout className="h-8 w-8 text-gray-400" />
                  </div>
                )}
                <div>
                  <h3 className="font-medium text-gray-900">
                    {plant.common_name || 'Unknown'}
                  </h3>
                  <p className="text-sm text-gray-500 italic">
                    {plant.scientific_name}
                  </p>
                  {plant.family_common_name && (
                    <p className="text-sm text-gray-600">
                      Family: {plant.family_common_name}
                    </p>
                  )}
                  <div className="mt-2 flex flex-wrap gap-2">
                    {plant.vegetable && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                        Vegetable
                      </span>
                    )}
                    {plant.edible && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                        Edible
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          No plants found matching your criteria
        </div>
      )}

      {selectedPlant && (
        <PlantDetails
          plantId={selectedPlant}
          onClose={() => setSelectedPlant(null)}
        />
      )}
    </div>
  );
}