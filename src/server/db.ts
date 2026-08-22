import bcrypt from 'bcryptjs';
import { computeAuditLogHash, computeDocumentHash, generateBarangayDigitalSignature } from './crypto.js';
import type { AuditLog, ClearanceRequest, NotificationRecord, ResidentProfile, UploadedDocument, User, UserRole } from '../types.js';

// In-Memory Relational Store with Strict Parameterized Query abstraction
class ParameterizedDatabase {
  private users: Map<string, any> = new Map();
  private profiles: Map<string, any> = new Map();
  private requests: Map<string, any> = new Map();
  private uploadedDocuments: Map<string, UploadedDocument> = new Map();
  private auditLogs: AuditLog[] = [];
  private notifications: NotificationRecord[] = [];
  private lastAuditHash: string = '0000000000000000000000000000000000000000000000000000000000000000';

  constructor() {
    this.initSeedData();
  }

  /**
   * Initializes relational tables and seeds with authentic Philippine Barangay records & IAS demo accounts
   */
  private async initSeedData() {
    const saltRounds = 10;
    const residentPass = await bcrypt.hash('Resident@2026!', saltRounds);
    const staffPass = await bcrypt.hash('StaffSecure@2026!', saltRounds);
    const officialPass = await bcrypt.hash('CaptainAuth@2026!', saltRounds);
    const adminPass = await bcrypt.hash('AdminRoot@2026!', saltRounds);

    const resident1Id = 'usr-res-001';
    const resident2Id = 'usr-res-002';
    const staffId = 'usr-stf-001';
    const officialId = 'usr-off-001';
    const adminId = 'usr-adm-001';

    // Users
    this.users.set(resident1Id, {
      id: resident1Id,
      username: 'juan.delacruz',
      password_hash: residentPass,
      email: 'juan.delacruz@cabucbucan.gov.ph',
      role: 'resident',
      full_name: 'Juan M. Dela Cruz',
      contact_number: '09171234567',
      address: 'Purok 4, Barangay Cabucbucan, Rizal, Nueva Ecija',
      purok: 'Purok 4',
      is_verified_resident: 1,
      created_at: '2026-01-10T08:30:00Z',
      last_login: new Date().toISOString(),
      mfa_enabled: 0,
      mfa_required: 0,
      mfa_secret: null,
      mfa_backup_codes: ['BACKUP-SEC-01', 'BACKUP-SEC-02', '4A81-992F', '82C1-331B', '9DF0-8812', '124B-772A']
    });

    this.users.set(resident2Id, {
      id: resident2Id,
      username: 'maria.santos',
      password_hash: residentPass,
      email: 'maria.santos@cabucbucan.gov.ph',
      role: 'resident',
      full_name: 'Maria Clara Santos',
      contact_number: '09289876543',
      address: 'Purok 2, Barangay Cabucbucan, Rizal, Nueva Ecija',
      purok: 'Purok 2',
      is_verified_resident: 1,
      created_at: '2026-02-01T09:15:00Z',
      last_login: new Date().toISOString(),
      mfa_enabled: 0,
      mfa_required: 0,
      mfa_secret: null,
      mfa_backup_codes: ['BACKUP-SEC-01', 'BACKUP-SEC-02', '7A12-884B', '33FC-991A']
    });

    this.users.set(staffId, {
      id: staffId,
      username: 'staff.elena',
      password_hash: staffPass,
      email: 'staff.elena@cabucbucan.gov.ph',
      role: 'staff',
      full_name: 'Elena Ramos (Desk Officer)',
      contact_number: '09195551234',
      address: 'Barangay Cabucbucan Hall Administrative Desk',
      purok: 'Purok 1',
      is_verified_resident: 1,
      created_at: '2025-11-01T08:00:00Z',
      last_login: new Date().toISOString(),
      mfa_enabled: 1,
      mfa_required: 1,
      mfa_secret: 'JBSWY3DPEHPK3PXP', // Base32 RFC 3548 demo key
      mfa_backup_codes: ['BACKUP-SEC-01', 'BACKUP-SEC-02', 'STAFF-8841', 'STAFF-9902', 'STAFF-1123', 'STAFF-4456']
    });

    this.users.set(officialId, {
      id: officialId,
      username: 'capt.laugo',
      password_hash: officialPass,
      email: 'captain.laugo@cabucbucan.gov.ph',
      role: 'official',
      full_name: 'Hon. Cornelio Laugo (Punong Barangay)',
      contact_number: '09187778899',
      address: 'Office of the Punong Barangay, Cabucbucan, Rizal, Nueva Ecija',
      purok: 'Purok 1',
      is_verified_resident: 1,
      created_at: '2025-06-30T08:00:00Z',
      last_login: new Date().toISOString(),
      mfa_enabled: 1,
      mfa_required: 1,
      mfa_secret: 'JBSWY3DPEHPK3PXP',
      mfa_backup_codes: ['BACKUP-SEC-01', 'BACKUP-SEC-02', 'CAPT-2026', 'CAPT-7788', 'CAPT-9911', 'CAPT-3344']
    });

    this.users.set(adminId, {
      id: adminId,
      username: 'admin.security',
      password_hash: adminPass,
      email: 'admin.ias@cabucbucan.gov.ph',
      role: 'admin',
      full_name: 'Engr. John Dela Cruz (Cybersecurity Admin)',
      contact_number: '09170001122',
      address: 'ICT Security Operations Office, Barangay Cabucbucan',
      purok: 'Purok 1',
      is_verified_resident: 1,
      created_at: '2025-01-01T00:00:00Z',
      last_login: new Date().toISOString(),
      mfa_enabled: 1,
      mfa_required: 1,
      mfa_secret: 'JBSWY3DPEHPK3PXP',
      mfa_backup_codes: ['BACKUP-SEC-01', 'BACKUP-SEC-02', 'ROOT-0001', 'ROOT-0002', 'ROOT-0003', 'ROOT-0004']
    });

    // Resident Profiles
    this.profiles.set(resident1Id, {
      id: 'prof-res-001',
      userId: resident1Id,
      firstName: 'Juan',
      middleName: 'Mercado',
      lastName: 'Dela Cruz',
      suffix: '',
      birthDate: '1992-06-12',
      civilStatus: 'Married',
      gender: 'Male',
      citizenship: 'Filipino',
      purokZone: 'Purok 4',
      streetAddress: 'Purok 4, Barangay Cabucbucan, Rizal, Nueva Ecija',
      yearsOfResidency: 14,
      contactNumber: '09171234567',
      emergencyContact: 'Luisa Dela Cruz (Spouse) - 09179998877',
      voterStatus: 'Registered',
      idType: 'Philippine National ID (PhilSys)',
      idNumber: 'PHIL-2024-8841-9920',
      createdAt: '2026-01-10T08:35:00Z',
      updatedAt: '2026-01-10T08:35:00Z'
    });

    this.profiles.set(resident2Id, {
      id: 'prof-res-002',
      userId: resident2Id,
      firstName: 'Maria',
      middleName: 'Clara',
      lastName: 'Santos',
      suffix: '',
      birthDate: '1998-11-23',
      civilStatus: 'Single',
      gender: 'Female',
      citizenship: 'Filipino',
      purokZone: 'Purok 2',
      streetAddress: 'Purok 2, Barangay Cabucbucan, Rizal, Nueva Ecija',
      yearsOfResidency: 8,
      contactNumber: '09289876543',
      emergencyContact: 'Teresa Santos (Mother) - 09281112233',
      voterStatus: 'Registered',
      idType: 'Unified Multi-Purpose ID (UMID)',
      idNumber: 'CRN-0111-9876543-2',
      createdAt: '2026-02-01T09:20:00Z',
      updatedAt: '2026-02-01T09:20:00Z'
    });

    // Seed Clearance Requests with authentic cryptographic signatures
    const issuedReqId = 'req-2026-001';
    const issuedRef = 'BC-2026-0842';
    const issueDate = '2026-08-15T10:30:00Z';
    const signatory = 'Hon. Cornelio Laugo (Punong Barangay)';

    const cryptoHash = computeDocumentHash({
      referenceNumber: issuedRef,
      residentId: resident1Id,
      residentName: 'Juan M. Dela Cruz',
      documentType: 'barangay_clearance',
      purpose: 'Local Employment Application at BPO Center',
      issuedAt: issueDate,
      signatory
    });

    const sigResult = generateBarangayDigitalSignature(cryptoHash, signatory);

    // Seed Uploaded Document 1 (Juan's PhilSys ID)
    const doc1Id = 'doc-up-001';
    this.uploadedDocuments.set(doc1Id, {
      id: doc1Id,
      applicationId: issuedReqId,
      residentId: resident1Id,
      residentName: 'Juan M. Dela Cruz',
      originalFilename: 'philsys_national_id_front.jpg',
      storedFilename: 'sec_doc_001_philsys.dat',
      mimeType: 'image/jpeg',
      sizeBytes: 842100,
      docCategory: 'valid_id',
      sha256Hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      scanStatus: 'CLEAN',
      scanDetails: 'IAS Antivirus Engine verified clean. Magic bytes: image/jpeg. No malicious payload detected.',
      threatsFound: [],
      storagePathMasked: '[ISOLATED_VAULT_ROOT]/sec_doc_001_philsys.dat',
      uploadedAt: '2026-08-14T08:50:00Z',
      downloadUrl: `/api/uploads/${doc1Id}`
    });

    // Seed Uploaded Document 2 (Maria's UMID Card)
    const doc2Id = 'doc-up-002';
    const req2Id = 'req-2026-002';
    this.uploadedDocuments.set(doc2Id, {
      id: doc2Id,
      applicationId: req2Id,
      residentId: resident2Id,
      residentName: 'Maria Clara Santos',
      originalFilename: 'umid_card_scan.pdf',
      storedFilename: 'sec_doc_002_umid.dat',
      mimeType: 'application/pdf',
      sizeBytes: 1245000,
      docCategory: 'valid_id',
      sha256Hash: 'a6c98615b39926615b49749174577ef379d46d0a7905ee7a89e9005bc14d6428',
      scanStatus: 'CLEAN',
      scanDetails: 'IAS Antivirus Engine verified clean. Magic bytes: application/pdf. 0 threats detected.',
      threatsFound: [],
      storagePathMasked: '[ISOLATED_VAULT_ROOT]/sec_doc_002_umid.dat',
      uploadedAt: '2026-08-20T11:10:00Z',
      downloadUrl: `/api/uploads/${doc2Id}`
    });

    this.requests.set(issuedReqId, {
      id: issuedReqId,
      referenceNumber: issuedRef,
      residentId: resident1Id,
      residentName: 'Juan M. Dela Cruz',
      residentAddress: 'Purok 4, Barangay Cabucbucan, Rizal, Nueva Ecija',
      purok: 'Purok 4',
      documentType: 'barangay_clearance',
      purpose: 'Local Employment Application at Central Luzon Logistics Center',
      urgency: 'standard',
      status: 'issued',
      feeAmount: 50.00,
      orNumber: 'OR-CAB-2026-8812',
      idAttachmentName: 'philsys_national_id_front.jpg',
      attachments: [this.uploadedDocuments.get(doc1Id)!],
      cryptoHash: cryptoHash,
      qrPayload: JSON.stringify({
        ref: issuedRef,
        doc: 'Barangay Clearance',
        name: 'JUAN M. DELA CRUZ',
        issued: issueDate,
        hash: cryptoHash.substring(0, 16) + '...',
        verifyUrl: `https://ais-dev-kl4fl7jkhuhiupusvnmiri-878015002300.asia-southeast1.run.app/?verify=${issuedRef}`
      }),
      signedByOfficialId: officialId,
      signedByOfficialName: signatory,
      signedAt: issueDate,
      digitalSignatureFingerprint: sigResult.keyFingerprint,
      submittedAt: '2026-08-14T09:00:00Z',
      reviewedAt: '2026-08-14T14:20:00Z',
      reviewedByStaffId: staffId,
      reviewedByStaffName: 'Elena Ramos (Desk Officer)',
      readyAt: '2026-08-15T10:00:00Z',
      issuedAt: issueDate,
      staffRemarks: 'Verified against local voter record and PhilSys ID. No derogatory record on blotter.',
      notificationsSent: [
        {
          id: 'notif-1',
          type: 'sms',
          recipient: '09171234567',
          message: '[BRGY-CABUCBUCAN] Your request for Barangay Clearance #BC-2026-0842 has been APPROVED by Hon. Cornelio Laugo and is Ready for Collection/Download with digital verification seal.',
          timestamp: '2026-08-15T10:35:00Z',
          status: 'delivered',
          residentId: resident1Id,
          residentName: 'Juan M. Dela Cruz',
          applicationId: issuedReqId,
          referenceNumber: issuedRef,
          documentType: 'barangay_clearance'
        }
      ]
    });

    // Sample Request 2: Certificate of Indigency (Under Review)
    this.requests.set(req2Id, {
      id: req2Id,
      referenceNumber: 'IND-2026-0193',
      residentId: resident2Id,
      residentName: 'Maria Clara Santos',
      residentAddress: 'Purok 2, Barangay Cabucbucan, Rizal, Nueva Ecija',
      purok: 'Purok 2',
      documentType: 'certificate_of_indigency',
      purpose: 'Financial Medical Assistance at Nueva Ecija Provincial Hospital',
      urgency: 'urgent_medical',
      status: 'under_review',
      monthlyIncome: 8500,
      assistanceType: 'Medical Hospitalization Assistance (DSWD)',
      feeAmount: 0.00, // Indigency is free
      idAttachmentName: 'umid_card_scan.pdf',
      attachments: [this.uploadedDocuments.get(doc2Id)!],
      submittedAt: '2026-08-20T11:15:00Z',
      reviewedAt: '2026-08-21T08:30:00Z',
      reviewedByStaffId: staffId,
      reviewedByStaffName: 'Elena Ramos (Desk Officer)',
      staffRemarks: 'Endorsed for priority Captain signature due to urgent medical scheduled tomorrow.',
      notificationsSent: [
        {
          id: 'notif-2',
          type: 'sms',
          recipient: '09289876543',
          message: '[BRGY-CABUCBUCAN] Your Indigency Certificate application #IND-2026-0193 is currently UNDER REVIEW by Desk Staff.',
          timestamp: '2026-08-21T08:31:00Z',
          status: 'delivered',
          residentId: resident2Id,
          residentName: 'Maria Clara Santos',
          applicationId: req2Id,
          referenceNumber: 'IND-2026-0193',
          documentType: 'certificate_of_indigency'
        }
      ]
    });

    // Sample Request 3: Business Clearance (For Signature)
    const req3Id = 'req-2026-003';
    this.requests.set(req3Id, {
      id: req3Id,
      referenceNumber: 'BUS-2026-0419',
      residentId: resident1Id,
      residentName: 'Juan M. Dela Cruz',
      residentAddress: 'Purok 4, Barangay Cabucbucan, Rizal, Nueva Ecija',
      purok: 'Purok 4',
      documentType: 'business_permit',
      purpose: 'New Barangay Business Clearance for Agri-Supply & Sari-Sari Store',
      urgency: 'standard',
      status: 'for_signature',
      businessName: 'Dela Cruz Rice & Agri-Supply Store',
      businessNature: 'Retail of Rice, Feed & General Merchandise',
      businessAddress: 'Purok 4, Barangay Cabucbucan, Rizal, Nueva Ecija',
      feeAmount: 350.00,
      orNumber: 'OR-CAB-2026-9044',
      idAttachmentName: 'dti_registration_certificate.pdf',
      attachments: [],
      submittedAt: '2026-08-19T14:00:00Z',
      reviewedAt: '2026-08-20T10:00:00Z',
      reviewedByStaffId: staffId,
      reviewedByStaffName: 'Elena Ramos (Desk Officer)',
      staffRemarks: 'Sanitary and local zoning inspection cleared. Awaiting Punong Barangay Cornelio Laugo cryptographic seal.',
      notificationsSent: [
        {
          id: 'notif-3',
          type: 'sms',
          recipient: '09171234567',
          message: '[BRGY-CABUCBUCAN] Your Business Clearance #BUS-2026-0419 has been forwarded to Hon. Cornelio Laugo FOR SIGNATURE.',
          timestamp: '2026-08-20T10:05:00Z',
          status: 'delivered',
          residentId: resident1Id,
          residentName: 'Juan M. Dela Cruz',
          applicationId: req3Id,
          referenceNumber: 'BUS-2026-0419',
          documentType: 'business_permit'
        }
      ]
    });

    // Seed Immutable Audit Logs with Initial Blockchain-like Hash Chaining
    this.appendAuditLog({
      userId: 'SYSTEM_BOOT',
      userName: 'IAS Security Kernel',
      userRole: 'admin',
      ipAddress: '127.0.0.1',
      actionType: 'SYSTEM_GENESIS_INITIALIZATION',
      category: 'SECURITY',
      severity: 'INFO',
      details: 'IAS Compliant Relational Database tables initialized with AES/SHA-256 integrity checks, MFA TOTP engine, and Antivirus file scanner.',
      resourceType: 'SYSTEM'
    });

    this.appendAuditLog({
      userId: officialId,
      userName: 'Hon. Cornelio Laugo',
      userRole: 'official',
      ipAddress: '192.168.1.10',
      actionType: 'DIGITAL_SIGNATURE_APPLIED',
      category: 'CLEARANCE',
      severity: 'INFO',
      details: `Generated cryptographic HMAC-SHA256 seal for Barangay Clearance #BC-2026-0842 (Barangay Cabucbucan, Rizal, Nueva Ecija)`,
      resourceType: 'CLEARANCE_REQUEST',
      resourceId: issuedReqId
    });
  }

