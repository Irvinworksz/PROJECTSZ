import crypto from 'crypto';
import QRCode from 'qrcode';

// Standard Base32 RFC 3548 alphabet
const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

/**
 * Encodes a buffer into RFC 3548 Base32 string
 */
export function base32Encode(buffer: Buffer): string {
  let bits = 0;
  let value = 0;
  let output = '';

  for (let i = 0; i < buffer.length; i++) {
    value = (value << 8) | buffer[i];
    bits += 8;

    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }

  return output;
}

/**
 * Decodes a Base32 string into a Buffer
 */
export function base32Decode(base32Str: string): Buffer {
  const clean = base32Str.toUpperCase().replace(/=+$/, '').replace(/[^A-Z2-7]/g, '');
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];

  for (let i = 0; i < clean.length; i++) {
    const char = clean[i];
    const index = BASE32_ALPHABET.indexOf(char);
    if (index === -1) continue;

    value = (value << 5) | index;
    bits += 5;

    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }

  return Buffer.from(bytes);
}

/**
 * Generates a cryptographically secure Base32 TOTP secret key (20 bytes / 32 base32 chars)
 */
export function generateTotpSecret(): string {
  const randomBuffer = crypto.randomBytes(20);
  return base32Encode(randomBuffer);
}

/**
 * Generates an RFC 6238 TOTP 6-digit code for a given timestamp and secret
 */
export function generateTotpCode(secret: string, timeSeconds: number = Math.floor(Date.now() / 1000), timeStep: number = 30): string {
  const secretBuffer = base32Decode(secret);
  const counter = Math.floor(timeSeconds / timeStep);
  
  // 8-byte big-endian counter buffer
  const counterBuffer = Buffer.alloc(8);
  counterBuffer.writeBigUInt64BE(BigInt(counter));

  // Compute HMAC-SHA1
  const hmac = crypto.createHmac('sha1', secretBuffer);
  hmac.update(counterBuffer);
  const digest = hmac.digest();

  // Dynamic truncation (RFC 4226)
  const offset = digest[digest.length - 1] & 0x0f;
  const binary =
    ((digest[offset] & 0x7f) << 24) |
    ((digest[offset + 1] & 0xff) << 16) |
    ((digest[offset + 2] & 0xff) << 8) |
    (digest[offset + 3] & 0xff);

  const otp = (binary % 1000000).toString().padStart(6, '0');
  return otp;
}

/**
 * Verifies a 6-digit TOTP token against secret with +/- 1 time step drift tolerance (90s window)
 */
export function verifyTotpToken(secret: string, token: string, windowSteps: number = 1): boolean {
  if (!secret || !token) return false;
  const cleanToken = token.trim().replace(/\s/g, '');
  if (!/^\d{6}$/.test(cleanToken)) return false;

  const currentStep = Math.floor(Date.now() / 1000);

  for (let i = -windowSteps; i <= windowSteps; i++) {
    const calculated = generateTotpCode(secret, currentStep + (i * 30));
    if (calculated === cleanToken) {
      return true;
    }
  }

  return false;
}

/**
 * Generates an otpauth:// URL for Google Authenticator / Microsoft Authenticator
 */
export function generateOtpAuthUrl(accountName: string, secret: string, issuer: string = 'Barangay San Isidro'): string {
  const encodedIssuer = encodeURIComponent(issuer);
  const encodedAccount = encodeURIComponent(accountName);
  return `otpauth://totp/${encodedIssuer}:${encodedAccount}?secret=${secret}&issuer=${encodedIssuer}&algorithm=SHA1&digits=6&period=30`;
}

/**
 * Generates a QR Code Data URL (PNG base64) for mobile authenticator scanning
 */
export async function generateQrCodeDataUrl(otpAuthUrl: string): Promise<string> {
  return QRCode.toDataURL(otpAuthUrl, {
    errorCorrectionLevel: 'M',
    margin: 2,
    color: {
      dark: '#000000',
      light: '#ffffff'
    },
    width: 240
  });
}

/**
 * Generates a cryptographically secure 6-digit numeric OTP code for Email / Gmail verification
 */
export function generateEmailOtp(): string {
  const num = crypto.randomInt(100000, 999999);
  return num.toString();
}

/**
 * Masks an email address for privacy and secure display (e.g., d***5@gmail.com)
 */
export function maskEmailAddress(email: string): string {
  if (!email || !email.includes('@')) return 'your registered Gmail';
  const [local, domain] = email.trim().toLowerCase().split('@');
  if (local.length <= 2) {
    return `${local[0]}*@${domain}`;
  }
  const maskedLocal = `${local[0]}${'*'.repeat(Math.max(local.length - 2, 3))}${local[local.length - 1]}`;
  return `${maskedLocal}@${domain}`;
}

/**
 * Generates a set of 8 cryptographically secure single-use recovery backup codes
 */
export function generateBackupCodes(count: number = 8): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const hex = crypto.randomBytes(4).toString('hex').toUpperCase();
    codes.push(`${hex.substring(0, 4)}-${hex.substring(4, 8)}`);
  }
  return codes;
}


