import React, { createContext, useContext } from 'react';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { doc, collection, setDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import { addToSyncQueue } from '../services/indexedDB';
import type { Plan } from '../types';

interface PlanningState {
  plans: Plan[];
  isLoading: boolean;
  setPlans: (plans: Plan[]) => void;
  setLoading: (loading: boolean) => void;
  addPlan: (plan: Plan) => Promise<void>;
  deletePlan: (id: string) => Promise<void>;
  updatePlan: (id: string, updates: Partial<Plan>) => Promise<void>;
  exportPlans: (selectedPlans: Plan[], type: 'csv' | 'ics', options: any) => Promise<void>;
  populateDefaultTasks: () => Promise<void>;
  removeDefaultTasks: () => Promise<void>;
}

const initialState = {
  plans: [],
  isLoading: false
};

export const usePlanningStore = create<PlanningState>()(
  persist(
    (set, get) => ({
      ...initialState,
      setPlans: (plans) => set({ plans, isLoading: false }),
      setLoading: (isLoading) => set({ isLoading }),
      addPlan: async (plan) => {
        try {
          const planWithMetadata = {
            ...plan,
            userId: auth.currentUser?.uid || 'offline',
            lastModified: new Date().toISOString()
          };

          if (auth.currentUser && !auth.currentUser.isAnonymous) {
            const planRef = doc(collection(db, `users/${auth.currentUser.uid}/plans`), plan.id);
            await setDoc(planRef, {
              ...planWithMetadata,
              lastModified: Timestamp.now()
            });
          } else {
            await addToSyncQueue('create', 'plans', planWithMetadata);
          }

          set(state => ({
            plans: [...state.plans, planWithMetadata]
          }));
        } catch (error) {
          console.error('Failed to add plan:', error);
          throw error;
        }
      },
      deletePlan: async (id) => {
        try {
          if (auth.currentUser && !auth.currentUser.isAnonymous) {
            const planRef = doc(collection(db, `users/${auth.currentUser.uid}/plans`), id);
            await deleteDoc(planRef);
          } else {
            await addToSyncQueue('delete', 'plans', { id });
          }

          set(state => ({
            plans: state.plans.filter(p => p.id !== id)
          }));
        } catch (error) {
          console.error('Failed to delete plan:', error);
          throw error;
        }
      },
      updatePlan: async (id, updates) => {
        try {
          const currentPlan = get().plans.find(p => p.id === id);
          if (!currentPlan) {
            throw new Error('Plan not found');
          }

          const updatedPlan = {
            ...currentPlan,
            ...updates,
            lastModified: new Date().toISOString()
          };

          if (auth.currentUser && !auth.currentUser.isAnonymous) {
            const planRef = doc(collection(db, `users/${auth.currentUser.uid}/plans`), id);
            await setDoc(planRef, {
              ...updatedPlan,
              lastModified: Timestamp.now()
            }, { merge: true });
          } else {
            await addToSyncQueue('update', 'plans', updatedPlan);
          }

          set(state => ({
            plans: state.plans.map(p => p.id === id ? updatedPlan : p)
          }));
        } catch (error) {
          console.error('Failed to update plan:', error);
          throw error;
        }
      },
      exportPlans: async (selectedPlans, type, options) => {
        // Export implementation
      },
      populateDefaultTasks: async () => {
        try {
          const { settings } = get();
          if (!settings?.defaultTasks) return;

          const newPlans = settings.defaultTasks.map(task => ({
            id: `default-${task.id}`,
            type: 'task' as const,
            taskId: task.id,
            taskName: task.name,
            taskDescription: task.description,
            startDate: new Date().toISOString().split('T')[0],
            successionInterval: 7,
            successionCount: 1,
            userId: auth.currentUser?.uid || 'offline',
            lastModified: new Date().toISOString()
          }));

          for (const plan of newPlans) {
            await get().addPlan(plan);
          }
        } catch (error) {
          console.error('Failed to populate default tasks:', error);
          throw error;
        }
      },
      removeDefaultTasks: async () => {
        try {
          const state = get();
          const defaultTaskIds = state.plans
            .filter(plan => 
              plan.type === 'task' && 
              (plan as any).taskId.startsWith('default-')
            )
            .map(plan => plan.id);

          for (const id of defaultTaskIds) {
            await get().deletePlan(id);
          }
        } catch (error) {
          console.error('Failed to remove default tasks:', error);
          throw error;
        }
      }
    }),
    {
      name: 'garden-plans',
      version: 2,
      storage: createJSONStorage(() => localStorage),
      migrate: (persistedState: any, version: number) => {
        if (version === 0) {
          return {
            ...initialState,
            ...persistedState,
            plans: persistedState.plans || []
          };
        }
        if (version === 1) {
          return {
            ...initialState,
            ...persistedState,
            plans: persistedState.plans || []
          };
        }
        return persistedState;
      },
      partialize: (state) => ({
        plans: state.plans
      })
    }
  )
);

const PlanningContext = createContext<PlanningState | undefined>(undefined);

export function PlanningProvider({ children }: { children: React.ReactNode }) {
  return (
    <PlanningContext.Provider value={usePlanningStore()}>
      {children}
    </PlanningContext.Provider>
  );
}

export function usePlanning() {
  const context = useContext(PlanningContext);
  if (!context) {
    throw new Error('usePlanning must be used within a PlanningProvider');
  }
  return context;
}