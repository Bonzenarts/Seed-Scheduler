// API Configuration
const TREFLE_API_URL = 'https://trefle.io/api/v1';
const TREFLE_TOKEN = 'd5ZyQDU-Cmk_2s7LK_HUYr3p_-na16IJOjygl1PYqW0';

// Helper function to build API URLs
const buildApiUrl = (endpoint: string, params: Record<string, string> = {}) => {
  const queryParams = new URLSearchParams({
    token: TREFLE_TOKEN,
    ...params
  });
  return `${TREFLE_API_URL}${endpoint}?${queryParams}`;
};

// Helper function for API requests
async function fetchFromApi<T>(url: string): Promise<T> {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TREFLE_TOKEN}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Trefle API error:', error);
    throw error;
  }
}

// Test API connection
export async function testApiConnection(): Promise<{ success: boolean; message: string }> {
  try {
    const url = buildApiUrl('/plants');
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TREFLE_TOKEN}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (data && data.data) {
      return { 
        success: true, 
        message: 'Successfully connected to Trefle API' 
      };
    }
    
    throw new Error('Invalid response format');
  } catch (error) {
    console.error('API test failed:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Failed to connect to API' 
    };
  }
}

// Search plants by query
export async function searchPlants(query: string) {
  const url = buildApiUrl('/plants/search', { q: query });
  return fetchFromApi(url);
}

// Get plant details by ID
export async function getPlantDetails(id: number) {
  const url = buildApiUrl(`/plants/${id}`);
  return fetchFromApi(url);
}

// Get plants by filter
export async function getPlantsByFilter(filters: Record<string, string>) {
  const url = buildApiUrl('/plants', filters);
  return fetchFromApi(url);
}

// Get plant species
export async function getPlantSpecies(id: number) {
  const url = buildApiUrl(`/species/${id}`);
  return fetchFromApi(url);
}

// Get plant distributions
export async function getPlantDistributions(id: number) {
  const url = buildApiUrl(`/plants/${id}/distributions`);
  return fetchFromApi(url);
}

// Get plant genus
export async function getPlantGenus(id: number) {
  const url = buildApiUrl(`/genus/${id}`);
  return fetchFromApi(url);
}

// Get plant family
export async function getPlantFamily(id: number) {
  const url = buildApiUrl(`/families/${id}`);
  return fetchFromApi(url);
}