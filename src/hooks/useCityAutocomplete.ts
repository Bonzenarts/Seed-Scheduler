import useSWR from 'swr';

const API_KEY = '4d22ad4cc4971d5dafde3ce5855cb312';
const GEOCODING_API_URL = 'https://api.openweathermap.org/geo/1.0/direct';

export interface CityResult {
  name: string;
  local_names?: Record<string, string>;
  lat: number;
  lon: number;
  country: string;
  state?: string;
}

async function fetchCities(query: string): Promise<CityResult[]> {
  if (!query || query.length < 2) return [];

  try {
    const response = await fetch(
      `${GEOCODING_API_URL}?q=${encodeURIComponent(query)}&limit=5&appid=${API_KEY}`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch city suggestions');
    }

    return await response.json();
  } catch (error) {
    console.error('City search error:', error);
    return [];
  }
}

export function useCityAutocomplete(query: string) {
  const { data, error } = useSWR(
    query.length >= 2 ? ['city-search', query] : null,
    ([, q]) => fetchCities(q),
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // Cache for 1 minute
    }
  );

  return {
    cities: data || [],
    isLoading: !error && !data && query.length >= 2,
    error
  };
}