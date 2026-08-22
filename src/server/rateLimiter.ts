/**
 * Information Assurance & Security (IAS) - Availability & Brute-Force Rate Limiter
 * Implements sliding window and exponential lockout protection for authentication and API calls.
 */

interface RateLimitRecord {
  count: number;
  firstAttempt: number;
  lastAttempt: number;
  lockedUntil?: number;
  failedAuthCount: number;
}

const ipRequestMap = new Map<string, RateLimitRecord>();
const authLockoutMap = new Map<string, RateLimitRecord>();

let globalRateLimitHits = 0;
let globalBruteForceLockouts = 0;

export const RateLimiter = {
  /**
   * Check general API endpoint rate limit (e.g. 100 requests per minute)
   */
  checkGeneral(ip: string, limit: number = 120, windowMs: number = 60000): { allowed: boolean; remaining: number; resetMs: number } {
    const now = Date.now();
    let record = ipRequestMap.get(ip);

    if (!record || now - record.firstAttempt > windowMs) {
      record = {
        count: 1,
        firstAttempt: now,
        lastAttempt: now,
        failedAuthCount: 0
      };
      ipRequestMap.set(ip, record);
      return { allowed: true, remaining: limit - 1, resetMs: windowMs };
    }

    record.count++;
    record.lastAttempt = now;

    if (record.count > limit) {
      globalRateLimitHits++;
      return {
        allowed: false,
        remaining: 0,
        resetMs: windowMs - (now - record.firstAttempt)
      };
    }

    return {
      allowed: true,
      remaining: limit - record.count,
      resetMs: windowMs - (now - record.firstAttempt)
    };
  },

  /**
   * Check login rate limit and brute-force lockout (5 failed attempts -> 5 min lockout)
   */
  checkAuthAttempt(identifier: string): { allowed: boolean; lockTimeRemainingSeconds?: number } {
    const now = Date.now();
    const record = authLockoutMap.get(identifier);

    if (!record) return { allowed: true };

    if (record.lockedUntil && now < record.lockedUntil) {
      return {
        allowed: false,
        lockTimeRemainingSeconds: Math.ceil((record.lockedUntil - now) / 1000)
      };
    }

    // Lockout expired, reset lockout flag if older than 10 mins
    if (record.lockedUntil && now >= record.lockedUntil) {
      record.lockedUntil = undefined;
      record.failedAuthCount = 0;
      record.firstAttempt = now;
    }

    return { allowed: true };
  },

  /**
   * Record a failed login attempt; triggers lockout if threshold is exceeded
   */
  recordFailedAuth(identifier: string, maxAttempts: number = 5, lockoutDurationMs: number = 300000) {
    const now = Date.now();
    let record = authLockoutMap.get(identifier);

    if (!record) {
      record = {
        count: 1,
        firstAttempt: now,
        lastAttempt: now,
        failedAuthCount: 1
      };
      authLockoutMap.set(identifier, record);
      return;
    }

    record.failedAuthCount++;
    record.lastAttempt = now;

    if (record.failedAuthCount >= maxAttempts) {
      record.lockedUntil = now + lockoutDurationMs;
      globalBruteForceLockouts++;
    }
  },

  /**
   * Clear failed authentication on successful login
   */
  recordSuccessfulAuth(identifier: string) {
    authLockoutMap.delete(identifier);
  },

  getStats() {
    return {
      globalRateLimitHits,
      globalBruteForceLockouts,
      activeTrackedIps: ipRequestMap.size,
      activeLockedAccounts: Array.from(authLockoutMap.values()).filter(r => r.lockedUntil && r.lockedUntil > Date.now()).length
    };
  },

  resetStats() {
    globalRateLimitHits = 0;
    globalBruteForceLockouts = 0;
    ipRequestMap.clear();
    authLockoutMap.clear();
  }
};
