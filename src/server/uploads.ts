import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import multer from 'multer';
import type { Request } from 'express';
import { MAX_FILE_SIZE_BYTES } from './fileScanner.js';

// Secure storage directory located outside webroot
export const SECURE_VAULT_DIR = path.join(process.cwd(), 'data', 'secure_document_vault');

// Ensure directory exists securely
if (!fs.existsSync(SECURE_VAULT_DIR)) {
  fs.mkdirSync(SECURE_VAULT_DIR, { recursive: true });
}

// In-Memory fallback buffer map to guarantee instantaneous file streaming across all environments
export const vaultBufferStore = new Map<string, Buffer>();

// Configure Multer storage using memory storage for immediate inspection before writing to vault
const storage = multer.memoryStorage();

export const uploadMiddleware = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES,
    files: 1
  }
});

/**
 * Saves a verified clean file into the secure vault outside webroot
 */
export function saveFileToSecureVault(fileBuffer: Buffer, fileId: string): string {
  const secureFilename = `sec_doc_${fileId}_${crypto.randomBytes(8).toString('hex')}.dat`;
  const fullPath = path.join(SECURE_VAULT_DIR, secureFilename);

  try {
    fs.writeFileSync(fullPath, fileBuffer);
  } catch (err) {
    console.warn('Filesystem write notice:', err);
  }

  // Also store in memory store
  vaultBufferStore.set(fileId, fileBuffer);
  return `[ISOLATED_VAULT_ROOT]/${secureFilename}`;
}

/**
 * Retrieves file buffer from secure vault
 */
export function getFileFromSecureVault(fileId: string, storagePathMasked?: string): Buffer | null {
  if (vaultBufferStore.has(fileId)) {
    return vaultBufferStore.get(fileId)!;
  }

  if (storagePathMasked && storagePathMasked.startsWith('[ISOLATED_VAULT_ROOT]/')) {
    const filename = storagePathMasked.replace('[ISOLATED_VAULT_ROOT]/', '');
    const fullPath = path.join(SECURE_VAULT_DIR, filename);
    if (fs.existsSync(fullPath)) {
      return fs.readFileSync(fullPath);
    }
  }

  return null;
}
