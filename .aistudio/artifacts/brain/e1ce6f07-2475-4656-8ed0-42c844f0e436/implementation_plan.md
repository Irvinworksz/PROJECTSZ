# Firebase Real-Time Authentication & Cloud Integration Plan

This plan implements all three requested capabilities to provide complete real-time authentication in Firebase:
1. **Live Authentication Sync**: Seamlessly sync and verify all user accounts, active sessions, and logins in real-time Cloud Firestore.
2. **Direct Firebase Google Sign-In**: Add Google Authentication via Firebase Auth SDK (`signInWithPopup` / GoogleAuthProvider) on the Citizen Portal.
3. **Firebase Auth & Credentials Inspector**: Provide a live diagnostic tab displaying Firebase Auth user tokens, provider details, and project credentials.

---

## User Review Required

> [!IMPORTANT]
> The application will support **both** municipal password/MFA logins (synced real-time to Firestore) **and** direct one-click **"Sign In with Google"** powered by Firebase Auth. Google Sign-In will automatically create and verify resident profiles in Firestore.

---

## Proposed Changes

### 1. Firebase Authentication Client Module (`src/lib/firebase.ts`)
- Export `GoogleAuthProvider`, `signInWithPopup`, and `onAuthStateChanged` from `firebase/auth`.
- Implement `signInWithGoogleFirebase()` which executes Google popup authentication, acquires the Firebase ID token, and sends it to `/api/auth/firebase-google-login`.
- Provide `getFirebaseClientAuthStatus()` to inspect live client authentication state.

### 2. Backend Authentication Route (`server.ts` & `src/server/firebaseSync.ts`)
- Add `POST /api/auth/firebase-google-login`:
  - Receives Firebase Auth user info (UID, email, displayName, photoURL).
  - Checks if user exists in persistent store; if new, provisions a resident account.
  - Automatically records the live session and profile to Firestore `/users/{uid}`.
  - Generates official application JWT session token for standard e-governance access.
- Seed the existing system accounts (`resident.santos`, `staff.reyes`, `captain.delacruz`, `admin.security`) into Firestore `/users` so they appear immediately in the Firebase Console.

### 3. Frontend Citizen Portal (`src/components/SignInPage.tsx`)
- Add official **"Sign In with Google"** button with official Google emblem on the Citizen Portal login form.
- Handle seamless sign-in, redirecting the citizen to their resident dashboard upon approval.
- Graceful error handling for popup closures or network interruptions.

### 4. Interactive Firebase Auth & Credentials Inspector (`src/components/FirebaseCloudConsoleModal.tsx`)
- Add **"Firebase Auth & Cloud Credentials"** tab displaying:
  - Active Firebase Auth state (Current UID, Provider, Auth Domain, OAuth Client ID).
  - One-click **"Run Live Auth Test"** that simulates authenticating a user and verifies real-time appearance in Cloud Firestore.
  - Full diagnostic checklist for classroom/professor presentation.

---

## Verification Plan

### Automated Verification
- Run `compile_applet` to verify TypeScript builds without errors.
- Run `lint_applet` to check strict type safety.
- Test `/api/firebase/status` and `/api/auth/firebase-google-login` via curl.

### Manual Verification
1. Click **"Firebase Cloud DB"** on the Sign-In page and verify all tabs (Live Sync, Auth Credentials, Schema).
2. Click **"Sign In with Google"** to test Firebase Auth login flow.
3. Sign in using any standard account (`resident.santos` or `captain.delacruz`) and confirm real-time event updates in the Live Stream.
