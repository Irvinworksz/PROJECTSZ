# Authentication Recovery, Dual-Channel 2FA, and Cross-Role Profile Parity Plan

A comprehensive engineering plan to restore all previously registered citizen accounts from Cloud Firestore, enable transparent dual-channel Two-Factor Authentication (live on-screen code with 1-click autofill + Gmail SMTP dispatch + Firestore sync), ensure 100% field-for-field parity of personal details across Resident, Staff, and Barangay Captain views, and deliver reliable Google authentication.

## User Review & Critical Decisions

> [!IMPORTANT]
> Based on your confirmed choices in Phase 1:
> - **Account Restoration**: All existing user accounts and profiles stored in Cloud Firestore database `ai-studio-securebarangayec-e1ce6f07-2475-4656-8ed0-42c844f0e436` will be eagerly loaded and merged into the system on server boot, allowing instant login by username or registered Gmail address, as well as instant password reset via OTP.
> - **Two-Factor Authentication Delivery**: 2FA verification codes will be displayed directly on-screen with an "Autofill Passcode" button while simultaneously attempting real-time Gmail delivery and logging to Cloud Firestore (`mfaDispatches` and `notifications`).
> - **Personal Details Parity**: All registration fields (First/Middle/Last Name, Suffix, Birthdate, Civil Status, Gender, Purok, Street Address, Contact Number, ID Type, ID Number, ID Photo) will be synchronized in both `users` and `profiles` collections in Firestore, guaranteeing that the Resident account, Staff Desk queue, and Punong Barangay Captain views display identical, unclipped citizen data.

---

## 1. Overview & Core Concept

### What It Does
This update fixes the authentication pipeline, data persistence synchronization, and profile consistency across all three portal tiers:
1. **Previous Account Login & Recovery**: Resolves why previous accounts could not sign in. Server boot eagerly fetches all Firestore accounts (`users` and `profiles`), preserves password hashes, populates credentials, and allows residents to sign in with their username, registered email, or Google account.
2. **Dual-Channel 2FA & Firebase Sync**: When 2FA is triggered during login, the system creates a 6-digit passcode, attempts live Gmail delivery via SMTP, records the event in Firestore (`mfaDispatches` and `notifications`), and renders the active code directly inside the sign-in modal with a 1-click "Auto-fill Code" button so logins are never blocked by unconfigured SMTP servers or email delays.
3. **End-to-End Profile Parity**: Every piece of personal information submitted during registration—including middle name, suffix, civil status, birthdate, purok, contact number, ID type, ID number, and attached ID photo—is permanently stored in Firestore and dynamically loaded in the Resident's Account Settings, the Staff Verification Table, and the Barangay Captain's Signatory & Constituent Registry.
4. **Google Sign-In Resilience**: Combines Firebase Google Popup Sign-In with an instant verified Google Email sign-in option, eliminating iframe sandbox blocking and ensuring seamless entry for Google-authenticated residents.

---

## 2. User Experience & Visual Design

### Key User Flows

#### A. Resident Registration & Profile Parity Flow
1. Citizen fills out the unified registration form with personal details (First Name, Middle Name, Last Name, Suffix, Contact Number, Purok, Street, Birthdate, Civil Status, Gender, ID credentials, and password).
2. The system hashes the password, writes the user to the local encrypted store, and writes both the `User` and `Profile` objects to Cloud Firestore.
3. The citizen immediately sees their complete personal profile in their dashboard.
4. When Staff or the Barangay Captain views the Desk Queue, the citizen's record displays the exact same personal details (full name with middle initial and suffix, 11-digit phone number, Purok, civil status, ID preview modal).

#### B. Sign-In & Dual-Channel 2FA Flow
1. Citizen signs in using either username, email address, or Google account.
2. If 2FA is required, the 6-digit challenge is activated:
   - Live OTP is recorded in Firestore `mfaDispatches` and `notifications`.
   - Live SMTP dispatch is attempted to the citizen's Gmail.
   - The sign-in modal displays the 6-digit code with an "Auto-fill Security Passcode" button and delivery status indicator (`"Dispatched to Gmail • Code Active"`).
3. The user enters or autofills the code and immediately accesses their portal.

#### C. Password Recovery Flow
1. If a resident forgot their password, they click "Forgot Password?", enter their registered username or Gmail, receive the 6-digit recovery code directly, set a new password complying with security standards, and log in.

### Visual Identity & Theme
- **Dominant Canvas**: Neutral cool slate (`#0B1329` to `#F8FAFC`) with subtle micro-grid precision.
- **Surfaces**: Frosted glass panels (`glass-panel` and `glass-card`) with 1px border lines (`border-slate-200 / border-slate-700/50`).
- **Typography**: Display headlines in `Plus Jakarta Sans` / `Outfit`, body copy in `Plus Jakarta Sans`, tabular figures in `JetBrains Mono` (`font-mono tabular-nums`).
- **Zero-Pill Discipline**: Metadata displayed as clean, unboxed text separated by subtle bullets (`·`).

---

## 3. Key Product Decisions & Trade-Offs

