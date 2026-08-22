import crypto from 'crypto';
import type { ClearanceRequest } from '../types.js';

// Server-side master secret key for Barangay digital signatures & HMAC validation
const BARANGAY_HMAC_SECRET = process.env.BARANGAY_SECRET_KEY || 'BRGY_SECURE_KEY_CABUCBUCAN_2026_9981A';
const BARANGAY_PUBLIC_KEY_ID = 'BRGY-PK-NE-CABUCBUCAN-01';

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
