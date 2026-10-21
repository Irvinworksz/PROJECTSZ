import React, { useState, useRef, useEffect } from 'react';
import { 
  AlertCircle, CheckCircle2, Eye, EyeOff, Lock, User, 
  HelpCircle, UploadCloud, X, Check, Mail, Phone,
  MapPin, Shield, ArrowRight, RefreshCw, KeyRound, UserPlus,
  LogIn, FileText, Clipboard
} from 'lucide-react';
import { apiClient } from '../lib/api';
import { ForgotPasswordModal } from './ForgotPasswordModal';
import { PasswordStrengthMeter } from './PasswordStrengthMeter';
import { signInWithGoogleFirebase, registerUserInFirebaseAuth, verifyFirebasePassword } from '../lib/firebase';
import type { ResidentProfile, User as UserType } from '../types';

interface SignInPageProps {
  onAuthSuccess: (user: UserType, profile?: ResidentProfile) => void;
  sessionExpiredNotice?: string | null;
  onClearExpiredNotice?: () => void;
  onOpenVerify?: () => void;
}

export type RoleGuideType = 'resident' | 'staff' | 'official';

// Kept for type compatibility across existing system references
export const ROLE_DEMO_ACCOUNTS: Record<'resident' | 'staff' | 'official', {
  name: string;
  title: string;
  roleBadge: string;
  username: string;
  passwordHint: string;
  actualPassword: string;
}> = {
  resident: {
    name: 'Maria Clara Santos',
    title: 'Constituent · Purok 2',
    roleBadge: 'Resident',
    username: 'maria.santos',
    passwordHint: 'Salted BCrypt ($2a$10$)',
    actualPassword: 'Resident@2026!'
  },
  staff: {
    name: 'Elena Ramos',
    title: 'Desk Officer · Intake & Records',
    roleBadge: 'Staff Desk',
    username: 'staff.elena',
    passwordHint: 'Salted BCrypt ($2a$10$)',
    actualPassword: 'StaffSecure@2026!'
  },
  official: {
    name: 'Hon. Cornelio Laugo',
    title: 'Punong Barangay · Executive Signatory',
    roleBadge: 'Barangay Captain',
    username: 'capt.laugo',
    passwordHint: 'Salted BCrypt ($2a$10$)',
    actualPassword: 'CaptainAuth@2026!'
  }
};

