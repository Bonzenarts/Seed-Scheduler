import { useEffect } from 'react';
import useSWR from 'swr';
import { getWeatherData } from '../services/weatherApi';
import { useSettings } from '../context/settings';

export function useWeather() {
  const { settings } = useSettings();
  
  const { data: weather, error, isLoading, mutate } = useSWR(
    settings.coordinates 
      ? ['weather', settings.coordinates.lat, settings.coordinates.lon] 
      : null,
    async ([, lat, lon]) => getWeatherData(lat, lon),
    {
      refreshInterval: 30 * 60 * 1000, // Refresh every 30 minutes
      revalidateOnFocus: false,
      dedupingInterval: 0, // Disable deduping to allow immediate updates
      shouldRetryOnError: true,
      errorRetryCount: 3,
      revalidateOnMount: true,
      suspense: false
    }
  );

  // Force immediate refetch when coordinates change
  useEffect(() => {
    if (settings.coordinates) {
      mutate();
    }
  }, [settings.coordinates?.lat, settings.coordinates?.lon]);

  const refetch = async () => {
    if (settings.coordinates) {
      await mutate();
    }
  };

  return {
    weather,
    error,
    isLoading: isLoading || !weather,
    coordinates: settings.coordinates,
    refetch
  };
}