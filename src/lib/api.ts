import type { AuditLog, ClearanceRequest, ClearanceType, NotificationRecord, ResidentProfile, SecurityStats, User, VerificationResult } from '../types';

const TOKEN_KEY = 'barangay_auth_token';
const USER_KEY = 'barangay_auth_user';

async function makeRequest<T = any>(endpoint: string, options: RequestInit = {}): Promise<{ success: boolean; data?: T; error?: string; [key: string]: any }> {
  const token = localStorage.getItem(TOKEN_KEY);
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(endpoint, {
      ...options,
      headers
    });

    const json = await response.json().catch(() => ({
      success: false,
      error: `Server returned HTTP ${response.status}`
    }));

    if (!response.ok) {
      return {
        success: false,
        error: json.error || `HTTP ${response.status}: An error occurred`,
        ...json
      };
    }

    return json;
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Network connection failed or server is offline.'
    };
  }
}

export const apiClient = {
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },

  setToken(token: string) {
    localStorage.setItem(TOKEN_KEY, token);
  },

  getStoredUser(): User | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  setStoredUser(user: User) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  clearAuth() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    try {
      localStorage.removeItem('barangay_last_activity_time');
    } catch {
      // Ignore
    }
  },

  async logout(reason: 'inactivity_timeout' | 'user_logout' = 'user_logout') {
    try {
      await makeRequest('/api/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ reason })
      });
    } catch {
      // Ignore network errors during logout
    } finally {
      this.clearAuth();
    }
  },

  // Auth
  async login(username: string, password: string, mfaCode?: string, destinationEmail?: string) {
    const res = await makeRequest<{
      user?: User;
      token?: string;
      profile?: ResidentProfile;
      mfaRequired?: boolean;
      userId?: string;
      username?: string;
      role?: string;
      fullName?: string;
      email?: string;
      maskedEmail?: string;
      mfaType?: 'gmail' | 'totp' | 'both';
      emailDelivered?: boolean;
      emailError?: string;
      demoOtp?: string;
      message?: string;
      userEmail?: string;
      canCheckFirebaseSync?: boolean;
      passwordResetPending?: boolean;
    }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password, mfaCode, destinationEmail })
    });

    if (res.success && res.token && res.user) {
      this.setToken(res.token);
      this.setStoredUser(res.user);
    }

    return res;
  },

  async invalidateOldPassword(identifier: string) {
    return makeRequest<{ success: boolean; message?: string }>('/api/auth/invalidate-reset-password', {
      method: 'POST',
      body: JSON.stringify({ userId: identifier, email: identifier, username: identifier })
    });
  },

  async syncFirebasePassword(data: {
    email?: string;
    username?: string;
    newPassword: string;
    firebaseUid?: string;
    idToken?: string;
  }) {
    const res = await makeRequest<{
      user?: User;
      token?: string;
      profile?: ResidentProfile;
      message?: string;
      mfaRequired?: boolean;
      userId?: string;
      username?: string;
      role?: string;
      fullName?: string;
      email?: string;
      maskedEmail?: string;
      emailDelivered?: boolean;
      emailError?: string;
      demoOtp?: string;
    }>('/api/auth/sync-firebase-password', {
      method: 'POST',
      body: JSON.stringify(data)
    });

    if (res.success && res.token && res.user) {
      this.setToken(res.token);
      this.setStoredUser(res.user);
    }

    return res;
  },

  async verifyMfa(data: { username?: string; userId?: string; mfaCode: string }) {
    const res = await makeRequest<{ user: User; token: string; profile?: ResidentProfile }>('/api/auth/verify-mfa', {
      method: 'POST',
      body: JSON.stringify(data)
    });

    if (res.success && res.token && res.user) {
      this.setToken(res.token);
      this.setStoredUser(res.user);
    }

    return res;
  },

  async googleFastLogin(data: { email: string; displayName?: string; photoURL?: string }) {
    const res = await makeRequest<{ user: User; token: string; profile?: ResidentProfile }>('/api/auth/google-fast-login', {
      method: 'POST',
      body: JSON.stringify(data)
    });

    if (res.success && res.token && res.user) {
      this.setToken(res.token);
      this.setStoredUser(res.user);
    }

    return res;
  },

  async resendMfaOtp(data: { userId?: string; username?: string; destinationEmail?: string }) {
    return makeRequest<{
      email: string;
      maskedEmail: string;
      emailDelivered?: boolean;
      emailError?: string;
      demoOtp?: string;
      expiresInMinutes: number;
      message: string;
    }>('/api/auth/resend-mfa-otp', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async sendMfaSetupCode(destinationEmail?: string) {
    return makeRequest<{
      email: string;
      maskedEmail: string;
      emailDelivered?: boolean;
      emailError?: string;
      demoOtp?: string;
      expiresInMinutes: number;
      message: string;
    }>('/api/auth/mfa/send-setup-code', {
      method: 'POST',
      body: JSON.stringify({ destinationEmail })
    });
  },

  async getEmailSettings() {
    return makeRequest<{
      configured: boolean;
      provider: string;
      sender: string | null;
      host: string;
      port: number;
      hasEnvCredentials: boolean;
      hasDbCredentials: boolean;
      forwardingEmail: string;
      forwardAllMfaToAdmin: boolean;
    }>('/api/email/settings');
  },

  async saveEmailSettings(settings: {
    gmailUser?: string;
    gmailAppPassword?: string;
    sendgridApiKey?: string;
    forwardingEmail?: string;
    forwardAllMfaToAdmin?: boolean;
  }) {
    return makeRequest<{
      message: string;
      configured: boolean;
      provider: string;
      host: string;
      port: number;
    }>('/api/email/settings', {
      method: 'POST',
      body: JSON.stringify(settings)
    });
  },

  async testEmailConnection(recipientEmail?: string) {
    return makeRequest<{
      delivered: boolean;
      message: string;
      messageId?: string;
      error?: string;
      provider: string;
      host: string;
      port: number;
    }>('/api/email/test', {
      method: 'POST',
      body: JSON.stringify({ recipientEmail })
    });
  },

  async updateAccountEmail(email: string) {
    return makeRequest<{
      message: string;
      email: string;
      user: any;
    }>('/api/auth/update-email', {
      method: 'POST',
      body: JSON.stringify({ email })
    });
  },

  async setupMfa() {
    return makeRequest<{
      secret: string;
      qrCodeDataUrl: string;
      otpAuthUrl: string;
      backupCodes: string[];
    }>('/api/auth/mfa/setup', {
      method: 'POST'
    });
  },

  async enableMfa(secret: string, token: string, backupCodes: string[], mfaType: 'gmail' | 'totp' = 'gmail') {
    return makeRequest<{ message: string; backupCodes?: string[] }>('/api/auth/mfa/enable', {
      method: 'POST',
      body: JSON.stringify({ secret, token, backupCodes, mfaType })
    });
  },

  async disableMfa(password: string, token?: string) {
    return makeRequest<{ message: string }>('/api/auth/mfa/disable', {
      method: 'POST',
      body: JSON.stringify({ password, token })
    });
  },

  async forgotPassword(identifier: string, destinationEmail?: string) {
    return makeRequest<{
      userFound: boolean;
      userId?: string;
      email?: string;
      maskedEmail?: string;
      username?: string;
      emailDelivered?: boolean;
      emailError?: string;
      demoOtp?: string;
      expiresInMinutes?: number;
      message: string;
    }>('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ identifier, destinationEmail })
    });
  },

  async resetPassword(data: { userId: string; otp: string; newPassword: string }) {
    return makeRequest<{ message: string }>('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  // Document Vault & Anti-Malware Upload
  async uploadDocument(file: File, docCategory: string, applicationId?: string) {
    const token = this.getToken();
    const formData = new FormData();
    formData.append('file', file);
    formData.append('docCategory', docCategory);
    if (applicationId) formData.append('applicationId', applicationId);

    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    try {
      const response = await fetch('/api/uploads/document', {
        method: 'POST',
        headers,
        body: formData
      });

      const json = await response.json().catch(() => ({
        success: false,
        error: `Server returned HTTP ${response.status}`
      }));

      return json;
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'File upload failed.'
      };
    }
  },

  async getUploadedDocuments() {
    return makeRequest<any[]>('/api/uploads');
  },

  async deleteUploadedDocument(id: string) {
    return makeRequest<{ message: string }>(`/api/uploads/${id}`, {
      method: 'DELETE'
    });
  },

  async register(data: {
    username: string;
    password: string;
    email: string;
    firstName: string;
    middleName?: string;
    lastName: string;
    suffix?: string;
    birthDate?: string;
    streetAddress?: string;
    purokZone?: string;
    contactNumber?: string;
    idType?: string;
    idNumber?: string;
    idPhotoUrl?: string;
    idPhotoName?: string;
    civilStatus?: string;
    gender?: string;
    yearsOfResidency?: number;
  }) {
    const res = await makeRequest<{ user: User; token: string; profile: ResidentProfile }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data)
    });

    if (res.success && res.token && res.user) {
      this.setToken(res.token);
      this.setStoredUser(res.user);
    }

    return res;
  },

  async getMe() {
    return makeRequest<{ user: User; profile?: ResidentProfile }>('/api/auth/me');
  },

  async updateProfile(data: {
    contactNumber?: string;
    address?: string;
    purok?: string;
    emergencyContact?: string;
    yearsOfResidency?: number;
    civilStatus?: string;
  }) {
    const res = await makeRequest<{ user: User; profile?: ResidentProfile; message: string }>('/api/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data)
    });
    if (res.success && res.user) {
      this.setStoredUser(res.user);
    }
    return res;
  },

  // Clearances
  async getClearances(status?: string) {
    const query = status ? `?status=${encodeURIComponent(status)}` : '';
    return makeRequest<ClearanceRequest[]>(`/api/clearances${query}`);
  },

  async getNotifications() {
    return makeRequest<NotificationRecord[]>('/api/notifications');
  },

  async getClearanceById(id: string) {
    return makeRequest<ClearanceRequest>(`/api/clearances/${id}`);
  },

  async submitRequest(data: {
    documentType: ClearanceType;
    purpose: string;
    urgency?: string;
    contactNumber?: string;
    businessName?: string;
    businessNature?: string;
    businessAddress?: string;
    monthlyIncome?: number;
    assistanceType?: string;
    idAttachmentName?: string;
    idAttachmentUrl?: string;
  }) {
    return makeRequest<ClearanceRequest>('/api/clearances', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async reviewRequest(id: string, data: {
    status: string;
    remarks?: string;
    rejectionReason?: string;
    orNumber?: string;
  }) {
    return makeRequest<ClearanceRequest>(`/api/clearances/${id}/review`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async signRequest(id: string) {
    return makeRequest<ClearanceRequest>(`/api/clearances/${id}/sign`, {
      method: 'POST'
    });
  },

  async issueRequest(id: string, orNumber?: string) {
    return makeRequest<ClearanceRequest>(`/api/clearances/${id}/issue`, {
      method: 'POST',
      body: JSON.stringify({ orNumber })
    });
  },

  // Public Verification
  async verifyDocument(referenceNumber: string, qrPayloadHash?: string) {
    return makeRequest<VerificationResult>('/api/verify', {
      method: 'POST',
      body: JSON.stringify({ referenceNumber, qrPayloadHash })
    });
  },

  // Audit Logs
  async getAuditLogs(limit: number = 100) {
    return makeRequest<{ logs: AuditLog[]; chainValid: boolean; totalLogs: number }>(`/api/audit/logs?limit=${limit}`);
  },

  async verifyAuditChain() {
    return makeRequest<{ valid: boolean; totalEntries: number; brokenAt?: string }>('/api/audit/verify-chain');
  },

  // Security Statistics
  async getSecurityStats() {
    return makeRequest<SecurityStats>('/api/audit/security-stats');
  },

  // SQL Schema Generator
  async getSchema(dialect: 'mysql' | 'postgresql' | 'sqlite' = 'mysql') {
    return makeRequest<{ dialect: string; ddl: string }>(`/api/schema/ddl?dialect=${dialect}`);
  },

  // Database Credentials Storage Audit (Advance Database & IAS alignment)
  async getDatabaseCredentialsAudit() {
    return makeRequest<{
      standard: string;
      records: Array<{
        id: string;
        username: string;
        role: string;
        fullName: string;
        passwordStorageType: string;
        passwordHash: string;
        isBackendInfrastructureOnly: boolean;
        plaintextStored: boolean;
        atRestEncryption: string;
        sampleEncryptedCiphertext: string;
        createdAt: string;
        lastLogin?: string;
      }>;
    }>('/api/db/credentials-audit');
  },

  // IAS Security Live Probes
  async testSecurityProbe(probeType: 'sqli' | 'xss' | 'tamper' | 'encryption' | 'password-hash', payload: any) {
    return makeRequest<any>('/api/security/test-probe', {
      method: 'POST',
      body: JSON.stringify({ probeType, payload })
    });
  },

  // Information Assurance Database Encryption Status & Sample
  async getEncryptionStatus() {
    return makeRequest<{
      status: string;
      algorithm: string;
      keyLengthBits: number;
      ivLengthBits: number;
      authTagBits: number;
      keyFingerprint: string;
      standard: string;
      regulatoryCompliance: string;
      encryptedAtRest: boolean;
      encryptedEntities: any;
    }>('/api/admin/encryption/status');
  },

  async getEncryptionSample() {
    return makeRequest<{
      userId: string;
      username: string;
      fullName: string;
      atRestEncryptedFields: Record<string, string>;
      inMemoryDecryptedFields: Record<string, string>;
      algorithm: string;
      cipherFormat: string;
      keyFingerprint: string;
    }>('/api/admin/encryption/sample');
  },

  // Gmail SMTP Status & Diagnostics
  async getEmailStatus() {
    return makeRequest<{
      emailConfigured: boolean;
      sender: string | null;
      host: string;
      port: number;
      mode: 'LIVE_SMTP' | 'DEMO_SIMULATION';
      guidance: string;
    }>('/api/system/email-status');
  },

  async testSendEmail(toEmail?: string) {
    return makeRequest<{
      target: string;
      testOtp: string;
      delivered: boolean;
      simulated?: boolean;
      error?: string;
      messageId?: string;
      message: string;
    }>('/api/system/test-email', {
      method: 'POST',
      body: JSON.stringify({ toEmail })
    });
  },

  // Resident ID Verification Management (Staff & Resident)
  async getStaffResidents() {
    return makeRequest<{
      data: import('../types.js').ResidentVerificationRecord[];
      counts: { total: number; pending: number; verified: number; rejected: number };
    }>('/api/staff/residents');
  },

  async verifyResident(id: string, decision: 'verified' | 'rejected', remarks: string) {
    return makeRequest<{ data: any; profile: any }>(`/api/staff/residents/${id}/verify`, {
      method: 'POST',
      body: JSON.stringify({ decision, remarks })
    });
  },

  async resubmitResidentId(data: { idPhotoUrl: string; idPhotoName?: string; idType?: string; idNumber?: string }) {
    return makeRequest<{ user: User; profile: ResidentProfile }>('/api/resident/resubmit-id', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  // Cybersecurity Administration & System Diagnostics
  async getDiagnostics() {
    return makeRequest<any>('/api/admin/diagnostics');
  }
};
