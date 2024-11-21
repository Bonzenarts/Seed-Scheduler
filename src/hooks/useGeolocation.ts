import { useState, useEffect } from 'react';
import { useSettings } from '../context/settings';
import type { Coordinates } from '../types';

const GEOCODING_API_URL = 'https://api.openweathermap.org/geo/1.0/direct';
const REVERSE_GEOCODING_API_URL = 'https://api.openweathermap.org/geo/1.0/reverse';
const API_KEY = '4d22ad4cc4971d5dafde3ce5855cb312';

async function getCoordinates(location: string): Promise<Coordinates | null> {
  try {
    const response = await fetch(
      `${GEOCODING_API_URL}?q=${encodeURIComponent(location)}&limit=1&appid=${API_KEY}`
    );

    if (!response.ok) {
      throw new Error('Failed to get coordinates');
    }

    const data = await response.json();
    if (data && data.length > 0) {
      return {
        lat: data[0].lat,
        lon: data[0].lon
      };
    }
    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}

async function getLocationName(lat: number, lon: number): Promise<string | null> {
  try {
    const response = await fetch(
      `${REVERSE_GEOCODING_API_URL}?lat=${lat}&lon=${lon}&limit=1&appid=${API_KEY}`
    );

    if (!response.ok) {
      throw new Error('Failed to get location name');
    }

    const data = await response.json();
    if (data && data.length > 0) {
      return `${data[0].name}, ${data[0].country}`;
    }
    return null;
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return null;
  }
}

export function useGeolocation() {
  const { settings, updateSettings } = useSettings();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!settings.location && !settings.coordinates) {
      setIsLoading(true);
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const coords = {
              lat: position.coords.latitude,
              lon: position.coords.longitude
            };
            
            const locationName = await getLocationName(coords.lat, coords.lon);
            
            await updateSettings({
              coordinates: coords,
              location: locationName || 'Unknown Location'
            });
            
            setError(null);
          } catch (err) {
            setError('Failed to get location name');
          } finally {
            setIsLoading(false);
          }
        },
        (err) => {
          console.error('Geolocation error:', err);
          setError('Failed to get location. Please enter a location manually.');
          setIsLoading(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        }
      );
    }
  }, [settings.location, settings.coordinates, updateSettings]);

  return {
    coordinates: settings.coordinates,
    isLoading,
    error
  };
}