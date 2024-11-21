import React, { createContext, useContext } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { doc, collection, setDoc, deleteDoc } from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import { addToSyncQueue } from '../services/indexedDB';
import { InventoryItem, Crop } from '../types';
import { defaultCrops as initialDefaultCrops } from '../data/defaultCrops';

interface InventoryState {
  inventory: InventoryItem[];
  customCrops: Crop[];
  defaultCrops: Crop[];
  errors: string[];
  setInventory: (inventory: InventoryItem[]) => void;
  setCustomCrops: (crops: Crop[]) => void;
  addItem: (item: Omit<InventoryItem, 'id'>) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  updateItem: (id: string, updates: Partial<InventoryItem>) => Promise<void>;
  addCustomCrop: (crop: Omit<Crop, 'id'>) => Promise<void>;
  removeCustomCrop: (id: string) => Promise<void>;
  updateDefaultCrops: (crops: Crop[]) => void;
  resetToDefaults: () => void;
  addError: (error: string) => void;
  clearErrors: () => void;
}

export const useInventoryStore = create<InventoryState>()(
  persist(
    (set, get) => ({
      inventory: [],
      customCrops: [],
      defaultCrops: initialDefaultCrops,
      errors: [],
      setInventory: (inventory) => set({ inventory }),
      setCustomCrops: (customCrops) => set({ customCrops }),
      addItem: async (item) => {
        try {
          const itemWithMetadata = {
            ...item,
            id: crypto.randomUUID(),
            userId: auth.currentUser?.uid || 'offline',
            lastModified: new Date().toISOString()
          };

          if (auth.currentUser && !auth.currentUser.isAnonymous) {
            const itemRef = doc(collection(db, `users/${auth.currentUser.uid}/inventory`), itemWithMetadata.id);
            await setDoc(itemRef, itemWithMetadata);
          } else {
            await addToSyncQueue('create', 'inventory', itemWithMetadata);
          }

          set(state => ({
            inventory: [...state.inventory, itemWithMetadata]
          }));
        } catch (error: any) {
          get().addError(`Failed to add inventory item: ${error.message}`);
          throw error;
        }
      },
      removeItem: async (id) => {
        try {
          if (auth.currentUser && !auth.currentUser.isAnonymous) {
            const itemRef = doc(collection(db, `users/${auth.currentUser.uid}/inventory`), id);
            await deleteDoc(itemRef);
          } else {
            await addToSyncQueue('delete', 'inventory', { id });
          }

          set(state => ({
            inventory: state.inventory.filter(item => item.id !== id)
          }));
        } catch (error: any) {
          get().addError(`Failed to remove inventory item: ${error.message}`);
          throw error;
        }
      },
      updateItem: async (id, updates) => {
        try {
          const currentItem = get().inventory.find(item => item.id === id);
          if (!currentItem) {
            throw new Error('Item not found');
          }

          const updatedItem = {
            ...currentItem,
            ...updates,
            lastModified: new Date().toISOString()
          };

          if (auth.currentUser && !auth.currentUser.isAnonymous) {
            const itemRef = doc(collection(db, `users/${auth.currentUser.uid}/inventory`), id);
            await setDoc(itemRef, updatedItem, { merge: true });
          } else {
            await addToSyncQueue('update', 'inventory', updatedItem);
          }

          set(state => ({
            inventory: state.inventory.map(item => 
              item.id === id ? updatedItem : item
            )
          }));
        } catch (error: any) {
          get().addError(`Failed to update inventory item: ${error.message}`);
          throw error;
        }
      },
      addCustomCrop: async (crop) => {
        try {
          const newCrop = {
            ...crop,
            id: `custom-${crypto.randomUUID()}`,
            userId: auth.currentUser?.uid || 'offline',
            lastModified: new Date().toISOString()
          };

          if (auth.currentUser && !auth.currentUser.isAnonymous) {
            const cropRef = doc(collection(db, `users/${auth.currentUser.uid}/customCrops`), newCrop.id);
            await setDoc(cropRef, newCrop);
          } else {
            await addToSyncQueue('create', 'customCrops', newCrop);
          }

          set(state => ({
            customCrops: [...state.customCrops, newCrop]
          }));
        } catch (error: any) {
          get().addError(`Failed to add custom crop: ${error.message}`);
          throw error;
        }
      },
      removeCustomCrop: async (id) => {
        try {
          if (!id.startsWith('custom-')) {
            throw new Error('Cannot remove default crops');
          }

          if (auth.currentUser && !auth.currentUser.isAnonymous) {
            const cropRef = doc(collection(db, `users/${auth.currentUser.uid}/customCrops`), id);
            await deleteDoc(cropRef);
          } else {
            await addToSyncQueue('delete', 'customCrops', { id });
          }

          set(state => ({
            customCrops: state.customCrops.filter(crop => crop.id !== id),
            inventory: state.inventory.filter(item => item.cropId !== id)
          }));
        } catch (error: any) {
          get().addError(`Failed to remove custom crop: ${error.message}`);
          throw error;
        }
      },
      updateDefaultCrops: (crops) => {
        try {
          set({ defaultCrops: crops });
        } catch (error: any) {
          get().addError(`Failed to update default crops: ${error.message}`);
          throw error;
        }
      },
      resetToDefaults: () => {
        try {
          set({
            inventory: [],
            customCrops: [],
            defaultCrops: initialDefaultCrops,
            errors: []
          });
        } catch (error: any) {
          get().addError(`Failed to reset to defaults: ${error.message}`);
          throw error;
        }
      },
      addError: (error: string) => {
        console.error(error);
        set(state => ({
          errors: [...state.errors, error]
        }));
      },
      clearErrors: () => set({ errors: [] })
    }),
    {
      name: 'seed-inventory',
    }
  )
);

const InventoryContext = createContext<InventoryState | undefined>(undefined);

export function InventoryProvider({ children }: { children: React.ReactNode }) {
  return (
    <InventoryContext.Provider value={useInventoryStore()}>
      {children}
    </InventoryContext.Provider>
  );
}

export function useInventory() {
  const context = useContext(InventoryContext);
  if (!context) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
}