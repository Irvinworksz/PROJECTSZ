import { useEffect, useRef, useState, useCallback } from 'react';

export const DEFAULT_INACTIVITY_TIMEOUT_MS = 3 * 60 * 1000; // 3 minutes standard
export const WARNING_THRESHOLD_MS = 20 * 1000; // 20 seconds warning popup
const STORAGE_KEY_EXPIRES_AT = 'barangay_session_expires_at';
const STORAGE_KEY_LAST_ACTIVITY = 'barangay_last_activity_time';

interface UseInactivityTimeoutOptions {
  enabled: boolean;
  onTimeout: () => void;
  timeoutMs?: number;
  warningMs?: number;
}

export function useInactivityTimeout({
  enabled,
  onTimeout,
  timeoutMs: initialTimeoutMs = DEFAULT_INACTIVITY_TIMEOUT_MS,
  warningMs = WARNING_THRESHOLD_MS
}: UseInactivityTimeoutOptions) {
  const [currentTimeoutMs, setCurrentTimeoutMs] = useState<number>(initialTimeoutMs);
  const [showWarning, setShowWarning] = useState<boolean>(false);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(Math.ceil(warningMs / 1000));
  const [sessionRemainingSeconds, setSessionRemainingSeconds] = useState<number>(Math.ceil(initialTimeoutMs / 1000));
  
  const lastActiveTimestampRef = useRef<number>(Date.now());
  const expiresAtRef = useRef<number>(Date.now() + initialTimeoutMs);
  const lastThrottleRef = useRef<number>(Date.now());
  const onTimeoutRef = useRef(onTimeout);

  useEffect(() => {
    onTimeoutRef.current = onTimeout;
  }, [onTimeout]);

  // Reset the session countdown to full duration
  const resetTimer = useCallback((customMs?: number) => {
    const ms = customMs || currentTimeoutMs;
    const now = Date.now();
    lastActiveTimestampRef.current = now;
    lastThrottleRef.current = now;
    const newExpiresAt = now + ms;
    expiresAtRef.current = newExpiresAt;

    try {
      localStorage.setItem(STORAGE_KEY_LAST_ACTIVITY, now.toString());
      localStorage.setItem(STORAGE_KEY_EXPIRES_AT, newExpiresAt.toString());
    } catch {
      // Ignore localStorage restrictions
    }

    setShowWarning(false);
    setRemainingSeconds(Math.ceil(warningMs / 1000));
    setSessionRemainingSeconds(Math.ceil(ms / 1000));
  }, [currentTimeoutMs, warningMs]);

  // Change duration (e.g. 2 min test, 5 min, 15 min, 30 min)
  const setTimeoutMinutes = useCallback((minutes: number) => {
    const newMs = minutes * 60 * 1000;
    setCurrentTimeoutMs(newMs);
    resetTimer(newMs);
  }, [resetTimer]);

  // Fast-forward countdown to test the 20-second warning modal
  const simulateWarningTest = useCallback((testSeconds: number = 20) => {
    const now = Date.now();
    const newExpiresAt = now + testSeconds * 1000;
    expiresAtRef.current = newExpiresAt;
    try {
      localStorage.setItem(STORAGE_KEY_EXPIRES_AT, newExpiresAt.toString());
    } catch {
      // Ignore
    }
    setShowWarning(true);
    setRemainingSeconds(testSeconds);
    setSessionRemainingSeconds(testSeconds);
  }, []);

  // Listen to user interaction events across the entire window
  useEffect(() => {
    if (!enabled) {
      setShowWarning(false);
      return;
    }

    const now = Date.now();
    // Initialize or load persisted expiration
    let loadedExpiresAt = now + currentTimeoutMs;
    try {
      const storedExp = localStorage.getItem(STORAGE_KEY_EXPIRES_AT);
      if (storedExp) {
        const parsed = parseInt(storedExp, 10);
        if (!isNaN(parsed) && parsed > now && parsed <= now + 24 * 60 * 60 * 1000) {
          loadedExpiresAt = parsed;
        } else {
          localStorage.setItem(STORAGE_KEY_EXPIRES_AT, loadedExpiresAt.toString());
        }
      } else {
        localStorage.setItem(STORAGE_KEY_EXPIRES_AT, loadedExpiresAt.toString());
      }
    } catch {
      // Ignore
    }
    expiresAtRef.current = loadedExpiresAt;
    setSessionRemainingSeconds(Math.max(0, Math.ceil((loadedExpiresAt - now) / 1000)));

    // User activity events: Notice we DO NOT include passive 'mousemove' or 'scroll'
    // so the countdown timer visibly ticks down continuously second-by-second!
    // Meaningful user input (like typing or clicking) can extend the session,
    // throttled so active work keeps the session refreshed.
    const activeEventTypes: (keyof WindowEventMap)[] = [
      'keydown',
      'click',
      'touchstart'
    ];

    const handleMeaningfulActivity = () => {
      // If warning modal is open, user MUST click "Stay Signed In" to dismiss
      if (showWarning) return;

      const currentTime = Date.now();
      // Throttle automatic activity renewal so the timer is visibly counting down
      // Only auto-extend if at least 30 seconds have elapsed since last recorded activity
      if (currentTime - lastThrottleRef.current > 30 * 1000) {
        lastThrottleRef.current = currentTime;
        lastActiveTimestampRef.current = currentTime;
        const newExpiresAt = currentTime + currentTimeoutMs;
        expiresAtRef.current = newExpiresAt;
        try {
          localStorage.setItem(STORAGE_KEY_LAST_ACTIVITY, currentTime.toString());
          localStorage.setItem(STORAGE_KEY_EXPIRES_AT, newExpiresAt.toString());
        } catch {
          // Ignore
        }
      }
    };

    activeEventTypes.forEach(event => {
      window.addEventListener(event, handleMeaningfulActivity, { passive: true });
    });

    // Cross-tab synchronization
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY_EXPIRES_AT && e.newValue) {
        const remoteExp = parseInt(e.newValue, 10);
        if (!isNaN(remoteExp)) {
          expiresAtRef.current = remoteExp;
        }
      } else if (e.key === 'barangay_auth_token' && !e.newValue) {
        // Token was cleared elsewhere
        onTimeoutRef.current();
      }
    };

    window.addEventListener('storage', handleStorage);

    // Heartbeat ticker (runs every 1 second)
    const intervalId = setInterval(() => {
      const currentTime = Date.now();
      const remainingMs = expiresAtRef.current - currentTime;
      const totalSecsLeft = Math.max(0, Math.ceil(remainingMs / 1000));
      setSessionRemainingSeconds(totalSecsLeft);

      if (remainingMs <= 0) {
        // Session has expired!
        clearInterval(intervalId);
        setShowWarning(false);
        try {
          localStorage.removeItem(STORAGE_KEY_EXPIRES_AT);
          localStorage.removeItem(STORAGE_KEY_LAST_ACTIVITY);
        } catch {
          // Ignore
        }
        onTimeoutRef.current();
      } else if (remainingMs <= warningMs) {
        // Warning zone (e.g. final 60 seconds)
        setShowWarning(true);
        setRemainingSeconds(Math.max(1, Math.ceil(remainingMs / 1000)));
      } else {
        setShowWarning(false);
      }
    }, 1000);

    return () => {
      activeEventTypes.forEach(event => {
        window.removeEventListener(event, handleMeaningfulActivity);
      });
      window.removeEventListener('storage', handleStorage);
      clearInterval(intervalId);
    };
  }, [enabled, currentTimeoutMs, warningMs, showWarning]);

  return {
    showWarning,
    remainingSeconds,
    sessionRemainingSeconds,
    resetTimer,
    simulateWarningTest,
    setTimeoutMinutes,
    timeoutMinutes: Math.round(currentTimeoutMs / (60 * 1000)),
    isCritical: sessionRemainingSeconds <= 60,
    isUrgent: sessionRemainingSeconds > 60 && sessionRemainingSeconds <= 300
  };
}
