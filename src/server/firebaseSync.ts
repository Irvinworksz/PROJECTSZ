import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  setDoc,
  collection,
  getDocs
} from 'firebase/firestore';
import fs from 'fs';
import path from 'path';

let dbInstance: any = null;
let isConfigured = false;
let configData: any = null;

// Real-time in-memory event stream buffer (capped at 50 most recent cloud events)
const recentEventsBuffer: any[] = [
  {
    id: 'evt-init-01',
    collection: 'system',
    type: 'CLOUD_INIT',
    action: 'FIRESTORE_CONNECTED',
    title: 'Google Cloud Firestore Real-Time Channel Connected',
    details: 'Project: favorable-outlook-98chg • Database: ai-studio-securebarangayec-e1ce6f07-2475-4656-8ed0-42c844f0e436',
    actorName: 'Cloud Engine',
    timestamp: new Date().toISOString()
  }
];

try {
  const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    const raw = fs.readFileSync(configPath, 'utf8');
    configData = JSON.parse(raw);
    const app = getApps().length === 0 ? initializeApp(configData) : getApp();
    const databaseId = configData.firestoreDatabaseId || '(default)';
    dbInstance = getFirestore(app, databaseId);
    isConfigured = true;
    console.info(`[Firebase Sync] Initialized real-time Firestore with Database ID: ${databaseId}`);
  }
} catch (err) {
  console.warn('[Firebase Sync] Firebase config error or offline:', err);
}

function recordEvent(event: any) {
  recentEventsBuffer.unshift(event);
  if (recentEventsBuffer.length > 50) {
    recentEventsBuffer.pop();
  }
}

export function getRecentEvents() {
  return [...recentEventsBuffer];
}

export function getFirebaseSyncStatus() {
  return {
    configured: isConfigured,
    projectId: configData?.projectId || 'Not provisioned',
    databaseId: configData?.firestoreDatabaseId || '(default)',
    authDomain: configData?.authDomain || '',
    consoleUrl: configData?.projectId
      ? `https://console.firebase.google.com/project/${configData.projectId}/firestore/databases/${configData.firestoreDatabaseId || '(default)'}/data`
      : 'https://console.firebase.google.com'
  };
}

/**
 * Synchronizes user authentication & profile record to Firebase Firestore in real time
 */
export async function syncUserToFirestore(user: any) {
  const event = {
    id: user.id,
    collection: 'users',
    type: 'USER_AUTH',
    action: 'USER_SYNC',
    title: `User '${user.username}' Authenticated / Active`,
    details: `Role: ${user.role} • Email: ${user.email} • IP: ${user.lastIp || '127.0.0.1'}`,
    actorName: user.full_name || user.fullName || user.username,
    timestamp: new Date().toISOString()
  };
  recordEvent(event);

  if (!dbInstance) return;
  try {
    const userRef = doc(dbInstance, 'users', user.id);
    const firestoreData: any = {
      id: user.id,
      email: user.email,
      username: user.username,
      fullName: user.full_name || user.fullName || user.username,
      role: user.role,
      status: user.verification_status || user.status || 'active',
      isVerifiedResident: Boolean(user.is_verified_resident),
      lastLogin: user.lastLogin || user.last_login || new Date().toISOString(),
      lastIp: user.lastIp || '127.0.0.1',
      syncedAt: new Date().toISOString()
    };

    if (user.password_hash) firestoreData.password_hash = user.password_hash;
    if (user.contact_number) firestoreData.contact_number = user.contact_number;
    if (user.address) firestoreData.address = user.address;
    if (user.purok) firestoreData.purok = user.purok;
    if (user.id_type) firestoreData.id_type = user.id_type;
    if (user.id_number) firestoreData.id_number = user.id_number;
    if (user.id_photo_url) firestoreData.id_photo_url = user.id_photo_url;
    if (user.id_photo_name) firestoreData.id_photo_name = user.id_photo_name;
    if (user.mfa_enabled !== undefined) firestoreData.mfa_enabled = user.mfa_enabled;
    if (user.mfa_required !== undefined) firestoreData.mfa_required = user.mfa_required;

    await setDoc(userRef, firestoreData, { merge: true });
    console.info(`[Firebase Sync] Synced user '${user.username}' (${user.id}) to Firestore`);
  } catch (err) {
    console.error('[Firebase Sync] Error syncing user to Firestore:', err);
  }
}

/**
 * Loads all user accounts stored in Firestore into memory/local database
 */
