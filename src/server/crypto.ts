import crypto from 'crypto';
import type { ClearanceRequest } from '../types.js';

// Server-side master secret key for Barangay digital signatures & HMAC validation
const BARANGAY_HMAC_SECRET = process.env.BARANGAY_SECRET_KEY || 'BRGY_SECURE_KEY_CABUCBUCAN_2026_9981A';
const BARANGAY_PUBLIC_KEY_ID = 'BRGY-PK-NE-CABUCBUCAN-01';

// Master 256-bit encryption key for Data-at-Rest Encryption (AES-256-GCM)
const DB_ENCRYPTION_SECRET = process.env.DB_ENCRYPTION_KEY || `${BARANGAY_HMAC_SECRET}_AES256_IAS_CABUCBUCAN_2026`;
export const AES_MASTER_KEY = crypto.createHash('sha256').update(DB_ENCRYPTION_SECRET).digest();
export const ENCRYPTION_KEY_FINGERPRINT = `KEY-AES256-${crypto.createHash('sha1').update(AES_MASTER_KEY).digest('hex').substring(0, 16).toUpperCase()}`;

export const USER_ENCRYPTED_FIELDS = [
  'contact_number',
  'address',
  'id_number',
  'id_photo_url',
  'mfa_secret',
  'reset_otp',
  'email_mfa_otp'
];

export const PROFILE_ENCRYPTED_FIELDS = [
  'contactNumber',
  'streetAddress',
  'idNumber',
  'idPhotoUrl',
  'birthDate',
  'civilStatus',
  'emergencyContact',
  'monthlyIncome'
];

export const DOCUMENT_ENCRYPTED_FIELDS = [
  'fileData'
];

/**
 * Encrypts a plaintext string using AES-256-GCM authenticated encryption.
 * Output format: enc:v1:<iv_hex>:<authTag_hex>:<ciphertext_hex>
 */
