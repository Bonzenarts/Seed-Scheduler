import React, { useState } from 'react';
import { Search, AlertTriangle, RefreshCw, Loader } from 'lucide-react';
import { usePlantSearch } from '../hooks/usePlantSearch';
import { testApiConnection } from '../services/trefleApi';
import PlantList from './PlantList';
import debounce from '../utils/debounce';
import PlantDetails from './PlantDetails';

export default function PlantSearch() {
  const [query, setQuery] = useState('');
  const [selectedPlant, setSelectedPlant] = useState<number | null>(null);
  const { results, error, isLoading } = usePlantSearch(query);

  const handleSearch = debounce((value: string) => {
    setQuery(value);
  }, 500);

  const checkApiConnection = async () => {
    const result = await testApiConnection();
    if (!result.success) {
      console.error('API Connection test failed:', result.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Search plants by name..."
          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-green-500 focus:border-green-500"
          onChange={(e) => handleSearch(e.target.value)}
        />
        {isLoading && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <Loader className="h-5 w-5 text-gray-400 animate-spin" />
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-md flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 flex-shrink-0" />
          <span className="text-sm">
            {error === 'Failed to fetch' 
              ? 'Unable to connect to the plant database. Please try again later.'
              : error}
          </span>
          <button
            onClick={checkApiConnection}
            className="ml-auto text-sm text-red-600 hover:text-red-700 flex items-center gap-1"
          >
            <RefreshCw className="h-4 w-4" />
            Retry
          </button>
        </div>
      )}

      {query ? (
        <div className="space-y-4">
          {results.length > 0 ? (
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
                      />
                    ) : (
                      <div className="w-24 h-24 bg-gray-100 rounded flex items-center justify-center">
                        <span className="text-gray-400">No image</span>
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
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : !isLoading && (
            <p className="text-center text-gray-500">
              No plants found matching "{query}"
            </p>
          )}
        </div>
      ) : (
        <PlantList />
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