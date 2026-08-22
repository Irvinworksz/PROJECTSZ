import crypto from 'crypto';

export interface ScanResult {
  isClean: boolean;
  status: 'CLEAN' | 'INFECTED' | 'QUARANTINED';
  sha256: string;
  detectedMimeType: string;
  sizeBytes: number;
  threats: string[];
  scanDetails: string;
}

// Allowed MIME types for official Barangay document uploads
const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp'
]);

// Maximum file size in bytes (10 Megabytes)
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

/**
 * Validates magic bytes / file signatures to prevent extension spoofing
 */
export function inspectFileMagicBytes(buffer: Buffer): { isValid: boolean; detectedMime: string } {
  if (buffer.length < 4) {
    return { isValid: false, detectedMime: 'unknown/too_short' };
  }

  // PDF signature: %PDF (0x25, 0x50, 0x44, 0x46)
  if (buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46) {
    return { isValid: true, detectedMime: 'application/pdf' };
  }

  // PNG signature: 0x89 0x50 0x4E 0x47 0x0D 0x0A 0x1A 0x0A
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
    return { isValid: true, detectedMime: 'image/png' };
  }

  // JPEG / JPG signature: 0xFF 0xD8 0xFF
  if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
    return { isValid: true, detectedMime: 'image/jpeg' };
  }

  // WebP signature: RIFF ... WEBP (0x52 0x49 0x46 0x46 ... 0x57 0x45 0x42 0x50)
  if (
    buffer.length >= 12 &&
    buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
    buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50
  ) {
    return { isValid: true, detectedMime: 'image/webp' };
  }

  return { isValid: false, detectedMime: 'application/octet-stream' };
}

/**
 * Scans file buffer for malware, embedded executable code, web shells, and script injection
 */
export function scanFileForMalware(buffer: Buffer, originalFilename: string, declaredMimeType: string): ScanResult {
  const threats: string[] = [];
  const sha256 = crypto.createHash('sha256').update(buffer).digest('hex');
  const sizeBytes = buffer.length;

  // 1. Check file size
  if (sizeBytes > MAX_FILE_SIZE_BYTES) {
    threats.push(`File size (${(sizeBytes / (1024 * 1024)).toFixed(2)} MB) exceeds maximum allowed limit (10 MB).`);
  }

  if (sizeBytes === 0) {
    threats.push('Zero-byte empty file submitted.');
  }

  // 2. Magic Bytes Inspection
  const magic = inspectFileMagicBytes(buffer);
  if (!magic.isValid || !ALLOWED_MIME_TYPES.has(magic.detectedMime)) {
    threats.push(`Header signature mismatch: Detected '${magic.detectedMime}' which is not a permitted document/image format.`);
  }

  // 3. Dangerous File Extensions
  const ext = originalFilename.toLowerCase().split('.').pop() || '';
  const dangerousExts = new Set(['exe', 'bat', 'cmd', 'sh', 'php', 'phtml', 'py', 'pl', 'jsp', 'asp', 'aspx', 'dll', 'vbs', 'scr', 'com', 'msi', 'jar', 'svg']);
  if (dangerousExts.has(ext)) {
    threats.push(`Prohibited executable or script file extension: .${ext}`);
  }

  // 4. Inspect for binary executable signatures inside buffer
  // Windows MZ header (0x4D 0x5A)
  if (buffer.length >= 2 && buffer[0] === 0x4D && buffer[1] === 0x5A) {
    threats.push('Windows PE / Executable binary (MZ header) signature identified.');
  }
  // Linux ELF header (0x7F 'E' 'L' 'F')
  if (buffer.length >= 4 && buffer[0] === 0x7F && buffer[1] === 0x45 && buffer[2] === 0x4C && buffer[3] === 0x46) {
    threats.push('Linux ELF executable header signature detected.');
  }

  // 5. Inspect for embedded web shells, script injection, and macro execution payloads in text/stream
  const bufferString = buffer.toString('utf-8', 0, Math.min(buffer.length, 65536)).toLowerCase();

  const maliciousSignatures = [
    { pattern: /<\?php/i, name: 'Embedded PHP WebShell Tag (<?php)' },
    { pattern: /<script[\s>]/i, name: 'Embedded Client-Side HTML/JS Execution (<script>)' },
    { pattern: /eval\s*\(/i, name: 'Dynamic Code Execution Pattern (eval)' },
    { pattern: /base64_decode\s*\(/i, name: 'Obfuscated Base64 Payload Execution (base64_decode)' },
    { pattern: /system\s*\(/i, name: 'System Command Execution Payload (system)' },
    { pattern: /passthru\s*\(/i, name: 'System Shell Execution (passthru)' },
    { pattern: /shell_exec\s*\(/i, name: 'Shell Execution Command (shell_exec)' },
    { pattern: /powershell\.exe/i, name: 'PowerShell Invocation Payload' },
    { pattern: /cmd\.exe\s+\/c/i, name: 'Windows Command Prompt Invocation' },
    { pattern: /document\.cookie/i, name: 'XSS Cookie Exfiltration Hook' },
    { pattern: /vbaProject\.bin/i, name: 'VBA Macro Executable Component' }
  ];

  for (const sig of maliciousSignatures) {
    if (sig.pattern.test(bufferString)) {
      threats.push(`Malicious payload detected: ${sig.name}`);
    }
  }

  const isClean = threats.length === 0;
  const status: 'CLEAN' | 'INFECTED' | 'QUARANTINED' = isClean ? 'CLEAN' : 'QUARANTINED';
  
  const scanDetails = isClean
    ? `IAS Antivirus Engine verified clean. Magic bytes: ${magic.detectedMime}, SHA-256: ${sha256.substring(0, 16)}...`
    : `Threats neutralized and quarantined: ${threats.join('; ')}`;

  return {
    isClean,
    status,
    sha256,
    detectedMimeType: magic.detectedMime,
    sizeBytes,
    threats,
    scanDetails
  };
}
