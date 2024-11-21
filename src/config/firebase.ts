import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { 
  getAuth, 
  setPersistence, 
  browserLocalPersistence,
  signInAnonymously,
  onAuthStateChanged,
  GoogleAuthProvider,
  OAuthProvider,
  signInWithPopup,
  signInWithRedirect
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyD4xtbJkdttUWbldDdnWdPmL-hr0vJ20tQ",
  authDomain: "seed-scheduler.firebaseapp.com",
  projectId: "seed-scheduler",
  storageBucket: "seed-scheduler.firebasestorage.app",
  messagingSenderId: "967270255063",
  appId: "1:967270255063:web:162038363aeece5fabe392",
  measurementId: "G-REN9586PWS"
};

// Initialize Firebase only if no apps exist
const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
export const db = getFirestore(app);
export const auth = getAuth(app);

// Configure Google provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('email');
googleProvider.addScope('profile');

// Configure Apple provider
export const appleProvider = new OAuthProvider('apple.com');
appleProvider.addScope('email');
appleProvider.addScope('name');

// Enable offline persistence for Firestore
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === 'failed-precondition') {
    console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time.');
  } else if (err.code === 'unimplemented') {
    console.warn('The current browser doesn\'t support persistence.');
  }
});

// Set auth persistence to local
setPersistence(auth, browserLocalPersistence).catch(error => {
  console.error('Auth persistence error:', error);
});

// Helper function to handle social sign in with fallback
export const signInWithProvider = async (provider: GoogleAuthProvider | OAuthProvider) => {
  try {
    // Try popup first
    return await signInWithPopup(auth, provider);
  } catch (popupError: any) {
    console.log('Popup sign-in failed:', popupError);
    
    // If popup fails and it's not because it was blocked or closed by user,
    // try redirect as fallback
    if (popupError.code !== 'auth/popup-blocked' && 
        popupError.code !== 'auth/popup-closed-by-user' &&
        popupError.code !== 'auth/cancelled-popup-request') {
      return signInWithRedirect(auth, provider);
    }
    
    throw popupError;
  }
};

// Initialize auth with anonymous authentication
export const initAuth = async () => {
  try {
    // Check if already authenticated
    if (auth.currentUser) {
      return true;
    }

    // Try anonymous sign in
    await signInAnonymously(auth);
    return true;
  } catch (error) {
    console.error('Auth initialization error:', error);
    return false;
  }
};

// Export auth state observer
export const onAuthChange = (callback: (user: any) => void) => {
  return onAuthStateChanged(auth, callback);
};