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
  contactNumber: string;
  address: string;
  purok: string;
  createdAt: string;
  lastLogin?: string;
  isVerifiedResident: boolean;
  avatarUrl?: string;
  // Multi-Factor Authentication (MFA / TOTP)
  mfaEnabled: boolean;
  mfaRequired: boolean; // Mandatory for Staff, Official, Admin
  mfaBackupCodes?: string[];
  mfaSecret?: string;
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
  civilStatus: 'Single' | 'Married' | 'Widowed' | 'Separated';
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
  createdAt: string;
  updatedAt: string;
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