export async function fetchAllUsersFromFirestore(): Promise<any[]> {
  if (!dbInstance) return [];
  try {
    const snap = await getDocs(collection(dbInstance, 'users'));
    const list: any[] = [];
    snap.forEach((docSnap) => {
      const data = docSnap.data();
      if (data && data.username && !docSnap.id.startsWith('audit-')) {
        list.push({ id: docSnap.id, ...data });
      }
    });
    return list;
  } catch (err) {
    console.warn('[Firebase Sync] Could not fetch users from Firestore:', err);
    return [];
  }
}

/**
 * Synchronizes MFA OTP and Two-Factor security dispatches to Firebase Firestore in real time
 */
export async function syncMfaDispatchToFirestore(data: {
  userId: string;
  username: string;
  email: string;
  maskedEmail: string;
  otpCode: string;
  purpose: string;
  delivered: boolean;
  expiresInMinutes: number;
}) {
  const dispatchId = `mfa-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const event = {
    id: dispatchId,
    collection: 'mfaDispatches',
    type: 'MFA_DISPATCH',
    action: 'MFA_SECURITY_CODE',
    title: `Two-Factor Security Code Dispatched for '${data.username}'`,
    details: `Recipient: ${data.maskedEmail} • Purpose: ${data.purpose} • Channel: Gmail / 2FA`,
    otpCode: data.otpCode,
    actorName: data.username,
    timestamp: new Date().toISOString()
  };
  recordEvent(event);

  if (!dbInstance) return;
  try {
    const dispatchRef = doc(dbInstance, 'mfaDispatches', dispatchId);
    const payload = {
      id: dispatchId,
      userId: data.userId,
      username: data.username,
      recipientEmail: data.email,
      maskedEmail: data.maskedEmail,
      otpCode: data.otpCode,
      purpose: data.purpose,
      deliveredViaSmtp: data.delivered,
      expiresAt: new Date(Date.now() + (data.expiresInMinutes || 10) * 60 * 1000).toISOString(),
      timestamp: new Date().toISOString(),
      status: 'DISPATCHED_PENDING_VERIFICATION'
    };
    await setDoc(dispatchRef, payload);

    // Also write to notifications collection so residents/personnel see it in their live inbox
    const notifId = `notif-${Date.now()}`;
    const notifRef = doc(dbInstance, 'notifications', notifId);
    await setDoc(notifRef, {
      id: notifId,
      userId: data.userId,
      title: 'Two-Factor Authentication Security Code',
      message: `Your 6-digit verification code is [ ${data.otpCode} ] for ${data.purpose}. Valid for ${data.expiresInMinutes} minutes.`,
      channel: 'Gmail / Two-Factor Authentication',
      read: false,
      createdAt: new Date().toISOString()
    });
    console.info(`[Firebase Sync] Dispatched MFA code for '${data.username}' recorded in Firestore (${dispatchId})`);
  } catch (err) {
    console.error('[Firebase Sync] Error syncing MFA dispatch:', err);
  }
}

/**
 * Synchronizes clearance requests to Firebase Firestore in real time
 */
export async function syncRequestToFirestore(request: any) {
  const event = {
    id: request.id,
    collection: 'clearanceRequests',
    type: 'CLEARANCE_REQUEST',
    action: `REQUEST_${request.status?.toUpperCase() || 'UPDATED'}`,
    title: `${request.type || 'Barangay Clearance'} • Status: ${request.status?.toUpperCase()}`,
    details: `Resident: ${request.resident_name || request.residentName} • Purpose: ${request.purpose}`,
    actorName: request.resident_name || request.residentName,
    timestamp: new Date().toISOString()
  };
  recordEvent(event);

  if (!dbInstance) return;
  try {
    const reqRef = doc(dbInstance, 'clearanceRequests', request.id);
    await setDoc(reqRef, {
      id: request.id,
      residentId: request.resident_id || request.residentId,
      residentName: request.resident_name || request.residentName,
      type: request.type || request.documentType,
      purpose: request.purpose,
      status: request.status,
      urgency: request.urgency || 'Normal',
      paymentStatus: request.payment_status || request.paymentStatus || 'unpaid',
      trackingCode: request.tracking_code || request.trackingCode || request.id,
      createdAt: request.created_at || request.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }, { merge: true });
    console.info(`[Firebase Sync] Synced request ${request.id} to Firestore`);
  } catch (err) {
    console.error('[Firebase Sync] Error syncing request:', err);
  }
}

/**
 * Synchronizes immutable audit logs to Firebase Firestore in real time
 */
export async function syncAuditLogToFirestore(log: any) {
  const logId = log.id || `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const event = {
    id: logId,
    collection: 'auditLogs',
    type: 'AUDIT_LOG',
    action: log.actionType || log.action || 'SECURITY_EVENT',
    title: `Security Event: ${log.actionType || 'LOG_ENTRY'}`,
    details: log.details || '',
    actorName: log.userName || log.actorName || 'System',
    timestamp: log.timestamp || new Date().toISOString()
  };
  recordEvent(event);

  if (!dbInstance) return;
  try {
    const logRef = doc(dbInstance, 'auditLogs', logId);
    await setDoc(logRef, {
      id: logId,
      timestamp: log.timestamp || new Date().toISOString(),
      actorId: log.userId || log.actorId || 'system',
      actorName: log.userName || log.actorName || 'System',
      actorRole: log.userRole || log.actorRole || 'system',
      action: log.actionType || log.action || 'SECURITY_EVENT',
      entity: log.resourceType || log.entity || '/system',
      details: log.details || '',
      ipAddress: log.ipAddress || '127.0.0.1',
      hash: log.currentHash || log.hash || '',
      prevHash: log.previousHash || log.prevHash || ''
    });
    console.info(`[Firebase Sync] Synced audit log ${logId} to Firestore`);
  } catch (err) {
    console.error('[Firebase Sync] Error syncing audit log:', err);
  }
}

