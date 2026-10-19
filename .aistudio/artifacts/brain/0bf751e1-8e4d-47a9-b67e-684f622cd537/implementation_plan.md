# Seamless Firebase Password Reset & Google Account Linking Plan

This plan resolves the dual authentication barrier between Firebase Authentication and the local portal database, enabling seamless password synchronization from Firebase email reset links and automatic linking when signing in with Google.

## User Review & Critical Decisions

> [!IMPORTANT]
> Based on your answers to the clarifying questions, the system will implement the following verified behaviors:

- **Confirmed Decision 1 (Firebase Password Reset Sync)**: When you reset your password via the Firebase email link, the portal will automatically detect and sync your new Firebase password into your portal profile, updating your encrypted local password hash so you can log in immediately without credentials mismatch.
- **Confirmed Decision 2 (Google Sign-In Account Linking)**: When you click "Continue with Google", the system will automatically link your Google account to your registered email address, even if you originally registered with a username and password, seamlessly opening your existing resident dashboard.

---

## 1. Overview & Core Concept

### Why It Wasn't Working
1. **Separate Password Vaults**: When you click the Firebase password reset link sent to your Gmail, you create a new password on Google's cloud server. Previously, the portal's backend still stored your previous local password hash (`bcrypt`), causing the portal to reject your new password.
2. **Credential Conflict (`auth/account-exists-with-different-credential`)**: Firebase Authentication by default treats "Email/Password" and "Google Sign-In" as separate credentials for the same email address. When an account was created via password and then attempted to sign in with Google, Firebase threw a credential collision error instead of linking the two methods.

### The Solution
- **Bi-Directional Auth Validation**: During sign-in, if a user enters their newly reset Firebase password, the client/server validates with Firebase Auth, automatically upgrades the local bcrypt hash to match the new password, and logs the user in smoothly.
- **Automatic Identity Linking**: In `signInWithGoogleFirebase`, the client catches `auth/account-exists-with-different-credential`, resolves the credential with Firebase Auth, and the backend pairs the Google profile with the existing user record by matching email address (`carinok92@gmail.com`).

---

## 2. User Experience & Flows

### Flow A: Firebase Password Reset & Relogin
1. Resident clicks **Forgot Password** and receives the official Google Firebase link in their Gmail.
2. Resident clicks the link and types a new password on Google's reset page.
3. Resident returns to the portal and enters their registered email/username and new password.
4. The system validates the new credentials, updates the stored password hash in the database, and logs the user in immediately.

### Flow B: Sign In With Google for Registered Email
1. Resident who previously registered with email/password clicks **Continue with Google**.
2. Resident selects their Google account (`carinok92@gmail.com`).
3. The system links Google to their existing resident account, preserves their registered civil status, residency details, and uploaded ID, and redirects directly to their dashboard.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Client-Side Fallback Verification**:
  - *Chosen Approach*: Validate against Firebase Auth directly in the client if the local database hash check indicates an update occurred via Firebase.
  - *Why*: Allows immediate login with newly reset Firebase passwords without requiring server-side service account private keys.
- **Decision 2: Seamless Email Matching for Google Sign-In**:
  - *Chosen Approach*: Match Google profile email directly against existing resident profiles in the database.
  - *Why*: Prevents duplicate accounts from being created and avoids locking residents out when switching between password login and Google 1-click login.

---

## 4. Technical Architecture & Component Mapping

```
┌───────────────────────────────────────────────────────────────┐
│                    User Client (Browser)                     │
│                                                               │
│   ┌─────────────────────┐            ┌────────────────────┐   │
│   │   SignInPage.tsx    │            │ ForgotPassword.tsx │   │
│   └──────────┬──────────┘            └─────────┬──────────┘   │
└──────────────┼─────────────────────────────────┼──────────────┘
               │                                 │
               ▼                                 ▼
┌───────────────────────────────────────────────────────────────┐
│              Authentication Layer (firebase.ts)               │
│                                                               │
│   • signInWithGoogleFirebase() -> Handles Linking Error       │
│   • verifyFirebasePassword()   -> Validates Reset Password    │
│   • sendFirebasePasswordReset()-> Dispatches Email Link       │
└──────────────┬────────────────────────────────────────────────┘
               │
               ▼
┌───────────────────────────────────────────────────────────────┐
│                 Express Backend (server.ts)                   │
│                                                               │
│   • POST /api/auth/login: Adopt & update password hash        │
│   • POST /api/auth/firebase-google-login: Link existing user  │
│   • Sync updated password hash to Firestore real-time         │
└───────────────────────────────────────────────────────────────┘
```
