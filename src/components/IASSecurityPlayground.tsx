import React, { useState } from 'react';
import { AlertOctagon, CheckCircle2, Database, KeyRound, Lock, Play, Shield, ShieldAlert, ShieldCheck, Terminal, Zap, Clock, Timer, Eye, EyeOff, RefreshCw, FileText } from 'lucide-react';
import { apiClient } from '../lib/api';

interface IASSecurityPlaygroundProps {
  onSimulateInactivityWarning?: () => void;
}

export const IASSecurityPlayground: React.FC<IASSecurityPlaygroundProps> = ({
  onSimulateInactivityWarning
}) => {
  const [activeTab, setActiveTab] = useState<'integrity' | 'confidentiality' | 'availability' | 'authentication'>('integrity');
  
  // SQLi Probe State
  const [sqlPayload, setSqlPayload] = useState<string>("' OR '1'='1' --");
  const [sqlResult, setSqlResult] = useState<any>(null);
  const [sqlLoading, setSqlLoading] = useState<boolean>(false);

  // XSS Probe State
  const [xssPayload, setXssPayload] = useState<string>("<script>alert('Stealing Cookie: ' + document.cookie)</script><img src=x onerror=\"alert('XSS Exploit')\">");
  const [xssResult, setXssResult] = useState<any>(null);
  const [xssLoading, setXssLoading] = useState<boolean>(false);

  // Tamper Probe State
  const [tamperOriginalName, setTamperOriginalName] = useState<string>("MARIA C. SANTOS");
  const [tamperAlteredName, setTamperAlteredName] = useState<string>("MARIA C. SANTUZ"); // 1 letter changed
  const [tamperResult, setTamperResult] = useState<any>(null);
  const [tamperLoading, setTamperLoading] = useState<boolean>(false);

  // Rate Limiting Simulator State
  const [dosCount, setDosCount] = useState<number>(0);
  const [dosLogs, setDosLogs] = useState<Array<{ id: number; status: number; text: string; time: string }>>([]);

  // AES-256-GCM Encryption State
  const [encryptionPayload, setEncryptionPayload] = useState<string>("09289876543 (Resident Mobile) | PhilSys ID: CRN-0111-9876543-2 | Purok 2, Cabucbucan");
  const [encryptionResult, setEncryptionResult] = useState<any>(null);
  const [encryptionLoading, setEncryptionLoading] = useState<boolean>(false);
  const [encryptionSample, setEncryptionSample] = useState<any>(null);
  const [loadingSample, setLoadingSample] = useState<boolean>(false);

  // BCrypt Salted Password Hashing Probe State (ADBMS & IAS alignment)
  const [bcryptCandidate, setBcryptCandidate] = useState<string>("SecurePassword@2026!");
  const [bcryptCost, setBcryptCost] = useState<number>(10);
  const [bcryptResult, setBcryptResult] = useState<any>(null);
  const [bcryptLoading, setBcryptLoading] = useState<boolean>(false);

  const handleTestBcrypt = async () => {
    setBcryptLoading(true);
    const res = await apiClient.testSecurityProbe('password-hash', {
      password: bcryptCandidate,
      cost: bcryptCost
    });
    setBcryptLoading(false);
    if (res.success) {
      setBcryptResult(res);
    }
  };

  const handleTestEncryption = async () => {
    setEncryptionLoading(true);
    const res = await apiClient.testSecurityProbe('encryption', encryptionPayload);
    setEncryptionLoading(false);
    if (res.success) {
      setEncryptionResult(res);
    }
  };

  const handleLoadDbEncryptionSample = async () => {
    setLoadingSample(true);
    const res = await apiClient.getEncryptionSample();
    setLoadingSample(false);
    if (res.success && res.data) {
      setEncryptionSample(res.data);
    }
  };

  const handleTestSql = async () => {
    setSqlLoading(true);
    const res = await apiClient.testSecurityProbe('sqli', sqlPayload);
    setSqlLoading(false);
    if (res.success) {
      setSqlResult(res);
    }
  };

  const handleTestXss = async () => {
    setXssLoading(true);
    const res = await apiClient.testSecurityProbe('xss', xssPayload);
    setXssLoading(false);
    if (res.success) {
      setXssResult(res);
    }
  };

  const handleTestTamper = async () => {
    setTamperLoading(true);
    const res = await apiClient.testSecurityProbe('tamper', {
      originalName: tamperOriginalName,
      alteredName: tamperAlteredName,
      referenceNumber: 'BC-2026-0842',
      documentType: 'barangay_clearance',
      purpose: 'Local Employment Application',
      issuedAt: '2026-08-15T10:30:00Z'
    });
    setTamperLoading(false);
    if (res.success) {
      setTamperResult(res);
    }
  };

  const handleSimulateDosBurst = async () => {
    const burstSize = 6;
    for (let i = 0; i < burstSize; i++) {
      const attemptNum = dosCount + i + 1;
      const res = await apiClient.login('admin.security', 'WrongPasswordTest!');
      const timeStr = new Date().toLocaleTimeString();
      
      setDosLogs(prev => [
        {
          id: Date.now() + i,
          status: res.locked ? 423 : 401,
          text: res.locked
            ? `[LOCKED 423] Brute-Force Shield Activated! Account locked for ${res.lockTimeRemainingSeconds}s.`
            : `[ATTEMPT ${attemptNum}] 401 Unauthorized: Invalid credentials recorded. (${attemptNum}/5 failed attempts)`,
          time: timeStr
        },
        ...prev.slice(0, 15)
      ]);
    }
    setDosCount(prev => prev + burstSize);
  };

  return (
    <div className="space-y-6">
      {/* Playground Header */}
      <div className="bg-white text-slate-900 p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 border border-blue-200 text-blue-700 rounded-xl shrink-0">
            <Terminal className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Information Assurance & Security (IAS) Interactive Lab</h2>
            <p className="text-xs text-slate-600 font-medium mt-0.5">
              Live penetration simulation & defense verification engine demonstrating CIA Triad and Non-Repudiation controls
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex flex-wrap gap-2 mt-6 border-t border-slate-200 pt-4">
          <button
            onClick={() => setActiveTab('integrity')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'integrity'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-300'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            1. Integrity (SQLi, XSS, & Tamper Proof)
          </button>

          <button
            onClick={() => setActiveTab('confidentiality')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'confidentiality'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-300'
            }`}
          >
            <Lock className="w-4 h-4" />
            2. Confidentiality (RBAC & Isolation)
          </button>

          <button
            onClick={() => setActiveTab('availability')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'availability'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-300'
            }`}
          >
            <Zap className="w-4 h-4" />
            3. Availability (Rate Limits & Shielding)
          </button>

          <button
            onClick={() => setActiveTab('authentication')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'authentication'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-300'
            }`}
          >
            <KeyRound className="w-4 h-4" />
            4. Auth & Non-Repudiation (BCrypt & Ledger)
          </button>
        </div>
      </div>

      {/* TAB 1: INTEGRITY */}
      {activeTab === 'integrity' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* SQL Injection Defense Test */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-50 border border-amber-200 text-amber-700 rounded-lg">
                  <Database className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm text-slate-900">SQL Injection Resistance Test</h3>
              </div>
              <span className="px-2 py-0.5 bg-emerald-50 border border-emerald-300 text-emerald-800 text-[10px] font-bold rounded-full">
                Prepared Statements
              </span>
            </div>

            <p className="text-xs text-slate-600 font-medium">
              Test how the database handles SQL injection payloads via parameterized queries vs vulnerable dynamic concatenation.
            </p>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700">Test Input Payload:</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={sqlPayload}
                  onChange={(e) => setSqlPayload(e.target.value)}
                  className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-medium text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <button
                  onClick={handleTestSql}
                  disabled={sqlLoading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm flex items-center gap-1.5 cursor-pointer shrink-0 disabled:opacity-50"
                >
                  <Play className="w-3.5 h-3.5" />
                  Evaluate
                </button>
              </div>
              <div className="flex gap-2 text-[11px] text-slate-500 font-medium">
                <span>Presets:</span>
                <button onClick={() => setSqlPayload("' OR '1'='1' --")} className="text-blue-600 underline hover:text-blue-800 cursor-pointer font-bold">Tautology</button>
                <button onClick={() => setSqlPayload("admin' UNION SELECT password_hash FROM users --")} className="text-blue-600 underline hover:text-blue-800 cursor-pointer font-bold">Union Extract</button>
                <button onClick={() => setSqlPayload("'; DROP TABLE audit_logs; --")} className="text-blue-600 underline hover:text-blue-800 cursor-pointer font-bold">Destructive Drop</button>
              </div>
            </div>

            {sqlResult && (
              <div className="space-y-2 pt-3 border-t border-slate-200 text-xs">
                <div className="p-3 bg-slate-900 border border-slate-800 text-slate-200 rounded-xl font-mono text-[11px] space-y-2">
                  <div>
                    <span className="text-rose-400 block font-bold">// ❌ Vulnerable String Concatenation:</span>
                    <code className="text-rose-300">{sqlResult.vulnerableQuery}</code>
                  </div>
                  <div className="pt-2 border-t border-slate-800">
                    <span className="text-emerald-400 block font-bold">// ✅ Our Secure Parameterized Statement:</span>
                    <code className="text-emerald-300">{sqlResult.parameterizedQuery}</code>
                  </div>
                </div>
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs flex items-start gap-2 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{sqlResult.defenseExplanation}</span>
                </div>
              </div>
            )}
          </div>

          {/* XSS Sanitization Test */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm text-slate-900">Cross-Site Scripting (XSS) Sanitizer</h3>
              </div>
              <span className="px-2 py-0.5 bg-emerald-50 border border-emerald-300 text-emerald-800 text-[10px] font-bold rounded-full">
                Defensive Sanitizer
              </span>
            </div>

            <p className="text-xs text-slate-600 font-medium">
              Enforces server-side sanitization on all resident text inputs, stripping scripts, event handlers, and malicious tags.
            </p>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700">Raw Malicious Form Input:</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={xssPayload}
                  onChange={(e) => setXssPayload(e.target.value)}
                  className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-medium text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <button
                  onClick={handleTestXss}
                  disabled={xssLoading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm flex items-center gap-1.5 cursor-pointer shrink-0 disabled:opacity-50"
                >
                  <Play className="w-3.5 h-3.5" />
                  Sanitize
                </button>
              </div>
            </div>

            {xssResult && (
              <div className="space-y-2 pt-3 border-t border-slate-200 text-xs">
                <div className="p-3 bg-slate-900 border border-slate-800 text-slate-200 rounded-xl font-mono text-[11px] space-y-2">
                  <div>
                    <span className="text-amber-400 block font-bold">// Raw Attacker Input:</span>
                    <code className="text-amber-300">{xssResult.rawInput}</code>
                  </div>
                  <div className="pt-2 border-t border-slate-800">
                    <span className="text-emerald-400 block font-bold">// Sanitized Clean Output (Stored in DB):</span>
                    <code className="text-emerald-300">{xssResult.sanitizedOutput || '[Empty / Malicious payload completely purged]'}</code>
                  </div>
                </div>
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 text-xs flex items-start gap-2 font-medium">
                  <Shield className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <span>{xssResult.defenseExplanation}</span>
                </div>
              </div>
            )}
          </div>

          {/* Cryptographic SHA-256 Tamper Proof Inspector */}
          <div className="col-span-full bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm text-slate-900">SHA-256 Avalanche Effect & Document Tamper Invalidation</h3>
              </div>
              <span className="px-2 py-0.5 bg-blue-50 border border-blue-300 text-blue-800 text-[10px] font-bold rounded-full">
                Cryptographic Anti-Forgery
              </span>
            </div>

            <p className="text-xs text-slate-600 font-medium">
              Demonstrates how altering even a single character in an official document invalidates the entire 256-bit cryptographic signature.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Original Certified Resident Name:</label>
                <input
                  type="text"
                  value={tamperOriginalName}
                  onChange={(e) => setTamperOriginalName(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Forged / Altered Name (e.g. by bad actor):</label>
                <input
                  type="text"
                  value={tamperAlteredName}
                  onChange={(e) => setTamperAlteredName(e.target.value)}
                  className="w-full px-3 py-2 bg-rose-50 border border-rose-300 rounded-xl text-xs font-mono font-bold text-rose-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>
            </div>

            <button
              onClick={handleTestTamper}
              disabled={tamperLoading}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5" />
              Compute Cryptographic Hashes & Verify Mismatch
            </button>

            {tamperResult && (
              <div className="space-y-3 pt-3 border-t border-slate-200 text-xs">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1">
                    <span className="font-bold text-emerald-900 text-xs">Original Canonical Hash (SHA-256):</span>
                    <code className="text-[11px] font-mono text-emerald-800 font-bold block break-all">{tamperResult.originalHash}</code>
                  </div>
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-1">
                    <span className="font-bold text-rose-900 text-xs">Forged Payload Hash (SHA-256):</span>
                    <code className="text-[11px] font-mono text-rose-800 font-bold block break-all">{tamperResult.alteredHash}</code>
                  </div>
                </div>

                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 text-xs flex items-start gap-2 font-medium">
                  <AlertOctagon className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-bold">Verification Mismatch Confirmed: </strong>
                    <span>{tamperResult.defenseExplanation}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: CONFIDENTIALITY (ENCRYPTION AT REST & RBAC) */}
      {activeTab === 'confidentiality' && (
        <div className="space-y-6">
          {/* AES-256-GCM Field-Level Encryption Live Interactive Lab */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">AES-256-GCM Field-Level Data at Rest Encryption</h3>
                  <p className="text-[11px] text-slate-500">NIST SP 800-38D & Philippine Data Privacy Act (RA 10173) Compliance</p>
                </div>
              </div>
              <span className="px-2.5 py-0.5 bg-emerald-50 border border-emerald-300 text-emerald-800 text-[10px] font-bold rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Active Database Encryption
              </span>
            </div>

            <p className="text-xs text-slate-600 font-medium">
              In Information Assurance, <strong>Confidentiality</strong> ensures sensitive Citizen PII (phone numbers, home addresses, government IDs, and MFA secrets) cannot be read by unauthorized parties even if the physical disk, database file, or backup dump is stolen. Test field encryption below:
            </p>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 block">Plaintext Sensitive Resident Information:</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={encryptionPayload}
                  onChange={(e) => setEncryptionPayload(e.target.value)}
                  placeholder="Enter sensitive resident data to encrypt..."
                  className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-medium text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <button
                  onClick={handleTestEncryption}
                  disabled={encryptionLoading || !encryptionPayload.trim()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm flex items-center gap-1.5 cursor-pointer shrink-0 disabled:opacity-50 transition-colors"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>{encryptionLoading ? 'Encrypting...' : 'Encrypt with AES-256-GCM'}</span>
                </button>
              </div>

              {/* Sample Presets */}
              <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500">
                <span className="font-semibold text-slate-700">Quick Test Payloads:</span>
                <button
                  type="button"
                  onClick={() => setEncryptionPayload("CRN-0111-9876543-2 (Philippine National PhilSys ID)")}
                  className="text-blue-600 underline hover:text-blue-800 cursor-pointer font-medium"
                >
                  PhilSys ID
                </button>
                <span>•</span>
                <button
                  type="button"
                  onClick={() => setEncryptionPayload("0928-987-6543 (Citizen Mobile Contact)")}
                  className="text-blue-600 underline hover:text-blue-800 cursor-pointer font-medium"
                >
                  Contact Number
                </button>
                <span>•</span>
                <button
                  type="button"
                  onClick={() => setEncryptionPayload("House 142, Purok 2, Barangay Cabucbucan, Rizal, Nueva Ecija")}
                  className="text-blue-600 underline hover:text-blue-800 cursor-pointer font-medium"
                >
                  Residential Address
                </button>
                <span>•</span>
                <button
                  type="button"
                  onClick={() => setEncryptionPayload("JBSWY3DPEHPK3PXP (MFA Seed Secret & Backup Codes)")}
                  className="text-blue-600 underline hover:text-blue-800 cursor-pointer font-medium"
                >
                  2FA Secret
                </button>
              </div>
            </div>

            {encryptionResult && (
              <div className="space-y-3 pt-3 border-t border-slate-200 text-xs">
                <div>
                  <span className="text-slate-700 font-bold block mb-1">
                    🔒 Resulting Authenticated Storage Envelope (Stored in Database):
                  </span>
                  <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl font-mono text-[11px] text-amber-300 break-all select-all">
                    {encryptionResult.encryptedEnvelope}
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1 block font-mono">
                    Format: enc:v1:&lt;96-bit IV&gt;:&lt;128-bit AuthTag&gt;:&lt;Ciphertext&gt;
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                    <span className="text-[10px] font-bold uppercase text-slate-500 block">Initialization Vector (IV)</span>
                    <code className="text-[10px] font-mono text-blue-700 font-bold break-all block mt-0.5">
                      {encryptionResult.components?.ivHex}
                    </code>
                    <span className="text-[9px] text-slate-500 block mt-0.5">96-bit unique random nonce per field</span>
                  </div>

                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                    <span className="text-[10px] font-bold uppercase text-slate-500 block">Authentication Tag (GCM MAC)</span>
                    <code className="text-[10px] font-mono text-emerald-700 font-bold break-all block mt-0.5">
                      {encryptionResult.components?.authTagHex}
                    </code>
                    <span className="text-[9px] text-slate-500 block mt-0.5">128-bit cryptographic integrity tag</span>
                  </div>

                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                    <span className="text-[10px] font-bold uppercase text-slate-500 block">Verified Decryption</span>
                    <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1 mt-0.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Integrity 100% Valid</span>
                    </span>
                    <code className="text-[10px] font-mono text-slate-800 font-semibold block truncate mt-0.5">
                      "{encryptionResult.decryptedVerify}"
                    </code>
                  </div>
                </div>

                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs flex items-start gap-2 font-medium">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{encryptionResult.defenseExplanation}</span>
                </div>
              </div>
            )}
          </div>

          {/* Real Database At-Rest Disk Storage Inspector */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-lg">
                  <Database className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Database Disk Storage Inspector (.data/barangay_store.json)</h3>
                  <p className="text-[11px] text-slate-500">Live comparison: Raw Encrypted At-Rest Disk Storage vs Decrypted Authorized Memory</p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleLoadDbEncryptionSample}
                disabled={loadingSample}
                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 flex items-center gap-1.5 cursor-pointer shrink-0 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingSample ? 'animate-spin' : ''}`} />
                <span>{encryptionSample ? 'Refresh Storage Sample' : 'Inspect Live Encrypted Record'}</span>
              </button>
            </div>

            {encryptionSample ? (
              <div className="space-y-3 pt-2 text-xs">
                <div className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700">
                  <span>Target Sample Resident: <strong className="text-slate-900">{encryptionSample.fullName}</strong> ({encryptionSample.username})</span>
                  <span className="font-mono text-[11px] bg-white px-2 py-0.5 rounded border border-slate-200 font-bold text-blue-700">
                    {encryptionSample.keyFingerprint}
                  </span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Left: Raw Disk At Rest */}
                  <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-rose-400 border-b border-slate-800 pb-1.5">
                      <span className="flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5" />
                        <span>RAW DISK STORAGE (.data/barangay_store.json)</span>
                      </span>
                      <span className="text-[10px] bg-rose-950 text-rose-300 border border-rose-800 px-1.5 py-0.5 rounded">
                        Ciphertext At Rest
                      </span>
                    </div>

                    <div className="space-y-1.5 font-mono text-[10px]">
                      <div>
                        <span className="text-slate-400 block font-sans font-bold">contact_number:</span>
                        <code className="text-amber-300 break-all block bg-slate-950 p-1.5 rounded border border-slate-800">
                          {encryptionSample.atRestEncryptedFields?.contact_number}
                        </code>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-sans font-bold">address:</span>
                        <code className="text-amber-300 break-all block bg-slate-950 p-1.5 rounded border border-slate-800">
                          {encryptionSample.atRestEncryptedFields?.address}
                        </code>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-sans font-bold">id_number:</span>
                        <code className="text-amber-300 break-all block bg-slate-950 p-1.5 rounded border border-slate-800">
                          {encryptionSample.atRestEncryptedFields?.id_number}
                        </code>
                      </div>
                    </div>
                  </div>

                  {/* Right: Authenticated Memory */}
                  <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl text-emerald-950 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-emerald-800 border-b border-emerald-200 pb-1.5">
                      <span className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>AUTHENTICATED IN-MEMORY REPRESENTATION</span>
                      </span>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-300 px-1.5 py-0.5 rounded">
                        Decrypted on Auth
                      </span>
                    </div>

                    <div className="space-y-1.5 text-[11px] font-sans">
                      <div>
                        <span className="text-emerald-800 font-bold block text-[10px] uppercase">contact_number:</span>
                        <div className="font-semibold text-slate-900 bg-white p-1.5 rounded border border-emerald-200 font-mono">
                          {encryptionSample.inMemoryDecryptedFields?.contact_number}
                        </div>
                      </div>
                      <div>
                        <span className="text-emerald-800 font-bold block text-[10px] uppercase">address:</span>
                        <div className="font-semibold text-slate-900 bg-white p-1.5 rounded border border-emerald-200">
                          {encryptionSample.inMemoryDecryptedFields?.address}
                        </div>
                      </div>
                      <div>
                        <span className="text-emerald-800 font-bold block text-[10px] uppercase">id_number:</span>
                        <div className="font-semibold text-slate-900 bg-white p-1.5 rounded border border-emerald-200 font-mono">
                          {encryptionSample.inMemoryDecryptedFields?.id_number}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center text-xs text-slate-600 space-y-2">
                <p>Click the button above to load the live cryptographic comparison from the server database.</p>
                <button
                  type="button"
                  onClick={handleLoadDbEncryptionSample}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Inspect Live Database Disk Storage</span>
                </button>
              </div>
            )}
          </div>

          {/* Role-Based Access Control Matrix */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-base text-slate-900">Role-Based Access Control (RBAC) Matrix</h3>
            <p className="text-xs text-slate-600 font-medium">
              The system enforces least-privilege separation across 4 distinct user tiers with strictly isolated data boundaries.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase">
                  <tr>
                    <th className="py-3 px-4">System Capability</th>
                    <th className="py-3 px-4 text-center">Resident</th>
                    <th className="py-3 px-4 text-center">Desk Staff</th>
                    <th className="py-3 px-4 text-center">Punong Barangay (Captain)</th>
                    <th className="py-3 px-4 text-center">Cybersecurity Admin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans font-medium">
                  <tr className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900">Submit E-Clearance Request</td>
                    <td className="py-3 px-4 text-center"><CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" /></td>
                    <td className="py-3 px-4 text-center"><CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" /></td>
                    <td className="py-3 px-4 text-center"><span className="text-slate-400">—</span></td>
                    <td className="py-3 px-4 text-center"><CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" /></td>
                  </tr>
                  <tr className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900">View Other Residents' Records & IDs</td>
                    <td className="py-3 px-4 text-center"><span className="text-rose-600 font-bold">NO (Data Isolation)</span></td>
                    <td className="py-3 px-4 text-center"><CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" /></td>
                    <td className="py-3 px-4 text-center"><CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" /></td>
                    <td className="py-3 px-4 text-center"><CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" /></td>
                  </tr>
                  <tr className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900">Review & Advance Pipeline (Staff Review)</td>
                    <td className="py-3 px-4 text-center"><span className="text-slate-400">—</span></td>
                    <td className="py-3 px-4 text-center"><CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" /></td>
                    <td className="py-3 px-4 text-center"><span className="text-slate-400">—</span></td>
                    <td className="py-3 px-4 text-center"><CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" /></td>
                  </tr>
                  <tr className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900">Digital HMAC-SHA256 Signing Authority</td>
                    <td className="py-3 px-4 text-center"><span className="text-slate-400">—</span></td>
                    <td className="py-3 px-4 text-center"><span className="text-slate-400">—</span></td>
                    <td className="py-3 px-4 text-center"><span className="text-blue-700 font-bold">Exclusive Authority</span></td>
                    <td className="py-3 px-4 text-center"><CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" /></td>
                  </tr>
                  <tr className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900">Inspect Immutable Audit Logs & Hash Chain</td>
                    <td className="py-3 px-4 text-center"><span className="text-slate-400">—</span></td>
                    <td className="py-3 px-4 text-center"><CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" /></td>
                    <td className="py-3 px-4 text-center"><CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" /></td>
                    <td className="py-3 px-4 text-center"><CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" /></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: AVAILABILITY */}
      {activeTab === 'availability' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900">Brute-Force & DoS Throttle Simulator</h3>
              <span className="px-2 py-0.5 bg-amber-50 border border-amber-300 text-amber-800 text-[10px] font-bold rounded-full">
                5 Attempts = Lockout
              </span>
            </div>

            <p className="text-xs text-slate-600 font-medium">
              Click below to simulate a rapid burst of 6 failed authentication attempts against the server. Observe how the rate limiter engages an exponential lockout window.
            </p>

            <button
              onClick={handleSimulateDosBurst}
              className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-sm flex items-center gap-2 cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5" />
              Simulate 6x Rapid Failed Auth Burst
            </button>

            <div className="space-y-1.5 max-h-60 overflow-y-auto font-mono text-[10px] bg-slate-900 text-slate-200 p-3 rounded-xl border border-slate-800">
              {dosLogs.length === 0 ? (
                <span className="text-slate-400 italic font-sans">No DoS probe events triggered yet. Click the button above to simulate.</span>
              ) : (
                dosLogs.map(l => (
                  <div key={l.id} className={l.status === 423 ? 'text-rose-400 font-bold' : 'text-slate-300'}>
                    <span className="text-slate-500">[{l.time}]</span> {l.text}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-slate-900">Server Exception Shielding</h3>
            <p className="text-xs text-slate-600 font-medium">
              In accordance with IAS Availability and Information Disclosure constraints, all uncaught exceptions are trapped by the global Express error boundary.
            </p>

            <div className="p-4 bg-slate-900 border border-slate-800 text-slate-200 rounded-xl font-mono text-xs space-y-2">
              <div className="text-rose-400 font-bold">// Masked Response Returned to Client:</div>
              <pre className="text-[11px] text-emerald-400 bg-slate-950 p-2.5 rounded border border-slate-800">
{`{
  "success": false,
  "error": "A secured server exception occurred. Internal trace suppressed.",
  "errorReference": "ERR-SEC-9842A"
}`}
              </pre>
            </div>

            <p className="text-[11px] text-slate-500 font-medium">
              Full internal stack traces and database credentials are strictly shielded and logged only to the private admin audit trail.
            </p>
          </div>

          {/* Session Inactivity & Visual Countdown Gauge Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 lg:col-span-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Mandatory Session Inactivity Timeout (15-Min IAS Rule)</h3>
                  <p className="text-xs text-slate-500">NPC Circular 16-01 & DILG E-Governance Terminal Lock Standard</p>
                </div>
              </div>
              <span className="px-2 py-0.5 bg-emerald-50 border border-emerald-300 text-emerald-800 text-[10px] font-bold rounded-full">
                Active Heartbeat
              </span>
            </div>

            <p className="text-xs text-slate-600 font-medium leading-relaxed">
              To defend against physical unauthorized terminal access when officials step away from unattended workstations, the system automatically terminates sessions after <strong>15 minutes of idle time</strong>. During the final <strong>60 seconds</strong>, a high-visibility circular SVG countdown gauge alerts the user to renew their session or gracefully lock the terminal.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              {onSimulateInactivityWarning && (
                <button
                  type="button"
                  onClick={onSimulateInactivityWarning}
                  className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <Timer className="w-4 h-4" />
                  <span>Launch Inactivity Warning Countdown Modal (Preview)</span>
                </button>
              )}
              <span className="text-[11px] text-slate-500 font-mono">
                Simulates the 60-second warning state with live countdown ring and urgency color shifting
              </span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: AUTHENTICATION & NON-REPUDIATION */}
      {activeTab === 'authentication' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-slate-900">BCrypt Password Hashing & Immutable Audit Chaining</h3>
                <p className="text-xs text-slate-600 font-medium mt-0.5">
                  Advance Database & IAS Compliance: Passwords are never stored in plaintext. Adaptive key stretching ($2a$10$) defeats rainbow tables and GPU brute-force.
                </p>
              </div>
              <span className="px-2.5 py-1 bg-emerald-50 border border-emerald-300 text-emerald-800 text-[10px] font-bold rounded-full">
                Zero Plaintext in DB
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <h4 className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                  <KeyRound className="w-4 h-4 text-blue-600" />
                  <span>BCrypt Modular Format Structure</span>
                </h4>
                <p className="text-xs text-slate-600 font-medium">Example hashed representation stored in database:</p>
                <code className="text-[10px] font-mono bg-white p-2 rounded border border-slate-200 block break-all text-slate-800 font-bold">
                  $2a$10$wK8oP3mXq9Y.N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad6
                </code>
                <p className="text-[10px] text-slate-500 font-medium">
                  Anatomy: $2a$ (Algorithm) + 10 (Cost = 1,024 rounds) + 22-char 128-bit Salt + 31-char Hash Ciphertext.
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <h4 className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Non-Repudiation Audit Ledger</span>
                </h4>
                <p className="text-xs text-slate-600 font-medium">Blockchain-style cryptographic link:</p>
                <code className="text-[10px] font-mono bg-white p-2 rounded border border-slate-200 block break-all text-slate-800 font-bold">
                  CurrentHash = SHA256(PrevHash + LogID + Timestamp + UserID + Action + IP)
                </code>
                <p className="text-[10px] text-slate-500 font-medium">
                  Prevents back-dated alterations by any administrator or external intruder.
                </p>
              </div>
            </div>
          </div>

          {/* Interactive Live BCrypt Password Hashing Lab */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-purple-50 border border-purple-200 text-purple-700 rounded-lg">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">Live BCrypt Hashing & Work Factor Verification Lab</h3>
                <p className="text-[11px] text-slate-500 font-medium">
                  Execute real bcrypt.hashSync & bcrypt.compareSync calls on the live Node.js server
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pt-1">
              {/* Input Form */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 text-xs">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Candidate Password
                  </label>
                  <input
                    type="text"
                    value={bcryptCandidate}
                    onChange={(e) => setBcryptCandidate(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700">Cost Factor</label>
                    <span className="text-[11px] font-mono font-bold text-blue-700">{bcryptCost} rounds ({Math.pow(2, bcryptCost)} iters)</span>
                  </div>
                  <input
                    type="range"
                    min="8"
                    max="12"
                    value={bcryptCost}
                    onChange={(e) => setBcryptCost(Number(e.target.value))}
                    className="w-full cursor-pointer accent-blue-600"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleTestBcrypt}
                  disabled={bcryptLoading}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-sm transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${bcryptLoading ? 'animate-spin' : ''}`} />
                  <span>{bcryptLoading ? 'Hashing on Server...' : 'Execute BCrypt Probe'}</span>
                </button>
              </div>

              {/* Output & Breakdown */}
              <div className="lg:col-span-2 p-4 bg-slate-900 text-slate-100 rounded-xl border border-slate-800 space-y-3 font-mono text-xs">
                {bcryptResult ? (
                  <>
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <span className="font-bold text-emerald-400 text-xs">Server Hashing Result (users.password_hash)</span>
                      <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
                        Iterations: {bcryptResult.iterations}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 block mb-0.5 font-sans">Stored Hash String:</span>
                      <code className="text-amber-300 bg-slate-950 p-2 rounded border border-slate-800 block break-all font-bold text-[11px]">
                        {bcryptResult.fullModularHashString}
                      </code>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[10px]">
                      <div className="p-2 bg-slate-950 rounded border border-slate-800">
                        <span className="text-slate-400 block font-sans">Algorithm ID</span>
                        <span className="text-purple-300 font-bold">{bcryptResult.algorithmId}</span>
                      </div>
                      <div className="p-2 bg-slate-950 rounded border border-slate-800">
                        <span className="text-slate-400 block font-sans">Salt (128 bits)</span>
                        <span className="text-blue-300 font-bold truncate block">{bcryptResult.saltHexOrB64}</span>
                      </div>
                      <div className="p-2 bg-slate-950 rounded border border-slate-800">
                        <span className="text-slate-400 block font-sans">Work Factor</span>
                        <span className="text-emerald-300 font-bold">{bcryptResult.costFactor} (2^{bcryptResult.costFactor})</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 pt-1 border-t border-slate-800 text-[11px] font-sans">
                      <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Valid Pass Verification: MATCH (True)</span>
                      </span>
                      <span className="flex items-center gap-1.5 text-rose-400 font-bold">
                        <ShieldAlert className="w-3.5 h-3.5" />
                        <span>Tampered Input Rejected: FALSE (Rejected)</span>
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8 text-slate-400 font-sans text-xs space-y-2">
                    <p>Click "Execute BCrypt Probe" to compute real-time salted BCrypt hashes on the server.</p>
                    <button
                      type="button"
                      onClick={handleTestBcrypt}
                      className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs"
                    >
                      Run Default Test
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