| Decision | Chosen Approach | Rationale & User Benefit |
| :--- | :--- | :--- |
| **Firestore Boot Sync** | Eager boot synchronization of all `/users` and `/profiles` | Guarantees that accounts created in earlier sessions or previous containers are immediately restored and searchable before the first login attempt. |
| **2FA Passcode Accessibility** | Dual-channel: Live on-screen display + 1-click autofill + real Gmail SMTP dispatch + Firestore event | Prevents user lockout when external SMTP credentials (e.g. Gmail App Passwords) are not yet configured or delayed by Google spam filters. |
| **Profile Storage Schema** | Unified dual-write to `/users/{id}` and `/profiles/{id}` in Firestore | Guarantees Resident, Staff, and Barangay Captain views load the exact same data without discrepancies between user credentials and extended citizen census data. |
| **Google Auth Fallback** | Firebase Popup with direct verified Google Email fast-track | Protects users in preview iframes where Google OAuth popups can be blocked by browser third-party cookie restrictions. |

---

## 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Barangay Web Client (Vite/React)                │
│                                                                        │
│  ┌───────────────────────┐  ┌───────────────────────┐  ┌─────────────┐ │
│  │   Resident Portal     │  │   Staff Desk Queue    │  │  Brgy Capt  │ │
│  │ (Profile & Requests)  │  │(ID Verification Table)│  │ (Signatory) │ │
│  └───────────┬───────────┘  └───────────┬───────────┘  └──────┬──────┘ │
│              │                          │                     │        │
│              └───────────────────┬──────┴─────────────────────┘        │
│                                  │                                     │
│                     ┌────────────┴─────────────┐                       │
│                     │  apiClient (/api/*)      │                       │
│                     │  + Firebase Client SDK   │                       │
│                     └────────────┬─────────────┘                       │
└──────────────────────────────────┼─────────────────────────────────────┘
                                   │ HTTP API / JSON
┌──────────────────────────────────┴─────────────────────────────────────┐
│                    Express Fullstack Server (server.ts)                │
│                                                                        │
│  ┌───────────────────────┐  ┌───────────────────────┐  ┌─────────────┐ │
│  │  Auth & 2FA Engine    │  │ Resident ID Manager   │  │ Mailer/SMTP │ │
│  │  (/api/auth/*)        │  │ (/api/staff/residents)│  │ (Nodemailer)│ │
│  └───────────┬───────────┘  └───────────┬───────────┘  └──────┬──────┘ │
│              │                          │                     │        │
│              └───────────────────┬──────┴─────────────────────┘        │
│                                  │                                     │
│                     ┌────────────┴─────────────┐                       │
│                     │ ParameterizedDatabase    │                       │
│                     │ (src/server/db.ts)       │                       │
│                     └────────────┬─────────────┘                       │
└──────────────────────────────────┼─────────────────────────────────────┘
                                   │ Real-Time Sync & Boot Restoration
┌──────────────────────────────────┴─────────────────────────────────────┐
│                     Google Cloud Firestore (Enterprise)                │
│                                                                        │
│   ├── /users/{userId}           (Credentials, RBAC, Core Profile)      │
│   ├── /profiles/{userId}        (Extended Citizen Census & ID Fields)  │
│   ├── /clearanceRequests/{id}   (E-Clearance & Digital Signatures)     │
│   ├── /mfaDispatches/{id}       (Two-Factor Security Dispatches)       │
│   └── /notifications/{id}       (Live Real-time Alert Inbox)           │
└────────────────────────────────────────────────────────────────────────┘
```

### Component & File Mapping

1. **`src/server/db.ts`**:
   - Update `loadPersistedStore` and boot lifecycle to sync all users and profiles from Firestore.
   - Fix profile keying so `profiles.get(userId)` and `profiles.get("prof-" + userId)` consistently resolve the full resident profile.
   - Ensure `syncFromFirestoreUsers` restores all profile census fields, contact numbers, and passwords.

2. **`src/server/firebaseSync.ts`**:
   - Add `syncProfileToFirestore` to mirror extended registration details.
   - Update `fetchAllUsersFromFirestore` to fetch both `/users` and `/profiles`.
   - Update `syncMfaDispatchToFirestore` to guarantee records in `/mfaDispatches` and `/notifications`.

3. **`server.ts`**:
   - On server boot, call `syncAllFirestoreDataOnBoot()` to load all existing accounts and profiles.
   - Update `/api/auth/register` to save and sync both user and profile to Firestore.
   - Update `/api/auth/login` to support username, registered email, or Google email, return active 2FA code, and provide direct verification.
   - Update `/api/auth/firebase-google-login` to link Google accounts with existing resident profiles by email.
   - Update `/api/staff/residents` to return fully populated profiles for staff and captain reviews.

4. **`src/components/SignInPage.tsx`**:
   - Enhance the MFA challenge screen with:
     - Prominent visual display of the active 6-digit security code.
     - 1-click `"Autofill Security Code"` button.
     - Clear status badge (`"Delivered to Gmail"` or `"Code Generated & Active"`).
     - Direct Google fast-track sign-in modal/helper.

5. **`src/components/ResidentDashboard.tsx` & `src/components/StaffDashboard.tsx`**:
   - Ensure full profile parity so all registered personal fields (Middle Name, Suffix, Purok, Civil Status, Birth Date, ID Number) render accurately across both dashboards.
