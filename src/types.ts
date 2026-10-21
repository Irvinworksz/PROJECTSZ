export type UserRole = 'resident' | 'staff' | 'official' | 'admin';

export type ClearanceType = 
  | 'barangay_clearance'
  | 'certificate_of_indigency'
  | 'certificate_of_residency'
  | 'business_permit';

export type RequestStatus = 
  | 'submitted'
  | 'under_review'
  | 'for_signature'
  | 'ready_for_collection'
  | 'issued'
  | 'rejected';

export type ClearanceUrgency = 'standard' | 'express' | 'urgent_medical';

export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  fullName: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  suffix?: string;
  birthDate?: string;
  civilStatus?: string;
  gender?: string;
  yearsOfResidency?: number;
  contactNumber: string;
  address: string;
  purok: string;
  createdAt: string;
  lastLogin?: string;
  isVerifiedResident: boolean;
  avatarUrl?: string;
  // Resident Verification Workflow
  verificationStatus?: 'pending_review' | 'verified' | 'rejected';
  idPhotoUrl?: string;
  idPhotoName?: string;
  idType?: string;
  idNumber?: string;
  verificationRemarks?: string;
  reviewedByStaffName?: string;
  reviewedAt?: string;
  // Multi-Factor Authentication (MFA / 2FA - Gmail, TOTP & WebAuthn Biometrics)
  mfaEnabled: boolean;
  mfaRequired: boolean; // Mandatory for Staff, Official, Admin
  mfaType?: 'gmail' | 'totp' | 'webauthn' | 'both';
  mfaBackupCodes?: string[];
  mfaSecret?: string;
  webauthnEnabled?: boolean;
  webauthnCredentials?: WebAuthnCredential[];
}

export interface WebAuthnCredential {
  id: string;
  credentialId: string;
  publicKey?: string;
  counter: number;
  deviceName: string;
  deviceType?: 'platform' | 'cross-platform' | 'security_key';
  createdAt: string;
  lastUsedAt?: string;
  transports?: string[];
  aaguid?: string;
}

export interface UploadedDocument {
  id: string;
  applicationId?: string;
  residentId: string;
  residentName: string;
  originalFilename: string;
  storedFilename: string;
  mimeType: string;
  sizeBytes: number;
  docCategory: 'valid_id' | 'proof_of_residency' | 'business_document' | 'indigency_proof' | 'other';
  sha256Hash: string;
  scanStatus: 'CLEAN' | 'INFECTED' | 'QUARANTINED';
  scanDetails: string;
  threatsFound?: string[];
  storagePathMasked: string;
  uploadedAt: string;
  downloadUrl: string;
}

export interface ResidentProfile {
  id: string;
  userId: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  suffix?: string;
  birthDate: string;
  civilStatus: 'Single' | 'Married' | 'Widowed';
  gender: 'Male' | 'Female' | 'Other';
  citizenship: string;
  purokZone: string;
  streetAddress: string;
  yearsOfResidency: number;
  contactNumber: string;
  emergencyContact: string;
  voterStatus: 'Registered' | 'Non-Registered';
  idType: string;
  idNumber: string;
  idPhotoUrl?: string;
  idPhotoName?: string;
  verificationStatus?: 'pending_review' | 'verified' | 'rejected';
  verificationRemarks?: string;
  reviewedByStaffName?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ResidentVerificationRecord {
  id: string;
  userId: string;
  username: string;
  fullName: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  suffix?: string;
  email: string;
  contactNumber: string;
  emergencyContact?: string;
  purokZone: string;
  streetAddress: string;
  yearsOfResidency: number;
  birthDate: string;
  civilStatus: string;
  gender: string;
  voterStatus: string;
  idType: string;
  idNumber: string;
  idPhotoUrl?: string;
  idPhotoName?: string;
  isVerifiedResident: boolean;
  verificationStatus: 'pending_review' | 'verified' | 'rejected';
  verificationRemarks?: string;
  reviewedByStaffName?: string;
  reviewedAt?: string;
  createdAt: string;
}

export interface ClearanceRequest {
  id: string;
  referenceNumber: string; // e.g. BRGY-2026-0842
  residentId: string;
  residentName: string;
  residentAddress: string;
  purok: string;
  documentType: ClearanceType;
  purpose: string;
  urgency: ClearanceUrgency;
  status: RequestStatus;
  
  // Specific details
  businessName?: string;
  businessNature?: string;
  businessAddress?: string;
  monthlyIncome?: number; // for Indigency
  assistanceType?: string; // for Indigency
  
  // Supporting identification & Uploaded Documents
  idAttachmentUrl?: string;
  idAttachmentName?: string;
  attachments?: UploadedDocument[];
  
  // Cryptographic & Verification Data (Integrity)
  cryptoHash?: string;
  qrPayload?: string;
  signedByOfficialId?: string;
  signedByOfficialName?: string;
  signedAt?: string;
  digitalSignatureFingerprint?: string;
  
  // Timestamps
  submittedAt: string;
  reviewedAt?: string;
  reviewedByStaffId?: string;
  reviewedByStaffName?: string;
  readyAt?: string;
  issuedAt?: string;
  
  // Official Remarks / Rejection Reason
  staffRemarks?: string;
  rejectionReason?: string;
  feeAmount: number;
  orNumber?: string; // Official Receipt Number
  
  // Notification history
  notificationsSent: NotificationRecord[];
}

export interface NotificationRecord {
  id: string;
  type: 'sms' | 'email';
  recipient: string;
  message: string;
  timestamp: string;
  status: 'delivered' | 'sent' | 'failed';
  targetRole?: UserRole | 'all';
  title?: string;
  residentId?: string;
  residentName?: string;
  applicationId?: string;
  referenceNumber?: string;
  documentType?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
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
  previousHash?: string;
  currentHash: string; // Hash-chained immutable ledger
  metadata?: Record<string, any>;
}

export interface SecurityStats {
  totalRequests: number;
  activeSessions: number;
  tamperAttemptsBlocked: number;
  rateLimitHits: number;
  sqlInjectionProbesBlocked: number;
  xssProbesSanitized: number;
  immutableLogsCount: number;
  digitalSignaturesIssued: number;
  uptimeSeconds: number;
  mfaUsersCount: number;
  filesScannedCount: number;
  malwareBlockedCount: number;
}

export interface VerificationResult {
  isValid: boolean;
  referenceNumber: string;
  documentType: ClearanceType;
  residentName: string;
  issuedDate?: string;
  signatory: string;
  cryptoHash: string;
  status: RequestStatus;
  tamperAlert?: boolean;
  message: string;
}
