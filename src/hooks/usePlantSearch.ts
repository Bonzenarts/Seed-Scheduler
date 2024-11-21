import useSWR from 'swr';
import { searchPlants, getPlantDetails, getPlantsByFilter } from '../services/trefleApi';
import type { TreflePlant, TrefleApiResponse } from '../types/trefle';

export function usePlantSearch(query: string) {
  const { data, error, isLoading } = useSWR<TrefleApiResponse<TreflePlant[]>>(
    query ? ['plant-search', query] : null,
    ([, q]) => searchPlants(q),
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // Cache results for 1 minute
      errorRetryCount: 2
    }
  );

  return {
    results: data?.data || [],
    meta: data?.meta,
    error: error?.message || null,
    isLoading
  };
}

export function usePlantDetails(id: number | null) {
  const { data, error, isLoading } = useSWR<TrefleApiResponse<TreflePlant>>(
    id ? ['plant-details', id] : null,
    ([, plantId]) => getPlantDetails(plantId),
    {
      revalidateOnFocus: false,
      dedupingInterval: 300000, // Cache results for 5 minutes
      errorRetryCount: 2
    }
  );

  return {
    plant: data?.data,
    error: error?.message || null,
    isLoading
  };
}

export function usePlantFilter(filters: Record<string, string>) {
  const { data, error, isLoading } = useSWR<TrefleApiResponse<TreflePlant[]>>(
    filters ? ['plant-filter', JSON.stringify(filters)] : null,
    ([, filterString]) => getPlantsByFilter(JSON.parse(filterString)),
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // Cache results for 1 minute
      errorRetryCount: 2
    }
  );

  return {
    results: data?.data || [],
    meta: data?.meta,
    error: error?.message || null,
    isLoading
  };
}