export const SignInPage: React.FC<SignInPageProps> = ({ 
  onAuthSuccess, 
  sessionExpiredNotice,
  onClearExpiredNotice
}) => {
  // Main two authentication modes: 'signin' or 'register'
  const [isRegister, setIsRegister] = useState<boolean>(false);
  const [showForgotPassword, setShowForgotPassword] = useState<boolean>(false);
  const [showAccountGuide, setShowAccountGuide] = useState<boolean>(false);
  const [resetSuccessMsg, setResetSuccessMsg] = useState<string>('');
  
  // Login credentials
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  
  // MFA Challenge State (for accounts with 2FA enabled)
  const [mfaChallengeActive, setMfaChallengeActive] = useState<boolean>(false);
  const [mfaCode, setMfaCode] = useState<string>('');
  const [customDestinationEmail, setCustomDestinationEmail] = useState<string>('');
  const [mfaTargetUser, setMfaTargetUser] = useState<{
    id: string;
    username: string;
    role: string;
    fullName: string;
    email?: string;
    maskedEmail?: string;
    mfaType?: string;
    demoOtp?: string;
    emailDelivered?: boolean;
    emailError?: string;
  } | null>(null);

  // Google Sign-In Fallback State
  const [showGoogleFastTrack, setShowGoogleFastTrack] = useState<boolean>(false);
  const [googleFastEmail, setGoogleFastEmail] = useState<string>('');

  // Registration fields
  const [regFirstName, setRegFirstName] = useState<string>('');
  const [regMiddleName, setRegMiddleName] = useState<string>('');
  const [regLastName, setRegLastName] = useState<string>('');
  const [regSuffix, setRegSuffix] = useState<string>('');
  const [regEmail, setRegEmail] = useState<string>('');
  const [regContactNumber, setRegContactNumber] = useState<string>('');
  const [regPurokZone, setRegPurokZone] = useState<string>('Purok 1');
  const [regStreetAddress, setRegStreetAddress] = useState<string>('');
  const [regBirthDate, setRegBirthDate] = useState<string>('1995-06-15');
  const [regCivilStatus, setRegCivilStatus] = useState<string>('Single');
  const [regGender, setRegGender] = useState<string>('Male');
  const [regUsername, setRegUsername] = useState<string>('');
  const [regPassword, setRegPassword] = useState<string>('');
  const [regConfirmPassword, setRegConfirmPassword] = useState<string>('');
  const [showRegPassword, setShowRegPassword] = useState<boolean>(false);
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState<boolean>(false);

  // Resident ID Attachment fields
  const [regIdType, setRegIdType] = useState<string>('Philippine National ID (PhilSys)');
  const [regCustomIdType, setRegCustomIdType] = useState<string>('');
  const [regIdNumber, setRegIdNumber] = useState<string>('');
  const [regIdPhotoUrl, setRegIdPhotoUrl] = useState<string>('');
  const [regIdPhotoName, setRegIdPhotoName] = useState<string>('');
  const [regIdPreviewModal, setRegIdPreviewModal] = useState<boolean>(false);
  const [regIdConsentAgreed, setRegIdConsentAgreed] = useState<boolean>(false);
  const [showIdConsentModal, setShowIdConsentModal] = useState<boolean>(false);
  const [consentModalChecked, setConsentModalChecked] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [nameHadNumberWarning, setNameHadNumberWarning] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [googleLoading, setGoogleLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Close guide modal on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowAccountGuide(false);
        setShowIdConsentModal(false);
        setRegIdPreviewModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleTriggerIdUpload = () => {
    if (!regIdConsentAgreed) {
      setConsentModalChecked(false);
      setShowIdConsentModal(true);
    } else {
      fileInputRef.current?.click();
    }
  };

  const handleConfirmConsent = () => {
    setRegIdConsentAgreed(true);
    setShowIdConsentModal(false);
    setTimeout(() => {
      fileInputRef.current?.click();
    }, 150);
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setErrorMsg('');
    try {
      const res = await signInWithGoogleFirebase();
      if (res.success && res.user && res.token) {
        apiClient.setToken(res.token);
        if (res.isAccountLinked) {
          setResetSuccessMsg(`Welcome back! Your Google account (${res.user.email}) has been automatically linked to your registered resident profile.`);
        }
        onAuthSuccess(res.user, res.profile);
      } else if (res.error) {
        setErrorMsg(res.error);
        setShowGoogleFastTrack(true);
      }
    } catch (e: any) {
      setErrorMsg(e.message || 'Google Sign-In failed.');
      setShowGoogleFastTrack(true);
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleGoogleFastLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!googleFastEmail.trim() || !googleFastEmail.includes('@')) {
      setErrorMsg('Please enter your valid Google Gmail address.');
      return;
    }
    setGoogleLoading(true);
    setErrorMsg('');
    try {
      const res = await apiClient.googleFastLogin({
        email: googleFastEmail.trim().toLowerCase(),
        displayName: googleFastEmail.split('@')[0]
      });
      if (res.success && res.user && res.token) {
        onAuthSuccess(res.user, res.profile);
      } else {
        setErrorMsg(res.error || 'Google sign-in could not be completed.');
      }
    } catch (e: any) {
      setErrorMsg(e.message || 'Google Sign-In failed.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleNameInput = (value: string, setter: (val: string) => void) => {
    if (/[0-9]/.test(value)) {
      setNameHadNumberWarning(true);
      setTimeout(() => setNameHadNumberWarning(false), 3000);
    }
    setter(value.replace(/[0-9]/g, ''));
  };

  const handleIdFileUpload = (file: File) => {
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg('Uploaded ID image must be smaller than 10MB.');
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'application/pdf'];
    const lowerType = file.type.toLowerCase();
    const hasValidExtension = /\.(jpe?g|png|webp|pdf)$/i.test(file.name);

    if (!allowedTypes.includes(lowerType) && !hasValidExtension) {
      setErrorMsg('Invalid file format. Please upload an image (PNG, JPEG, WebP) or PDF file.');
      return;
    }

    const cleanFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const reader = new FileReader();
    reader.onload = () => {
      setRegIdPhotoUrl(reader.result as string);
      setRegIdPhotoName(cleanFileName);
      setErrorMsg('');
    };
    reader.onerror = () => {
      setErrorMsg('Failed to process ID file. Please choose another image.');
    };
    reader.readAsDataURL(file);
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
    setResetSuccessMsg('');

    // Case A: Create Account / Registration
    if (isRegister) {
      if (!regFirstName.trim() || !regLastName.trim()) {
        setErrorMsg('Please enter your First Name and Last Name.');
        return;
      }

      if (/[0-9]/.test(regFirstName) || /[0-9]/.test(regLastName) || (regMiddleName && /[0-9]/.test(regMiddleName))) {
        setErrorMsg('Numbers are not permitted in first, middle, or last name fields.');
        return;
      }

      if (!regUsername.trim()) {
        setErrorMsg('Please choose a username.');
        return;
      }

      if (regPassword.length < 8) {
        setErrorMsg('Password must be at least 8 characters long.');
        return;
      }

      const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(regPassword);
      if (!hasSpecialChar) {
        setErrorMsg('Password must contain at least one special character (e.g. ! @ # $ %).');
        return;
      }

      if (regPassword !== regConfirmPassword) {
        setErrorMsg('Password and Confirm Password do not match.');
        return;
      }

      if (!regIdConsentAgreed) {
        setErrorMsg('Please review and accept the ID verification consent agreement.');
        return;
      }

      if (!regIdPhotoUrl) {
        setErrorMsg('Please upload a clear picture of your valid Government or Barangay ID document.');
        return;
      }

      const cleanContact = regContactNumber.replace(/[^0-9]/g, '');
      if (cleanContact.length !== 11) {
        setErrorMsg('Mobile contact number must be exactly 11 numeric digits (e.g. 09171234567).');
        return;
      }

      if (regIdType === 'Other Valid ID / Document' && !regCustomIdType.trim()) {
        setErrorMsg('Please specify the type or name of your ID document.');
        return;
      }

      const selectedIdType = regIdType === 'Other Valid ID / Document'
        ? (regCustomIdType.trim() || 'Other Valid Document')
        : regIdType;

      setLoading(true);
      const res = await apiClient.register({
        username: regUsername.trim().toLowerCase(),
        password: regPassword,
        email: regEmail.trim().toLowerCase(),
        firstName: regFirstName.trim(),
        middleName: regMiddleName.trim(),
        lastName: regLastName.trim(),
        suffix: regSuffix.trim(),
        birthDate: regBirthDate,
        civilStatus: regCivilStatus,
        gender: regGender,
        purokZone: regPurokZone,
        streetAddress: regStreetAddress.trim(),
        yearsOfResidency: 5,
        contactNumber: cleanContact,
        idType: selectedIdType,
        idNumber: regIdNumber.trim(),
        idPhotoUrl: regIdPhotoUrl,
        idPhotoName: regIdPhotoName
      });
      setLoading(false);

      if (res.success && res.user) {
        if (regEmail && regEmail.includes('@')) {
          registerUserInFirebaseAuth(regEmail, regPassword).catch(() => {});
        }
        onAuthSuccess(res.user, res.profile);
      } else {
        setErrorMsg(res.error || 'Registration failed. Please check your details.');
      }
      return;
    }

    // Case B: MFA 2-Factor Authentication Code Verification
    if (mfaChallengeActive) {
      if (!mfaCode.trim()) {
        setErrorMsg('Please enter the 6-digit security code.');
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
        onAuthSuccess(res.user, res.user.role === 'resident' ? res.profile : undefined);
        handleResetChallenge();
      } else {
        setErrorMsg(res.error || 'Invalid 6-digit security code. Please check and try again.');
      }
      return;
    }

    // Case C: Standard Sign In
    if (!username.trim() || !password) {
      setErrorMsg('Please enter both your Username and Password.');
      return;
    }

    setLoading(true);
    const cleanUser = username.trim().toLowerCase();
    const res = await apiClient.login(cleanUser, password);
    setLoading(false);

    if (res.success) {
      setLoading(false);
      if (res.mfaRequired && !res.user) {
        setMfaChallengeActive(true);
        setMfaTargetUser({
          id: res.userId || '',
          username: res.username || username,
          role: res.role || 'resident',
          fullName: res.fullName || username,
          email: res.email,
          maskedEmail: res.maskedEmail || `${username}@gmail.com`,
          mfaType: res.mfaType || 'gmail',
          demoOtp: res.demoOtp,
          emailDelivered: res.emailDelivered,
          emailError: res.emailError
        });
        setMfaCode('');
        setResetSuccessMsg(
          res.emailDelivered
            ? `Security code dispatched to your Gmail (${res.email || res.maskedEmail}).`
            : `Security code generated for ${res.email || res.maskedEmail}.`
        );
      } else if (res.user) {
        onAuthSuccess(res.user, res.user.role === 'resident' ? res.profile : undefined);
      }
    } else {
      // AUTOMATIC FIREBASE PASSWORD SYNC:
      // If portal login rejects the password, check if the resident reset their password via Google Firebase email link.
      const targetEmail = res.userEmail || (cleanUser.includes('@') ? cleanUser : null);
      if (targetEmail && targetEmail.includes('@')) {
        try {
          const fbCheck = await verifyFirebasePassword(targetEmail, password);
          if (fbCheck.success && fbCheck.user) {
            // Validated against Firebase Auth! Update local portal password hash immediately
            const syncRes = await apiClient.syncFirebasePassword({
              email: targetEmail,
              username: cleanUser,
              newPassword: password,
              firebaseUid: fbCheck.user.uid,
              idToken: fbCheck.idToken
            });
            setLoading(false);
            if (syncRes.success) {
              if (syncRes.mfaRequired && !syncRes.user) {
                setMfaChallengeActive(true);
                setMfaTargetUser({
                  id: syncRes.userId || '',
                  username: syncRes.username || username,
                  role: syncRes.role || 'resident',
                  fullName: syncRes.fullName || username,
                  email: syncRes.email,
                  maskedEmail: syncRes.maskedEmail || `${username}@gmail.com`,
                  mfaType: 'gmail',
                  demoOtp: syncRes.demoOtp,
                  emailDelivered: syncRes.emailDelivered,
                  emailError: syncRes.emailError
                });
                setMfaCode('');
                setResetSuccessMsg(
                  syncRes.emailDelivered
                    ? `New password verified! 6-digit verification code dispatched to your Gmail (${syncRes.email || syncRes.maskedEmail}).`
                    : `New password verified! 6-digit verification code generated for ${syncRes.email || syncRes.maskedEmail}.`
                );
                return;
              } else if (syncRes.user && syncRes.token) {
                setResetSuccessMsg('New Firebase reset password verified! Your portal account has been synchronized successfully.');
                onAuthSuccess(syncRes.user, syncRes.user.role === 'resident' ? syncRes.profile : undefined);
                return;
              }
            }
          }
        } catch (syncErr) {
          console.warn('[Firebase Auth] Auto-sync attempt error:', syncErr);
        }
      }

      setLoading(false);
      if (res.passwordResetPending) {
        setErrorMsg('A password reset was requested for this account and your previous password has been invalidated. Please sign in with the new password you set via your Gmail link.');
      } else {
        setErrorMsg(res.error || 'Invalid credentials. Please verify your username and password.');
      }
    }
  };

  const handleResendMfaCode = async () => {
    if (!mfaTargetUser) return;
    setLoading(true);
    setErrorMsg('');
    const emailToSend = customDestinationEmail.trim() ? customDestinationEmail.trim() : undefined;
    const res = await apiClient.resendMfaOtp({
      userId: mfaTargetUser.id,
      username: mfaTargetUser.username,
      destinationEmail: emailToSend
    });
    setLoading(false);
    if (res.success) {
      setMfaTargetUser({
        ...mfaTargetUser,
        email: res.email,
        maskedEmail: res.maskedEmail,
        demoOtp: res.demoOtp,
        emailDelivered: res.emailDelivered,
        emailError: res.emailError
      });
      setMfaCode('');
      setResetSuccessMsg(
        res.emailDelivered
          ? `A fresh 6-digit code was sent to ${res.email || res.maskedEmail}.`
          : `A fresh 6-digit code has been generated.`
      );
    } else {
      setErrorMsg(res.error || 'Failed to resend verification code.');
    }
  };

  return (
    <div className="min-h-screen ios-blur-canvas text-slate-100 flex flex-col justify-between font-sans selection:bg-blue-600 selection:text-white relative overflow-x-hidden">
      
      {/* Dynamic Ambient Background Glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-500/20 rounded-full blur-[100px]" />
        <div className="absolute top-1/4 -right-20 w-[30rem] h-[30rem] bg-indigo-500/15 rounded-full blur-[120px]" />
        <div className="absolute -bottom-20 left-1/3 w-[32rem] h-[32rem] bg-sky-500/15 rounded-full blur-[110px]" />
      </div>

      {/* Main Content Container: Clean, Centered, Professional iOS Glassmorphism Layout */}
      <main className="flex-1 w-full max-w-lg mx-auto px-4 py-8 sm:py-12 flex flex-col justify-center items-center relative z-10">
        
        {/* Central Frosted Glass Card */}
        <div className="ios-glass w-full rounded-[2.25rem] p-6 sm:p-8 border border-white/70 shadow-2xl text-slate-900 relative">
          
          {/* Header Brand Lockup: Official Seal of Barangay Cabucbucan */}
          <div className="flex flex-col items-center text-center pb-5 mb-5 border-b border-slate-200/70">
            <div className="relative mb-3 group">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-white/80 p-1.5 border border-white/90 shadow-md backdrop-blur-md flex items-center justify-center overflow-hidden transition-transform duration-300 group-hover:scale-105">
                <img
                  src="/brgy_seal.jpg"
                  alt="Official Seal of Barangay Cabucbucan"
                  className="w-full h-full object-contain rounded-2xl"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="absolute -inset-1 bg-blue-400/20 rounded-3xl blur-md -z-10" />
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-snug">
              Barangay Cabucbucan
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Municipality of Rizal · Province of Nueva Ecija
            </p>
            <div className="inline-block mt-2 px-3 py-1 bg-blue-50 border border-blue-200/80 rounded-full text-[11px] font-bold text-blue-800 tracking-wide">
              Official Civil Registry & E-Services Portal
            </div>
          </div>

          {/* Dual Action Switcher: Only 2 Primary Actions (Sign In & Create Account) */}
          {!mfaChallengeActive && (
            <div className="mb-4">
              <div className="flex bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200 shadow-inner">
                <button
                  type="button"
                  onClick={() => {
                    setIsRegister(false);
                    setErrorMsg('');
                    setResetSuccessMsg('');
                  }}
                  className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    !isRegister
                      ? 'bg-blue-600 text-white shadow-md font-extrabold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                  }`}
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsRegister(true);
                    setErrorMsg('');
                    setResetSuccessMsg('');
                  }}
                  className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    isRegister
                      ? 'bg-blue-600 text-white shadow-md font-extrabold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                  }`}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Create Account</span>
                </button>
              </div>

              {/* Account Creation Guide Link (Subtle, Noticeable Help Element) */}
              <div className="flex items-center justify-end mt-2 px-1">
                <button
                  type="button"
                  onClick={() => setShowAccountGuide(true)}
                  className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 hover:text-blue-700 transition-colors cursor-pointer group"
                  aria-label="How to create an account"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-blue-600 group-hover:scale-110 transition-transform" />
                  <span className="underline decoration-slate-300 group-hover:decoration-blue-600 underline-offset-2">
                    How to create an account
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Session Expired Notice */}
            {sessionExpiredNotice && (
              <div className="p-3 bg-amber-50/90 border border-amber-300 rounded-2xl text-amber-900 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <strong className="block font-bold">Session Notice</strong>
                  <p className="text-[11px] text-amber-800 leading-snug">{sessionExpiredNotice}</p>
                </div>
                {onClearExpiredNotice && (
                  <button
                    type="button"
                    onClick={onClearExpiredNotice}
                    className="text-amber-700 hover:text-amber-900 text-[11px] font-bold underline cursor-pointer"
                  >
                    Dismiss
                  </button>
                )}
              </div>
            )}

            {/* Success Message Banner */}
            {resetSuccessMsg && (
              <div className="p-3 bg-emerald-50/90 border border-emerald-300 rounded-2xl text-emerald-800 text-xs flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span className="text-[11px] leading-snug">{resetSuccessMsg}</span>
              </div>
            )}

            {/* Error Banner */}
            {errorMsg && (
              <div className="p-3 bg-rose-50/90 border border-rose-300 rounded-2xl text-rose-800 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span className="text-[11px] leading-snug">{errorMsg}</span>
              </div>
            )}

            {/* CASE 1: RESIDENT GMAIL 2FA VERIFICATION STEP */}
            {mfaChallengeActive ? (
              <div className="space-y-4">
                <div className="p-3.5 bg-blue-50/90 border border-blue-200 rounded-2xl text-xs space-y-2 text-slate-700">
                  <div className="font-bold text-slate-900 flex items-center justify-between">
                    <span className="flex items-center gap-1.5 font-extrabold text-blue-950">
                      <Mail className="w-4 h-4 text-blue-600" />
                      <span>Resident Security Verification</span>
                    </span>
                    <span className="text-[10px] font-mono font-bold text-blue-700 bg-blue-100/90 px-2 py-0.5 rounded-full">
                      {mfaTargetUser?.emailDelivered ? 'Gmail Delivered' : 'Code Active'}
                    </span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-slate-600">
                    A 6-digit verification code has been dispatched to your registered Gmail address:{' '}
                    <strong className="text-slate-900 font-extrabold">{mfaTargetUser?.email || mfaTargetUser?.maskedEmail}</strong>.
                    Open your Gmail inbox or spam folder, copy the code, and paste it below to enter your resident portal.
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-700 block">
                      6-Digit Gmail Verification Code
                    </label>
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          const text = await navigator.clipboard.readText();
                          const clean = text.replace(/[^0-9]/g, '').slice(0, 6);
                          if (clean) setMfaCode(clean);
                        } catch (err) {
                          console.warn('Clipboard read error:', err);
                        }
                      }}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 hover:text-blue-900 bg-blue-100/70 hover:bg-blue-100 px-2.5 py-1 rounded-xl transition-colors cursor-pointer"
                    >
                      <Clipboard className="w-3.5 h-3.5" />
                      <span>Paste Code</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    autoFocus
                    maxLength={6}
                    value={mfaCode}
                    onPaste={(e) => {
                      const pasted = e.clipboardData.getData('text');
                      const clean = pasted.replace(/[^0-9]/g, '').slice(0, 6);
                      if (clean) {
                        e.preventDefault();
                        setMfaCode(clean);
                      }
                    }}
                    onChange={(e) => setMfaCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                    placeholder="123456"
                    className="w-full px-4 py-3 bg-white/95 border border-slate-300 rounded-2xl text-center text-2xl font-mono font-black tracking-[0.3em] text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-inner"
                  />
                  <p className="text-[10px] text-slate-500 mt-1 text-center font-medium">
                    Check your registered Gmail inbox for the 6-digit code
                  </p>
                </div>

                {/* Emergency code fallback shown only if email is in testing mode or failed live delivery */}
                {!mfaTargetUser?.emailDelivered && mfaTargetUser?.demoOtp && (
                  <div className="p-3 bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-between text-xs text-slate-600">
                    <div>
                      <span className="font-semibold text-slate-800 text-[11px]">Emergency Security Code:</span>
                      <span className="font-mono font-bold text-slate-900 ml-2 tracking-widest">{mfaTargetUser.demoOtp}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setMfaCode(mfaTargetUser.demoOtp || '')}
                      className="text-[11px] font-bold text-blue-700 hover:text-blue-900 underline cursor-pointer"
                    >
                      Use Code
                    </button>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 ios-btn-primary rounded-2xl text-xs font-bold cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{loading ? 'Verifying Code...' : 'Verify & Enter Portal'}</span>
                </button>

                <div className="flex items-center justify-between text-xs pt-1">
                  <button
                    type="button"
                    onClick={() => handleResendMfaCode()}
                    disabled={loading}
                    className="text-blue-600 hover:text-blue-800 font-bold underline cursor-pointer"
                  >
                    Resend Code
                  </button>
                  <button
                    type="button"
                    onClick={handleResetChallenge}
                    className="text-slate-500 hover:text-slate-700 cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : isRegister ? (
              /* CASE 2: CREATE ACCOUNT FORM (Full Registration) */
              <div className="space-y-3.5 max-h-[62vh] overflow-y-auto pr-1">
                
                {/* Full Name */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">First Name *</label>
                    <input
                      type="text"
                      required
                      value={regFirstName}
                      onChange={(e) => handleNameInput(e.target.value, setRegFirstName)}
                      placeholder="e.g. Maria"
                      className="w-full px-3 py-2 bg-white/80 border border-slate-300 rounded-xl text-xs text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Last Name *</label>
                    <input
                      type="text"
                      required
                      value={regLastName}
                      onChange={(e) => handleNameInput(e.target.value, setRegLastName)}
                      placeholder="e.g. Santos"
                      className="w-full px-3 py-2 bg-white/80 border border-slate-300 rounded-xl text-xs text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {nameHadNumberWarning && (
                  <p className="text-[10px] text-rose-600 font-medium">
                    Numbers are not permitted in name fields.
                  </p>
                )}

                {/* Middle Name and Suffix (Optional) */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">Middle Name</label>
                    <input
                      type="text"
                      value={regMiddleName}
                      onChange={(e) => handleNameInput(e.target.value, setRegMiddleName)}
                      placeholder="e.g. Clara"
                      className="w-full px-3 py-2 bg-white/80 border border-slate-300 rounded-xl text-xs text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">Suffix</label>
                    <input
                      type="text"
                      value={regSuffix}
                      onChange={(e) => setRegSuffix(e.target.value)}
                      placeholder="Jr., Sr., III"
                      className="w-full px-3 py-2 bg-white/80 border border-slate-300 rounded-xl text-xs text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Purok & Street */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Purok / Zone *</label>
                    <select
                      value={regPurokZone}
                      onChange={(e) => setRegPurokZone(e.target.value)}
                      className="w-full px-3 py-2 bg-white/80 border border-slate-300 rounded-xl text-xs text-slate-900 font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Purok 1">Purok 1</option>
                      <option value="Purok 2">Purok 2</option>
                      <option value="Purok 3">Purok 3</option>
                      <option value="Purok 4">Purok 4</option>
                      <option value="Purok 5">Purok 5</option>
                      <option value="Purok 6">Purok 6</option>
                      <option value="Purok 7">Purok 7</option>
                      <option value="Sitio Maligaya">Sitio Maligaya</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Street Address</label>
                    <input
                      type="text"
                      value={regStreetAddress}
                      onChange={(e) => setRegStreetAddress(e.target.value)}
                      placeholder="House / Street"
                      className="w-full px-3 py-2 bg-white/80 border border-slate-300 rounded-xl text-xs text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Contact & Email */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      Mobile Number (11 digits) *
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={11}
                      value={regContactNumber}
                      onChange={(e) => setRegContactNumber(e.target.value.replace(/[^0-9]/g, ''))}
                      placeholder="09171234567"
                      className="w-full px-3 py-2 bg-white/80 border border-slate-300 rounded-xl text-xs font-mono text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="maria@gmail.com"
                      className="w-full px-3 py-2 bg-white/80 border border-slate-300 rounded-xl text-xs text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Civil Status & Gender */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      Civil Status *
                    </label>
                    <select
                      value={regCivilStatus}
                      onChange={(e) => setRegCivilStatus(e.target.value)}
                      className="w-full px-3 py-2 bg-white/80 border border-slate-300 rounded-xl text-xs text-slate-900 font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Single">Single</option>
                      <option value="Married">Married</option>
                      <option value="Widowed">Widowed</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      Gender *
                    </label>
                    <select
                      value={regGender}
                      onChange={(e) => setRegGender(e.target.value)}
                      className="w-full px-3 py-2 bg-white/80 border border-slate-300 rounded-xl text-xs text-slate-900 font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>
                </div>

                {/* Government ID Attachment */}
                <div className="p-3 bg-slate-100/90 border border-slate-200 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800">Valid ID Document *</span>
                    {regIdPhotoUrl ? (
                      <span className="text-emerald-700 font-bold text-[11px] flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> ID Attached
                      </span>
                    ) : (
                      <span className="text-slate-500 text-[11px]">Required for Verification</span>
                    )}
                  </div>

                  <select
                    value={regIdType}
                    onChange={(e) => setRegIdType(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Philippine National ID (PhilSys)">Philippine National ID (PhilSys)</option>
                    <option value="Student / School ID">Student / School ID</option>
                    <option value="Unified Multi-Purpose ID (UMID)">Unified Multi-Purpose ID (UMID)</option>
                    <option value="Driver's License (LTO)">Driver's License (LTO)</option>
                    <option value="Voter's ID / Comelec Certificate">Voter's ID / Comelec Certificate</option>
                    <option value="Philippine Passport">Philippine Passport</option>
                    <option value="Postal ID (PhilPost)">Postal ID (PhilPost)</option>
                    <option value="Barangay Resident ID">Barangay Resident ID</option>
                    <option value="Senior Citizen ID">Senior Citizen ID</option>
                    <option value="Person with Disability (PWD) ID">Person with Disability (PWD) ID</option>
                    <option value="PRC Professional License">PRC Professional License</option>
                    <option value="PhilHealth / Pag-IBIG ID">PhilHealth / Pag-IBIG ID</option>
                    <option value="Other Valid ID / Document">Other Valid ID / Document</option>
                  </select>

                  {/* Note for Student / School ID */}
                  {regIdType === 'Student / School ID' && (
                    <div className="p-2.5 bg-blue-50/90 border border-blue-200 rounded-xl text-[11px] text-blue-900 leading-snug">
                      <strong>Student Notice:</strong> You may upload your current school ID card (with valid academic year) or your latest Certificate of Matriculation / Registration.
                    </div>
                  )}

                  {/* Custom Specification Input when "Other Valid ID / Document" is chosen */}
                  {regIdType === 'Other Valid ID / Document' && (
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">
                        Specify ID / Document Type *
                      </label>
                      <input
                        type="text"
                        required
                        value={regCustomIdType}
                        onChange={(e) => setRegCustomIdType(e.target.value)}
                        placeholder="e.g. Employee ID, Alumni Card, NBI Clearance"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  )}

                  {/* ID / Student / Document Number (Optional) */}
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                      {regIdType === 'Student / School ID' ? 'Student ID Number (Optional)' : 'ID / Document Number (Optional)'}
                    </label>
                    <input
                      type="text"
                      value={regIdNumber}
                      onChange={(e) => setRegIdNumber(e.target.value)}
                      placeholder={regIdType === 'Student / School ID' ? 'e.g. 2026-10492' : 'e.g. PhilSys / License / Card No.'}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleTriggerIdUpload}
                      className="flex-1 py-2 px-3 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 cursor-pointer flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                    >
                      <UploadCloud className="w-3.5 h-3.5 text-blue-600" />
                      <span>{regIdPhotoUrl ? 'Change ID Photo' : 'Upload ID Picture'}</span>
                    </button>
                    {regIdPhotoUrl && (
                      <button
                        type="button"
                        onClick={() => setRegIdPreviewModal(true)}
                        className="px-3 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold hover:bg-blue-100 cursor-pointer"
                      >
                        Preview
                      </button>
                    )}
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleIdFileUpload(file);
                    }}
                    className="hidden"
                  />
                </div>

                {/* Desired Username & Password */}
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Username *</label>
                  <input
                    type="text"
                    required
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                    placeholder="e.g. maria.santos"
                    className="w-full px-3 py-2 bg-white/80 border border-slate-300 rounded-xl text-xs text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Password *</label>
                    <div className="relative">
                      <input
                        type={showRegPassword ? 'text' : 'password'}
                        required
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="min 8 chars"
                        className="w-full pl-3 pr-8 py-2 bg-white/80 border border-slate-300 rounded-xl text-xs text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegPassword(!showRegPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showRegPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Confirm *</label>
                    <div className="relative">
                      <input
                        type={showRegConfirmPassword ? 'text' : 'password'}
                        required
                        value={regConfirmPassword}
                        onChange={(e) => setRegConfirmPassword(e.target.value)}
                        placeholder="re-type"
                        className="w-full pl-3 pr-8 py-2 bg-white/80 border border-slate-300 rounded-xl text-xs text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegConfirmPassword(!showRegConfirmPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showRegConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                {regPassword && (
                  <PasswordStrengthMeter password={regPassword} />
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 ios-btn-primary rounded-2xl text-xs font-bold cursor-pointer disabled:opacity-50 mt-2 flex items-center justify-center gap-2"
                >
                  {loading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{loading ? 'Submitting Registration...' : 'Create Account'}</span>
                </button>

                <div className="text-center pt-2 border-t border-slate-200/60 text-xs text-slate-500">
                  <span>Already have a registered account? </span>
                  <button
                    type="button"
                    onClick={() => {
                      setIsRegister(false);
                      setErrorMsg('');
                    }}
                    className="font-bold text-blue-600 hover:text-blue-800 underline cursor-pointer"
                  >
                    Sign In
                  </button>
                </div>
              </div>
            ) : (
              /* CASE 3: PRIMARY SIGN IN FORM */
              <div className="space-y-4">
                
                {/* Google Sign-In (Firebase Authentication) */}
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={googleLoading}
                    className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 text-slate-800 font-bold rounded-2xl text-xs flex items-center justify-center gap-2.5 border border-slate-300 shadow-sm hover:border-slate-400 transition-all cursor-pointer disabled:opacity-60"
                  >
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span>{googleLoading ? 'Connecting to Google...' : 'Sign In with Google'}</span>
                  </button>

                  {!showGoogleFastTrack ? (
                    <div className="text-center">
                      <button
                        type="button"
                        onClick={() => setShowGoogleFastTrack(true)}
                        className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold cursor-pointer underline"
                      >
                        Can't open Google popup? Sign in directly with Google Email
                      </button>
                    </div>
                  ) : (
                    <div className="p-3 bg-blue-50/90 border border-blue-200 rounded-2xl space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                        <span>Direct Google Email Login</span>
                        <button
                          type="button"
                          onClick={() => setShowGoogleFastTrack(false)}
                          className="text-slate-400 hover:text-slate-600 cursor-pointer text-[10px]"
                        >
                          Hide
                        </button>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-snug">
                        Enter your verified Google Gmail address to enter without popup restrictions:
                      </p>
                      <div className="flex gap-2">
                        <input
                          type="email"
                          value={googleFastEmail}
                          onChange={(e) => setGoogleFastEmail(e.target.value)}
                          placeholder="your.email@gmail.com"
                          className="flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                          type="button"
                          onClick={handleGoogleFastLogin}
                          disabled={googleLoading}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 cursor-pointer whitespace-nowrap"
                        >
                          {googleLoading ? 'Verifying...' : 'Sign In'}
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="relative flex items-center justify-center">
                    <div className="border-t border-slate-200/90 w-full" />
                    <span className="bg-white/90 px-3 text-[10px] uppercase font-bold text-slate-400 absolute rounded-full">
                      or with credentials
                    </span>
                  </div>
                </div>

                {/* Username or Email Input */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Username or Registered Email
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="e.g. maria.santos"
                      className="w-full pl-10 pr-3 py-2.5 ios-glass-input rounded-2xl text-xs text-slate-900 font-medium focus:outline-none"
                    />
                  </div>
                </div>

                {/* Password Input */}
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
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full pl-10 pr-10 py-2.5 ios-glass-input rounded-2xl text-xs text-slate-900 font-medium focus:outline-none font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Primary Sign In Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 ios-btn-primary rounded-2xl text-xs font-bold cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 shadow-md"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Authenticating...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>Sign In</span>
                    </>
                  )}
                </button>

                {/* Footer Switcher to Create Account */}
                <div className="text-center pt-2 border-t border-slate-200/60 text-xs text-slate-500">
                  <span>Don't have an account yet? </span>
                  <button
                    type="button"
                    onClick={() => {
                      setIsRegister(true);
                      setErrorMsg('');
                    }}
                    className="font-bold text-blue-600 hover:text-blue-800 underline cursor-pointer"
                  >
                    Create Account
                  </button>
                </div>
              </div>
            )}
          </form>

        </div>
      </main>

      {/* Clean Frosted Glass Institutional Footer */}
      <footer className="w-[94%] max-w-lg mx-auto my-4 text-slate-400 text-xs relative z-10">
        <div className="ios-glass-dark rounded-2xl px-5 py-3 flex items-center justify-center text-center border border-white/10 shadow-lg">
          <span className="text-slate-300 text-xs font-medium">
            Barangay Government of Cabucbucan · Rizal, Nueva Ecija · Office Hours: Mon–Fri 8:00 AM – 5:00 PM
          </span>
        </div>
      </footer>

      {/* Account Creation Guide Modal */}
      {showAccountGuide && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setShowAccountGuide(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="guide-modal-title"
        >
          <div 
            className="bg-white rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 text-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white flex items-center justify-between border-b border-blue-900/40">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-blue-300">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 id="guide-modal-title" className="text-sm font-bold text-white tracking-tight">
                    How to Create an Account
                  </h3>
                  <p className="text-[11px] text-blue-200/80">
                    Official Resident Registration Guide
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAccountGuide(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
                aria-label="Close Guide"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Guide Step-by-Step Content */}
            <div className="p-5 space-y-3.5 max-h-[70vh] overflow-y-auto text-xs">
              <p className="text-slate-600 leading-relaxed text-[11px]">
                Follow these clear steps to register your resident profile in the Barangay Cabucbucan civil registry system:
              </p>

              <ol className="space-y-2.5 text-xs">
                <li className="flex items-start gap-2.5 p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                    1
                  </span>
                  <div className="text-slate-700 leading-snug">
                    <strong className="text-slate-900">Click Create Account:</strong> Choose the Create Account action on the portal entrance.
                  </div>
                </li>

                <li className="flex items-start gap-2.5 p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                    2
                  </span>
                  <div className="text-slate-700 leading-snug">
                    <strong className="text-slate-900">Complete Registration Fields:</strong> Provide your correct legal information (First Name, Last Name, Purok address in Barangay Cabucbucan, and mobile number).
                  </div>
                </li>

                <li className="flex items-start gap-2.5 p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                    3
                  </span>
                  <div className="text-slate-700 leading-snug">
                    <strong className="text-slate-900">Enter a Valid Email:</strong> Provide a valid email address (Gmail) to receive security notifications and verification codes.
                  </div>
                </li>

                <li className="flex items-start gap-2.5 p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                    4
                  </span>
                  <div className="text-slate-700 leading-snug">
                    <strong className="text-slate-900">Create a Secure Password:</strong> Set a password with at least 8 characters including special characters, and confirm it.
                  </div>
                </li>

                <li className="flex items-start gap-2.5 p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                    5
                  </span>
                  <div className="text-slate-700 leading-snug">
                    <strong className="text-slate-900">Attach Valid ID:</strong> Upload a clear image of your valid ID (PhilSys, Student/School ID, Driver's License, UMID, Postal, or other valid document) for identity verification with privacy consent.
                  </div>
                </li>

                <li className="flex items-start gap-2.5 p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                    6
                  </span>
                  <div className="text-slate-700 leading-snug">
                    <strong className="text-slate-900">Review & Submit:</strong> Review your details carefully and submit your registration form.
                  </div>
                </li>

                <li className="flex items-start gap-2.5 p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                    7
                  </span>
                  <div className="text-slate-700 leading-snug">
                    <strong className="text-slate-900">Sign In to Your Account:</strong> After successful registration, your account is immediately ready. You may return to Sign In anytime using your credentials.
                  </div>
                </li>
              </ol>

              {/* Security Privacy Notice */}
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-[11px] flex items-start gap-2">
                <Shield className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <p className="leading-snug">
                  <strong>Notice:</strong> Only create an account using your own valid information. Keep your password private and never share your security credentials.
                </p>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setShowAccountGuide(false)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl cursor-pointer transition-colors shadow-sm"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Forgot Password OTP Modal */}
      <ForgotPasswordModal
        isOpen={showForgotPassword}
        onClose={() => setShowForgotPassword(false)}
        onSuccess={(msg) => {
          setResetSuccessMsg(msg);
          setShowForgotPassword(false);
        }}
      />

      {/* Full ID Card Preview Modal */}
      {regIdPreviewModal && regIdPhotoUrl && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold">{regIdType}</h3>
                <p className="text-[11px] text-slate-300">
                  Attached proof of residency for {regFirstName || 'Resident'} {regLastName || 'Applicant'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setRegIdPreviewModal(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-slate-100 flex items-center justify-center min-h-[260px] max-h-[70vh] overflow-auto">
              <img
                src={regIdPhotoUrl}
                alt="Full ID Preview"
                className="max-w-full max-h-[60vh] object-contain rounded-2xl border border-slate-300 shadow-md bg-white"
                referrerPolicy="no-referrer"
              />
            </div>

            <div className="p-3.5 bg-white border-t border-slate-200 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-mono text-[11px]">
                {regIdPhotoName || 'valid_id.jpg'}
              </span>
              <button
                type="button"
                onClick={() => setRegIdPreviewModal(false)}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Resident Identity & Data Privacy Consent Modal */}
      {showIdConsentModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src="/brgy_seal.jpg"
                  alt="Seal of Barangay Cabucbucan"
                  className="w-9 h-9 object-contain rounded-full border border-white/20"
                  referrerPolicy="no-referrer"
                />
                <div>
                  <h3 className="text-sm font-bold text-white tracking-tight">
                    Resident Identity & ID Document Usage Consent
                  </h3>
                  <p className="text-[11px] text-blue-300 font-medium">
                    Official Barangay Civil Registry Verification
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowIdConsentModal(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto text-xs">
              <p className="text-slate-600 leading-relaxed">
                Before uploading your government-issued identification, please review and accept the official consent terms required by the Barangay Government of Cabucbucan under the Philippine Data Privacy Act.
              </p>

              <div className="space-y-2">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <span className="font-bold text-slate-900 block text-xs">1. Official Identity & Residency Verification</span>
                  <p className="text-[11px] text-slate-600">
                    Your identification document will be used exclusively by authorized Barangay Intake Staff to verify bona fide residency and prevent fraud.
                  </p>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <span className="font-bold text-slate-900 block text-xs">2. Encrypted Government Storage</span>
                  <p className="text-[11px] text-slate-600">
                    Uploaded document images are stored securely in encrypted municipal storage isolated from public webroot directories.
                  </p>
                </div>
              </div>

              <label className="flex items-start gap-2.5 p-3.5 bg-blue-50 border border-blue-200 rounded-2xl cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={consentModalChecked}
                  onChange={(e) => setConsentModalChecked(e.target.checked)}
                  className="mt-0.5 w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer shrink-0"
                />
                <span className="text-xs font-semibold text-slate-900 leading-snug">
                  I agree and consent to the upload, digital storage, and verification of my government-issued ID solely for official barangay validation.
                </span>
              </label>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowIdConsentModal(false)}
                className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmConsent}
                disabled={!consentModalChecked}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl cursor-pointer flex items-center gap-1.5"
              >
                <UploadCloud className="w-3.5 h-3.5" />
                <span>Agree & Upload</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
