import React, { useState } from 'react';
import { 
  AlertCircle, CheckCircle2, Eye, EyeOff, FileCheck, FileText, 
  HelpCircle, IdCard, Info, KeyRound, Lock, QrCode, Search, Shield, 
  ShieldAlert, ShieldCheck, Smartphone, Sparkles, User, UserCheck, 
  UserPlus, Users, ArrowRight, Award, Building, Check
} from 'lucide-react';
import { apiClient } from '../lib/api';
import { ForgotPasswordModal } from './ForgotPasswordModal';
import type { ResidentProfile, User as UserType } from '../types';

interface SignInPageProps {
  onAuthSuccess: (user: UserType, profile?: ResidentProfile) => void;
  onOpenVerify: () => void;
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

export const SignInPage: React.FC<SignInPageProps> = ({ onAuthSuccess, onOpenVerify }) => {
  const [isRegister, setIsRegister] = useState<boolean>(false);
  const [showForgotPassword, setShowForgotPassword] = useState<boolean>(false);
  const [resetSuccessMsg, setResetSuccessMsg] = useState<string>('');
  
  // Login credentials
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  
  // MFA Challenge State
  const [mfaChallengeActive, setMfaChallengeActive] = useState<boolean>(false);
  const [mfaCode, setMfaCode] = useState<string>('');
  const [mfaTargetUser, setMfaTargetUser] = useState<{ id: string; username: string; role: string; fullName: string } | null>(null);

  // Registration fields
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
  
  const [regBirthDate, setRegBirthDate] = useState<string>('1995-06-15');
  const [regStreetAddress, setRegStreetAddress] = useState<string>('');
  const [regPurokZone, setRegPurokZone] = useState<string>('Purok 3');
  const [regContactNumber, setRegContactNumber] = useState<string>('0917-555-0199');
  const [regIdType, setRegIdType] = useState<string>('Philippine National ID (PhilSys)');
  const [regIdNumber, setRegIdNumber] = useState<string>('');
  const [regCivilStatus, setRegCivilStatus] = useState<string>('Single');
  const [regGender, setRegGender] = useState<string>('Male');
  
  // Name validation warning flags
  const [nameHadNumberWarning, setNameHadNumberWarning] = useState<boolean>(false);
  
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Helper to filter out numbers from names immediately
  const handleNameInput = (value: string, setter: (val: string) => void) => {
    if (/[0-9]/.test(value)) {
      setNameHadNumberWarning(true);
      setTimeout(() => setNameHadNumberWarning(false), 3500);
    }
    const sanitized = value.replace(/[0-9]/g, '');
    setter(sanitized);
  };

  // Quick Demo Account One-Click Logins
  const handleQuickLogin = async (u: string, p: string) => {
    setErrorMsg('');
    setLoading(true);
    const res = await apiClient.login(u, p);
    setLoading(false);
    if (res.success && res.user) {
      onAuthSuccess(res.user, res.profile);
    } else {
      setErrorMsg(res.error || 'Failed to login with selected account.');
    }
  };

  const handleResetChallenge = () => {
    setMfaChallengeActive(false);
    setMfaCode('');
    setMfaTargetUser(null);
    setErrorMsg('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (isRegister) {
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

      if (!regContactNumber.trim()) {
        setErrorMsg('Please provide a valid active mobile contact number.');
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

      const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(regPassword);
      if (!hasSpecialChar) {
        setErrorMsg('Password must contain at least one special character (e.g. ! @ # $ % ^ & *).');
        return;
      }

      if (regPassword !== regConfirmPassword) {
        setErrorMsg('Password and Confirm Password do not match.');
        return;
      }

      setLoading(true);
      const res = await apiClient.register({
        username: regUsername.trim().toLowerCase(),
        password: regPassword,
        email: regEmail.trim().toLowerCase(),
        firstName: regFirstName.trim(),
        middleName: regMiddleName.trim(),
        lastName: regLastName.trim(),
        birthDate: regBirthDate,
        streetAddress: regStreetAddress.trim(),
        purokZone: regPurokZone,
        contactNumber: regContactNumber.trim(),
        idNumber: regIdNumber.trim(),
        civilStatus: regCivilStatus,
        gender: regGender,
        yearsOfResidency: 5
      });
      setLoading(false);

      if (res.success && res.user) {
        onAuthSuccess(res.user, res.profile);
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
    const res = await apiClient.login(username.trim(), password);
    setLoading(false);

    if (res.success) {
      if (res.mfaRequired) {
        setMfaChallengeActive(true);
        setMfaTargetUser({
          id: res.userId || '',
          username: res.username || username,
          role: res.role || 'resident',
          fullName: res.fullName || username
        });
        setMfaCode('');
      } else if (res.user) {
        onAuthSuccess(res.user, res.profile);
      }
    } else {
      setErrorMsg(res.error || 'Invalid username or password. Please verify your credentials.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-between font-sans selection:bg-blue-600 selection:text-white">
      {/* Official Republic of the Philippines Header Strip */}
      <div className="w-full bg-slate-900 border-b border-slate-800 text-white">
        <div className="h-1.5 w-full bg-gradient-to-r from-blue-600 via-amber-400 to-red-600" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-semibold text-slate-200">Republic of the Philippines • Official Government E-Services Portal</span>
            </div>
            <span className="hidden md:inline px-2 py-0.5 bg-blue-900/60 border border-blue-400/30 text-blue-300 text-[10px] font-bold rounded">
              RA 11032 & RA 10173 Certified
            </span>
          </div>

          <div className="flex items-center gap-4 text-slate-300">
            <button
              onClick={onOpenVerify}
              className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-blue-300 hover:text-white font-bold rounded-lg border border-slate-700 transition-colors cursor-pointer"
            >
              <QrCode className="w-3.5 h-3.5 text-blue-400" />
              <span>Verify Document QR / Seal</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Hero & Authentication Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 flex flex-col justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Column: Official Government Branding & Information */}
          <div className="lg:col-span-7 space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-700 to-indigo-900 border-2 border-blue-400/40 p-2 shadow-lg flex items-center justify-center text-white shrink-0">
                  <ShieldCheck className="w-10 h-10 text-amber-300" />
                </div>
                <div>
                  <div className="text-[11px] font-bold tracking-wider uppercase text-blue-700">
                    Republic of the Philippines • Region III
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
                    Barangay Cabucbucan
                  </h1>
                  <p className="text-xs sm:text-sm font-semibold text-slate-600">
                    Municipality of Rizal, Province of Nueva Ecija • E-Clearance & Civil Registry Portal
                  </p>
                </div>
              </div>

              <p className="text-sm text-slate-700 leading-relaxed font-normal">
                Welcome to the official, cryptographically verified digital portal of Barangay Cabucbucan. 
                Apply for official barangay clearances, residency certifications, and indigency documents with 
                instant status tracking, digital Punong Barangay signing, and tamper-proof QR verification.
              </p>
            </div>

            {/* Core Pillars / Services */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs flex items-start gap-3">
                <div className="p-2 bg-blue-50 text-blue-700 rounded-lg shrink-0 mt-0.5">
                  <FileCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Official E-Clearances</h4>
                  <p className="text-[11px] text-slate-600 mt-0.5">Employment, Residency, Indigency, Business, & Jobseeker (RA 11261).</p>
                </div>
              </div>

              <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs flex items-start gap-3">
                <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg shrink-0 mt-0.5">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Cryptographic HMAC Seals</h4>
                  <p className="text-[11px] text-slate-600 mt-0.5">SHA-256 non-repudiation seals and Punong Barangay digital signature.</p>
                </div>
              </div>

              <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs flex items-start gap-3">
                <div className="p-2 bg-indigo-50 text-indigo-700 rounded-lg shrink-0 mt-0.5">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">SMS & Real-Time Alerts</h4>
                  <p className="text-[11px] text-slate-600 mt-0.5">Instant notification at every pipeline stage: Review, Endorse, & Ready.</p>
                </div>
              </div>

              <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs flex items-start gap-3">
                <div className="p-2 bg-purple-50 text-purple-700 rounded-lg shrink-0 mt-0.5">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Data Privacy & Security</h4>
                  <p className="text-[11px] text-slate-600 mt-0.5">Strict RBAC isolation, 2FA TOTP protection, and immutable audit trails.</p>
                </div>
              </div>
            </div>

            {/* Quick Demo Access Bar */}
            <div className="p-4 bg-slate-900 text-white rounded-2xl shadow-md border border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-slate-100">One-Click Demonstration & Evaluation Access</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">Instant Role Sign In</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-normal">
                Click any role button below to instantly sign in and test the system with full permissions:
              </p>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleQuickLogin('juan.delacruz', 'Resident@2026!')}
                  disabled={loading}
                  className="p-2.5 bg-slate-800 hover:bg-blue-600 border border-slate-700 hover:border-blue-500 rounded-xl text-left transition-all cursor-pointer group disabled:opacity-50"
                >
                  <div className="flex items-center gap-1.5 text-blue-400 group-hover:text-white font-bold text-xs">
                    <User className="w-3.5 h-3.5" />
                    <span>Resident</span>
                  </div>
                  <div className="text-[10px] text-slate-300 group-hover:text-blue-100 font-medium truncate mt-0.5">Juan Dela Cruz</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickLogin('staff.elena', 'StaffSecure@2026!')}
                  disabled={loading}
                  className="p-2.5 bg-slate-800 hover:bg-emerald-600 border border-slate-700 hover:border-emerald-500 rounded-xl text-left transition-all cursor-pointer group disabled:opacity-50"
                >
                  <div className="flex items-center gap-1.5 text-emerald-400 group-hover:text-white font-bold text-xs">
                    <Users className="w-3.5 h-3.5" />
                    <span>Barangay Staff</span>
                  </div>
                  <div className="text-[10px] text-slate-300 group-hover:text-emerald-100 font-medium truncate mt-0.5">Elena Santos</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickLogin('capt.laugo', 'CaptainAuth@2026!')}
                  disabled={loading}
                  className="p-2.5 bg-slate-800 hover:bg-purple-600 border border-slate-700 hover:border-purple-500 rounded-xl text-left transition-all cursor-pointer group disabled:opacity-50"
                >
                  <div className="flex items-center gap-1.5 text-purple-400 group-hover:text-white font-bold text-xs">
                    <Award className="w-3.5 h-3.5" />
                    <span>Punong Barangay</span>
                  </div>
                  <div className="text-[10px] text-slate-300 group-hover:text-purple-100 font-medium truncate mt-0.5">Hon. Cornelio Laugo</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickLogin('admin.security', 'AdminRoot@2026!')}
                  disabled={loading}
                  className="p-2.5 bg-slate-800 hover:bg-amber-600 border border-slate-700 hover:border-amber-500 rounded-xl text-left transition-all cursor-pointer group disabled:opacity-50"
                >
                  <div className="flex items-center gap-1.5 text-amber-400 group-hover:text-white font-bold text-xs">
                    <Shield className="w-3.5 h-3.5" />
                    <span>Cyber Admin</span>
                  </div>
                  <div className="text-[10px] text-slate-300 group-hover:text-amber-100 font-medium truncate mt-0.5">IAS Lab & SQL DB</div>
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Sign In / Register Card */}
          <div className="lg:col-span-5">
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
              
              {/* Card Header & Tab Switcher */}
              <div className="bg-slate-900 text-white p-5 border-b border-slate-800">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-white">
                      {mfaChallengeActive 
                        ? 'Two-Factor Challenge (TOTP)' 
                        : isRegister 
                          ? 'New Resident Registration' 
                          : 'Sign In to Government Portal'}
                    </h3>
                    <p className="text-xs text-slate-300 mt-0.5">
                      {mfaChallengeActive 
                        ? 'Enter RFC-6238 Authenticator Code' 
                        : isRegister 
                          ? 'Create your verified resident profile' 
                          : 'Enter your credentials to access your account'}
                    </p>
                  </div>
                  <div className="p-2 bg-blue-600/30 border border-blue-400/40 text-blue-300 rounded-xl">
                    <Lock className="w-5 h-5" />
                  </div>
                </div>

                {!mfaChallengeActive && (
                  <div className="flex bg-slate-800/80 p-1 rounded-xl mt-4 border border-slate-700">
                    <button
                      type="button"
                      onClick={() => { setIsRegister(false); setErrorMsg(''); }}
                      className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        !isRegister 
                          ? 'bg-blue-600 text-white shadow-sm' 
                          : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      <User className="w-3.5 h-3.5" />
                      <span>Sign In</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => { setIsRegister(true); setErrorMsg(''); }}
                      className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        isRegister 
                          ? 'bg-blue-600 text-white shadow-sm' 
                          : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Register New</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Form Body */}
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {/* Reset Success Feedback Banner */}
                {resetSuccessMsg && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-start gap-2 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{resetSuccessMsg}</span>
                  </div>
                )}

                {/* Error Banner */}
                {errorMsg && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-start gap-2 font-medium">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {/* MFA Step */}
                {mfaChallengeActive ? (
                  <div className="space-y-4">
                    <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-indigo-900 text-xs space-y-1">
                      <div className="font-bold flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-indigo-700" />
                        <span>Two-Factor Authentication Required</span>
                      </div>
                      <p className="text-slate-600">
                        Account <strong>{mfaTargetUser?.fullName}</strong> has 2FA enabled. Open your Google Authenticator or Microsoft Authenticator app.
                      </p>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        6-Digit TOTP Passcode or Backup Code:
                      </label>
                      <input
                        type="text"
                        maxLength={8}
                        value={mfaCode}
                        onChange={(e) => setMfaCode(e.target.value.replace(/[^a-zA-Z0-9]/g, ''))}
                        placeholder="123456"
                        autoFocus
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-lg font-mono font-bold text-center tracking-widest text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                      />
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleResetChallenge}
                        className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-300 cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm cursor-pointer disabled:opacity-50"
                      >
                        {loading ? 'Verifying...' : 'Authenticate & Sign In'}
                      </button>
                    </div>
                  </div>
                ) : isRegister ? (
                  /* REGISTRATION FORM */
                  <div className="space-y-3.5 text-xs max-h-[480px] overflow-y-auto pr-1">
                    {nameHadNumberWarning && (
                      <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-[11px] font-bold flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                        <span>Numbers were automatically stripped. Names must contain only alphabetical characters.</span>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">First Name *</label>
                        <input
                          type="text"
                          required
                          value={regFirstName}
                          onChange={(e) => handleNameInput(e.target.value, setRegFirstName)}
                          placeholder="e.g. Maria"
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">Last Name *</label>
                        <input
                          type="text"
                          required
                          value={regLastName}
                          onChange={(e) => handleNameInput(e.target.value, setRegLastName)}
                          placeholder="e.g. Santos"
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">Middle Name</label>
                        <input
                          type="text"
                          value={regMiddleName}
                          onChange={(e) => handleNameInput(e.target.value, setRegMiddleName)}
                          placeholder="e.g. Ramos"
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">Purok / Zone *</label>
                        <select
                          value={regPurokZone}
                          onChange={(e) => setRegPurokZone(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="Purok 1">Purok 1</option>
                          <option value="Purok 2">Purok 2</option>
                          <option value="Purok 3">Purok 3</option>
                          <option value="Purok 4">Purok 4</option>
                          <option value="Purok 5">Purok 5</option>
                          <option value="Purok 6">Purok 6</option>
                          <option value="Purok 7">Purok 7</option>
                          <option value="Sitio Maligaya">Sitio Maligaya</option>
                          <option value="Sitio Centro">Sitio Centro</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">Mobile Number *</label>
                        <input
                          type="tel"
                          required
                          value={regContactNumber}
                          onChange={(e) => setRegContactNumber(e.target.value)}
                          placeholder="0917-xxx-xxxx"
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">Government ID Type *</label>
                        <select
                          value={regIdType}
                          onChange={(e) => setRegIdType(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 truncate"
                        >
                          {GOVERNMENT_ID_OPTIONS.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Government ID Number (e.g. PhilSys ID) *</label>
                      <input
                        type="text"
                        required
                        value={regIdNumber}
                        onChange={(e) => setRegIdNumber(e.target.value)}
                        placeholder="e.g. 1234-5678-9012-3456"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 font-mono font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Desired Username *</label>
                      <input
                        type="text"
                        required
                        value={regUsername}
                        onChange={(e) => setRegUsername(e.target.value)}
                        placeholder="e.g. maria.santos"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Password (min 8 chars, 1 special) *</label>
                      <div className="relative">
                        <input
                          type={showRegPassword ? 'text' : 'password'}
                          required
                          value={regPassword}
                          onChange={(e) => setRegPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full pl-3 pr-9 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                          type="button"
                          onClick={() => setShowRegPassword(!showRegPassword)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                        >
                          {showRegPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Confirm Password *</label>
                      <div className="relative">
                        <input
                          type={showRegConfirmPassword ? 'text' : 'password'}
                          required
                          value={regConfirmPassword}
                          onChange={(e) => setRegConfirmPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full pl-3 pr-9 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                          type="button"
                          onClick={() => setShowRegConfirmPassword(!showRegConfirmPassword)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                        >
                          {showRegConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full mt-2 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-sm text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>{loading ? 'Creating Account...' : 'Complete Resident Registration'}</span>
                    </button>
                  </div>
                ) : (
                  /* SIGN IN FORM */
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Username or Registered Email</label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="text"
                          required
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          placeholder="e.g. juan.delacruz or staff.elena"
                          className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-bold text-slate-700">Password</label>
                        <button
                          type="button"
                          onClick={() => {
                            setErrorMsg('');
                            setResetSuccessMsg('');
                            setShowForgotPassword(true);
                          }}
                          className="text-[11px] font-bold text-blue-600 hover:text-blue-800 cursor-pointer"
                        >
                          Forgot Password?
                        </button>
                      </div>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Enter your password"
                          className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      <Lock className="w-4 h-4" />
                      <span>{loading ? 'Authenticating...' : 'Sign In to Official Account'}</span>
                    </button>

                    {/* QR Code Quick Verification Link */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-slate-500">Need to check a document?</span>
                      <button
                        type="button"
                        onClick={onOpenVerify}
                        className="text-blue-700 hover:text-blue-900 font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        <span>Public Verification</span>
                      </button>
                    </div>
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Official Government Footer */}
      <footer className="w-full bg-white border-t border-slate-200 py-6 text-slate-600 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div>
            <div className="font-bold text-slate-900">Barangay Cabucbucan Digital Governance System</div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Barangay Hall, Cabucbucan, Municipality of Rizal, Province of Nueva Ecija 3127 • Hotline: (044) 940-2026
            </p>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-slate-500 font-medium">
            <span>Republic Act No. 10173 (Data Privacy)</span>
            <span>•</span>
            <span>Republic Act No. 11032 (EODB)</span>
            <span>•</span>
            <span>IAS ISO/IEC 27001 Security Framework</span>
          </div>
        </div>
      </footer>

      {/* Forgot Password OTP Modal */}
      <ForgotPasswordModal
        isOpen={showForgotPassword}
        onClose={() => setShowForgotPassword(false)}
        onSuccess={(msg) => {
          setResetSuccessMsg(msg);
          setShowForgotPassword(false);
        }}
      />
    </div>
  );
};
