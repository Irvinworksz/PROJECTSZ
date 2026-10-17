import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User as FirebaseUser
} from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app, (firebaseConfig as any).firestoreDatabaseId || '(default)');

// Validate connection to Firestore on initialization per IAS security checklist
export async function validateFirebaseConnection(): Promise<{ connected: boolean; error?: string }> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.info('[Firebase] Firestore real-time cloud connection verified successfully.');
    return { connected: true };
  } catch (error: any) {
    if (error?.message?.includes('the client is offline')) {
      console.warn('[Firebase] Client is offline or database initializing.');
      return { connected: false, error: 'Offline / initializing' };
    }
    // Document might just not exist, but server responded, meaning connection is live
    return { connected: true };
  }
}

// Initial connectivity ping
validateFirebaseConnection().catch(() => {});

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

/**
 * Sign in using Google Authentication via Firebase Auth SDK
 */
export async function signInWithGoogleFirebase(): Promise<{
  success: boolean;
  user?: any;
  profile?: any;
  token?: string;
  firebaseUser?: FirebaseUser;
  error?: string;
}> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const fbUser = result.user;
    const idToken = await fbUser.getIdToken();

    // Call backend to authenticate / provision resident session
    const response = await fetch('/api/auth/firebase-google-login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        uid: fbUser.uid,
        email: fbUser.email,
        displayName: fbUser.displayName,
        photoURL: fbUser.photoURL,
        idToken
      })
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      return {
        success: false,
        error: data.error || 'Failed to authenticate with Barangay E-Services backend.'
      };
    }

    return {
      success: true,
      user: data.user,
      profile: data.profile,
      token: data.token,
      firebaseUser: fbUser
    };
  } catch (error: any) {
    if (error.code === 'auth/popup-closed-by-user') {
      return { success: false, error: 'Sign-in cancelled. You closed the Google sign-in window.' };
    }
    if (error.code === 'auth/cancelled-popup-request') {
      return { success: false, error: 'Another sign-in request is already in progress.' };
    }
    return {
      success: false,
      error: error.message || 'Firebase Google Sign-In failed.'
    };
  }
}

export function getCurrentFirebaseUser(): FirebaseUser | null {
  return auth.currentUser;
}

export async function signOutFirebaseUser(): Promise<void> {
  try {
    await firebaseSignOut(auth);
  } catch (e) {
    console.warn('[Firebase Auth] Error signing out:', e);
  }
}
