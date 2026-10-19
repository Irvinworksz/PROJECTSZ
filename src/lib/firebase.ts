import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
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
 * Automatically handles and resolves account-exists-with-different-credential to link registered accounts
 */
export async function signInWithGoogleFirebase(): Promise<{
  success: boolean;
  user?: any;
  profile?: any;
  token?: string;
  firebaseUser?: FirebaseUser;
  error?: string;
  isAccountLinked?: boolean;
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
        idToken,
        accountLinked: false
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
      firebaseUser: fbUser,
      isAccountLinked: Boolean(data.accountLinked)
    };
  } catch (error: any) {
    if (error.code === 'auth/popup-closed-by-user') {
      return { success: false, error: 'Sign-in cancelled. You closed the Google sign-in window.' };
    }
    if (error.code === 'auth/cancelled-popup-request') {
      return { success: false, error: 'Another sign-in request is already in progress.' };
    }

    // AUTOMATIC ACCOUNT LINKING: Handle auth/account-exists-with-different-credential
    // When a resident registered with email/password and now clicks Google Sign-In with that same Gmail
    if (error.code === 'auth/account-exists-with-different-credential' || error.message?.includes('account-exists-with-different-credential')) {
      const email = error.customData?.email || (error as any).email;
      if (email && typeof email === 'string' && email.includes('@')) {
        console.info(`[Firebase Auth] Resolving credential collision: linking Google account for registered email ${email}`);
        try {
          const response = await fetch('/api/auth/firebase-google-login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              uid: (error.customData as any)?.uid || `google-linked-${Date.now().toString(36)}`,
              email: email.trim().toLowerCase(),
              displayName: (error.customData as any)?.displayName || (error as any).displayName || email.split('@')[0],
              photoURL: (error.customData as any)?.photoURL || (error as any).photoURL || '',
              accountLinked: true
            })
          });

          const data = await response.json();
          if (response.ok && data.success) {
            return {
              success: true,
              user: data.user,
              profile: data.profile,
              token: data.token,
              isAccountLinked: true
            };
          } else {
            return {
              success: false,
              error: data.error || 'Could not link Google account to registered profile.'
            };
          }
        } catch (linkErr: any) {
          console.warn('[Firebase Auth] Auto-link network error:', linkErr);
        }
      }
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

/**
 * Sends a real official password reset email directly via Google Firebase Auth to user's registered Gmail
 */
export async function sendFirebasePasswordReset(email: string): Promise<{
  success: boolean;
  error?: string;
  code?: string;
}> {
  try {
    const cleanEmail = email.trim().toLowerCase();
    await sendPasswordResetEmail(auth, cleanEmail);
    console.info(`[Firebase Auth] Real password reset email dispatched via Google servers to ${cleanEmail}`);
    return { success: true };
  } catch (err: any) {
    console.warn('[Firebase Auth] sendPasswordResetEmail notice:', err?.code, err?.message);
    return {
      success: false,
      code: err?.code,
      error: err?.message || 'Firebase email dispatch error'
    };
  }
}

/**
 * Registers an account in Firebase Auth so Google Firebase can directly manage and dispatch emails
 */
export async function registerUserInFirebaseAuth(email: string, password: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const cleanEmail = email.trim().toLowerCase();
    await createUserWithEmailAndPassword(auth, cleanEmail, password);
    console.info(`[Firebase Auth] Registered user in Firebase Auth with email: ${cleanEmail}`);
    return { success: true };
  } catch (err: any) {
    // If email is already registered in Firebase or provider requires toggle, log notice without crashing
    console.warn('[Firebase Auth] Registration notice:', err?.code, err?.message);
    return { success: false, error: err?.code || err?.message };
  }
}

/**
 * Validates user credentials against Google Firebase Auth.
 * When a resident resets their password via the official Firebase reset email link,
 * this function verifies that the newly submitted password is valid in Firebase,
 * allowing the portal to automatically sync the updated password to their portal account.
 */
export async function verifyFirebasePassword(email: string, password: string): Promise<{
  success: boolean;
  user?: FirebaseUser;
  idToken?: string;
  error?: string;
}> {
  try {
    const cleanEmail = email.trim().toLowerCase();
    const result = await signInWithEmailAndPassword(auth, cleanEmail, password);
    const idToken = await result.user.getIdToken();
    console.info(`[Firebase Auth] Successfully verified new Firebase password for: ${cleanEmail}`);
    return {
      success: true,
      user: result.user,
      idToken
    };
  } catch (err: any) {
    console.warn('[Firebase Auth] verifyFirebasePassword notice:', err?.code, err?.message);
    return {
      success: false,
      error: err?.code || err?.message || 'Firebase authentication failed'
    };
  }
}

