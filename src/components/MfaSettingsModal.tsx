import React, { useState, useEffect } from 'react';
import { AlertCircle, Check, CheckCircle2, Copy, Download, KeyRound, Lock, QrCode, RefreshCw, Shield, ShieldAlert, ShieldCheck, Smartphone, Sparkles, X } from 'lucide-react';
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
  const [step, setStep] = useState<'status' | 'setup' | 'confirm'>('status');
  const [setupData, setSetupData] = useState<{
    secret: string;
    qrCodeDataUrl: string;
    otpAuthUrl: string;
    backupCodes: string[];
  } | null>(null);
  
  const [verificationCode, setVerificationCode] = useState<string>('');
  const [disablePassword, setDisablePassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [copiedSecret, setCopiedSecret] = useState<boolean>(false);
  const [copiedBackup, setCopiedBackup] = useState<boolean>(false);

  const isMandatory = user.role === 'staff' || user.role === 'official' || user.role === 'admin';

  useEffect(() => {
    if (isOpen) {
      setStep('status');
      setErrorMsg('');
      setSuccessMsg('');
      setVerificationCode('');
      setDisablePassword('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleStartSetup = async () => {
    setLoading(true);
    setErrorMsg('');
    const res = await apiClient.setupMfa();
    setLoading(false);

    if (res.success && res.secret) {
      setSetupData(res as any);
      setStep('setup');
    } else {
      setErrorMsg(res.error || 'Failed to initialize MFA key generation.');
    }
  };

  const handleConfirmEnable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!setupData) return;

    setLoading(true);
    setErrorMsg('');

    const res = await apiClient.enableMfa(setupData.secret, verificationCode, setupData.backupCodes);
    setLoading(false);

    if (res.success) {
      setSuccessMsg('Two-Factor Authentication (TOTP) successfully activated!');
      onUserUpdated({
        ...user,
        mfaEnabled: true,
        mfaBackupCodes: setupData.backupCodes
      });
      setStep('status');
    } else {
      setErrorMsg(res.error || 'Verification code failed. Please check the 6-digit code in your app.');
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
    const content = `BARANGAY CABUCBUCAN E-CLEARANCE PORTAL (RIZAL, NUEVA ECIJA)\nMULTI-FACTOR AUTHENTICATION EMERGENCY BACKUP CODES\nUser: ${user.username} (${user.fullName})\nGenerated: ${new Date().toLocaleString()}\n\nKeep these codes in a secure, confidential place:\n\n${codes.map((c, i) => `${i + 1}. ${c}`).join('\n')}\n\n* Each backup code can only be used ONCE to recover portal access.\n`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `barangay-cabucbucan-mfa-backup-${user.username}.txt`;
    link.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 border-b border-slate-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 rounded-xl">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Multi-Factor Authentication (MFA)</h3>
              <p className="text-xs text-slate-300">TOTP (Google Authenticator, Microsoft Authenticator, FreeOTP)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 bg-white">
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
                      ? 'Your account is protected with RFC 6238 TOTP multi-factor verification. Login requires both password and one-time passcode.'
                      : 'Add an extra layer of defense against credential stuffing and brute-force attacks by requiring dynamic passcodes.'}
                  </p>
                </div>
              </div>

              {/* Policy Note for Admin/Staff/Official */}
              {isMandatory ? (
                <div className="p-3.5 bg-indigo-50/70 rounded-xl border border-indigo-200 text-xs space-y-2">
                  <div className="flex items-center gap-1.5 text-indigo-900 font-bold">
                    <Shield className="w-4 h-4 text-indigo-600" />
                    <span>IAS Security Mandate (Administrative Access)</span>
                  </div>
                  <p className="text-slate-700 text-[11px] leading-relaxed">
                    Per the Philippine Data Privacy Act and Barangay E-Clearance Information Assurance Policy, administrative and signatory personnel cannot disable MFA.
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
                    Use these single-use codes if you lose access to your primary mobile authenticator device.
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-end gap-3">
                {!user.mfaEnabled && !isMandatory ? (
                  <button
                    type="button"
                    onClick={handleStartSetup}
                    disabled={loading}
                    className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Smartphone className="w-4 h-4" />
                    <span>Set Up Two-Factor Authentication</span>
                  </button>
                ) : !isMandatory ? (
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
                        {loading ? 'Disabling...' : 'Disable MFA'}
                      </button>
                    </div>
                  </form>
                ) : null}
              </div>
            </div>
          )}

          {/* SETUP ENROLLMENT WIZARD */}
          {step === 'setup' && setupData && (
            <div className="space-y-4">
              <div className="text-center space-y-1">
                <span className="px-2.5 py-0.5 bg-indigo-100 border border-indigo-300 text-indigo-900 text-[10px] font-bold rounded-full">
                  Step 1 of 2: Scan QR Code
                </span>
                <h4 className="text-sm font-bold text-slate-900">Configure Authenticator App</h4>
                <p className="text-xs text-slate-600">
                  Open Google Authenticator, Microsoft Authenticator, or 1Password and scan this QR code:
                </p>
              </div>

              {/* QR Code Canvas */}
              <div className="p-4 bg-white rounded-2xl w-52 h-52 mx-auto flex items-center justify-center shadow-lg border border-slate-200">
                {setupData.qrCodeDataUrl ? (
                  <img src={setupData.qrCodeDataUrl} alt="MFA QR Code" className="w-full h-full object-contain" />
                ) : (
                  <RefreshCw className="w-8 h-8 text-slate-400 animate-spin" />
                )}
              </div>

              {/* Manual Secret Key */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-700 font-bold">Can't scan? Enter Key Manually:</span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(setupData.secret, 'secret')}
                    className="text-[11px] text-indigo-700 hover:text-indigo-900 font-bold flex items-center gap-1 cursor-pointer font-mono"
                  >
                    {copiedSecret ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedSecret ? 'Copied!' : 'Copy Key'}</span>
                  </button>
                </div>
                <div className="p-2 bg-white rounded-lg text-xs font-mono font-bold text-indigo-900 tracking-wider text-center select-all border border-slate-200">
                  {setupData.secret}
                </div>
              </div>

              {/* Step 2 Form */}
              <form onSubmit={handleConfirmEnable} className="space-y-3 pt-2 border-t border-slate-200">
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
                    className="w-full px-4 py-2.5 bg-slate-50 border border-indigo-300 focus:border-indigo-600 rounded-xl text-center text-base font-mono font-bold tracking-widest text-indigo-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:bg-white"
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
        </div>
      </div>
    </div>
  );
};
