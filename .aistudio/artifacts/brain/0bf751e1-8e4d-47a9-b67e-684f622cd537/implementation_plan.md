# Resident Portal Experience & Identity Management Implementation Plan

Streamline the resident portal experience by removing redundant security controls, integrating civil status options, automating registered identity verification on certificate applications, and ensuring uploaded resident pictures are seamlessly visible to Barangay Staff and the Punong Barangay (Barangay Captain).

---

## 1. Scope & Core Objectives

Based on your direct specifications and clarified requirements:

1. **Remove Resident Document Vault & MFA Settings**:
   - Remove the **Secure Document Vault** and **IAS Security & MFA Settings** tabs from the Resident Dashboard.
   - Remove the **MFA: Active / Disabled** button from the resident profile header.
   - Keep 2FA disabled for resident accounts so residents can navigate directly without complex MFA configuration.

2. **Add Civil Status to Resident Profile & Edit Contact Info**:
   - In the **Edit Contact Info** modal, add a **Civil Status** dropdown with strictly three options:
     - **Single**
     - **Married**
     - **Widowed**
   - Save and persist the selected Civil Status to the resident's profile and user records in SQLite and Firebase Firestore.
   - Display the updated Civil Status prominently on the resident's dashboard summary card.
   - Align the account creation registration form to use the same three Civil Status options (**Single**, **Married**, **Widowed**).

3. **Automate Government ID on Applications (Remove Manual Re-upload)**:
   - In the **Request New E-Clearance** application modal, remove the manual file upload and document vault selection controls.
   - Display an **"Official ID on File"** preview card showing the exact Government ID / picture submitted during account registration (with ID Type, ID Number, and instant image thumbnail preview).
   - Automatically bind the resident's registered ID image URL and filename when creating the application, eliminating the need to repeatedly upload documents.

4. **Synchronize Resident Uploaded Picture Across Staff & Barangay Captain Portals**:
   - Ensure the picture uploaded during account registration is stored as `idPhotoUrl` and `avatarUrl`.
   - In **Staff Dashboard**:
     - Display the resident's actual uploaded picture in the **Resident Verification Queue** and in the clearance review modal.
     - Enable full high-resolution image zoom and modal preview for staff officers.
   - In **Barangay Captain (Official Signing Portal)**:
     - Update the **"Inspect ID"** modal to render the resident's actual uploaded photo in high fidelity instead of a generic placeholder avatar.

---

## 2. Proposed Changes & Technical Architecture

### Component & Backend Changes

#### 1. `src/types.ts`
- Update `ResidentProfile['civilStatus']` to `'Single' | 'Married' | 'Widowed'`.
- Ensure `User` and `ClearanceRequest` maintain fields for `civilStatus`, `idPhotoUrl`, and `idAttachmentUrl`.

#### 2. `src/components/ResidentDashboard.tsx`
- Remove the tabs bar for **"Secure Document Vault"** and **"IAS Security & MFA Settings"**, keeping the view focused exclusively on **"My Applications"** and e-clearance tracking.
- Remove the header button `MFA: Active / Disabled`.
- **Edit Contact Info Modal**:
  - Add state `editCivilStatus` initialized from `profile?.civilStatus || user.civilStatus || 'Single'`.
  - Add a select dropdown with options: `Single`, `Married`, and `Widowed`.
  - Pass `civilStatus` to `apiClient.updateProfile()`.
- **Request New E-Clearance Modal**:
  - Remove `idSourceType`, file upload picker, malware simulation toggle, and vault selector.
  - Render a clean **"Government ID on File"** section showcasing the resident's registration ID with a zoomable thumbnail, ID Type, and ID Number.
  - Automatically attach the registered `idPhotoUrl` and `idPhotoName` to the application payload.

#### 3. `src/components/SignInPage.tsx`
- In the **Create Account (Registration)** form:
  - Update the Civil Status dropdown to strictly **Single**, **Married**, and **Widowed**.
  - Ensure the uploaded picture file is captured as base64 / URL and submitted as both `idPhotoUrl` and `avatarUrl`.

#### 4. `src/server/db.ts` & `server.ts`
- In `db.updateUserProfile(userId, data)`:
  - Add support for updating `user.civil_status` and `profile.civilStatus`.
- In `PUT /api/auth/profile`:
  - Validate and accept `civilStatus` (`Single`, `Married`, or `Widowed`) and commit it to both local storage and Firestore.
- In `POST /api/clearances`:
  - If `idAttachmentUrl` is not explicitly provided in the request body, automatically fallback to `residentUser.id_photo_url` or `residentProfile.idPhotoUrl`.

#### 5. `src/components/StaffDashboard.tsx`
- In the **Resident Verification Queue**:
  - Ensure the resident's uploaded picture renders clearly in the table thumbnail and opens in the full-size inspector modal.
- In the **Clearance Review Modal**:
  - Render the resident's uploaded ID image directly (with high-resolution inspection button).

#### 6. `src/components/OfficialSigningPortal.tsx`
- In the **Signatory Verification ID Inspection Modal**:
  - Render the resident's real uploaded picture / ID image (`inspectingReq.idAttachmentUrl || inspectingReq.residentPhotoUrl`) at full clarity with zoom capabilities, replacing the placeholder letter icon.

---

## 3. Verification & Testing Plan

1. **Resident Registration Test**:
   - Register a new resident account with an uploaded picture and select Civil Status (**Single**, **Married**, or **Widowed**).
   - Verify that the picture is saved and accessible.

2. **Resident Profile & Contact Update Test**:
   - Log into the resident portal.
   - Verify that **Secure Document Vault** and **IAS Security MFA Settings** tabs are gone.
   - Verify that the header MFA button is removed.
   - Click **Edit Contact Info**, change Civil Status (e.g. from Single to Married), and click **Save**.
   - Verify that the updated Civil Status immediately displays on the resident dashboard card and persists upon refresh.

3. **Application Submission Test**:
   - Click **Request New E-Clearance**.
   - Verify that the manual government ID upload input is replaced with the **Government ID on File** card showing the registered image.
   - Submit the application and verify that the application references the registered ID image automatically.

4. **Staff Dashboard Review Test**:
   - Log in as **Staff Desk** (`staff.elena`).
   - In **Clearance Review**, click **Inspect High-Resolution ID** and confirm the resident's actual uploaded picture is visible.
   - In **Resident Verification Queue**, verify that the resident's uploaded photo appears in the roster and the zoom modal.

5. **Barangay Captain Signing Test**:
   - Log in as **Barangay Captain** (`capt.laugo`).
   - Click **Inspect ID** for the pending clearance.
   - Confirm the resident's actual photo is displayed in full resolution.

---

## Ready to Proceed?
Please review this implementation plan. When you are ready, click **Proceed** to begin the changes.
