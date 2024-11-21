import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '../config/firebase';
import { User } from 'firebase/auth';
import { startSync, stopSync } from '../services/syncService';
import { getUserProfile } from '../services/userService';
import { featureAccess } from '../featureAccess';
import type { UserProfile, UserTier } from '../types';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  tier: UserTier;
  hasFeatureAccess: (feature: keyof typeof featureAccess) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setUser(user);
      
      if (user && !user.isAnonymous) {
        try {
          const profile = await getUserProfile();
          setUserProfile(profile);
          await startSync();
        } catch (error) {
          console.error('Failed to load user profile:', error);
        }
      } else {
        setUserProfile(null);
        stopSync();
      }
      
      setIsLoading(false);
    });

    return () => {
      unsubscribe();
      stopSync();
    };
  }, []);

  // Add periodic profile refresh
  useEffect(() => {
    if (!user || user.isAnonymous) return;

    const refreshInterval = setInterval(async () => {
      try {
        const profile = await getUserProfile();
        setUserProfile(profile);
      } catch (error) {
        console.error('Failed to refresh user profile:', error);
      }
    }, 5 * 60 * 1000); // Refresh every 5 minutes

    return () => clearInterval(refreshInterval);
  }, [user]);

  const hasFeatureAccess = (feature: keyof typeof featureAccess): boolean => {
    if (!userProfile) return false;
    
    const allowedTiers = featureAccess[feature] || [];
    return allowedTiers.includes(userProfile.tier as UserTier);
  };

  const value = {
    user,
    userProfile,
    isAuthenticated: !!user && !user.isAnonymous,
    isLoading,
    tier: userProfile?.tier || 'free',
    hasFeatureAccess
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}