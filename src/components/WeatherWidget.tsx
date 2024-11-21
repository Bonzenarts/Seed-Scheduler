import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/settings';
import { useWeather } from '../hooks/useWeather';
import { Cloud, Crown, MapPin, ChevronLeft, ChevronRight, Loader, AlertTriangle } from 'lucide-react';
import WeatherIcon from './WeatherIcon';
import CitySearch from './CitySearch';
import type { CityResult } from '../hooks/useCityAutocomplete';

export default function WeatherWidget() {
  const { hasFeatureAccess } = useAuth();
  const { settings, updateSettings } = useSettings();
  const { weather, error: weatherError, isLoading: weatherLoading, refetch } = useWeather();
  const [activeTab, setActiveTab] = useState<'hourly' | 'daily'>('hourly');
  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [hourlyScrollIndex, setHourlyScrollIndex] = useState(0);

  const hasPremiumAccess = hasFeatureAccess('weatherData');

  // Reset scroll index when weather data changes
  useEffect(() => {
    setHourlyScrollIndex(0);
  }, [weather]);

  const handleLocationSelect = async (city: CityResult) => {
    try {
      setUpdateError(null);
      const locationString = `${city.name}, ${city.country}`;
      const coordinates = {
        lat: city.lat,
        lon: city.lon
      };

      await updateSettings({
        location: locationString,
        coordinates
      });

      // Force immediate weather update
      await refetch();
      setIsEditingLocation(false);
    } catch (error) {
      console.error('Location update error:', error);
      setUpdateError('Failed to update location. Please try again.');
    }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString([], {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const scrollHourly = (direction: 'left' | 'right') => {
    if (direction === 'left') {
      setHourlyScrollIndex(Math.max(0, hourlyScrollIndex - 1));
    } else {
      setHourlyScrollIndex(Math.min((weather?.hourly?.length || 0) - 5, hourlyScrollIndex + 1));
    }
  };

  if (!hasPremiumAccess) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center gap-2 text-purple-600">
          <Crown className="h-6 w-6" />
          <h2 className="text-xl font-semibold">Premium Feature</h2>
        </div>
        <p className="mt-2 text-gray-600">
          Weather forecasts are available to Premium, Beta, and Admin users.
          Upgrade your account to access detailed weather information for your garden.
        </p>
      </div>
    );
  }

  if (weatherLoading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-center gap-2">
          <Loader className="h-5 w-5 animate-spin text-green-600" />
          <span className="text-gray-600">Loading weather data...</span>
        </div>
      </div>
    );
  }

  if (weatherError || updateError) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center gap-2 text-red-600">
          <AlertTriangle className="h-5 w-5" />
          <span>{weatherError || updateError}</span>
        </div>
        <button
          onClick={() => setIsEditingLocation(true)}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Set Location Manually
        </button>
      </div>
    );
  }

  if (!settings.location || isEditingLocation) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Cloud className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold">Set Location</h2>
          </div>
        </div>

        <CitySearch
          onSelect={handleLocationSelect}
          initialValue={settings.location}
          onCancel={() => settings.location && setIsEditingLocation(false)}
        />

        {updateError && (
          <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-md flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            {updateError}
          </div>
        )}
      </div>
    );
  }

  if (!weather) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center gap-2 text-gray-600">
          <Cloud className="h-6 w-6" />
          <span>No weather data available. Please set your location.</span>
        </div>
        <button
          onClick={() => setIsEditingLocation(true)}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Set Location
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Cloud className="h-6 w-6 text-blue-600" />
          <h2 className="text-xl font-semibold">Weather Forecast</h2>
        </div>
        <button
          onClick={() => setIsEditingLocation(true)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
        >
          <MapPin className="h-5 w-5" />
          {settings.location}
        </button>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="text-3xl font-bold">
            {Math.round(weather.current.temp)}°C
          </div>
          <div className="text-gray-600">
            Feels like {Math.round(weather.current.feels_like)}°C
          </div>
          <div className="text-gray-600 capitalize">
            {weather.current.weather[0].description}
          </div>
        </div>
        <WeatherIcon
          code={weather.current.weather[0].id}
          className="h-16 w-16 text-blue-600"
          timestamp={weather.current.dt * 1000}
        />
      </div>

      <div className="flex gap-4 mb-4">
        <button
          onClick={() => setActiveTab('hourly')}
          className={`px-4 py-2 rounded-lg ${
            activeTab === 'hourly'
              ? 'bg-blue-100 text-blue-800'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Hourly
        </button>
        <button
          onClick={() => setActiveTab('daily')}
          className={`px-4 py-2 rounded-lg ${
            activeTab === 'daily'
              ? 'bg-blue-100 text-blue-800'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          8-Day
        </button>
      </div>

      {activeTab === 'hourly' ? (
        <div className="relative">
          <div className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10">
            <button
              onClick={() => scrollHourly('left')}
              disabled={hourlyScrollIndex === 0}
              className={`p-1 rounded-full ${
                hourlyScrollIndex === 0
                  ? 'text-gray-300'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          </div>
          <div className="overflow-hidden">
            <div
              className="flex transition-transform duration-300"
              style={{
                transform: `translateX(-${hourlyScrollIndex * 100}px)`
              }}
            >
              {weather.hourly.map((hour) => (
                <div
                  key={hour.dt}
                  className="flex-shrink-0 w-24 text-center"
                >
                  <div className="text-sm text-gray-600">
                    {formatTime(hour.dt)}
                  </div>
                  <WeatherIcon
                    code={hour.weather[0].id}
                    className="h-8 w-8 mx-auto my-2 text-blue-600"
                    timestamp={hour.dt * 1000}
                  />
                  <div className="font-medium">
                    {Math.round(hour.temp)}°C
                  </div>
                  <div className="text-xs text-gray-500 capitalize">
                    {hour.weather[0].description}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10">
            <button
              onClick={() => scrollHourly('right')}
              disabled={hourlyScrollIndex >= (weather.hourly.length - 5)}
              className={`p-1 rounded-full ${
                hourlyScrollIndex >= (weather.hourly.length - 5)
                  ? 'text-gray-300'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-2">8-Day Forecast</h3>
          <div className="space-y-3">
            {weather.daily.map((day) => (
              <div
                key={day.dt}
                className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg"
              >
                <div className="w-24 text-gray-600">
                  {formatDate(day.dt)}
                </div>
                <div className="flex items-center gap-3 flex-1">
                  <WeatherIcon
                    code={day.weather[0].id}
                    className="h-8 w-8 text-blue-600"
                    timestamp={day.dt * 1000}
                  />
                  <div className="text-sm text-gray-500 capitalize flex-1">
                    {day.weather[0].description}
                  </div>
                </div>
                <div className="w-24 text-right font-medium">
                  {Math.round(day.temp.max)}° / {Math.round(day.temp.min)}°
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}