  /**
   * Appends an immutable, hash-chained log entry to enforce non-repudiation and tamper resistance
   */
  public appendAuditLog(entry: {
    userId: string;
    userName: string;
    userRole: UserRole;
    ipAddress: string;
    actionType: string;
    category: 'AUTH' | 'CLEARANCE' | 'SECURITY' | 'DATA_ACCESS' | 'ADMIN';
    severity: 'INFO' | 'WARN' | 'CRITICAL';
    details: string;
    resourceType: string;
    resourceId?: string;
    metadata?: Record<string, any>;
  }): AuditLog {
    const id = `aud-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const timestamp = new Date().toISOString();

    const currentHash = computeAuditLogHash(this.lastAuditHash, {
      id,
      timestamp,
      userId: entry.userId,
      actionType: entry.actionType,
      details: entry.details,
      ipAddress: entry.ipAddress
    });

    const newLog: AuditLog = {
      id,
      timestamp,
      userId: entry.userId,
      userName: entry.userName,
      userRole: entry.userRole,
      ipAddress: entry.ipAddress,
      actionType: entry.actionType,
      category: entry.category,
      severity: entry.severity,
      details: entry.details,
      resourceType: entry.resourceType,
      resourceId: entry.resourceId,
      previousHash: this.lastAuditHash,
      currentHash,
      metadata: entry.metadata
    };

    this.auditLogs.unshift(newLog);
    this.lastAuditHash = currentHash;
    return newLog;
  }

  // --- Parameterized Query / Safe Data Access Methods ---

  public findUserByUsername(username: string): any | null {
    const sanitized = username.trim().toLowerCase();
    for (const u of this.users.values()) {
      if (u.username.toLowerCase() === sanitized) return u;
    }
    return null;
  }

  public findUserByEmailOrUsername(identifier: string): any | null {
    const sanitized = identifier.trim().toLowerCase();
    for (const u of this.users.values()) {
      if (u.username.toLowerCase() === sanitized || (u.email && u.email.toLowerCase() === sanitized)) {
        return u;
      }
    }
    return null;
  }

  public setUserResetOtp(userId: string, otp: string, expiresAt: number): boolean {
    const user = this.users.get(userId);
    if (!user) return false;
    user.reset_otp = otp;
    user.reset_otp_expires = expiresAt;
    return true;
  }

  public verifyAndResetPassword(userId: string, otp: string, newPasswordHash: string): { success: boolean; error?: string } {
    const user = this.users.get(userId);
    if (!user) return { success: false, error: 'User account not found.' };

    if (!user.reset_otp || user.reset_otp !== otp) {
      return { success: false, error: 'Invalid or incorrect 6-digit security reset code.' };
    }

    if (!user.reset_otp_expires || Date.now() > user.reset_otp_expires) {
      return { success: false, error: 'Security reset code has expired (10-minute validity limit exceeded). Please request a new code.' };
    }

    // Update password
    user.password_hash = newPasswordHash;
    user.reset_otp = null;
    user.reset_otp_expires = null;
    return { success: true };
  }

  public findUserById(id: string): any | null {
    return this.users.get(id) || null;
  }

  public updateUserMfa(userId: string, enabled: boolean, secret?: string, backupCodes?: string[]): boolean {
    const user = this.users.get(userId);
    if (!user) return false;

    user.mfa_enabled = enabled ? 1 : 0;
    if (secret) user.mfa_secret = secret;
    if (backupCodes) user.mfa_backup_codes = backupCodes;
    user.mfa_temp_secret = null;
    return true;
  }

  public setUserTempMfaSecret(userId: string, tempSecret: string): boolean {
    const user = this.users.get(userId);
    if (!user) return false;
    user.mfa_temp_secret = tempSecret;
    return true;
  }

  public getResidentProfile(userId: string): ResidentProfile | null {
    return this.profiles.get(userId) || null;
  }

  public saveResidentProfile(profile: ResidentProfile): ResidentProfile {
    this.profiles.set(profile.userId, profile);
    return profile;
  }

  public updateUserProfile(userId: string, data: {
    contactNumber?: string;
    address?: string;
    purok?: string;
    emergencyContact?: string;
    yearsOfResidency?: number;
  }): { user: any; profile: ResidentProfile | null } | null {
    const user = this.users.get(userId);
    if (!user) return null;

    if (data.contactNumber !== undefined) user.contact_number = data.contactNumber;
    if (data.address !== undefined) user.address = data.address;
    if (data.purok !== undefined) user.purok = data.purok;

    let profile = this.profiles.get(userId) || null;
    if (profile) {
      if (data.contactNumber !== undefined) profile.contactNumber = data.contactNumber;
      if (data.address !== undefined) profile.streetAddress = data.address;
      if (data.purok !== undefined) profile.purokZone = data.purok;
      if (data.emergencyContact !== undefined) profile.emergencyContact = data.emergencyContact;
      if (data.yearsOfResidency !== undefined) profile.yearsOfResidency = data.yearsOfResidency;
      profile.updatedAt = new Date().toISOString();
      this.profiles.set(userId, profile);
    }

    return { user, profile };
  }

  public createUser(userData: any): any {
    this.users.set(userData.id, userData);
    return userData;
  }

  // --- Uploaded Documents Repository Methods ---

  public saveUploadedDocument(doc: UploadedDocument): UploadedDocument {
    this.uploadedDocuments.set(doc.id, doc);
    
    // If linked to an application, link in request
    if (doc.applicationId && this.requests.has(doc.applicationId)) {
      const req = this.requests.get(doc.applicationId);
      if (!req.attachments) req.attachments = [];
      const existingIdx = req.attachments.findIndex((a: UploadedDocument) => a.id === doc.id);
      if (existingIdx >= 0) {
        req.attachments[existingIdx] = doc;
      } else {
        req.attachments.push(doc);
      }
    }

    return doc;
  }

  public getUploadedDocumentById(id: string): UploadedDocument | null {
    return this.uploadedDocuments.get(id) || null;
  }

  public getUploadedDocumentsByResident(residentId: string): UploadedDocument[] {
    return Array.from(this.uploadedDocuments.values())
      .filter(d => d.residentId === residentId)
      .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
  }

  public getUploadedDocumentsByApplication(appId: string): UploadedDocument[] {
    return Array.from(this.uploadedDocuments.values())
      .filter(d => d.applicationId === appId)
      .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
  }

  public getAllUploadedDocuments(): UploadedDocument[] {
    return Array.from(this.uploadedDocuments.values())
      .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
  }

  public deleteUploadedDocument(id: string): boolean {
    return this.uploadedDocuments.delete(id);
  }

  // --- Clearance Requests Methods ---

  public getClearanceRequests(requestingUser: { id: string; role: UserRole }): ClearanceRequest[] {
    const all = Array.from(this.requests.values()).map(r => {
      // Ensure attachments are attached
      const appDocs = this.getUploadedDocumentsByApplication(r.id);
      return {
        ...r,
        attachments: appDocs.length > 0 ? appDocs : (r.attachments || [])
      };
    });

    if (requestingUser.role === 'resident') {
      return all.filter(r => r.residentId === requestingUser.id);
    }
    return all.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
  }

  public getClearanceRequestById(id: string, requestingUser?: { id: string; role: UserRole }): ClearanceRequest | null {
    const req = this.requests.get(id);
    if (!req) return null;
    
    if (requestingUser && requestingUser.role === 'resident' && req.residentId !== requestingUser.id) {
      return null;
    }

    const appDocs = this.getUploadedDocumentsByApplication(req.id);
    return {
      ...req,
      attachments: appDocs.length > 0 ? appDocs : (req.attachments || [])
    };
  }

  public findRequestByRefOrHash(query: string): ClearanceRequest | null {
    const clean = query.trim().toUpperCase();
    for (const r of this.requests.values()) {
      if (r.referenceNumber.toUpperCase() === clean || (r.cryptoHash && r.cryptoHash.toUpperCase() === clean)) {
        const appDocs = this.getUploadedDocumentsByApplication(r.id);
        return {
          ...r,
          attachments: appDocs.length > 0 ? appDocs : (r.attachments || [])
        };
      }
    }
    return null;
  }

  public saveClearanceRequest(req: ClearanceRequest): ClearanceRequest {
    this.requests.set(req.id, req);
    return req;
  }

  public getAuditLogs(limit: number = 100): AuditLog[] {
    return this.auditLogs.slice(0, limit);
  }

  public verifyAuditChainIntegrity(): { intact: boolean; verifiedCount: number; brokenAtIndex?: number } {
    const logs = [...this.auditLogs].reverse();
    let previousHash = '0000000000000000000000000000000000000000000000000000000000000000';

    for (let i = 0; i < logs.length; i++) {
      const log = logs[i];
      if (log.previousHash !== previousHash) {
        return { intact: false, verifiedCount: i, brokenAtIndex: i };
      }

      const expected = computeAuditLogHash(previousHash, {
        id: log.id,
        timestamp: log.timestamp,
        userId: log.userId,
        actionType: log.actionType,
        details: log.details,
        ipAddress: log.ipAddress
      });

      if (expected !== log.currentHash) {
        return { intact: false, verifiedCount: i, brokenAtIndex: i };
      }

      previousHash = log.currentHash;
    }

    return { intact: true, verifiedCount: logs.length };
  }

  // --- Statistics Helpers ---
  public getMfaEnabledUsersCount(): number {
    let count = 0;
    for (const u of this.users.values()) {
      if (u.mfa_enabled) count++;
    }
    return count;
  }

  public getUploadedFilesCount(): number {
    return this.uploadedDocuments.size;
  }

  public getSqlSchemaDDL(dialect: 'mysql' | 'postgresql' | 'sqlite' = 'mysql'): string {
    return `-- =========================================================================
-- SECURE BARANGAY E-CLEARANCE & RECORDS MANAGEMENT SYSTEM (IAS COMPLIANT)
-- Target Database: MySQL 8.0+ / MariaDB 10.5+ / PostgreSQL 15+
-- Core IAS Pillars:
-- 1. Confidentiality: Role-Based Access Control (RBAC), Strict Data Isolation
-- 2. Integrity: Foreign Keys, Prepared Statements, Cryptographic SHA-256 Hashes
-- 3. Availability: Optimized B-Tree Indexes, Anti-Virus Scanner, Rate Limiting
-- 4. Authentication & Non-Repudiation: BCrypt Password Hashes, RFC 6238 TOTP MFA, Immutable Audit Ledger
-- =========================================================================

CREATE DATABASE IF NOT EXISTS secure_barangay_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE secure_barangay_db;

-- 1. USERS TABLE (Authentication, RBAC & TOTP MFA)
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL COMMENT 'BCrypt hash (cost factor >= 10)',
    email VARCHAR(100) NOT NULL UNIQUE,
    role ENUM('resident', 'staff', 'official', 'admin') NOT NULL DEFAULT 'resident',
    full_name VARCHAR(120) NOT NULL,
    contact_number VARCHAR(20),
    address VARCHAR(255),
    purok VARCHAR(50),
    is_verified_resident BOOLEAN NOT NULL DEFAULT TRUE,
    
    -- Multi-Factor Authentication (MFA / TOTP)
    mfa_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    mfa_required BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Mandatory for Staff, Official, Admin',
    mfa_secret VARCHAR(64) NULL COMMENT 'Base32 RFC 3548 TOTP Secret Key',
    mfa_backup_codes JSON NULL COMMENT 'Array of single-use emergency backup hashes',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,
    INDEX idx_user_role (role),
    INDEX idx_user_email (email)
) ENGINE=InnoDB;

-- 2. RESIDENT PROFILES TABLE (Normalized Identity Records)
CREATE TABLE IF NOT EXISTS resident_profiles (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL UNIQUE,
    first_name VARCHAR(60) NOT NULL,
    middle_name VARCHAR(60),
    last_name VARCHAR(60) NOT NULL,
    suffix VARCHAR(10),
    birth_date DATE NOT NULL,
    civil_status ENUM('Single', 'Married', 'Widowed', 'Separated') NOT NULL,
    gender ENUM('Male', 'Female', 'Other') NOT NULL,
    citizenship VARCHAR(40) NOT NULL DEFAULT 'Filipino',
    purok_zone VARCHAR(50) NOT NULL,
    street_address VARCHAR(150) NOT NULL,
    years_of_residency INT NOT NULL,
    contact_number VARCHAR(20) NOT NULL,
    emergency_contact VARCHAR(100),
    voter_status ENUM('Registered', 'Non-Registered') NOT NULL DEFAULT 'Registered',
    id_type VARCHAR(60) NOT NULL,
    id_number VARCHAR(60) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_profile_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_profile_name (last_name, first_name)
) ENGINE=InnoDB;

-- 3. UPLOADED DOCUMENTS TABLE (Secure Storage Outside Webroot & Malware Scan)
CREATE TABLE IF NOT EXISTS uploaded_documents (
    id VARCHAR(36) PRIMARY KEY,
    application_id VARCHAR(36) NULL,
    resident_id VARCHAR(36) NOT NULL,
    resident_name VARCHAR(120) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    stored_filename VARCHAR(255) NOT NULL COMMENT 'Randomized key stored outside public webroot',
    mime_type VARCHAR(100) NOT NULL,
    size_bytes BIGINT NOT NULL,
    doc_category ENUM('valid_id', 'proof_of_residency', 'business_document', 'indigency_proof', 'other') NOT NULL,
    sha256_hash VARCHAR(64) NOT NULL COMMENT 'File integrity checksum',
    scan_status ENUM('CLEAN', 'INFECTED', 'QUARANTINED') NOT NULL DEFAULT 'CLEAN',
    scan_details TEXT,
    storage_path_masked VARCHAR(255) NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_upload_resident FOREIGN KEY (resident_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_upload_app (application_id),
    INDEX idx_upload_scan (scan_status)
) ENGINE=InnoDB;

-- 4. DOCUMENT REQUESTS & E-CLEARANCE TABLE (Pipeline & Cryptographic Proofs)
CREATE TABLE IF NOT EXISTS document_requests (
    id VARCHAR(36) PRIMARY KEY,
    reference_number VARCHAR(30) NOT NULL UNIQUE,
    resident_id VARCHAR(36) NOT NULL,
    resident_name VARCHAR(120) NOT NULL,
    resident_address VARCHAR(255) NOT NULL,
    purok VARCHAR(50) NOT NULL,
    document_type ENUM('barangay_clearance', 'certificate_of_indigency', 'certificate_of_residency', 'business_permit') NOT NULL,
    purpose TEXT NOT NULL,
    urgency ENUM('standard', 'express', 'urgent_medical') NOT NULL DEFAULT 'standard',
    status ENUM('submitted', 'under_review', 'for_signature', 'ready_for_collection', 'issued', 'rejected') NOT NULL DEFAULT 'submitted',
    
    -- Specific Attributes
    business_name VARCHAR(150),
    business_nature VARCHAR(100),
    business_address VARCHAR(255),
    monthly_income DECIMAL(10,2),
    assistance_type VARCHAR(100),
    id_attachment_name VARCHAR(100),
    
    -- Cryptographic Seals (Integrity & Non-Repudiation)
    crypto_hash VARCHAR(64) COMMENT 'SHA-256 fingerprint of canonical certificate payload',
    qr_payload TEXT,
    signed_by_official_id VARCHAR(36),
    signed_by_official_name VARCHAR(120),
    signed_at TIMESTAMP NULL,
    digital_signature_fingerprint VARCHAR(50),
    
    -- Pipeline Tracking
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP NULL,
    reviewed_by_staff_id VARCHAR(36),
    reviewed_by_staff_name VARCHAR(120),
    ready_at TIMESTAMP NULL,
    issued_at TIMESTAMP NULL,
    staff_remarks TEXT,
    rejection_reason TEXT,
    fee_amount DECIMAL(8,2) NOT NULL DEFAULT 50.00,
    or_number VARCHAR(30),
    
    CONSTRAINT fk_req_resident FOREIGN KEY (resident_id) REFERENCES users(id) ON DELETE RESTRICT,
    INDEX idx_req_ref (reference_number),
    INDEX idx_req_status (status),
    INDEX idx_req_crypto_hash (crypto_hash)
) ENGINE=InnoDB;

-- 5. IMMUTABLE AUDIT LOGS (Hash-Chained Non-Repudiation Ledger)
CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(36) PRIMARY KEY,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_id VARCHAR(36) NOT NULL,
    user_name VARCHAR(120) NOT NULL,
    user_role VARCHAR(20) NOT NULL,
    ip_address VARCHAR(45) NOT NULL,
    action_type VARCHAR(60) NOT NULL,
    category ENUM('AUTH', 'CLEARANCE', 'SECURITY', 'DATA_ACCESS', 'ADMIN') NOT NULL,
    severity ENUM('INFO', 'WARN', 'CRITICAL') NOT NULL DEFAULT 'INFO',
    details TEXT NOT NULL,
    resource_type VARCHAR(50),
    resource_id VARCHAR(50),
    previous_hash VARCHAR(64) NOT NULL COMMENT 'Chained SHA-256 hash of prior log entry',
    current_hash VARCHAR(64) NOT NULL COMMENT 'SHA-256 hash including payload + previous_hash',
    metadata JSON NULL,
    INDEX idx_audit_time (timestamp),
    INDEX idx_audit_user (user_id),
    INDEX idx_audit_action (action_type)
) ENGINE=InnoDB;
`;
  }
}

export const db = new ParameterizedDatabase();

