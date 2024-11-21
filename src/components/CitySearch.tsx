import React, { useState, useRef, useEffect } from 'react';
import { Search, MapPin, Loader } from 'lucide-react';
import { useCityAutocomplete, CityResult } from '../hooks/useCityAutocomplete';

interface CitySearchProps {
  onSelect: (city: CityResult) => void;
  initialValue?: string;
  onCancel: () => void;
}

export default function CitySearch({ onSelect, initialValue = '', onCancel }: CitySearchProps) {
  const [query, setQuery] = useState(initialValue);
  const [isOpen, setIsOpen] = useState(false);
  const { cities, isLoading } = useCityAutocomplete(query);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (city: CityResult) => {
    setQuery(`${city.name}, ${city.country}`);
    setIsOpen(false);
    onSelect(city);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            placeholder="Search for a city..."
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
          />
          {isLoading && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <Loader className="h-4 w-4 animate-spin text-gray-400" />
            </div>
          )}
        </div>
      </div>

      {isOpen && query.length >= 2 && (
        <div className="absolute z-10 w-full mt-1 bg-white rounded-md shadow-lg border border-gray-200">
          {cities.length > 0 ? (
            <ul className="py-1">
              {cities.map((city, index) => (
                <li key={`${city.lat}-${city.lon}-${index}`}>
                  <button
                    onClick={() => handleSelect(city)}
                    className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2"
                  >
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <div>
                      <div className="font-medium">{city.name}</div>
                      <div className="text-sm text-gray-500">
                        {[city.state, city.country].filter(Boolean).join(', ')}
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-4 py-2 text-sm text-gray-500">
              No cities found
            </div>
          )}
        </div>
      )}

      <p className="mt-2 text-sm text-gray-500">
        Enter a city name to see suggestions
      </p>
    </div>
  );
}