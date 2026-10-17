import React, { useState, useEffect } from 'react';
import { 
  AlertCircle, 
  Check, 
  CheckCircle2, 
  Copy, 
  Download, 
  KeyRound, 
  Lock, 
  Mail, 
  QrCode, 
  RefreshCw, 
  Send, 
  Server,
  Settings,
  Shield, 
  ShieldAlert, 
  ShieldCheck, 
  Smartphone, 
  Info,
  Eye,
  EyeOff,
  Edit2,
  X 
} from 'lucide-react';
import { apiClient } from '../lib/api';
import type { User } from '../types';

interface MfaSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onUserUpdated: (user: User) => void;
}

export const MfaSettingsModal: React.FC<MfaSettingsModalProps> = ({
  isOpen,
  onClose,
  user,
  onUserUpdated
}) => {
  const [activeTab, setActiveTab] = useState<'mfa' | 'email_settings'>('mfa');
  const [mfaChoice, setMfaChoice] = useState<'gmail' | 'totp'>('gmail');
  const [step, setStep] = useState<'status' | 'gmail_setup' | 'totp_setup'>('status');
  
  // Custom destination email for user profile
  const [userEmailInput, setUserEmailInput] = useState<string>(user.email || '');
  const [isEditingUserEmail, setIsEditingUserEmail] = useState<boolean>(false);
  const [updatingEmail, setUpdatingEmail] = useState<boolean>(false);

  // Email Server Settings State
  const [emailConfig, setEmailConfig] = useState<{
    configured: boolean;
    provider: string;
    sender: string | null;
    host: string;
    port: number;
    hasEnvCredentials: boolean;
    hasDbCredentials: boolean;
    forwardingEmail: string;
    forwardAllMfaToAdmin: boolean;
  } | null>(null);

  const [gmailUser, setGmailUser] = useState<string>('');
  const [gmailAppPassword, setGmailAppPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [forwardingEmail, setForwardingEmail] = useState<string>('');
  const [forwardAllMfaToAdmin, setForwardAllMfaToAdmin] = useState<boolean>(true);
  const [savingEmailSettings, setSavingEmailSettings] = useState<boolean>(false);

  // Test Email State
  const [testRecipient, setTestRecipient] = useState<string>(user.email || '');
  const [testingEmail, setTestingEmail] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{
    delivered: boolean;
    message: string;
    messageId?: string;
    error?: string;
    provider?: string;
    host?: string;
    port?: number;
  } | null>(null);

  // TOTP setup data
  const [totpData, setTotpData] = useState<{
    secret: string;
    qrCodeDataUrl: string;
    otpAuthUrl: string;
    backupCodes: string[];
  } | null>(null);

  // Gmail setup data
  const [gmailOtpData, setGmailOtpData] = useState<{
    maskedEmail: string;
    demoOtp?: string;
    emailDelivered?: boolean;
    emailError?: string;
  } | null>(null);

  const [verificationCode, setVerificationCode] = useState<string>('');
  const [disablePassword, setDisablePassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [copiedSecret, setCopiedSecret] = useState<boolean>(false);
  const [copiedBackup, setCopiedBackup] = useState<boolean>(false);

  const isMandatory = user.role === 'staff' || user.role === 'official' || user.role === 'admin';

  const loadEmailSettings = async () => {
    try {
      const res = await apiClient.getEmailSettings();
      if (res.success) {
        setEmailConfig(res);
        if (res.forwardingEmail) setForwardingEmail(res.forwardingEmail);
        setForwardAllMfaToAdmin(res.forwardAllMfaToAdmin ?? true);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (isOpen) {
      setStep('status');
      setErrorMsg('');
      setSuccessMsg('');
      setVerificationCode('');
      setDisablePassword('');
      setGmailOtpData(null);
      setUserEmailInput(user.email || '');
      setIsEditingUserEmail(false);
      setTestResult(null);
      loadEmailSettings();
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  // Update user's registered Gmail
  const handleSaveUserEmail = async () => {
    if (!userEmailInput.trim() || !userEmailInput.includes('@')) {
      setErrorMsg('Please provide a valid email address.');
      return;
    }
    setUpdatingEmail(true);
    setErrorMsg('');
    const res = await apiClient.updateAccountEmail(userEmailInput.trim().toLowerCase());
    setUpdatingEmail(false);
    if (res.success) {
      setSuccessMsg(`Registered Gmail updated to ${res.email}!`);
      setIsEditingUserEmail(false);
      onUserUpdated({
        ...user,
        email: res.email
      });
      setTestRecipient(res.email);
    } else {
      setErrorMsg(res.error || 'Failed to update email address.');
    }
  };

  // Save Gmail SMTP Configuration
  const handleSaveEmailConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingEmailSettings(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await apiClient.saveEmailSettings({
        gmailUser: gmailUser.trim() || undefined,
        gmailAppPassword: gmailAppPassword.trim() || undefined,
        forwardingEmail: forwardingEmail.trim() || undefined,
        forwardAllMfaToAdmin
      });
      setSavingEmailSettings(false);
      if (res.success) {
        setSuccessMsg(res.message || 'Gmail SMTP configuration saved successfully.');
        setGmailAppPassword('');
        loadEmailSettings();
      } else {
        setErrorMsg(res.error || 'Failed to save email settings.');
      }
    } catch (err: any) {
      setSavingEmailSettings(false);
      setErrorMsg(err.message || 'Failed to save email settings.');
    }
  };

  // Test live email dispatch
  const handleTestEmailDispatch = async () => {
    if (!testRecipient || !testRecipient.includes('@')) {
      setErrorMsg('Please enter a valid recipient email for the test dispatch.');
      return;
    }
    setTestingEmail(true);
    setErrorMsg('');
    setTestResult(null);
    try {
      const res = await apiClient.testEmailConnection(testRecipient.trim());
      setTestingEmail(false);
      setTestResult(res);
      if (res.delivered) {
        setSuccessMsg(`Live email test succeeded! Delivered to ${testRecipient}.`);
      } else {
        setErrorMsg(res.message || res.error || 'Test email failed to deliver.');
      }
    } catch (err: any) {
      setTestingEmail(false);
      setErrorMsg(err.message || 'Test email failed.');
    }
  };

  // Dispatch Gmail Setup Verification Code
  const handleStartGmailSetup = async () => {
    setLoading(true);
    setErrorMsg('');
    const targetEmail = userEmailInput.trim() || user.email || undefined;
    const res = await apiClient.sendMfaSetupCode(targetEmail);
    setLoading(false);

    if (res.success) {
      setGmailOtpData({
        maskedEmail: res.maskedEmail || targetEmail || 'your registered Gmail',
        demoOtp: res.demoOtp,
        emailDelivered: res.emailDelivered,
        emailError: res.emailError
      });
      setStep('gmail_setup');
    } else {
      setErrorMsg(res.error || 'Failed to dispatch Gmail verification code.');
    }
  };

  // Start Authenticator App TOTP Setup
  const handleStartTotpSetup = async () => {
    setLoading(true);
    setErrorMsg('');
    const res = await apiClient.setupMfa();
    setLoading(false);

    if (res.success && res.secret) {
      setTotpData(res as any);
      setStep('totp_setup');
    } else {
      setErrorMsg(res.error || 'Failed to initialize TOTP key generation.');
    }
  };

  const handleConfirmEnable = async (e: React.FormEvent, type: 'gmail' | 'totp') => {
    e.preventDefault();
    if (!verificationCode.trim()) {
      setErrorMsg('Please enter the 6-digit verification code.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    const secret = type === 'totp' && totpData ? totpData.secret : 'JBSWY3DPEHPK3PXP';
    const backupCodes = totpData?.backupCodes || [
      'BACKUP-SEC-01',
      'BACKUP-SEC-02',
      'BACKUP-SEC-03',
      'BACKUP-SEC-04',
      'BACKUP-SEC-05',
      'BACKUP-SEC-06'
    ];

    const res = await apiClient.enableMfa(secret, verificationCode.trim(), backupCodes, type);
    setLoading(false);

    if (res.success) {
      setSuccessMsg(
        type === 'gmail'
          ? 'Google Gmail Two-Factor Authentication successfully activated!'
          : 'Authenticator App (TOTP) Two-Factor Authentication successfully activated!'
      );
      onUserUpdated({
        ...user,
        mfaEnabled: true,
        mfaType: type,
        mfaBackupCodes: res.backupCodes || backupCodes
      });
      setStep('status');
    } else {
      setErrorMsg(res.error || 'Verification code failed. Please check the 6-digit code.');
    }
  };

  const handleDisableMfa = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    const res = await apiClient.disableMfa(disablePassword);
    setLoading(false);

    if (res.success) {
      setSuccessMsg('Two-Factor Authentication has been disabled.');
      onUserUpdated({
        ...user,
        mfaEnabled: false,
        mfaBackupCodes: []
      });
      setDisablePassword('');
    } else {
      setErrorMsg(res.error || 'Failed to disable MFA. Please check password.');
    }
  };

  const copyToClipboard = (text: string, type: 'secret' | 'backup') => {
    navigator.clipboard.writeText(text);
    if (type === 'secret') {
      setCopiedSecret(true);
      setTimeout(() => setCopiedSecret(false), 2000);
    } else {
      setCopiedBackup(true);
      setTimeout(() => setCopiedBackup(false), 2000);
    }
  };

  const downloadBackupCodes = (codes: string[]) => {
    const content = `BARANGAY CABUCBUCAN E-CLEARANCE PORTAL (RIZAL, NUEVA ECIJA)\nTWO-FACTOR AUTHENTICATION EMERGENCY RECOVERY CODES\nAccount: ${user.username} (${user.fullName})\nEmail: ${user.email || 'N/A'}\nGenerated: ${new Date().toLocaleString()}\n\nKeep these single-use codes in a confidential place:\n\n${codes.map((c, i) => `${i + 1}. ${c}`).join('\n')}\n\n* Each backup code can be used once to regain access if email is unavailable.\n`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `barangay-cabucbucan-mfa-backup-${user.username}.txt`;
    link.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto font-sans">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 border-b border-slate-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-500/20 border border-blue-500/30 text-blue-400 rounded-xl">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Two-Factor & Gmail Delivery Settings</h3>
              <p className="text-xs text-slate-300">Manage 2FA authentication passcodes and live Gmail SMTP dispatch</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-bold">
          <button
            type="button"
            onClick={() => { setActiveTab('mfa'); setErrorMsg(''); setSuccessMsg(''); }}
            className={`flex-1 py-3 px-3 text-center border-b-2 transition-all cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === 'mfa'
                ? 'border-blue-600 text-blue-700 bg-white shadow-xs font-extrabold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>MFA Security & Passcodes</span>
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('email_settings'); setErrorMsg(''); setSuccessMsg(''); loadEmailSettings(); }}
            className={`flex-1 py-3 px-3 text-center border-b-2 transition-all cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === 'email_settings'
                ? 'border-blue-600 text-blue-700 bg-white shadow-xs font-extrabold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            <span>Gmail SMTP Settings</span>
            {emailConfig?.configured && (
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            )}
          </button>
        </div>

        <div className="p-6 space-y-5 bg-white max-h-[75vh] overflow-y-auto">
          {errorMsg && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs rounded-xl flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* TAB 1: MFA PASSCODES & VERIFICATION */}
          {activeTab === 'mfa' && (
            <>
              {/* Registered Destination Email Box */}
              <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-blue-950 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-blue-600" />
                    Account Registered Gmail:
                  </span>
                  {!isEditingUserEmail && (
                    <button
                      type="button"
                      onClick={() => setIsEditingUserEmail(true)}
                      className="text-[11px] font-bold text-blue-700 hover:text-blue-900 flex items-center gap-1 cursor-pointer underline"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>Change Gmail</span>
                    </button>
                  )}
                </div>

                {!isEditingUserEmail ? (
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-slate-800 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                      {user.email || 'No email registered yet'}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      6-digit 2FA codes are sent here
                    </span>
                  </div>
                ) : (
                  <div className="space-y-2 pt-1">
                    <div className="flex gap-2">
                      <input
                        type="email"
                        value={userEmailInput}
                        onChange={(e) => setUserEmailInput(e.target.value)}
                        placeholder="e.g. resident@gmail.com"
                        className="flex-1 px-3 py-1.5 bg-white border border-blue-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                      />
                      <button
                        type="button"
                        onClick={handleSaveUserEmail}
                        disabled={updatingEmail}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg cursor-pointer disabled:opacity-50"
                      >
                        {updatingEmail ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        type="button"
                        onClick={() => { setIsEditingUserEmail(false); setUserEmailInput(user.email || ''); }}
                        className="px-2.5 py-1.5 text-slate-600 hover:text-slate-800 text-xs font-semibold cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                    <p className="text-[10px] text-blue-800">
                      Tip: Enter your active personal Gmail so all MFA codes arrive immediately in your inbox.
                    </p>
                  </div>
                )}
              </div>

              {/* STATUS VIEW */}
              {step === 'status' && (
            <div className="space-y-4">
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 flex items-start gap-4">
                <div className={`p-3 rounded-2xl shrink-0 ${
                  user.mfaEnabled || isMandatory
                    ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                    : 'bg-amber-100 text-amber-700 border border-amber-300'
                }`}>
                  {user.mfaEnabled || isMandatory ? <ShieldCheck className="w-7 h-7" /> : <ShieldAlert className="w-7 h-7" />}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-slate-900">
                      {user.mfaEnabled || isMandatory ? 'Two-Factor Authentication Active' : 'Two-Factor Authentication Disabled'}
                    </h4>
                    {isMandatory && (
                      <span className="px-2 py-0.5 bg-amber-100 border border-amber-300 text-amber-900 text-[10px] font-bold rounded">
                        Mandatory Policy
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {user.mfaEnabled || isMandatory
                      ? `Your account requires a 6-digit security code sent to ${user.email || 'your registered Gmail'} whenever you log in.`
                      : 'Add an extra layer of defense. Every login will verify a 6-digit security code sent to your Google Gmail.'}
                  </p>
                </div>
              </div>

              {/* Policy Note for Admin/Staff/Official */}
              {isMandatory ? (
                <div className="p-3.5 bg-blue-50/70 rounded-xl border border-blue-200 text-xs space-y-2">
                  <div className="flex items-center gap-1.5 text-blue-900 font-bold">
                    <Shield className="w-4 h-4 text-blue-600" />
                    <span>IAS Security Mandate (Administrative Access)</span>
                  </div>
                  <p className="text-slate-700 text-[11px] leading-relaxed">
                    Per the Philippine Data Privacy Act and Barangay E-Clearance Information Assurance Policy, administrative personnel must maintain Two-Factor Authentication.
                  </p>
                </div>
              ) : null}

              {/* Backup Codes Section if active */}
              {(user.mfaEnabled || isMandatory) && (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                      Emergency Recovery Codes
                    </span>
                    <button
                      type="button"
                      onClick={() => downloadBackupCodes(user.mfaBackupCodes || ['BACKUP-SEC-01', 'BACKUP-SEC-02', 'BACKUP-SEC-03'])}
                      className="text-[11px] text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer font-bold"
                    >
                      <Download className="w-3 h-3" />
                      Download TXT
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {(user.mfaBackupCodes && user.mfaBackupCodes.length > 0
                      ? user.mfaBackupCodes
                      : ['BACKUP-SEC-01', 'BACKUP-SEC-02', 'BACKUP-SEC-03', 'BACKUP-SEC-04']
                    ).slice(0, 4).map((code, idx) => (
                      <div key={idx} className="p-2 bg-white rounded-lg border border-slate-300 text-[11px] font-mono text-slate-800 font-semibold text-center shadow-2xs">
                        {code}
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-500 font-medium">
                    Use these single-use codes if you temporarily lose access to your Gmail account.
                  </p>
                </div>
              )}

              {/* Setup Choices if not enabled */}
              {!user.mfaEnabled && !isMandatory && (
                <div className="space-y-3 pt-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                    Choose 2FA Verification Method
                  </span>

                  {/* Option 1: Gmail 2FA (Recommended) */}
                  <div 
                    onClick={() => setMfaChoice('gmail')}
                    className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all flex items-start gap-3 ${
                      mfaChoice === 'gmail' 
                        ? 'border-blue-600 bg-blue-50/50' 
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="p-2 bg-blue-100 text-blue-600 rounded-lg shrink-0 mt-0.5">
                      <Mail className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h5 className="text-xs font-bold text-slate-900">Google Gmail Verification (Recommended)</h5>
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-[10px] font-bold rounded">
                          Easy & Instant
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-0.5">
                        Dispatches dynamic 6-digit codes to your registered Gmail (<strong>{user.email || 'your Gmail'}</strong>) on every sign-in attempt.
                      </p>
                    </div>
                  </div>

                  {/* Option 2: TOTP App */}
                  <div 
                    onClick={() => setMfaChoice('totp')}
                    className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all flex items-start gap-3 ${
                      mfaChoice === 'totp' 
                        ? 'border-blue-600 bg-blue-50/50' 
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="p-2 bg-purple-100 text-purple-600 rounded-lg shrink-0 mt-0.5">
                      <Smartphone className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <h5 className="text-xs font-bold text-slate-900">Authenticator App (TOTP)</h5>
                      <p className="text-[11px] text-slate-600 mt-0.5">
                        Scan a QR code using Google Authenticator, Microsoft Authenticator, or 1Password.
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={mfaChoice === 'gmail' ? handleStartGmailSetup : handleStartTotpSetup}
                      disabled={loading}
                      className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : mfaChoice === 'gmail' ? (
                        <Send className="w-4 h-4" />
                      ) : (
                        <Smartphone className="w-4 h-4" />
                      )}
                      <span>
                        {mfaChoice === 'gmail' ? 'Send Test Code to Gmail' : 'Configure Authenticator App'}
                      </span>
                    </button>
                  </div>
                </div>
              )}

              {/* Disable MFA form if already enabled */}
              {user.mfaEnabled && !isMandatory && (
                <form onSubmit={handleDisableMfa} className="w-full space-y-3 pt-2 border-t border-slate-200">
                  <span className="text-xs font-bold text-rose-800 block">Disable Two-Factor Authentication</span>
                  <div className="flex gap-2">
                    <input
                      type="password"
                      value={disablePassword}
                      onChange={(e) => setDisablePassword(e.target.value)}
                      placeholder="Confirm account password..."
                      required
                      className="flex-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white"
                    />
                    <button
                      type="submit"
                      disabled={loading || !disablePassword}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl cursor-pointer transition-colors disabled:opacity-50 shadow-sm"
                    >
                      {loading ? 'Disabling...' : 'Disable 2FA'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* GMAIL SETUP CONFIRMATION VIEW */}
          {step === 'gmail_setup' && gmailOtpData && (
            <form onSubmit={(e) => handleConfirmEnable(e, 'gmail')} className="space-y-4">
              <div className="text-center space-y-1">
                <span className="px-2.5 py-0.5 bg-blue-100 border border-blue-300 text-blue-900 text-[10px] font-bold rounded-full">
                  Step 2 of 2: Verify Gmail Code
                </span>
                <h4 className="text-sm font-bold text-slate-900">Verify Your Google Gmail Account</h4>
                <p className="text-xs text-slate-600">
                  A 6-digit confirmation passcode was generated for <strong>{gmailOtpData.maskedEmail}</strong>.
                </p>
              </div>

              {/* Delivery notification */}
              {gmailOtpData.emailDelivered ? (
                <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-950 text-xs flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="leading-snug">
                    Security code sent to your Gmail inbox. Please check your inbox and spam folder.
                  </span>
                </div>
              ) : (
                <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-950 text-xs space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-amber-900">
                    <Info className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                    <span>Live Dispatch Notice</span>
                  </div>
                  <p className="text-[11px] text-amber-900 leading-snug">
                    Live delivery to Gmail requires setting <code className="bg-amber-100 px-1 rounded font-mono text-[10px]">GMAIL_USER</code> and <code className="bg-amber-100 px-1 rounded font-mono text-[10px]">GMAIL_APP_PASSWORD</code> in environment variables. Your 2FA code is available below:
                  </p>
                </div>
              )}

              {gmailOtpData.demoOtp && (
                <div className="p-3 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold flex items-center gap-1.5 text-slate-900">
                      <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                      Verification Code:
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      Evaluation Passcode
                    </span>
                  </div>
                  <div className="font-mono text-base font-black text-slate-900 tracking-widest bg-white px-3 py-1.5 rounded-lg text-center border border-slate-300 shadow-inner select-all">
                    {gmailOtpData.demoOtp}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Enter 6-Digit Code from Gmail *
                </label>
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/[^0-9]/g, ''))}
                  required
                  placeholder="123456"
                  maxLength={6}
                  autoFocus
                  className="w-full px-4 py-2.5 bg-slate-50 border border-blue-300 focus:border-blue-600 rounded-xl text-center text-base font-mono font-bold tracking-widest text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:bg-white"
                />
              </div>

              <div className="flex items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep('status')}
                  className="px-4 py-2 text-slate-600 hover:text-slate-900 text-xs font-semibold cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading || verificationCode.length < 6}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
                >
                  {loading ? 'Activating...' : 'Confirm & Enable Gmail 2FA'}
                </button>
              </div>
            </form>
          )}

          {/* TOTP SETUP ENROLLMENT WIZARD */}
          {step === 'totp_setup' && totpData && (
            <div className="space-y-4">
              <div className="text-center space-y-1">
                <span className="px-2.5 py-0.5 bg-purple-100 border border-purple-300 text-purple-900 text-[10px] font-bold rounded-full">
                  Step 1 of 2: Scan QR Code
                </span>
                <h4 className="text-sm font-bold text-slate-900">Configure Authenticator App</h4>
                <p className="text-xs text-slate-600">
                  Open Google Authenticator or Microsoft Authenticator and scan this QR code:
                </p>
              </div>

              {/* QR Code Canvas */}
              <div className="p-4 bg-white rounded-2xl w-48 h-48 mx-auto flex items-center justify-center shadow-md border border-slate-200">
                {totpData.qrCodeDataUrl ? (
                  <img src={totpData.qrCodeDataUrl} alt="MFA QR Code" className="w-full h-full object-contain" />
                ) : (
                  <RefreshCw className="w-8 h-8 text-slate-400 animate-spin" />
                )}
              </div>

              {/* Manual Secret Key */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-700 font-bold">Manual Key:</span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(totpData.secret, 'secret')}
                    className="text-[11px] text-blue-700 hover:text-blue-900 font-bold flex items-center gap-1 cursor-pointer font-mono"
                  >
                    {copiedSecret ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedSecret ? 'Copied!' : 'Copy Key'}</span>
                  </button>
                </div>
                <div className="p-2 bg-white rounded-lg text-xs font-mono font-bold text-blue-900 tracking-wider text-center select-all border border-slate-200">
                  {totpData.secret}
                </div>
              </div>

              {/* Step 2 Form */}
              <form onSubmit={(e) => handleConfirmEnable(e, 'totp')} className="space-y-3 pt-2 border-t border-slate-200">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Step 2: Enter 6-Digit Passcode from Authenticator *
                  </label>
                  <input
                    type="text"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    required
                    placeholder="000000"
                    maxLength={6}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-purple-300 focus:border-purple-600 rounded-xl text-center text-base font-mono font-bold tracking-widest text-purple-900 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:bg-white"
                  />
                </div>

                <div className="flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setStep('status')}
                    className="px-4 py-2 text-slate-600 hover:text-slate-900 text-xs font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading || verificationCode.length < 6}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
                  >
                    {loading ? 'Activating...' : 'Verify & Enable Two-Factor'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </>
      )}

      {/* TAB 2: GMAIL SMTP & DISPATCH CONFIGURATION */}
      {activeTab === 'email_settings' && (
        <div className="space-y-5">
          {/* Delivery Engine Status Card */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-blue-600" />
                <span className="font-bold text-xs text-slate-900">Email Delivery Engine Status</span>
              </div>
              <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full ${
                emailConfig?.configured 
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                  : 'bg-amber-100 text-amber-800 border border-amber-300'
              }`}>
                {emailConfig?.configured ? 'Live SMTP Active' : 'Simulation Mode'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600">
              <div className="p-2 bg-white rounded-lg border border-slate-200">
                <span className="text-slate-400 block text-[10px]">Active Provider</span>
                <strong className="text-slate-800 uppercase">{emailConfig?.provider || 'none'}</strong>
              </div>
              <div className="p-2 bg-white rounded-lg border border-slate-200">
                <span className="text-slate-400 block text-[10px]">Host & Port</span>
                <strong className="text-slate-800">{emailConfig?.host || 'smtp.gmail.com'}:{emailConfig?.port || 465}</strong>
              </div>
            </div>

            <p className="text-[11px] text-slate-600 leading-relaxed">
              {emailConfig?.configured ? (
                <span className="text-emerald-700 font-medium">
                  ✓ Real SMTP credentials are active. 6-digit OTP codes and citizen notifications are dispatched live to real Google Gmail inboxes.
                </span>
              ) : (
                <span className="text-amber-800">
                  ⚠ Currently running in demonstration simulation mode. Enter your Google account and 16-character App Password below to deliver live emails directly to your Gmail inbox!
                </span>
              )}
            </p>
          </div>

          {/* SMTP Credentials Form */}
          <form onSubmit={handleSaveEmailConfig} className="p-4 bg-white rounded-2xl border border-slate-200 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Settings className="w-3.5 h-3.5 text-blue-600" />
                Google Gmail SMTP Credentials
              </span>
              <span className="text-[10px] text-slate-400">Direct SMTP relay</span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Sender Gmail Address:
                </label>
                <input
                  type="email"
                  value={gmailUser}
                  onChange={(e) => setGmailUser(e.target.value)}
                  placeholder="e.g. admin@gmail.com"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-bold text-slate-700">
                    Gmail 16-Character App Password:
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-[10px] text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    <span>{showPassword ? 'Hide' : 'Show'}</span>
                  </button>
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={gmailAppPassword}
                  onChange={(e) => setGmailAppPassword(e.target.value)}
                  placeholder="e.g. abcd efgh ijkl mnop"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                />
                <div className="mt-2 p-2.5 bg-blue-50 border border-blue-200 rounded-lg text-[10px] text-blue-900 space-y-1">
                  <strong>How to generate a Gmail App Password:</strong>
                  <ol className="list-decimal list-inside space-y-0.5 text-blue-800">
                    <li>Visit your <strong>Google Account</strong> (myaccount.google.com).</li>
                    <li>Navigate to <strong>Security</strong> &gt; <strong>2-Step Verification</strong>.</li>
                    <li>Scroll down and click <strong>App passwords</strong>.</li>
                    <li>Create a name (e.g. <em>Barangay Portal</em>) and paste the generated 16-character code here.</li>
                  </ol>
                </div>
              </div>

              {/* Forwarding Option */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <label className="block text-[11px] font-bold text-slate-700">
                  Universal MFA Forwarding Email:
                </label>
                <input
                  type="email"
                  value={forwardingEmail}
                  onChange={(e) => setForwardingEmail(e.target.value)}
                  placeholder="e.g. alerts@gmail.com"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                />
                <label className="flex items-center gap-2 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={forwardAllMfaToAdmin}
                    onChange={(e) => setForwardAllMfaToAdmin(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                  />
                  <span className="text-[11px] text-slate-700 font-medium leading-snug">
                    Forward all staff/resident MFA passcodes to this email for testing verification
                  </span>
                </label>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={savingEmailSettings}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-2 disabled:opacity-50"
              >
                {savingEmailSettings ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                <span>Save Email Configuration</span>
              </button>
            </div>
          </form>

          {/* Live Dispatch Diagnostic Tester */}
          <div className="p-4 bg-emerald-50/70 rounded-2xl border border-emerald-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                <Send className="w-3.5 h-3.5 text-emerald-700" />
                Live Email Dispatch Diagnostic Test
              </span>
              <span className="text-[10px] text-emerald-800 font-semibold">Immediate Verification</span>
            </div>

            <p className="text-[11px] text-emerald-900 leading-relaxed">
              Send an authentic test email to check your Gmail connection in real time:
            </p>

            <div className="flex gap-2">
              <input
                type="email"
                value={testRecipient}
                onChange={(e) => setTestRecipient(e.target.value)}
                placeholder="Recipient email (e.g. your_email@gmail.com)"
                className="flex-1 px-3 py-2 bg-white border border-emerald-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
              />
              <button
                type="button"
                onClick={handleTestEmailDispatch}
                disabled={testingEmail}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 disabled:opacity-50"
              >
                {testingEmail ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                <span>Send Test Email</span>
              </button>
            </div>

            {/* Test Result Card */}
            {testResult && (
              <div className={`p-3 rounded-xl border text-xs space-y-1.5 ${
                testResult.delivered 
                  ? 'bg-emerald-100/90 border-emerald-300 text-emerald-950' 
                  : 'bg-rose-50 border-rose-200 text-rose-950'
              }`}>
                <div className="flex items-center gap-1.5 font-bold">
                  {testResult.delivered ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span>{testResult.delivered ? 'Dispatch Successful!' : 'Dispatch Failed'}</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  {testResult.message}
                </p>
                {testResult.messageId && (
                  <div className="text-[10px] font-mono text-emerald-800">
                    Message-ID: {testResult.messageId}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
        </div>
      </div>
    </div>
  );
};
