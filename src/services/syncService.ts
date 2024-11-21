import { doc, collection, setDoc, getDocs, query, Timestamp } from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import { processSyncQueue } from './indexedDB';
import { useSettingsStore } from '../context/SettingsContext';
import { useInventoryStore } from '../context/InventoryContext';
import { usePlanningStore } from '../context/PlanningContext';
import { getCached, setCache } from './cacheService';

export { clearCache } from './cacheService';

let syncInterval: number | null = null;
let isCurrentlySyncing = false;
let lastSyncAttempt = 0;
const MIN_SYNC_INTERVAL = 5000;

async function ensureUserDocument() {
  if (!auth.currentUser) return;

  try {
    const userRef = doc(db, 'users', auth.currentUser.uid);
    await setDoc(userRef, {
      uid: auth.currentUser.uid,
      email: auth.currentUser.email,
      displayName: auth.currentUser.displayName,
      lastUpdated: Timestamp.now()
    }, { merge: true });
  } catch (error) {
    console.error('Failed to update user document:', error);
  }
}

export async function startSync() {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
  }
  
  if (!auth.currentUser || auth.currentUser.isAnonymous) return;

  try {
    await ensureUserDocument();
    await syncWithCloud();
    
    syncInterval = window.setInterval(async () => {
      if (auth.currentUser && !auth.currentUser.isAnonymous && navigator.onLine) {
        await syncWithCloud().catch(console.error);
      }
    }, 5 * 60 * 1000);
  } catch (error) {
    console.error('Failed to start sync:', error);
  }
}

export function stopSync() {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
  }
}

export async function syncWithCloud() {
  if (!navigator.onLine || !auth.currentUser || auth.currentUser.isAnonymous || isCurrentlySyncing) {
    return;
  }

  const now = Date.now();
  if (now - lastSyncAttempt < MIN_SYNC_INTERVAL) {
    return;
  }
  lastSyncAttempt = now;
  isCurrentlySyncing = true;

  try {
    const userId = auth.currentUser.uid;
    await processSyncQueue();

    const collections = {
      settings: {
        path: `users/${userId}/settings`,
        setter: useSettingsStore.getState().updateSettings
      },
      plans: {
        path: `users/${userId}/plans`,
        setter: usePlanningStore.getState().setPlans
      },
      inventory: {
        path: `users/${userId}/inventory`,
        setter: useInventoryStore.getState().setInventory
      }
    };

    for (const [name, { path, setter }] of Object.entries(collections)) {
      try {
        // Check cache first
        const cached = await getCached(name, userId);
        if (cached) {
          setter(cached);
        }

        // Fetch from Firestore
        const collectionRef = collection(db, path);
        const querySnapshot = await getDocs(query(collectionRef));
        
        const items = querySnapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id
        }));

        if (items.length > 0) {
          setter(items);
          await setCache(name, userId, items);
        }

        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.warn(`Failed to sync ${name}:`, error);
      }
    }

    // Update last sync time
    const settingsRef = doc(db, `users/${userId}/settings/general`);
    await setDoc(settingsRef, {
      lastSync: new Date().toISOString(),
      lastModified: Timestamp.now()
    }, { merge: true });

  } catch (error) {
    console.error('Sync failed:', error);
    if (error.code === 'permission-denied') {
      await auth.currentUser?.reload();
    }
  } finally {
    isCurrentlySyncing = false;
  }
}