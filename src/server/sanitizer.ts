/**
 * Information Assurance & Security (IAS) Sanitization & Defensive Validation Module
 * Enforces strict input validation and sanitization against XSS, HTML injection, and control characters.
 */

// Basic HTML entity encoding for high-risk characters
export function escapeHtml(str: string): string {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Strips potentially dangerous script tags, event handlers, javascript pseudo-protocols, and data URIs
 */
export function sanitizeInput(input: any): string {
  if (input === null || input === undefined) return '';
  if (typeof input !== 'string') input = String(input);

  let clean = input.trim();

  // Remove dangerous script tags and contents
  clean = clean.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Remove dangerous HTML attributes / event handlers (e.g., onload, onclick, onerror)
  clean = clean.replace(/on\w+\s*=\s*(['"]).*?\1/gi, '');
  clean = clean.replace(/on\w+\s*=\s*[^>\s]+/gi, '');
  
  // Strip javascript: and vbscript: URIs
  clean = clean.replace(/javascript:/gi, '');
  clean = clean.replace(/vbscript:/gi, '');
  clean = clean.replace(/data:text\/html/gi, '');

  // Strip raw HTML tags for standard text fields
  clean = clean.replace(/<[^>]*>?/gm, '');

  return clean;
}

/**
 * Validates Philippine mobile phone number (e.g., 09171234567 or +639171234567)
 */
export function isValidPhilippinePhone(phone: string): boolean {
  if (!phone) return false;
  const cleaned = phone.replace(/[\s-]/g, '');
  return /^(09|\+639)\d{9}$/.test(cleaned);
}

/**
 * Validates email format strictly
 */
export function isValidEmail(email: string): boolean {
  if (!email) return false;
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email) && email.length <= 100;
}

/**
 * Validates standard name strings (alphabetic + spaces + hyphens + period for middle initials)
 */
export function isValidName(name: string): boolean {
  if (!name || name.trim().length < 2 || name.length > 80) return false;
  return /^[a-zA-Z\sñÑ.\-']+$/.test(name);
}

/**
 * Analyzes string for active SQL Injection probe signatures (for IAS security telemetry logging)
 */
export function detectSqlInjectionSignature(input: string): boolean {
  if (!input || typeof input !== 'string') return false;
  const patterns = [
    /(\%27)|(\')|(\-\-)|(\%23)|(#)/i,
    /((\%3D)|(=))[^\n]*((\%27)|(\')|(\-\-)|(\%3B)|(;))/i,
    /\w*((\%27)|(\'))(\s)*((\%6F)|o|(\%4F))((\%72)|r|(\%52))/i,
    /((\%27)|(\'))(\s)*(union|select|insert|update|delete|drop|alter|truncate|exec)/i,
    /benchmark\s*\(|sleep\s*\(|waitfor\s+delay/i,
    /or\s+['"]?[0-9a-zA-Z]+['"]?\s*=\s*['"]?[0-9a-zA-Z]+/i,
    /1=1|'1'='1'|1\s*=\s*1/i
  ];

  return patterns.some(pattern => pattern.test(input));
}

/**
 * Analyzes string for active XSS payload signatures (for IAS security telemetry logging)
 */
export function detectXssSignature(input: string): boolean {
  if (!input || typeof input !== 'string') return false;
  const patterns = [
    /<script\b/i,
    /javascript:/i,
    /onerror\s*=/i,
    /onload\s*=/i,
    /onclick\s*=/i,
    /<img\s+src=[^>]*onerror/i,
    /<svg\s+onload/i,
    /<iframe/i,
    /alert\s*\(/i,
    /document\.cookie/i
  ];

  return patterns.some(pattern => pattern.test(input));
}