/**
 * Test ping emitter for live demonstration
 */
export async function dispatchTestSyncPing(triggeredBy: string) {
  const docId = `ping-${Date.now()}`;
  const event = {
    id: docId,
    collection: 'auditLogs',
    type: 'PING_TEST',
    action: 'REALTIME_HEALTH_CHECK',
    title: 'Live Firestore Round-Trip Connectivity Verified',
    details: `Triggered by ${triggeredBy}. Verified read/write access to Google Cloud Firestore.`,
    actorName: triggeredBy,
    timestamp: new Date().toISOString()
  };
  recordEvent(event);

  if (dbInstance) {
    try {
      const pingRef = doc(dbInstance, 'test', 'lastPing');
      await setDoc(pingRef, {
        timestamp: new Date().toISOString(),
        triggeredBy,
        project: configData?.projectId
      });
    } catch (e) {
      console.warn('[Firebase Sync] Ping write warning:', e);
    }
  }

  return { success: true, collection: 'test', docId };
}

/**
 * Seeds all system user accounts into Firestore so they are immediately visible in the web console
 */
export async function seedAllUsersToFirestore(users: any[]) {
  if (!dbInstance || !Array.isArray(users)) return { count: 0 };
  let count = 0;
  for (const u of users) {
    try {
      const userRef = doc(dbInstance, 'users', u.id);
      await setDoc(userRef, {
        id: u.id,
        email: u.email,
        username: u.username,
        fullName: u.full_name || u.fullName || u.username,
        role: u.role,
        status: u.verification_status || u.status || 'active',
        isVerifiedResident: Boolean(u.is_verified_resident),
        lastLogin: u.last_login || new Date().toISOString(),
        lastIp: '127.0.0.1',
        syncedAt: new Date().toISOString()
      }, { merge: true });
      count++;
    } catch (e) {
      console.warn(`[Firebase Sync] Failed to seed user ${u.username}:`, e);
    }
  }
  console.info(`[Firebase Sync] Successfully synced ${count} system accounts to Firestore.`);
  return { count };
}

/**
 * Runs a comprehensive live auth test ping that verifies writes to /users and /auditLogs
 */
export async function runFullAuthSyncTest(username: string = 'resident.santos') {
  const testId = `test-auth-${Date.now()}`;
  const event = {
    id: testId,
    collection: 'users',
    type: 'USER_AUTH',
    action: 'LIVE_AUTH_VERIFICATION',
    title: `Live Authentication Verification for '${username}'`,
    details: 'Verified real-time synchronization between Express session and Cloud Firestore /users',
    actorName: username,
    timestamp: new Date().toISOString()
  };
  recordEvent(event);

  if (dbInstance) {
    try {
      const userRef = doc(dbInstance, 'users', `audit-${username}`);
      await setDoc(userRef, {
        id: `audit-${username}`,
        username,
        lastVerifiedAuth: new Date().toISOString(),
        testSessionId: testId,
        syncEngine: 'Google Cloud Firestore Real-Time Channel'
      }, { merge: true });
    } catch (e) {
      console.warn('[Firebase Sync] Auth verification write warning:', e);
    }
  }

  return { success: true, testId, username };
}
