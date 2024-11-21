import { db, auth } from '../config/firebase';
import { doc, setDoc, getDoc, getDocs, collection, query, where, Timestamp } from 'firebase/firestore';
import type { UserProfile, UserTier } from '../types';

export async function setUserProfile(profile: Partial<UserProfile>) {
  if (!auth.currentUser || auth.currentUser.isAnonymous) {
    throw new Error('No authenticated user');
  }
  
  try {
    const userRef = doc(db, 'users', auth.currentUser.uid);
    const currentDoc = await getDoc(userRef);
    
    // If document exists, merge with existing data
    // If not, create new document with default values
    const updatedProfile = {
      ...(currentDoc.exists() ? currentDoc.data() : {}),
      ...profile,
      uid: auth.currentUser.uid,
      email: auth.currentUser.email || '',
      displayName: profile.displayName || auth.currentUser.displayName || '',
      tier: profile.tier || 'free',
      lastLogin: new Date().toISOString(),
      lastUpdated: Timestamp.now()
    };

    // Ensure we're not overwriting critical fields
    if (currentDoc.exists()) {
      const currentData = currentDoc.data();
      // Preserve admin/beta status unless explicitly set by an admin
      if (!profile.tier) {
        updatedProfile.tier = currentData.tier || 'free';
        updatedProfile.betaAccess = currentData.betaAccess || false;
        updatedProfile.adminAccess = currentData.adminAccess || false;
      }
    }

    await setDoc(userRef, updatedProfile, { merge: true });
    return updatedProfile;
  } catch (error: any) {
    console.error('Failed to update user profile:', error);
    // Only throw user-facing errors
    if (error.code === 'permission-denied') {
      throw new Error('You do not have permission to update this profile');
    }
    throw new Error('Failed to update profile');
  }
}

export async function getUserProfile(): Promise<UserProfile | null> {
  if (!auth.currentUser || auth.currentUser.isAnonymous) return null;
  
  try {
    const userRef = doc(db, 'users', auth.currentUser.uid);
    const docSnap = await getDoc(userRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        uid: auth.currentUser.uid,
        email: auth.currentUser.email || '',
        displayName: auth.currentUser.displayName || '',
        tier: data.tier || 'free',
        lastLogin: data.lastLogin || new Date().toISOString(),
        subscriptionId: data.subscriptionId,
        subscriptionStatus: data.subscriptionStatus,
        subscriptionEndDate: data.subscriptionEndDate,
        betaAccess: data.betaAccess || false,
        adminAccess: data.adminAccess || false,
        lastUpdated: data.lastUpdated?.toDate().toISOString() || new Date().toISOString()
      };
    }
    
    // Create default profile for new users
    const defaultProfile: UserProfile = {
      uid: auth.currentUser.uid,
      email: auth.currentUser.email || '',
      displayName: auth.currentUser.displayName || '',
      tier: 'free',
      lastLogin: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    };

    await setUserProfile(defaultProfile);
    return defaultProfile;
  } catch (error) {
    console.error('Failed to get user profile:', error);
    return null;
  }
}

export async function getAllUsers(): Promise<UserProfile[]> {
  if (!auth.currentUser) {
    throw new Error('No authenticated user');
  }

  try {
    // Get the user's profile to check admin status
    const userRef = doc(db, 'users', auth.currentUser.uid);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists() || userSnap.data().tier !== 'admin') {
      throw new Error('Unauthorized: Only administrators can view all users');
    }

    const usersRef = collection(db, 'users');
    const querySnapshot = await getDocs(usersRef);
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        uid: doc.id,
        email: data.email || '',
        displayName: data.displayName || '',
        tier: data.tier || 'free',
        lastLogin: data.lastLogin || '',
        subscriptionId: data.subscriptionId,
        subscriptionStatus: data.subscriptionStatus,
        subscriptionEndDate: data.subscriptionEndDate,
        betaAccess: data.betaAccess || false,
        adminAccess: data.adminAccess || false,
        lastUpdated: data.lastUpdated?.toDate().toISOString() || ''
      };
    });
  } catch (error) {
    console.error('Failed to get all users:', error);
    throw error;
  }
}

export async function updateUserTier(userId: string, tier: UserTier) {
  if (!auth.currentUser) {
    throw new Error('No authenticated user');
  }

  try {
    // Get the user's profile to check admin status
    const userRef = doc(db, 'users', auth.currentUser.uid);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists() || userSnap.data().tier !== 'admin') {
      throw new Error('Unauthorized: Only administrators can update user tiers');
    }

    const targetUserRef = doc(db, 'users', userId);
    
    // Update tier and related permissions
    await setDoc(targetUserRef, {
      tier,
      betaAccess: ['beta', 'admin'].includes(tier),
      adminAccess: tier === 'admin',
      lastUpdated: Timestamp.now()
    }, { merge: true });
  } catch (error) {
    console.error('Failed to update user tier:', error);
    throw error;
  }
}

export async function updateSubscriptionStatus(
  subscriptionId: string,
  status: 'active' | 'canceled' | 'expired',
  endDate?: string
) {
  if (!auth.currentUser || auth.currentUser.isAnonymous) {
    throw new Error('No authenticated user');
  }

  try {
    const userRef = doc(db, 'users', auth.currentUser.uid);
    await setDoc(userRef, {
      subscriptionId,
      subscriptionStatus: status,
      subscriptionEndDate: endDate,
      tier: status === 'active' ? 'premium' : 'free',
      lastUpdated: Timestamp.now()
    }, { merge: true });
  } catch (error) {
    console.error('Failed to update subscription status:', error);
    throw error;
  }
}