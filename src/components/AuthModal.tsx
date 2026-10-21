import React, { useState } from 'react';
import { 
  AlertCircle, Check, CheckCircle2, ChevronDown, ChevronUp, Edit2, Eye, EyeOff, 
  HelpCircle, IdCard, Info, KeyRound, Lock, Mail, RefreshCw, Send, Shield, ShieldAlert, 
  ShieldCheck, Smartphone, User, UserCheck, UserPlus, Users, X 
} from 'lucide-react';
import { apiClient } from '../lib/api';
import type { ResidentProfile, User as UserType } from '../types';
import { PasswordStrengthMeter } from './PasswordStrengthMeter';
import { generateSampleIdDataUrl } from '../lib/sampleIds';
import { verifyFirebasePassword } from '../lib/firebase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: UserType, profile?: ResidentProfile) => void;
}

const GOVERNMENT_ID_OPTIONS = [
  'Philippine National ID (PhilSys)',
  "Driver's License (LTO)",
  "Voter's ID / COMELEC Certificate",
  'SSS / UMID Card',
  'Philippine Passport',
  'Barangay Resident ID',
  'Postal ID (PhilPost)',
  'PRC Professional License',
  'Senior Citizen ID',
  'Person with Disability (PWD) ID',
  'Student / School ID',
  'PhilHealth / Pag-IBIG ID',
  'Other Government-Issued ID'
];

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onAuthSuccess }) => {
  const [isRegister, setIsRegister] = useState<boolean>(false);
  
  // Login credentials (clean and blank by default for authentic user sign in)
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  
  // MFA Challenge State
  const [mfaChallengeActive, setMfaChallengeActive] = useState<boolean>(false);
  const [mfaCode, setMfaCode] = useState<string>('');
  const [mfaTargetUser, setMfaTargetUser] = useState<{
    id: string;
    username: string;
    role: string;
    fullName: string;
    email?: string;
    maskedEmail?: string;
    emailDelivered?: boolean;
    emailError?: string;
    demoOtp?: string;
  } | null>(null);
  const [useBackupCode, setUseBackupCode] = useState<boolean>(false);
  const [customDestinationEmail, setCustomDestinationEmail] = useState<string>('');
  const [isEditingDestinationEmail, setIsEditingDestinationEmail] = useState<boolean>(false);
  const [resendingEmail, setResendingEmail] = useState<boolean>(false);
  const [resendStatusMsg, setResendStatusMsg] = useState<string>('');

  // Registration fields (completely blank for genuine resident onboarding)
  const [regFirstName, setRegFirstName] = useState<string>('');
  const [regMiddleName, setRegMiddleName] = useState<string>('');
  const [regLastName, setRegLastName] = useState<string>('');
  const [regSuffix, setRegSuffix] = useState<string>('');
  const [regEmail, setRegEmail] = useState<string>('');
  const [regUsername, setRegUsername] = useState<string>('');
  const [regPassword, setRegPassword] = useState<string>('');
  const [regConfirmPassword, setRegConfirmPassword] = useState<string>('');
  const [showRegPassword, setShowRegPassword] = useState<boolean>(false);
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState<boolean>(false);
  
  const [regBirthDate, setRegBirthDate] = useState<string>('');
  const [regStreetAddress, setRegStreetAddress] = useState<string>('');
  const [regPurokZone, setRegPurokZone] = useState<string>('');
  const [regContactNumber, setRegContactNumber] = useState<string>('');
  const [regIdType, setRegIdType] = useState<string>('Philippine National ID (PhilSys)');
  const [regIdNumber, setRegIdNumber] = useState<string>('');
  const [regCivilStatus, setRegCivilStatus] = useState<string>('Single');
  const [regGender, setRegGender] = useState<string>('Male');
  
  // Name validation warning flags
  const [nameHadNumberWarning, setNameHadNumberWarning] = useState<boolean>(false);
  
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  if (!isOpen) return null;

  // Helper to filter out numbers from names immediately
  const handleNameInput = (value: string, setter: (val: string) => void) => {
    if (/[0-9]/.test(value)) {
      setNameHadNumberWarning(true);
      setTimeout(() => setNameHadNumberWarning(false), 3500);
    }
    // Strictly strip all numbers (0-9)
    const sanitized = value.replace(/[0-9]/g, '');
    setter(sanitized);
  };

  const handleResetChallenge = () => {
    setMfaChallengeActive(false);
    setMfaCode('');
    setMfaTargetUser(null);
    setErrorMsg('');
    setResendStatusMsg('');
    setIsEditingDestinationEmail(false);
  };

  const handleResendMfaEmail = async (overrideEmail?: string) => {
    if (!mfaTargetUser) return;
    setResendingEmail(true);
    setResendStatusMsg('');
    setErrorMsg('');
    const target = (typeof overrideEmail === 'string' && overrideEmail.includes('@'))
      ? overrideEmail.trim()
      : (customDestinationEmail.trim() ? customDestinationEmail.trim() : undefined);
    
    try {
      const res = await apiClient.resendMfaOtp({
        userId: mfaTargetUser.id,
        username: mfaTargetUser.username,
        destinationEmail: target
      });
      setResendingEmail(false);
      if (res.success) {
        setResendStatusMsg(
          res.emailDelivered
            ? `New 6-digit code delivered to ${res.email || target || 'your Gmail'}!`
            : `Code generated for ${res.email || target || 'your Gmail'}. (Delivery: ${res.emailError || 'Simulated'})`
        );
        setMfaTargetUser(prev => prev ? ({
          ...prev,
          email: res.email || prev.email,
          maskedEmail: res.maskedEmail || prev.maskedEmail,
          emailDelivered: res.emailDelivered,
          demoOtp: res.demoOtp || prev.demoOtp
        }) : null);
        if (target) {
          setIsEditingDestinationEmail(false);
        }
      } else {
        setErrorMsg(res.error || 'Failed to resend verification code.');
      }
    } catch (e: any) {
      setResendingEmail(false);
      setErrorMsg(e.message || 'Failed to dispatch verification code.');
    }
  };

  const handleToggleTab = (toRegister: boolean) => {
    setIsRegister(toRegister);
    setErrorMsg('');
    setNameHadNumberWarning(false);
    setMfaChallengeActive(false);
  };

  // Password Security Checks
  const isPasswordLongEnough = regPassword.length >= 8;
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(regPassword);
  const passwordsMatch = regPassword.length > 0 && regPassword === regConfirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (isRegister) {
      // Client-side validations
      if (!regFirstName.trim() || !regLastName.trim()) {
        setErrorMsg('Please enter your First Name and Last Name.');
        return;
      }

      if (/[0-9]/.test(regFirstName) || /[0-9]/.test(regLastName) || (regMiddleName && /[0-9]/.test(regMiddleName))) {
        setErrorMsg('Numbers are strictly not permitted in first, middle, or last name fields.');
        return;
      }

      if (!regPurokZone) {
        setErrorMsg('Please select your Purok / Zone in Barangay Cabucbucan.');
        return;
      }

      const cleanContact = regContactNumber.replace(/[^0-9]/g, '');
      if (/[^0-9]/.test(regContactNumber.trim()) || cleanContact.length !== 11) {
        setErrorMsg('Mobile contact number must be exactly 11 numeric digits (e.g. 09171234567) with no special characters, dashes, or spaces.');
        return;
      }

      if (!regIdNumber.trim()) {
        setErrorMsg(`Please enter your valid ${regIdType} number.`);
        return;
      }

      if (regPassword.length < 8) {
        setErrorMsg('Password must be at least 8 characters long.');
        return;
      }

      if (!hasSpecialChar) {
        setErrorMsg('Password must contain at least one special character (e.g. ! @ # $ % ^ & *).');
        return;
      }

      if (regPassword !== regConfirmPassword) {
        setErrorMsg('Password and Confirm Password do not match.');
        return;
      }

      setLoading(true);
      const sampleIdUrl = generateSampleIdDataUrl(
        regIdType,
        `${regFirstName.trim()} ${regLastName.trim()}`,
        regIdNumber.trim() || 'BRGY-RES-ID',
        regPurokZone || 'Purok 1'
      );

      const res = await apiClient.register({
        username: regUsername.trim().toLowerCase(),
        password: regPassword,
        email: regEmail.trim().toLowerCase() || `${regUsername.trim().toLowerCase()}@cabucbucan.gov.ph`,
        firstName: regFirstName.trim(),
        middleName: regMiddleName.trim(),
        lastName: regLastName.trim(),
        birthDate: regBirthDate || '1995-06-15',
        streetAddress: regStreetAddress.trim() || `${regPurokZone || 'Purok 1'}, Barangay Cabucbucan`,
        purokZone: regPurokZone || 'Purok 1',
        contactNumber: cleanContact,
        idType: regIdType,
        idNumber: regIdNumber.trim() || undefined,
        idPhotoUrl: sampleIdUrl,
        idPhotoName: `${regIdType.toLowerCase().replace(/[^a-z0-9]/g, '_')}_card.svg`,
        civilStatus: regCivilStatus,
        gender: regGender,
        yearsOfResidency: 5
      });
      setLoading(false);

      if (res.success && res.user) {
        onAuthSuccess(res.user, res.profile);
        onClose();
      } else {
        setErrorMsg(res.error || 'Registration failed. Please check the provided information.');
      }
      return;
    }

    if (mfaChallengeActive) {
      if (!mfaCode.trim()) {
        setErrorMsg('Please enter the 6-digit TOTP passcode or backup code.');
        return;
      }

      setLoading(true);
      const res = await apiClient.verifyMfa({
        username: mfaTargetUser?.username || username,
        userId: mfaTargetUser?.id,
        mfaCode: mfaCode.trim()
      });
      setLoading(false);

      if (res.success && res.user) {
        onAuthSuccess(res.user, res.profile);
        onClose();
        handleResetChallenge();
      } else {
        setErrorMsg(res.error || 'Invalid 6-digit TOTP passcode or emergency backup code.');
      }
      return;
    }

    // Standard primary login step
    if (!username.trim() || !password) {
      setErrorMsg('Please enter both your Username and Password.');
      return;
    }

    setLoading(true);
    const cleanUser = username.trim().toLowerCase();
    const res = await apiClient.login(cleanUser, password);

    if (res.success) {
      setLoading(false);
      if (res.mfaRequired) {
        setMfaChallengeActive(true);
        setMfaTargetUser({
          id: res.userId || '',
          username: res.username || username,
          role: res.role || 'resident',
          fullName: res.fullName || username,
          email: res.email,
          maskedEmail: res.maskedEmail || (res.email ? res.email.replace(/(.{2})(.*)(@.*)/, '$1***$3') : `${username}@gmail.com`),
          emailDelivered: res.emailDelivered,
          emailError: res.emailError,
          demoOtp: res.demoOtp
        });
        setMfaCode('');
        setCustomDestinationEmail(res.email || '');
        if (res.emailDelivered) {
          setResendStatusMsg(`6-digit code delivered to ${res.email || res.maskedEmail}! Please check your Gmail.`);
        }
      } else if (res.user) {
        onAuthSuccess(res.user, res.profile);
        onClose();
      }
    } else {
      // AUTOMATIC FIREBASE PASSWORD SYNC:
      const targetEmail = res.userEmail || (cleanUser.includes('@') ? cleanUser : null);
      if (targetEmail && targetEmail.includes('@')) {
        try {
          const fbCheck = await verifyFirebasePassword(targetEmail, password);
          if (fbCheck.success && fbCheck.user) {
            const syncRes = await apiClient.syncFirebasePassword({
              email: targetEmail,
              username: cleanUser,
              newPassword: password,
              firebaseUid: fbCheck.user.uid,
              idToken: fbCheck.idToken
            });
            setLoading(false);
            if (syncRes.success) {
              if (syncRes.mfaRequired) {
                setMfaChallengeActive(true);
                setMfaTargetUser({
                  id: syncRes.userId || '',
                  username: syncRes.username || username,
                  role: syncRes.role || 'resident',
                  fullName: syncRes.fullName || username,
                  email: syncRes.email,
                  maskedEmail: syncRes.maskedEmail || `${username}@gmail.com`,
                  emailDelivered: syncRes.emailDelivered,
                  emailError: syncRes.emailError,
                  demoOtp: syncRes.demoOtp
                });
                setMfaCode('');
                setCustomDestinationEmail(syncRes.email || '');
                if (syncRes.emailDelivered) {
                  setResendStatusMsg(`Password verified! 6-digit code delivered to ${syncRes.email || syncRes.maskedEmail}.`);
                }
                return;
              } else if (syncRes.user && syncRes.token) {
                onAuthSuccess(syncRes.user, syncRes.user.role === 'resident' ? syncRes.profile : undefined);
                onClose();
                return;
              }
            }
          }
        } catch (syncErr) {
          console.warn('[Firebase Auth] Modal auto-sync notice:', syncErr);
        }
      }

      setLoading(false);
      if (res.passwordResetPending) {
        setErrorMsg('A password reset was requested for this account and your previous password was invalidated. Please enter the new password you created via your Gmail reset link.');
      } else {
        setErrorMsg(res.error || 'Invalid username or password. Please verify your credentials.');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 border-b border-slate-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-500/20 border border-blue-500/30 text-blue-400 rounded-xl">
              {mfaChallengeActive ? <Smartphone className="w-5 h-5 text-indigo-400" /> : isRegister ? <UserPlus className="w-5 h-5 text-blue-400" /> : <ShieldCheck className="w-5 h-5 text-emerald-400" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {mfaChallengeActive 
                  ? 'Two-Factor Authentication (TOTP)' 
                  : isRegister 
                    ? 'Register New Barangay Resident' 
                    : 'Barangay Resident & Official Portal'}
              </h3>
              <p className="text-xs text-slate-300">
                {mfaChallengeActive 
                  ? 'Enter RFC-6238 Passcode from your Authenticator App' 
                  : isRegister 
                    ? 'Official E-Clearance & Residency Registration' 
                    : 'Barangay Cabucbucan, Rizal, Nueva Ecija'}
              </p>
            </div>
          </div>
          <button
            onClick={() => { onClose(); handleResetChallenge(); }}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 cursor-pointer transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        {!mfaChallengeActive && (
          <div className="flex border-b border-slate-200 bg-slate-50">
            <button
              type="button"
              onClick={() => handleToggleTab(false)}
              className={`flex-1 py-3 text-xs font-bold text-center border-b-2 transition-all cursor-pointer flex items-center justify-center gap-2 ${
                !isRegister ? 'border-blue-600 text-blue-700 bg-white shadow-xs' : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Sign In Existing Account</span>
            </button>
            <button
              type="button"
              onClick={() => handleToggleTab(true)}
              className={`flex-1 py-3 text-xs font-bold text-center border-b-2 transition-all cursor-pointer flex items-center justify-center gap-2 ${
                isRegister ? 'border-blue-600 text-blue-700 bg-white shadow-xs' : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Register New Resident</span>
            </button>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto bg-white">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-start gap-2.5 shadow-xs font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {nameHadNumberWarning && (
            <div className="p-2.5 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-xl flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
              <span>Numbers are not allowed in name fields and were removed automatically.</span>
            </div>
          )}

          {/* MFA CHALLENGE VIEW */}
          {mfaChallengeActive ? (
            <div className="space-y-4">
              <div className="p-4 bg-indigo-50/70 rounded-2xl border border-indigo-200 text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-700 border border-indigo-200 flex items-center justify-center mx-auto">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">{mfaTargetUser?.fullName}</h4>
                  <p className="text-xs text-indigo-700 font-mono font-semibold">Account: @{mfaTargetUser?.username} • Role: {mfaTargetUser?.role?.toUpperCase()}</p>
                </div>
                <p className="text-xs text-slate-600 max-w-sm mx-auto">
                  A dynamic 6-digit Two-Factor security code has been generated for your account.
                </p>
              </div>

              {/* Destination Gmail & Resend Box */}
              <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-blue-950 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-blue-600" />
                    Delivered to Gmail:
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsEditingDestinationEmail(!isEditingDestinationEmail)}
                    className="text-[11px] font-bold text-blue-700 hover:text-blue-900 flex items-center gap-1 cursor-pointer underline"
                  >
                    <Edit2 className="w-3 h-3" />
                    <span>{isEditingDestinationEmail ? 'Close' : 'Change Gmail'}</span>
                  </button>
                </div>

                {!isEditingDestinationEmail ? (
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-slate-800 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                      {mfaTargetUser?.email || mfaTargetUser?.maskedEmail || `${mfaTargetUser?.username}@gmail.com`}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleResendMfaEmail()}
                      disabled={resendingEmail}
                      className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer disabled:opacity-50"
                    >
                      {resendingEmail ? <RefreshCw className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                      <span>Resend Code</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2 pt-1">
                    <div className="flex gap-2">
                      <input
                        type="email"
                        value={customDestinationEmail}
                        onChange={(e) => setCustomDestinationEmail(e.target.value)}
                        placeholder="e.g. resident@gmail.com"
                        className="flex-1 px-3 py-1.5 bg-white border border-blue-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                      />
                      <button
                        type="button"
                        onClick={() => handleResendMfaEmail(customDestinationEmail)}
                        disabled={resendingEmail || !customDestinationEmail.trim()}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg cursor-pointer disabled:opacity-50 flex items-center gap-1"
                      >
                        {resendingEmail ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                        <span>Send Here</span>
                      </button>
                    </div>
                    <p className="text-[10px] text-blue-800">
                      Enter your personal Gmail to instantly receive this account's 6-digit code.
                    </p>
                  </div>
                )}

                {resendStatusMsg && (
                  <div className="p-2 bg-emerald-100/80 border border-emerald-300 rounded-lg text-emerald-950 text-xs flex items-center gap-1.5 font-medium">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{resendStatusMsg}</span>
                  </div>
                )}

                {mfaTargetUser?.emailDelivered && !resendStatusMsg && (
                  <div className="p-2 bg-emerald-100/80 border border-emerald-300 rounded-lg text-emerald-950 text-xs flex items-center gap-1.5 font-medium">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Security code sent to your Gmail inbox. Check inbox and spam folder.</span>
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-800">
                    {useBackupCode ? 'Emergency Backup Code' : 'Enter 6-Digit Verification Code *'}
                  </label>
                  <button
                    type="button"
                    onClick={() => setUseBackupCode(!useBackupCode)}
                    className="text-[11px] text-indigo-700 hover:text-indigo-900 font-semibold hover:underline cursor-pointer"
                  >
                    {useBackupCode ? '← Use 6-Digit Code' : 'Use Emergency Backup Code'}
                  </button>
                </div>

                <input
                  type="text"
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value)}
                  required
                  autoFocus
                  placeholder={useBackupCode ? 'e.g. BACKUP-SEC-01' : '000000'}
                  maxLength={useBackupCode ? 24 : 8}
                  className="w-full px-4 py-3 bg-slate-50 border border-indigo-300 focus:border-indigo-600 rounded-xl text-center text-lg font-mono font-bold tracking-widest text-indigo-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:bg-white"
                />
              </div>

              {/* Live Email OTP & On-Screen Backup Code Autofill */}
              {mfaTargetUser?.demoOtp && (
                <div className="p-3.5 bg-emerald-50/90 border border-emerald-300 rounded-2xl flex items-center justify-between shadow-xs">
                  <div>
                    <div className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Live Email OTP • On-Screen Backup Code</span>
                    </div>
                    <div className="text-2xl font-mono font-black text-emerald-700 tracking-widest mt-0.5">
                      {mfaTargetUser.demoOtp}
                    </div>
                    <p className="text-[10px] text-emerald-700/90 font-medium">
                      Dispatched to Gmail. Click to autofill backup code immediately.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMfaCode(mfaTargetUser.demoOtp || '')}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-extrabold transition-all shadow-xs cursor-pointer flex items-center gap-1.5 shrink-0"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Autofill Backup Code</span>
                  </button>
                </div>
              )}

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleResetChallenge}
                  className="px-4 py-2.5 text-slate-600 hover:text-slate-900 text-xs font-semibold cursor-pointer"
                >
                  ← Back to Password
                </button>
                <button
                  type="submit"
                  disabled={loading || !mfaCode.trim()}
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? 'Verifying TOTP Passcode...' : 'Verify MFA & Enter Portal'}
                </button>
              </div>
            </div>
          ) : !isRegister ? (
            /* CLEAN AUTHENTIC SIGN IN FORM */
            <>
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Username or Registered Email <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    placeholder="Enter your username (e.g. maria.santos)"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 focus:border-blue-600 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white"
                  />
                  <User className="w-4 h-4 absolute right-3 top-3 text-slate-400 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="Enter your account password"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 focus:border-blue-600 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-800 cursor-pointer"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? 'Authenticating...' : 'Sign In to Barangay Portal'}
                </button>
              </div>

              <div className="text-center pt-2">
                <p className="text-xs text-slate-600">
                  Don't have a registered resident account yet?{' '}
                  <button
                    type="button"
                    onClick={() => handleToggleTab(true)}
                    className="text-blue-600 hover:text-blue-800 font-bold underline cursor-pointer"
                  >
                    Register New Resident here
                  </button>
                </p>
              </div>
            </>
          ) : (
            /* CLEAN AUTHENTIC RESIDENT REGISTRATION FORM */
            <div className="space-y-4">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-start gap-2 font-medium">
                <Info className="w-4 h-4 shrink-0 text-blue-600 mt-0.5" />
                <span>
                  Please provide accurate information for Barangay Cabucbucan residency verification and cryptographic E-Clearance issuance.
                </span>
              </div>

              {/* Name Section (Numbers Strictly Blocked) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    First Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={regFirstName}
                    onChange={(e) => handleNameInput(e.target.value, setRegFirstName)}
                    required
                    placeholder="e.g. Maria"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 focus:border-blue-600 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Middle Name <span className="text-slate-500 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={regMiddleName}
                    onChange={(e) => handleNameInput(e.target.value, setRegMiddleName)}
                    placeholder="e.g. Clara"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 focus:border-blue-600 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Last Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={regLastName}
                    onChange={(e) => handleNameInput(e.target.value, setRegLastName)}
                    required
                    placeholder="e.g. Santos"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 focus:border-blue-600 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Suffix <span className="text-slate-500 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={regSuffix}
                    onChange={(e) => handleNameInput(e.target.value, setRegSuffix)}
                    placeholder="Jr., III"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 focus:border-blue-600 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white"
                  />
                </div>
              </div>

              {/* Account Credentials */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Desired Username <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value.replace(/\s+/g, ''))}
                    required
                    placeholder="e.g. maria_santos"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 focus:border-blue-600 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Email Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    required
                    placeholder="e.g. maria@email.com"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 focus:border-blue-600 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white"
                  />
                </div>
              </div>

              {/* Password Creation with Live Policy Badges */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Password <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showRegPassword ? 'text' : 'password'}
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      required
                      placeholder="Min. 8 chars + 1 special symbol"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 focus:border-blue-600 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white pr-8"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPassword(!showRegPassword)}
                      className="absolute right-2.5 top-2 text-slate-500 hover:text-slate-800 cursor-pointer"
                    >
                      {showRegPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Confirm Password <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showRegConfirmPassword ? 'text' : 'password'}
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      required
                      placeholder="Re-type password"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 focus:border-blue-600 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white pr-8"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegConfirmPassword(!showRegConfirmPassword)}
                      className="absolute right-2.5 top-2 text-slate-500 hover:text-slate-800 cursor-pointer"
                    >
                      {showRegConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Password Strength Visual Indicator & Policy Meter */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                {regPassword ? (
                  <PasswordStrengthMeter
                    password={regPassword}
                    confirmPassword={regConfirmPassword}
                    showRequirementsList={true}
                  />
                ) : (
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold text-slate-700 block">Password Security Requirements (IAS / DILG Standard):</span>
                    <div className="flex flex-wrap gap-3 text-[11px] text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                        <span>Min. 8 characters</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                        <span>1 special symbol (!@#$%^&*)</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                        <span>Upper & lower case</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                        <span>Numbers (0-9)</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Location and Demographic Information */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Purok / Zone in Cabucbucan <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={regPurokZone}
                    onChange={(e) => setRegPurokZone(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 focus:border-blue-600 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white font-medium"
                  >
                    <option value="">-- Select Purok / Zone --</option>
                    <option value="Purok 1">Purok 1</option>
                    <option value="Purok 2">Purok 2</option>
                    <option value="Purok 3">Purok 3</option>
                    <option value="Purok 4">Purok 4</option>
                    <option value="Purok 5">Purok 5</option>
                    <option value="Purok 6">Purok 6</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Street / House Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={regStreetAddress}
                    onChange={(e) => setRegStreetAddress(e.target.value)}
                    required
                    placeholder="e.g. 142 Rizal Street"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 focus:border-blue-600 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Birth Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={regBirthDate}
                    onChange={(e) => setRegBirthDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 focus:border-blue-600 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white font-medium"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-800">
                      Active Mobile Contact Number <span className="text-rose-500">*</span>
                    </label>
                    <span className={`text-[10px] font-mono font-bold ${regContactNumber.length === 11 ? 'text-emerald-700' : 'text-slate-400'}`}>
                      {regContactNumber.length === 11 ? '✓ 11 digits' : `${regContactNumber.length}/11`}
                    </span>
                  </div>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]{11}"
                    maxLength={11}
                    minLength={11}
                    value={regContactNumber}
                    onChange={(e) => setRegContactNumber(e.target.value.replace(/[^0-9]/g, '').slice(0, 11))}
                    required
                    placeholder="09171234567"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 focus:border-blue-600 rounded-xl text-xs font-mono text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white"
                  />
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    11-digit mobile number, numbers only
                  </span>
                </div>
              </div>

              {/* Government ID Type Choice & ID Number */}
              <div className="p-3.5 bg-blue-50/70 rounded-xl border border-blue-200 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-blue-900">
                  <IdCard className="w-4 h-4 text-blue-600" />
                  <span>Government Identification Verification</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      Select Government ID Type <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={regIdType}
                      onChange={(e) => setRegIdType(e.target.value)}
                      required
                      className="w-full px-3 py-2 bg-white border border-slate-300 focus:border-blue-600 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium"
                    >
                      {GOVERNMENT_ID_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      {regIdType} Number <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={regIdNumber}
                      onChange={(e) => setRegIdNumber(e.target.value)}
                      required
                      placeholder="e.g. 1234-5678-9012-3456"
                      className="w-full px-3 py-2 bg-white border border-slate-300 focus:border-blue-600 rounded-xl text-xs font-mono text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? 'Creating Resident Account...' : 'Complete Resident Registration'}
                </button>
              </div>

              <div className="text-center pt-1">
                <p className="text-xs text-slate-600">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => handleToggleTab(false)}
                    className="text-blue-600 hover:text-blue-800 font-bold underline cursor-pointer"
                  >
                    Sign in here
                  </button>
                </p>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
