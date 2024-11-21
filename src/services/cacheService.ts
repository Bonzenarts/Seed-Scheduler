import localforage from 'localforage';

// Initialize cache stores
const cacheStores = {
  plans: localforage.createInstance({ name: 'plans-cache' }),
  inventory: localforage.createInstance({ name: 'inventory-cache' }),
  settings: localforage.createInstance({ name: 'settings-cache' }),
  customCrops: localforage.createInstance({ name: 'customcrops-cache' }),
  weather: localforage.createInstance({ name: 'weather-cache' })
};

// Cache TTL in milliseconds (5 minutes)
const CACHE_TTL = 5 * 60 * 1000;

export async function getCached(collection: string, key: string) {
  try {
    const store = cacheStores[collection as keyof typeof cacheStores];
    if (!store) return null;

    const cached = await store.getItem(key);
    if (!cached) return null;

    const { data, timestamp } = cached as { data: any; timestamp: number };
    if (Date.now() - timestamp > CACHE_TTL) {
      await store.removeItem(key);
      return null;
    }

    return data;
  } catch (error) {
    console.warn('Cache read error:', error);
    return null;
  }
}

export async function setCache(collection: string, key: string, data: any) {
  try {
    const store = cacheStores[collection as keyof typeof cacheStores];
    if (!store) return;

    await store.setItem(key, {
      data,
      timestamp: Date.now()
    });
  } catch (error) {
    console.warn('Cache write error:', error);
  }
}

export async function clearCache(collection?: string) {
  try {
    if (collection) {
      const store = cacheStores[collection as keyof typeof cacheStores];
      if (store) await store.clear();
    } else {
      await Promise.all(Object.values(cacheStores).map(store => store.clear()));
    }
  } catch (error) {
    console.warn('Cache clear error:', error);
  }
}

// Weather-specific cache functions
export async function getCachedWeather(userId: string) {
  try {
    return await cacheStores.weather.getItem(userId) as { data: any; timestamp: number } | null;
  } catch (error) {
    console.warn('Weather cache read error:', error);
    return null;
  }
}

export async function setCachedWeather(userId: string, data: any) {
  try {
    await cacheStores.weather.setItem(userId, {
      data,
      timestamp: Date.now()
    });
  } catch (error) {
    console.warn('Weather cache write error:', error);
  }
}