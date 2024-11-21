import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface SeedSchedulerDB extends DBSchema {
  plans: {
    key: string;
    value: any;
    indexes: { 'by-date': string };
  };
  inventory: {
    key: string;
    value: any;
  };
  settings: {
    key: string;
    value: any;
  };
  customCrops: {
    key: string;
    value: any;
  };
  syncQueue: {
    key: string;
    value: {
      operation: 'create' | 'update' | 'delete';
      collection: string;
      data: any;
      timestamp: number;
    };
  };
}

const DB_NAME = 'seed-scheduler';
const DB_VERSION = 2; // Increment version to trigger upgrade

export async function initDB(): Promise<IDBPDatabase<SeedSchedulerDB>> {
  return openDB<SeedSchedulerDB>(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion) {
      // Handle upgrades from each previous version
      if (oldVersion < 1) {
        // Plans store
        if (!db.objectStoreNames.contains('plans')) {
          const planStore = db.createObjectStore('plans', { keyPath: 'id' });
          planStore.createIndex('by-date', 'sowingDate');
        }

        // Inventory store
        if (!db.objectStoreNames.contains('inventory')) {
          db.createObjectStore('inventory', { keyPath: 'id' });
        }

        // Settings store
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'id' });
        }

        // Sync queue store
        if (!db.objectStoreNames.contains('syncQueue')) {
          db.createObjectStore('syncQueue', { 
            keyPath: 'id',
            autoIncrement: true 
          });
        }
      }

      // Add customCrops store in version 2
      if (oldVersion < 2) {
        if (!db.objectStoreNames.contains('customCrops')) {
          db.createObjectStore('customCrops', { keyPath: 'id' });
        }
      }
    },
  });
}

export async function addToSyncQueue(operation: 'create' | 'update' | 'delete', collection: string, data: any) {
  const db = await initDB();
  await db.add('syncQueue', {
    operation,
    collection,
    data,
    timestamp: Date.now()
  });
}

export async function processSyncQueue() {
  const db = await initDB();
  const tx = db.transaction('syncQueue', 'readwrite');
  const store = tx.objectStore('syncQueue');
  const items = await store.getAll();

  // Process items here with Firebase
  // After successful sync, clear the queue
  await store.clear();
}

// Generic CRUD operations
export async function addItem(storeName: keyof SeedSchedulerDB, item: any) {
  const db = await initDB();
  await db.add(storeName, item);
  await addToSyncQueue('create', storeName, item);
}

export async function updateItem(storeName: keyof SeedSchedulerDB, item: any) {
  const db = await initDB();
  await db.put(storeName, item);
  await addToSyncQueue('update', storeName, item);
}

export async function deleteItem(storeName: keyof SeedSchedulerDB, id: string) {
  const db = await initDB();
  await db.delete(storeName, id);
  await addToSyncQueue('delete', storeName, { id });
}

export async function getAllItems(storeName: keyof SeedSchedulerDB) {
  const db = await initDB();
  return db.getAll(storeName);
}

export async function clearStore(storeName: keyof SeedSchedulerDB) {
  const db = await initDB();
  const tx = db.transaction(storeName, 'readwrite');
  await tx.objectStore(storeName).clear();
}

export async function clearAllData() {
  const db = await initDB();
  const stores = ['plans', 'inventory', 'settings', 'customCrops', 'syncQueue'];
  
  for (const store of stores) {
    const tx = db.transaction(store, 'readwrite');
    await tx.objectStore(store).clear();
    await tx.done;
  }
}