export function encryptDataAtRest(plaintext: string | null | undefined): string {
  if (plaintext === null || plaintext === undefined) return '';
  const text = String(plaintext);
  if (text.startsWith('enc:v1:')) return text; // already encrypted
  if (text.length === 0) return '';

  const iv = crypto.randomBytes(12); // 96-bit IV recommended for GCM
  const cipher = crypto.createCipheriv('aes-256-gcm', AES_MASTER_KEY, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');

  return `enc:v1:${iv.toString('hex')}:${authTag}:${encrypted}`;
}

/**
 * Decrypts an authenticated AES-256-GCM envelope.
 * Returns original plaintext. If not encrypted or invalid tag, handles safely.
 */
export function decryptDataAtRest(encryptedEnvelope: string | null | undefined): string {
  if (!encryptedEnvelope || typeof encryptedEnvelope !== 'string') return '';
  if (!encryptedEnvelope.startsWith('enc:v1:')) return encryptedEnvelope;

  const parts = encryptedEnvelope.split(':');
  if (parts.length !== 5) return encryptedEnvelope;

  const ivHex = parts[2];
  const authTagHex = parts[3];
  const cipherHex = parts[4];

  try {
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-gcm', AES_MASTER_KEY, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(cipherHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err: any) {
    console.error('[CRYPTO ERROR] AES-256-GCM Authenticated Decryption failed (Tampered or Corrupt ciphertext):', err.message);
    return '[TAMPERED_CIPHERTEXT_DECRYPTION_FAILED]';
  }
}

/**
 * Checks if a string is an AES-256-GCM encrypted envelope
 */
export function isEncryptedAtRest(value: any): boolean {
  return typeof value === 'string' && value.startsWith('enc:v1:');
}

/**
 * Encrypts designated fields of a record before database disk serialization
 */
export function encryptRecordFields(record: Record<string, any>, fieldsToEncrypt: string[]): Record<string, any> {
  if (!record || typeof record !== 'object') return record;
  const clone = { ...record };
  for (const field of fieldsToEncrypt) {
    if (clone[field] !== undefined && clone[field] !== null) {
      if (typeof clone[field] === 'string' && clone[field].length > 0) {
        clone[field] = encryptDataAtRest(clone[field]);
      } else if (Array.isArray(clone[field])) {
        clone[field] = clone[field].map((item: any) => typeof item === 'string' ? encryptDataAtRest(item) : item);
      }
    }
  }
  return clone;
}

/**
 * Decrypts designated fields of a record after database disk retrieval
 */
export function decryptRecordFields(record: Record<string, any>, fieldsToDecrypt: string[]): Record<string, any> {
  if (!record || typeof record !== 'object') return record;
  const clone = { ...record };
  for (const field of fieldsToDecrypt) {
    if (clone[field] !== undefined && clone[field] !== null) {
      if (typeof clone[field] === 'string' && clone[field].startsWith('enc:v1:')) {
        clone[field] = decryptDataAtRest(clone[field]);
      } else if (Array.isArray(clone[field])) {
        clone[field] = clone[field].map((item: any) => typeof item === 'string' && item.startsWith('enc:v1:') ? decryptDataAtRest(item) : item);
      }
    }
  }
  return clone;
}

/**
 * Computes a standardized SHA-256 hash for document integrity verification.
 * Even 1 character change (e.g. resident name or date) produces a radically different hash.
 */
export function computeDocumentHash(data: {
  referenceNumber: string;
  residentId: string;
  residentName: string;
  documentType: string;
  purpose: string;
  issuedAt: string;
  signatory: string;
}): string {
  const canonicalPayload = [
    `REF:${data.referenceNumber}`,
    `RES_ID:${data.residentId}`,
    `NAME:${data.residentName.trim().toUpperCase()}`,
    `DOC:${data.documentType}`,
    `PURPOSE:${data.purpose.trim()}`,
    `ISSUED:${data.issuedAt}`,
    `SIGNATORY:${data.signatory}`
  ].join('|');

  return crypto.createHash('sha256').update(canonicalPayload).digest('hex');
}

/**
 * Generates an HMAC-SHA256 digital signature representing the Punong Barangay's official seal.
 */
export function generateBarangayDigitalSignature(documentHash: string, officialName: string): {
  signature: string;
  keyFingerprint: string;
} {
  const hmac = crypto.createHmac('sha256', BARANGAY_HMAC_SECRET);
  hmac.update(`${documentHash}|${officialName}|${BARANGAY_PUBLIC_KEY_ID}`);
  const signature = hmac.digest('hex');
  
  // Publicly verifiable key fingerprint (first 16 hex chars)
  const keyFingerprint = crypto.createHash('sha1').update(BARANGAY_PUBLIC_KEY_ID).digest('hex').substring(0, 16).toUpperCase();

  return {
    signature,
    keyFingerprint: `KEY-FP-${keyFingerprint}`
  };
}

/**
 * Verifies if a document's hash matches the expected canonical computation.
 */
export function verifyDocumentIntegrity(
  doc: Partial<ClearanceRequest>,
  expectedHash: string
): { isValid: boolean; recomputedHash: string } {
  if (!doc.referenceNumber || !doc.residentId || !doc.residentName || !doc.documentType) {
    return { isValid: false, recomputedHash: '' };
  }

  const recomputed = computeDocumentHash({
    referenceNumber: doc.referenceNumber,
    residentId: doc.residentId,
    residentName: doc.residentName,
    documentType: doc.documentType,
    purpose: doc.purpose || '',
    issuedAt: doc.issuedAt || doc.signedAt || '',
    signatory: doc.signedByOfficialName || 'Punong Barangay'
  });

  return {
    isValid: recomputed === expectedHash,
    recomputedHash: recomputed
  };
}

/**
 * Computes hash-chained block hash for immutable audit logs (like a blockchain block).
 */
export function computeAuditLogHash(
  previousHash: string,
  logEntry: {
    id: string;
    timestamp: string;
    userId: string;
    actionType: string;
    details: string;
    ipAddress: string;
  }
): string {
  const payload = `${previousHash}|${logEntry.id}|${logEntry.timestamp}|${logEntry.userId}|${logEntry.actionType}|${logEntry.details}|${logEntry.ipAddress}`;
  return crypto.createHash('sha256').update(payload).digest('hex');
}
