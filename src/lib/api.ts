import type { AuditLog, ClearanceRequest, ClearanceType, ResidentProfile, SecurityStats, User, VerificationResult } from '../types';

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
  },

  // Auth
  async login(username: string, password: string, mfaCode?: string) {
    const res = await makeRequest<{ user: User; token: string; profile?: ResidentProfile; mfaRequired?: boolean; userId?: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password, mfaCode })
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

  async enableMfa(secret: string, token: string, backupCodes: string[]) {
    return makeRequest<{ message: string }>('/api/auth/mfa/enable', {
      method: 'POST',
      body: JSON.stringify({ secret, token, backupCodes })
    });
  },

  async disableMfa(password: string, token?: string) {
    return makeRequest<{ message: string }>('/api/auth/mfa/disable', {
      method: 'POST',
      body: JSON.stringify({ password, token })
    });
  },

  async forgotPassword(identifier: string) {
    return makeRequest<{
      userFound: boolean;
      userId?: string;
      maskedEmail?: string;
      username?: string;
      demoOtp?: string;
      expiresInMinutes?: number;
      message: string;
    }>('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ identifier })
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
    birthDate: string;
    streetAddress: string;
    purokZone: string;
    contactNumber: string;
    idNumber: string;
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

  // IAS Security Live Probes
  async testSecurityProbe(probeType: 'sqli' | 'xss' | 'tamper', payload: any) {
    return makeRequest<any>('/api/security/test-probe', {
      method: 'POST',
      body: JSON.stringify({ probeType, payload })
    });
  }
};
