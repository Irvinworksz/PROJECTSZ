import React, { useState, useRef } from 'react';
import { 
  AlertCircle, CheckCircle2, Eye, EyeOff, FileCheck, FileText, 
  HelpCircle, Info, Lock, QrCode, Search, Shield, 
  ShieldAlert, ShieldCheck, Smartphone, User, UserCheck, 
  UserPlus, Users, ArrowRight, Award, Building, Check, RotateCcw,
  Mail, Phone, MapPin, Calendar, CheckCircle, BookOpen, ChevronRight,
  ClipboardList, Stamp, ShieldCheck as ShieldIcon, LogIn, ExternalLink,
  KeyRound, Zap, UploadCloud, Image as ImageIcon, X, CheckCheck, Terminal
} from 'lucide-react';
import { apiClient } from '../lib/api';
import { ForgotPasswordModal } from './ForgotPasswordModal';
import { PasswordStrengthMeter } from './PasswordStrengthMeter';
import { BackendAdminModal } from './BackendAdminModal';
import { PortalGuideModal } from './PortalGuideModal';
import { GmailSmtpModal } from './GmailSmtpModal';
import { FirebaseCloudConsoleModal } from './FirebaseCloudConsoleModal';
import { signInWithGoogleFirebase } from '../lib/firebase';
import type { ResidentProfile, User as UserType } from '../types';

interface SignInPageProps {
  onAuthSuccess: (user: UserType, profile?: ResidentProfile) => void;
  sessionExpiredNotice?: string | null;
  onClearExpiredNotice?: () => void;
  onOpenVerify?: () => void;
}

// Public Citizen & Municipal Roles (Admin account resides exclusively in Backend Infrastructure)
export type RoleGuideType = 'resident' | 'staff' | 'official';

export const ROLE_DEMO_ACCOUNTS: Record<'resident' | 'staff' | 'official', {
  name: string;
  title: string;
  roleBadge: string;
  badgeBg: string;
  username: string;
  passwordHint: string;
  actualPassword: string;
}> = {
  resident: {
    name: 'Maria Clara Santos',
    title: 'Constituent / Applicant (Purok 2)',
    roleBadge: 'Resident User',
    badgeBg: 'bg-blue-600 text-white',
    username: 'maria.santos',
    passwordHint: 'Salted BCrypt Hash ($2a$10$)',
    actualPassword: 'Resident@2026!'
  },
  staff: {
    name: 'Elena Ramos',
    title: 'Intake, Assessment & Verification Desk',
    roleBadge: 'Front Desk Officer',
    badgeBg: 'bg-emerald-600 text-white',
    username: 'staff.elena',
    passwordHint: 'Salted BCrypt Hash ($2a$10$)',
    actualPassword: 'StaffSecure@2026!'
  },
  official: {
    name: 'Hon. Cornelio Laugo',
    title: 'Punong Barangay / Executive Signatory',
    roleBadge: 'Barangay Captain',
    badgeBg: 'bg-purple-600 text-white',
    username: 'capt.laugo',
    passwordHint: 'Salted BCrypt Hash ($2a$10$)',
    actualPassword: 'CaptainAuth@2026!'
  }
};

interface RoleGuideData {
  title: string;
  badge: string;
  badgeColor: string;
  representative: string;
  description: string;
  accessRequirement: string;
  steps: { step: number; title: string; detail: string }[];
}

const ROLE_GUIDES: Record<'resident' | 'staff' | 'official', RoleGuideData> = {
  resident: {
    title: 'Resident Citizen Portal',
    badge: 'Citizen Access',
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-300',
    representative: 'Bona Fide Residents of Barangay Cabucbucan',
    description: 'For all bona fide residents of Barangay Cabucbucan applying for official documents, tracking requests, and viewing issued certificates.',
    accessRequirement: 'Self-service registration available. Residents may register their account using their personal name, contact information, and address.',
    steps: [
      {
        step: 1,
        title: 'Create Your Account',
        detail: 'Click "Register New" to create your free resident account with your name, purok, and contact details.'
      },
      {
        step: 2,
        title: 'Apply for Official Clearances',
        detail: 'Request Barangay Clearance, Certificate of Residency, Certificate of Indigency, or First-Time Jobseeker Certificate (RA 11261).'
      },
      {
        step: 3,
        title: 'Track Application Status',
        detail: 'Receive real-time tracking updates as Barangay Staff reviews your application and the Punong Barangay signs it.'
      },
      {
        step: 4,
        title: 'Download Authenticated Document',
        detail: 'Once approved, download or print your clearance containing the Punong Barangay\'s SHA-256 HMAC digital seal and QR verification code.'
      }
    ]
  },
  staff: {
    title: 'Barangay Desk Staff Portal',
    badge: 'Front-Desk Operations',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    representative: 'Designated Barangay Desk Officers & Clerks',
    description: 'For Barangay Hall staff in charge of receiving applications, verifying residency records, assessing fees, and forwarding documents for signing.',
    accessRequirement: 'Restricted staff operations. Staff accounts are provisioned exclusively through authorized administrative onboarding with RBAC.',
    steps: [
      {
        step: 1,
        title: 'Review Application Queue',
        detail: 'Access the real-time queue of incoming clearance and certificate applications submitted by residents.'
      },
      {
        step: 2,
        title: 'Verify Residency & Identity',
        detail: 'Cross-check applicant records against the local civil registry and confirm purok residency and eligibility.'
      },
      {
        step: 3,
        title: 'Assess Fees & Endorse to Captain',
        detail: 'Issue Official Receipts (OR) or apply RA 11261 zero-fee waivers, then endorse verified files to the Punong Barangay for digital signature.'
      }
    ]
  },
  official: {
    title: 'Punong Barangay (Captain) Portal',
    badge: 'Executive Signatory',
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-300',
    representative: 'Hon. Cornelio Laugo (Punong Barangay)',
    description: 'For the Barangay Captain to inspect endorsed clearance applications and apply the official cryptographic HMAC-SHA256 digital signature seal.',
    accessRequirement: 'Restricted executive access. Requires designated official credentials with cryptographic signing key authorization.',
    steps: [
      {
        step: 1,
        title: 'Inspect Signature Queue',
        detail: 'Review verified clearance requests endorsed by the desk staff with complete resident profiles.'
      },
      {
        step: 2,
        title: 'Apply Cryptographic Signature',
        detail: 'Digitally sign the document using the Captain\'s secure digital key fingerprint (SHA-256 HMAC non-repudiation).'
      },
      {
        step: 3,
        title: 'Issue QR-Sealed Certificates',
        detail: 'Approved documents are instantly minted with public QR codes, ready for resident collection and municipal verification.'
      }
    ]
  }
};

export const SignInPage: React.FC<SignInPageProps> = ({ 
  onAuthSuccess, 
  sessionExpiredNotice,
  onClearExpiredNotice,
  onOpenVerify
}) => {
  const [isRegister, setIsRegister] = useState<boolean>(false);
  const [showForgotPassword, setShowForgotPassword] = useState<boolean>(false);
  const [showBackendAdminModal, setShowBackendAdminModal] = useState<boolean>(false);
  const [showGuideModal, setShowGuideModal] = useState<boolean>(false);
  const [showGmailSmtpModal, setShowGmailSmtpModal] = useState<boolean>(false);
  const [showFirebaseModal, setShowFirebaseModal] = useState<boolean>(false);
  const [resetSuccessMsg, setResetSuccessMsg] = useState<string>('');
  
  // Selected Role for the Portal Context
  const [activeGuideRole, setActiveGuideRole] = useState<RoleGuideType>('resident');

  // Professional Role Selection: Switches portal context without auto-filling staff/captain passwords
  const handleSelectPortalRole = (role: 'resident' | 'staff' | 'official') => {
    setIsRegister(false);
    setMfaChallengeActive(false);
    setErrorMsg('');
    setActiveGuideRole(role);
    
    // Security standard: Staff and Captain credentials must never be auto-filled on a public interface
    setUsername('');
    setPassword('');
    
    if (role === 'staff') {
      setResetSuccessMsg('Barangay Staff Desk selected. Please enter your municipal personnel credentials.');
    } else if (role === 'official') {
      setResetSuccessMsg('Punong Barangay Executive Signatory Portal selected. Please enter your authorized executive credentials.');
    } else {
      setResetSuccessMsg('Resident Citizen Portal selected. Please enter your resident credentials or register.');
    }
  };

  const handleQuickFillRole = handleSelectPortalRole;

  // Login credentials (clean and empty by default, filled manually by the user)
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  
  // MFA Challenge State
  const [mfaChallengeActive, setMfaChallengeActive] = useState<boolean>(false);
  const [mfaCode, setMfaCode] = useState<string>('');
  const [userDestinationEmail, setUserDestinationEmail] = useState<string>('');
  const [showEmailEdit, setShowEmailEdit] = useState<boolean>(false);
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

  // Resident ID Attachment fields (for Barangay Staff verification)
  const [regIdType, setRegIdType] = useState<string>('Philippine National ID (PhilSys)');
  const [regIdNumber, setRegIdNumber] = useState<string>('');
  const [regIdPhotoUrl, setRegIdPhotoUrl] = useState<string>('');
  const [regIdPhotoName, setRegIdPhotoName] = useState<string>('');
  const [regIdPreviewModal, setRegIdPreviewModal] = useState<boolean>(false);
  const [regIdConsentAgreed, setRegIdConsentAgreed] = useState<boolean>(false);
  
  // Professional ID Upload Consent Dialog State (Republic Act No. 10173)
  const [showIdConsentModal, setShowIdConsentModal] = useState<boolean>(false);
  const [consentModalChecked, setConsentModalChecked] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // When resident clicks the button to upload ID picture:
  const handleTriggerIdUpload = () => {
    if (!regIdConsentAgreed) {
      setConsentModalChecked(false);
      setShowIdConsentModal(true);
    } else {
      fileInputRef.current?.click();
    }
  };

  // When resident confirms consent in the modal:
  const handleConfirmConsent = () => {
    setRegIdConsentAgreed(true);
    setShowIdConsentModal(false);
    setTimeout(() => {
      fileInputRef.current?.click();
    }, 150);
  };
  
  // Name validation warning flag
  const [nameHadNumberWarning, setNameHadNumberWarning] = useState<boolean>(false);
  
  const [loading, setLoading] = useState<boolean>(false);
  const [googleLoading, setGoogleLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setErrorMsg('');
    try {
      const res = await signInWithGoogleFirebase();
      if (res.success && res.user && res.token) {
        apiClient.setToken(res.token);
        onAuthSuccess(res.user, res.profile);
      } else if (res.error) {
        setErrorMsg(res.error);
      }
    } catch (e: any) {
      setErrorMsg(e.message || 'Google Sign-In failed.');
    } finally {
      setGoogleLoading(false);
    }
  };

  // Custom Gmail recipient configuration for testing live delivery
  const [customDestinationEmail, setCustomDestinationEmail] = useState<string>('');
  const [showCustomEmailInput, setShowCustomEmailInput] = useState<boolean>(false);

  // Helper to filter out numbers from names immediately
  const handleNameInput = (value: string, setter: (val: string) => void) => {
    if (/[0-9]/.test(value)) {
      setNameHadNumberWarning(true);
      setTimeout(() => setNameHadNumberWarning(false), 3000);
    }
    const sanitized = value.replace(/[0-9]/g, '');
    setter(sanitized);
  };

  // Helper to handle manual file upload of ID photo with strict Information Assurance & Security validation
  const handleIdFileUpload = (file: File) => {
    if (!file) return;

    // IAS Standard: File size limit enforcement (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg('Uploaded ID image must be smaller than 10MB.');
      return;
    }

    // IAS Standard: Strict MIME type validation against malicious executable payloads
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'application/pdf'];
    const lowerType = file.type.toLowerCase();
    const hasValidExtension = /\.(jpe?g|png|webp|pdf)$/i.test(file.name);

    if (!allowedTypes.includes(lowerType) && !hasValidExtension) {
      setErrorMsg('Invalid file format. For information assurance and security, only genuine image files (PNG, JPEG, WebP) or PDF documents are permitted.');
      return;
    }

    // Sanitize filename to prevent directory traversal or script injection
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setRegIdPhotoUrl(dataUrl);
      setRegIdPhotoName(cleanFileName);
      setErrorMsg('');
    };
    reader.onerror = () => {
      setErrorMsg('Failed to process ID file. Please select another image.');
    };
    reader.readAsDataURL(file);
  };

  // Reset/Clear all inputs in login form
  const handleClearLoginForm = () => {
    setUsername('');
    setPassword('');
    setErrorMsg('');
    setResetSuccessMsg('');
  };

  // Reset/Clear all inputs in registration form
  const handleClearRegisterForm = () => {
    setRegFirstName('');
    setRegMiddleName('');
    setRegLastName('');
    setRegSuffix('');
    setRegEmail('');
    setRegContactNumber('');
    setRegStreetAddress('');
    setRegPurokZone('Purok 1');
    setRegBirthDate('1995-06-15');
    setRegCivilStatus('Single');
    setRegGender('Male');
    setRegUsername('');
    setRegPassword('');
    setRegConfirmPassword('');
    setRegIdType('Philippine National ID (PhilSys)');
    setRegIdNumber('');
    setRegIdPhotoUrl('');
    setRegIdPhotoName('');
    setRegIdConsentAgreed(false);
    setErrorMsg('');
  };

  // When user clicks a role card in the directory, open its instructions guide ONLY (credentials are untouched)
  const handleSelectRoleGuide = (role: 'resident' | 'staff' | 'official') => {
    setActiveGuideRole(role);
    setErrorMsg('');
    setResetSuccessMsg('');
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
        setErrorMsg('Please choose a desired Username for logging in.');
        return;
      }

      if (!regPassword) {
        setErrorMsg('Please enter a secure Password.');
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

      if (!regIdConsentAgreed) {
        setErrorMsg('Please review and accept the ID verification and privacy consent agreement to proceed with registration.');
        return;
      }

      if (!regIdPhotoUrl) {
        setErrorMsg('Please upload a clear picture of your valid Government or Barangay ID document so Barangay Staff can verify your residency.');
        return;
      }

      // Mobile Contact Number Validation (Strictly 11 digits, numbers only, no special characters)
      const cleanContact = regContactNumber.replace(/[^0-9]/g, '');
      if (/[^0-9]/.test(regContactNumber.trim()) || cleanContact.length !== 11) {
        setErrorMsg('Mobile contact number must be exactly 11 numeric digits (e.g. 09171234567) with no special characters, dashes, or spaces.');
        return;
      }

      if (!regEmail.trim() || !regEmail.includes('@')) {
        setErrorMsg('Please enter your valid Gmail or email address so the system can dispatch your 6-digit Two-Factor security codes.');
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
        suffix: regSuffix.trim(),
        birthDate: regBirthDate || '1995-06-15',
        streetAddress: regStreetAddress.trim() || `${regPurokZone}, Barangay Cabucbucan`,
        purokZone: regPurokZone || 'Purok 1',
        contactNumber: cleanContact,
        idType: regIdType,
        idNumber: regIdNumber.trim() || undefined,
        idPhotoUrl: regIdPhotoUrl,
        idPhotoName: regIdPhotoName || 'valid_id.jpg',
        civilStatus: regCivilStatus,
        gender: regGender,
        yearsOfResidency: 5
      });
      setLoading(false);

      if (res.success && res.user) {
        setIsRegister(false);
        setUsername(regUsername.trim().toLowerCase());
        setPassword(regPassword);
        
        // Immediately initiate sign-in to trigger the 6-digit Two-Factor passcode to their registered Gmail!
        setLoading(true);
        const loginRes = await apiClient.login(regUsername.trim().toLowerCase(), regPassword);
        setLoading(false);

        if (loginRes.mfaRequired) {
          setMfaChallengeActive(true);
          setMfaTargetUser(loginRes);
          setResetSuccessMsg(
            `Account successfully registered! A 6-digit Two-Factor security code has been sent to your Gmail (${loginRes.maskedEmail || loginRes.email}). Enter the code below to complete sign-in.`
          );
        } else if (loginRes.success && loginRes.user) {
          onAuthSuccess(loginRes.user, loginRes.profile);
        }
      } else {
        setErrorMsg(res.error || 'Registration failed. Please verify your details and try again.');
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
        onAuthSuccess(res.user, res.user.role === 'resident' ? res.profile : undefined);
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

    // Call login without mfaCode so the server triggers real Two-Factor Gmail OTP dispatch
    const res = await apiClient.login(cleanUser, password);

    setLoading(false);

    if (res.success) {
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
            ? `Two-Factor verification passcode sent to your Google Gmail (${res.email || res.maskedEmail})! Check your inbox.`
            : `Two-Factor verification passcode dispatched to ${res.email || res.maskedEmail}. Please check your Google Gmail.`
        );
      } else if (res.user) {
        // Only resident user accounts receive resident profile
        onAuthSuccess(res.user, res.user.role === 'resident' ? res.profile : undefined);
      }
    } else {
      setErrorMsg(res.error || 'Invalid username or password. Please check your credentials.');
    }
  };

  const handleResendMfaCode = async (targetEmailOverride?: string | any) => {
    if (!mfaTargetUser) return;
    setLoading(true);
    setErrorMsg('');
    const emailToSend = (typeof targetEmailOverride === 'string' && targetEmailOverride.includes('@'))
      ? targetEmailOverride.trim()
      : (customDestinationEmail.trim() ? customDestinationEmail.trim() : undefined);
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
          ? `A fresh 6-digit passcode has been sent to Gmail (${res.email || res.maskedEmail}).`
          : (res.message || `A fresh 6-digit passcode has been generated for ${res.email || res.maskedEmail}.`)
      );
      setShowCustomEmailInput(false);
    } else {
      setErrorMsg(res.error || 'Failed to resend verification code.');
    }
  };

  const activeGuide = activeGuideRole ? ROLE_GUIDES[activeGuideRole] : null;

  return (
    <div className="min-h-screen ambient-bg flex flex-col justify-between font-sans selection:bg-blue-600 selection:text-white relative">
      {/* Official Republic of the Philippines National Header Strip */}
      <header className="w-full glass-dark text-white border-b border-white/10 shadow-md relative z-20">
        <div className="h-1 w-full bg-gradient-to-r from-blue-600 via-amber-400 to-rose-600" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse" />
            <span className="font-bold text-slate-200">Republic of the Philippines • Official Government E-Services Portal</span>
          </div>

          <div className="flex items-center gap-3 text-slate-300">
            <span className="text-slate-300 text-xs font-medium hidden sm:inline font-mono">Barangay Cabucbucan Digital Portal</span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 flex flex-col justify-center w-full relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Official Government Branding, Role Directory & Guide */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Seal & Heading */}
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-3xl bg-white border border-slate-200/90 p-1.5 shadow-xl shadow-blue-900/15 flex items-center justify-center shrink-0 relative overflow-hidden group">
                  <img
                    src="/brgy_seal.jpg"
                    alt="Official Seal of Barangay Cabucbucan"
                    className="w-full h-full object-contain rounded-2xl group-hover:scale-105 transition-transform"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div>
                  <div className="text-[11px] font-extrabold tracking-wider uppercase text-blue-700 font-mono">
                    Republic of the Philippines • Region III • Nueva Ecija
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
                    Barangay Cabucbucan
                  </h1>
                  <p className="text-xs sm:text-sm font-semibold text-slate-600">
                    Municipality of Rizal • Official E-Clearance & Civil Registry Portal
                  </p>
                </div>
              </div>

              <p className="text-sm text-slate-600 leading-relaxed font-normal">
                Welcome to the official digital governance portal of Barangay Cabucbucan. 
                Apply for official barangay clearances and civil certificates, and track processing status with real-time notifications and official endorsement.
              </p>
            </div>

            {/* Clean Executive Portal Directory Card */}
            <div className="glass-panel rounded-3xl border border-white/80 shadow-xl overflow-hidden">
              {/* Directory Header with The One Professional Instructions Button */}
              <div className="p-4 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-600/30 border border-blue-400/30 flex items-center justify-center text-amber-300 shrink-0 shadow-inner">
                    <Building className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-extrabold tracking-wide text-white uppercase font-mono">
                      Official Portal Directory
                    </h3>
                    <p className="text-[11px] text-slate-300">
                      Select your operational portal to access services
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Real-time Firebase Cloud Database Inspector Button */}
                  <button
                    type="button"
                    onClick={() => setShowFirebaseModal(true)}
                    className="btn-3d px-3 py-2 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-extrabold rounded-xl flex items-center gap-2 cursor-pointer shadow-md shadow-emerald-900/30 transition-all border border-emerald-400/40 shrink-0 group"
                    title="Open live Google Cloud Firestore database, collections, and real-time activity stream"
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse"></span>
                    <span>Firebase Cloud DB</span>
                  </button>

                  {/* The Professional Instructions & Guide Button */}
                  <button
                    type="button"
                    onClick={() => setShowGuideModal(true)}
                    className="btn-3d px-3.5 py-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer shadow-md shadow-blue-900/30 transition-all border border-blue-400/30 shrink-0 group"
                    title="Open official user guide, workflows, and operational instructions"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-amber-300 group-hover:scale-110 transition-transform" />
                    <span>Portal Guide</span>
                  </button>
                </div>
              </div>

              {/* 3 Clean, Streamlined Role Selection Portals (No sprawled text clutter) */}
              <div className="p-3.5 space-y-2.5 bg-slate-50/60">
                {/* 1. Resident Citizen Portal */}
                <div
                  onClick={() => handleSelectPortalRole('resident')}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    activeGuideRole === 'resident'
                      ? 'bg-white border-blue-500 shadow-sm ring-2 ring-blue-500/20'
                      : 'bg-white/80 border-slate-200/90 hover:border-blue-300 hover:bg-white'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-200/60 flex items-center justify-center shrink-0 shadow-2xs">
                      <User className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 truncate">Resident Citizen Portal</span>
                        <span className="px-2 py-0.5 text-[9px] font-extrabold uppercase bg-blue-100 text-blue-800 rounded-full border border-blue-200 shrink-0">
                          Constituent
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">
                        Apply for clearances & download official certificates
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectPortalRole('resident');
                      }}
                      className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                    >
                      <LogIn className="w-3 h-3" />
                      <span>Select</span>
                    </button>
                  </div>
                </div>

                {/* 2. Barangay Staff Desk */}
                <div
                  onClick={() => handleSelectPortalRole('staff')}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    activeGuideRole === 'staff'
                      ? 'bg-white border-emerald-500 shadow-sm ring-2 ring-emerald-500/20'
                      : 'bg-white/80 border-slate-200/90 hover:border-emerald-300 hover:bg-white'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200/60 flex items-center justify-center shrink-0 shadow-2xs">
                      <Users className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 truncate">Barangay Staff Desk</span>
                        <span className="px-2 py-0.5 text-[9px] font-extrabold uppercase bg-emerald-100 text-emerald-800 rounded-full border border-emerald-200 shrink-0">
                          Intake Desk
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">
                        ID verification, registry assessment & endorsement
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectPortalRole('staff');
                      }}
                      className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                    >
                      <LogIn className="w-3 h-3" />
                      <span>Select</span>
                    </button>
                  </div>
                </div>

                {/* 3. Punong Barangay */}
                <div
                  onClick={() => handleSelectPortalRole('official')}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    activeGuideRole === 'official'
                      ? 'bg-white border-purple-500 shadow-sm ring-2 ring-purple-500/20'
                      : 'bg-white/80 border-slate-200/90 hover:border-purple-300 hover:bg-white'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 border border-purple-200/60 flex items-center justify-center shrink-0 shadow-2xs">
                      <Award className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 truncate">Punong Barangay (Captain)</span>
                        <span className="px-2 py-0.5 text-[9px] font-extrabold uppercase bg-purple-100 text-purple-800 rounded-full border border-purple-200 shrink-0">
                          Executive Sign
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">
                        Executive document review & official digital signing
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectPortalRole('official');
                      }}
                      className="px-2.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-[11px] font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                    >
                      <LogIn className="w-3 h-3" />
                      <span>Select</span>
                    </button>
                  </div>
                </div>

                {/* 4. Municipal IT & Security Systems Administration */}
                <div
                  onClick={() => setShowBackendAdminModal(true)}
                  className="p-3 rounded-2xl border border-amber-200/90 bg-gradient-to-r from-amber-50/70 to-orange-50/50 hover:border-amber-400 hover:from-amber-50 hover:to-orange-50 transition-all cursor-pointer flex items-center justify-between gap-3 group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-amber-100/80 text-amber-800 border border-amber-300/60 flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                      <Terminal className="w-5 h-5 text-amber-700" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 truncate">System & Security Administration</span>
                        <span className="px-2 py-0.5 text-[9px] font-extrabold uppercase bg-amber-200/80 text-amber-900 rounded-full border border-amber-300 shrink-0">
                          SysAdmin
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 truncate mt-0.5">
                        Database infrastructure, cryptographic controls & audit logs
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowBackendAdminModal(true);
                      }}
                      className="px-2.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                    >
                      <Lock className="w-3 h-3" />
                      <span>Launch</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Sign In & Registration Card */}
          <div className="lg:col-span-5">
            <div className="glass-panel rounded-3xl shadow-2xl border border-white/80 overflow-hidden">
              
              {/* Card Header & Tabs (Professionally tailored for Resident, Staff Desk, and Punong Barangay) */}
              <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-5 border-b border-white/10">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-white tracking-tight">
                      {mfaChallengeActive 
                        ? 'Two-Step Security Verification' 
                        : isRegister 
                          ? 'New Resident Registration' 
                          : activeGuideRole === 'official'
                            ? 'Punong Barangay Portal'
                            : activeGuideRole === 'staff'
                              ? 'Barangay Staff Desk'
                              : 'Resident Citizen Sign In'}
                    </h3>
                    <p className="text-xs text-slate-300 mt-0.5">
                      {mfaChallengeActive 
                        ? 'Enter Authenticator Passcode' 
                        : isRegister 
                          ? 'Register your official resident profile' 
                          : activeGuideRole === 'official'
                            ? 'Executive Signatory Authentication'
                            : activeGuideRole === 'staff'
                              ? 'Authorized Municipal Intake & Verification'
                              : 'Sign in to access your clearances & records'}
                    </p>
                  </div>
                  <div className={`p-2.5 rounded-2xl shadow-inner ${
                    activeGuideRole === 'official'
                      ? 'bg-purple-600/30 border border-purple-400/40 text-purple-300'
                      : activeGuideRole === 'staff'
                        ? 'bg-emerald-600/30 border border-emerald-400/40 text-emerald-300'
                        : 'bg-blue-600/30 border border-blue-400/40 text-blue-300'
                  }`}>
                    {activeGuideRole === 'official' ? <Award className="w-5 h-5" /> : activeGuideRole === 'staff' ? <Users className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                  </div>
                </div>

                {!mfaChallengeActive && activeGuideRole === 'resident' && (
                  <div className="flex bg-slate-950/60 p-1 rounded-2xl mt-4 border border-white/10 backdrop-blur-md">
                    <button
                      type="button"
                      onClick={() => { 
                        setIsRegister(false); 
                        setErrorMsg(''); 
                        setResetSuccessMsg('');
                      }}
                      className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        !isRegister 
                          ? 'btn-3d bg-blue-600 text-white' 
                          : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      <User className="w-3.5 h-3.5" />
                      <span>Sign In</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => { 
                        setIsRegister(true); 
                        setErrorMsg(''); 
                        setResetSuccessMsg('');
                      }}
                      className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        isRegister 
                          ? 'btn-3d bg-blue-600 text-white' 
                          : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Register New</span>
                    </button>
                  </div>
                )}

                {!mfaChallengeActive && activeGuideRole !== 'resident' && (
                  <div className="mt-3.5 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-300">
                    <div className="flex items-center gap-1.5">
                      <ShieldCheck className={`w-3.5 h-3.5 ${activeGuideRole === 'official' ? 'text-purple-400' : 'text-emerald-400'}`} />
                      <span>
                        {activeGuideRole === 'official' ? 'Executive clearance and digital signing access' : 'Authorized Barangay Intake and Desk review access'}
                      </span>
                    </div>
                    <span className="font-mono text-[10px] text-slate-400 uppercase">Official</span>
                  </div>
                )}
              </div>

              {/* Form Body */}
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                
                {/* Session Inactivity Timeout Compliance Notice */}
                {sessionExpiredNotice && (
                  <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-xl text-amber-950 text-xs flex items-start gap-3 font-medium shadow-xs animate-in fade-in slide-in-from-top-1 duration-200">
                    <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <strong className="text-amber-900 font-bold text-xs">
                          Session Expired (IAS Security Compliance)
                        </strong>
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
                      <p className="text-[11px] text-amber-800 leading-relaxed">
                        {sessionExpiredNotice}
                      </p>
                    </div>
                  </div>
                )}

                {/* Reset / Success Feedback Banner */}
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
                    {/* MFA Info Banner */}
                    <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-blue-950 text-xs space-y-1.5">
                      <div className="font-bold flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-blue-900">
                          <ShieldCheck className="w-4 h-4 text-blue-700" />
                          <span>Two-Step Security Verification</span>
                        </span>
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                          mfaTargetUser?.emailDelivered
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-blue-100 text-blue-800 border border-blue-300'
                        }`}>
                          {mfaTargetUser?.emailDelivered ? 'Email Dispatched' : 'Security Active'}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-700 leading-relaxed">
                        {mfaTargetUser?.emailDelivered
                          ? <>Passcode sent to <strong>{mfaTargetUser?.email || mfaTargetUser?.maskedEmail}</strong>. Please check your Gmail inbox (or Spam folder).</>
                          : <>A 6-digit verification code has been dispatched to <strong>{mfaTargetUser?.maskedEmail || mfaTargetUser?.email}</strong>.</>}
                      </p>
                    </div>

                    {/* Destination Gmail row with live change button */}
                    <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 text-slate-700">
                          <Mail className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <span className="font-semibold">Recipient:</span>
                          <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                            {mfaTargetUser?.email || mfaTargetUser?.maskedEmail}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setShowGmailSmtpModal(true)}
                            className="text-[11px] font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <KeyRound className="w-3 h-3 text-amber-600" />
                            <span>SMTP</span>
                          </button>
                          <span className="text-slate-300">•</span>
                          <button
                            type="button"
                            onClick={() => setShowCustomEmailInput(!showCustomEmailInput)}
                            className="text-[11px] font-bold text-blue-600 hover:text-blue-800 underline cursor-pointer"
                          >
                            {showCustomEmailInput ? 'Cancel' : 'Change'}
                          </button>
                        </div>
                      </div>

                      {showCustomEmailInput && (
                        <div className="p-2.5 bg-blue-50/70 border border-blue-200 rounded-lg space-y-2 text-xs">
                          <div className="flex items-center justify-between">
                            <label className="text-[11px] font-bold text-slate-700 block">
                              Dispatch code to this Gmail address:
                            </label>
                            <button
                              type="button"
                              onClick={() => {
                                setCustomDestinationEmail('delacruzjohnirvin05@gmail.com');
                              }}
                              className="text-[10px] font-bold text-blue-600 hover:text-blue-800 underline cursor-pointer"
                            >
                              Use: delacruzjohnirvin05@gmail.com
                            </button>
                          </div>
                          <div className="flex gap-2">
                            <input
                              type="email"
                              value={customDestinationEmail}
                              onChange={(e) => setCustomDestinationEmail(e.target.value)}
                              placeholder="e.g. delacruzjohnirvin05@gmail.com"
                              className="flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                if (customDestinationEmail.includes('@')) {
                                  handleResendMfaCode(customDestinationEmail.trim());
                                  setShowCustomEmailInput(false);
                                } else {
                                  setErrorMsg('Please enter a valid Gmail address.');
                                }
                              }}
                              disabled={loading || !customDestinationEmail.includes('@')}
                              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs shadow-xs cursor-pointer disabled:opacity-50"
                            >
                              Dispatch OTP
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Compact Passcode Chip (If Live SMTP is in local mode) */}
                    {mfaTargetUser?.demoOtp && !mfaTargetUser?.emailDelivered && (
                      <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                        <span className="text-slate-600 font-medium">Evaluation Code:</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-300">
                            {mfaTargetUser.demoOtp}
                          </span>
                          <button
                            type="button"
                            onClick={() => setMfaCode(mfaTargetUser.demoOtp)}
                            className="text-[11px] font-bold text-blue-600 hover:text-blue-800 underline cursor-pointer"
                          >
                            Fill
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Passcode Input Field */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-bold text-slate-700">
                          Enter 6-Digit Verification Code:
                        </label>
                        <button
                          type="button"
                          onClick={handleResendMfaCode}
                          disabled={loading}
                          className="text-[11px] text-blue-600 hover:text-blue-800 font-bold cursor-pointer disabled:opacity-50"
                        >
                          Resend Code
                        </button>
                      </div>
                      <input
                        type="text"
                        maxLength={6}
                        value={mfaCode}
                        onChange={(e) => setMfaCode(e.target.value.replace(/[^0-9]/g, ''))}
                        placeholder="______"
                        autoFocus
                        className="w-full px-4 py-3 bg-slate-50 border border-blue-300 focus:border-blue-600 rounded-xl text-xl font-mono font-bold text-center tracking-[0.25em] text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/30 shadow-xs"
                      />
                    </div>

                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        onClick={handleResetChallenge}
                        className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-300 cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={loading || !mfaCode.trim()}
                        className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer disabled:opacity-50 transition-all font-sans"
                      >
                        {loading ? 'Verifying...' : 'Verify Passcode & Sign In'}
                      </button>
                    </div>
                  </div>
                ) : isRegister ? (
                  /* =========================================================================
                     RESIDENT REGISTRATION FORM (Clean, Validated, Email included)
                     ========================================================================= */
                  <div className="space-y-3.5 text-xs max-h-[500px] overflow-y-auto pr-1">
                    
                    {nameHadNumberWarning && (
                      <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-[11px] font-bold flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                        <span>Numbers are not permitted in name fields.</span>
                      </div>
                    )}

                    {/* Step indicator header */}
                    <div className="flex items-center justify-between pb-1 border-b border-slate-100 text-[11px] text-slate-500 font-semibold">
                      <span>Personal & Residency Information</span>
                      <button
                        type="button"
                        onClick={handleClearRegisterForm}
                        className="text-slate-500 hover:text-rose-600 font-bold flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Clear Form</span>
                      </button>
                    </div>

                    {/* First Name & Last Name */}
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

                    {/* Middle Name & Suffix */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">Middle Name (Optional)</label>
                        <input
                          type="text"
                          value={regMiddleName}
                          onChange={(e) => handleNameInput(e.target.value, setRegMiddleName)}
                          placeholder="e.g. Ramos"
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">Suffix (Optional)</label>
                        <input
                          type="text"
                          value={regSuffix}
                          onChange={(e) => setRegSuffix(e.target.value)}
                          placeholder="e.g. Jr., Sr., III"
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    {/* Purok / Zone & Street Address */}
                    <div className="grid grid-cols-2 gap-2">
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
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">Street / House No.</label>
                        <input
                          type="text"
                          value={regStreetAddress}
                          onChange={(e) => setRegStreetAddress(e.target.value)}
                          placeholder="e.g. House 142, Main Rd"
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    {/* Contact Number & Email Address */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="font-bold text-slate-700 block">Mobile Number *</label>
                          <span className={`text-[10px] font-mono font-bold ${regContactNumber.length === 11 ? 'text-emerald-700' : 'text-slate-400'}`}>
                            {regContactNumber.length === 11 ? '✓ 11 digits' : `${regContactNumber.length}/11`}
                          </span>
                        </div>
                        <div className="relative">
                          <Phone className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                          <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]{11}"
                            maxLength={11}
                            minLength={11}
                            required
                            value={regContactNumber}
                            onChange={(e) => {
                              // strictly digits only, max 11 digits, no special characters or spaces
                              const numbersOnly = e.target.value.replace(/[^0-9]/g, '').slice(0, 11);
                              setRegContactNumber(numbersOnly);
                            }}
                            placeholder="09171234567"
                            className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <span className="text-[10px] text-slate-500 block mt-0.5">
                          11-digit mobile number, numbers only
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="font-bold text-slate-700 block">Registered Gmail *</label>
                          <span className="text-[10px] text-blue-600 font-bold">For 2FA Codes</span>
                        </div>
                        <div className="relative">
                          <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                          <input
                            type="email"
                            required
                            value={regEmail}
                            onChange={(e) => setRegEmail(e.target.value)}
                            placeholder="your_email@gmail.com"
                            className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <span className="text-[10px] text-slate-500 block mt-0.5">
                          Login 2FA passcodes & reset codes sent here
                        </span>
                      </div>
                    </div>

                    {/* Birth Date & Civil Status */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">Date of Birth</label>
                        <input
                          type="date"
                          value={regBirthDate}
                          onChange={(e) => setRegBirthDate(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">Civil Status & Gender</label>
                        <div className="grid grid-cols-2 gap-1">
                          <select
                            value={regCivilStatus}
                            onChange={(e) => setRegCivilStatus(e.target.value)}
                            className="w-full px-2 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="Single">Single</option>
                            <option value="Married">Married</option>
                            <option value="Widowed">Widowed</option>
                            <option value="Separated">Separated</option>
                          </select>
                          <select
                            value={regGender}
                            onChange={(e) => setRegGender(e.target.value)}
                            className="w-full px-2 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Proof of Residency: Valid ID Photo Attachment (for Barangay Staff review) */}
                    <div className="p-3 bg-blue-50/70 border-2 border-blue-200 rounded-xl space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <ShieldCheck className="w-4 h-4 text-blue-700 shrink-0" />
                            <label className="font-bold text-slate-900 text-xs">
                              Proof of Residency: Valid ID Attachment *
                            </label>
                          </div>
                          <p className="text-[11px] text-slate-600 mt-0.5">
                            Attach a clear picture of any valid ID. Once created, your account is routed to Barangay Desk Staff (Elena Ramos) to verify your residency.
                          </p>
                        </div>
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-100 border border-amber-300 text-amber-900 rounded-full shrink-0">
                          Staff Review
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="font-bold text-slate-700 block mb-1 text-[11px]">Type of ID Card *</label>
                          <select
                            value={regIdType}
                            onChange={(e) => setRegIdType(e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="Philippine National ID (PhilSys)">Philippine National ID (PhilSys)</option>
                            <option value="LTO Driver's License">LTO Driver's License</option>
                            <option value="UMID / SSS ID">UMID / SSS ID</option>
                            <option value="COMELEC Voter's ID / Certificate">COMELEC Voter's ID / Certificate</option>
                            <option value="Barangay Resident ID">Barangay Resident ID</option>
                            <option value="Postal ID (PhilPost)">Postal ID (PhilPost)</option>
                            <option value="Philippine Passport">Philippine Passport</option>
                            <option value="Senior Citizen / PWD ID">Senior Citizen / PWD ID</option>
                            <option value="Student School ID">Student School ID</option>
                          </select>
                        </div>
                        <div>
                          <label className="font-bold text-slate-700 block mb-1 text-[11px]">ID Card Number (Optional)</label>
                          <input
                            type="text"
                            value={regIdNumber}
                            onChange={(e) => setRegIdNumber(e.target.value)}
                            placeholder="e.g. 1234-5678-9012"
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>

                      {/* Hidden File Input for Native Document / ID Upload */}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/png, image/jpeg, image/webp, application/pdf"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleIdFileUpload(file);
                        }}
                        className="hidden"
                      />

                      {/* ID Attachment Workflow Area */}
                      <div className="space-y-2.5">
                        {regIdPhotoUrl ? (
                          /* Attached ID Card */
                          <div className="p-3.5 bg-white border-2 border-emerald-400 rounded-2xl shadow-xs space-y-2.5">
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-14 h-11 rounded-lg border border-slate-300 overflow-hidden bg-slate-100 shrink-0 relative shadow-2xs">
                                  <img 
                                    src={regIdPhotoUrl} 
                                    alt="Attached ID Preview" 
                                    className="w-full h-full object-cover"
                                    referrerPolicy="no-referrer"
                                  />
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                    <span className="text-xs font-bold text-slate-900 truncate">
                                      {regIdPhotoName || 'ID Photo Attached'}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                      Verified ID • Consent Agreed
                                    </span>
                                    <span className="text-[10px] text-slate-500 font-medium">
                                      {regIdType}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => setRegIdPreviewModal(true)}
                                  className="px-2.5 py-1 text-blue-600 hover:bg-blue-50 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>Preview</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={handleTriggerIdUpload}
                                  className="px-2.5 py-1 text-slate-600 hover:bg-slate-100 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                                  title="Change Photo"
                                >
                                  Change
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setRegIdPhotoUrl('');
                                    setRegIdPhotoName('');
                                  }}
                                  className="p-1 text-rose-500 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
                                  title="Remove ID"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            </div>

                            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
                              <span>Ready for intake desk residency verification</span>
                              <button
                                type="button"
                                onClick={() => {
                                  setConsentModalChecked(true);
                                  setShowIdConsentModal(true);
                                }}
                                className="text-blue-600 hover:text-blue-800 underline font-medium cursor-pointer"
                              >
                                View Consent Agreement
                              </button>
                            </div>
                          </div>
                        ) : (
                          /* No ID Attached Yet: Clean, professional upload trigger */
                          <div className="p-4 bg-slate-50/90 border border-slate-200 rounded-2xl space-y-3">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-start gap-2.5">
                                <div className="p-2 bg-blue-100 text-blue-700 rounded-xl shrink-0 mt-0.5">
                                  <UploadCloud className="w-4 h-4" />
                                </div>
                                <div>
                                  <h4 className="text-xs font-bold text-slate-900">
                                    Attach Government ID Document *
                                  </h4>
                                  <p className="text-[11px] text-slate-600 mt-0.5">
                                    Upload a clear picture or document scan of your valid government ID.
                                  </p>
                                </div>
                              </div>
                              <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-200 shrink-0">
                                Required
                              </span>
                            </div>

                            {/* ID Usage & Privacy Consent Stipulation Checkbox */}
                            <div className="p-3 bg-blue-50/80 border border-blue-200/90 rounded-xl space-y-1.5">
                              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                                <input
                                  type="checkbox"
                                  checked={regIdConsentAgreed}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setRegIdConsentAgreed(true);
                                      setConsentModalChecked(true);
                                    } else {
                                      setRegIdConsentAgreed(false);
                                      setConsentModalChecked(false);
                                    }
                                  }}
                                  className="mt-0.5 w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer shrink-0"
                                />
                                <span className="text-[11px] font-semibold text-slate-800 leading-snug">
                                  I agree that my uploaded identification document will be used exclusively by authorized Barangay Cabucbucan intake staff for civil identity and residency verification.
                                </span>
                              </label>
                              <div className="flex items-center justify-between text-[10px] text-blue-700 pl-6.5">
                                <span className="text-slate-500">Official residency verification only</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setConsentModalChecked(regIdConsentAgreed);
                                    setShowIdConsentModal(true);
                                  }}
                                  className="font-bold underline text-blue-700 hover:text-blue-900 cursor-pointer"
                                >
                                  Read Terms & Stipulations
                                </button>
                              </div>
                            </div>

                            <div className="pt-1">
                              <button
                                type="button"
                                onClick={handleTriggerIdUpload}
                                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                              >
                                <UploadCloud className="w-4 h-4" />
                                <span>Upload ID Picture</span>
                              </button>
                            </div>

                            <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-200/60">
                              <span className="flex items-center gap-1">
                                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Encrypted and restricted for residency validation</span>
                              </span>
                              <span>PNG, JPG, PDF up to 10MB</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Desired Username */}
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Desired Username *</label>
                      <input
                        type="text"
                        required
                        value={regUsername}
                        onChange={(e) => setRegUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                        placeholder="e.g. maria.santos"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    {/* Password & Confirm Password */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">Password *</label>
                        <div className="relative">
                          <input
                            type={showRegPassword ? 'text' : 'password'}
                            required
                            value={regPassword}
                            onChange={(e) => setRegPassword(e.target.value)}
                            placeholder="min 8 chars, 1 special"
                            className="w-full pl-3 pr-8 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <button
                            type="button"
                            onClick={() => setShowRegPassword(!showRegPassword)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
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
                            placeholder="re-type password"
                            className="w-full pl-3 pr-8 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <button
                            type="button"
                            onClick={() => setShowRegConfirmPassword(!showRegConfirmPassword)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                          >
                            {showRegConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Password Strength Visual Progress Bar Indicator */}
                    {regPassword && (
                      <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                        <PasswordStrengthMeter
                          password={regPassword}
                          confirmPassword={regConfirmPassword}
                          showRequirementsList={true}
                        />
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full mt-2 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-sm text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>{loading ? 'Registering Account...' : 'Complete Resident Registration'}</span>
                    </button>
                  </div>
                ) : (
                  /* =========================================================================
                     SIGN IN FORM (Clean, Empty Fields, Standard Secure Authentication)
                     ========================================================================= */
                  <div className="space-y-4">
                    
                    {/* Active Portal Header & Security Context */}
                    <div className="p-3 bg-slate-50 border border-slate-200/90 rounded-2xl flex items-center justify-between">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-white shadow-2xs ${
                          activeGuideRole === 'official' ? 'bg-purple-600' : activeGuideRole === 'staff' ? 'bg-emerald-600' : 'bg-blue-600'
                        }`}>
                          {activeGuideRole === 'official' ? <Award className="w-4 h-4" /> : activeGuideRole === 'staff' ? <Users className="w-4 h-4" /> : <User className="w-4 h-4" />}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-900 truncate">
                            {activeGuideRole === 'official' ? 'Office of the Punong Barangay' : activeGuideRole === 'staff' ? 'Barangay Staff Desk' : 'Resident Citizen Portal'}
                          </div>
                          <p className="text-[11px] text-slate-500 truncate">
                            {activeGuideRole === 'official' ? 'Executive Signatory Desk' : activeGuideRole === 'staff' ? 'Municipal Intake & Verification' : 'Constituent Services & Records'}
                          </p>
                        </div>
                      </div>
                      {(username || password) && (
                        <button
                          type="button"
                          onClick={handleClearLoginForm}
                          className="text-slate-500 hover:text-rose-600 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Clear</span>
                        </button>
                      )}
                    </div>

                    {/* Username or Email Input (Clean manual input) */}
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
                          placeholder="e.g. your_email@gmail.com or username"
                          className="w-full pl-10 pr-3 py-2.5 glass-input rounded-xl text-xs text-slate-900 font-medium"
                        />
                      </div>
                    </div>

                    {/* Password Input (Clean manual input with show/hide toggle) */}
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
                          className="text-[11px] font-bold text-blue-600 hover:text-blue-800 cursor-pointer transition-colors"
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
                          className="w-full pl-10 pr-10 py-2.5 glass-input rounded-xl text-xs text-slate-900 font-medium font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer p-1"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Submit Button tailored for active role */}
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3 btn-3d bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      <Lock className="w-4 h-4" />
                      <span>
                        {loading 
                          ? 'Authenticating...' 
                          : activeGuideRole === 'official' 
                            ? 'Sign In as Punong Barangay' 
                            : activeGuideRole === 'staff' 
                              ? 'Sign In to Barangay Staff Desk' 
                              : 'Sign In to Resident Account'}
                      </span>
                    </button>

                    {/* Google Firebase Authentication Option (Resident Portal) */}
                    {activeGuideRole === 'resident' && (
                      <div className="pt-2 space-y-2">
                        <div className="relative flex items-center justify-center">
                          <div className="border-t border-slate-200 w-full"></div>
                          <span className="bg-white px-2 text-[10px] uppercase font-bold text-slate-400 absolute">
                            Or continue with
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={handleGoogleSignIn}
                          disabled={googleLoading}
                          className="w-full py-2.5 bg-white hover:bg-slate-50 text-slate-800 font-bold rounded-xl text-xs flex items-center justify-center gap-2.5 border border-slate-300 shadow-xs hover:border-slate-400 transition-all cursor-pointer disabled:opacity-60"
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
                          <span>{googleLoading ? 'Connecting to Google...' : 'Sign In with Google (Firebase Auth)'}</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      </main>

      {/* Official Municipal Portal Footer */}
      <footer className="w-full bg-white/80 border-t border-slate-200 py-4 text-slate-600 text-xs relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center gap-2.5 justify-center sm:justify-start">
            <img
              src="/brgy_seal.jpg"
              alt="Seal of Barangay Cabucbucan"
              className="w-7 h-7 object-contain rounded-full border border-slate-200 shadow-2xs shrink-0"
              referrerPolicy="no-referrer"
            />
            <div className="font-bold text-slate-900 text-xs">
              Barangay Cabucbucan • Municipality of Rizal, Nueva Ecija
            </div>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-slate-500 font-medium">
            <span>Official E-Clearance & Civil Registry Portal</span>
            <span className="text-slate-300">•</span>
            <button
              type="button"
              onClick={() => setShowBackendAdminModal(true)}
              className="text-slate-500 hover:text-amber-700 font-semibold flex items-center gap-1.5 transition-colors cursor-pointer group"
              title="Restricted Cybersecurity Admin Console (IAS & ADBMS Alignment)"
            >
              <Terminal className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-600" />
              <span>Backend SysAdmin Console</span>
            </button>
          </div>
        </div>
      </footer>

      {/* Backend Infrastructure SysAdmin Access Modal (Separated from Public Citizen Portal) */}
      <BackendAdminModal
        isOpen={showBackendAdminModal}
        onClose={() => setShowBackendAdminModal(false)}
        onAuthSuccess={onAuthSuccess}
      />

      {/* Forgot Password OTP Modal */}
      <ForgotPasswordModal
        isOpen={showForgotPassword}
        onClose={() => setShowForgotPassword(false)}
        onSuccess={(msg) => {
          setResetSuccessMsg(msg);
          setShowForgotPassword(false);
        }}
      />

      {/* Official Portal User Guide & Operational Instructions Modal */}
      <PortalGuideModal
        isOpen={showGuideModal}
        onClose={() => setShowGuideModal(false)}
        onQuickFillRole={handleQuickFillRole}
        initialRole={activeGuideRole}
      />

      {/* Gmail SMTP Dispatch Gateway Modal */}
      <GmailSmtpModal
        isOpen={showGmailSmtpModal}
        onClose={() => setShowGmailSmtpModal(false)}
        onSuccess={() => {
          setResetSuccessMsg('Gmail SMTP gateway configuration updated.');
        }}
      />

      {/* Real-Time Firebase Cloud Database & Console Modal */}
      <FirebaseCloudConsoleModal
        isOpen={showFirebaseModal}
        onClose={() => setShowFirebaseModal(false)}
      />

      {/* Full ID Card Preview Modal */}
      {regIdPreviewModal && regIdPhotoUrl && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="text-sm font-bold">{regIdType}</h3>
                  <p className="text-[11px] text-slate-300">
                    Attached proof of residency for {regFirstName || 'Resident'} {regLastName || 'Applicant'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRegIdPreviewModal(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-slate-100 flex items-center justify-center min-h-[260px] max-h-[70vh] overflow-auto">
              <img
                src={regIdPhotoUrl}
                alt="Full ID Preview"
                className="max-w-full max-h-[60vh] object-contain rounded-xl border border-slate-300 shadow-md bg-white"
                referrerPolicy="no-referrer"
              />
            </div>

            <div className="p-3 bg-white border-t border-slate-200 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-mono text-[11px]">
                {regIdPhotoName || 'valid_id.jpg'}
              </span>
              <button
                type="button"
                onClick={() => setRegIdPreviewModal(false)}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Resident Identity & Data Privacy Consent Modal (Republic Act No. 10173) */}
      {showIdConsentModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-between border-b border-white/10">
              <div className="flex items-center gap-3">
                <img
                  src="/brgy_seal.jpg"
                  alt="Seal of Barangay Cabucbucan"
                  className="w-10 h-10 object-contain rounded-2xl border border-white/20 bg-white/10 p-0.5 shrink-0"
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
                className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto text-xs">
              <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-2xl text-blue-950 flex items-start gap-2.5">
                <ShieldCheck className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
                <p className="text-[11px] leading-relaxed">
                  Before uploading or attaching your government-issued identification, please review and accept the official consent terms required by the Barangay Government of Cabucbucan for civil residency validation.
                </p>
              </div>

              <div className="space-y-2.5">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-[11px]">
                  Consent Stipulations & Privacy Safeguards
                </h4>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <div className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                    <span>1. Official Identity & Residency Verification</span>
                  </div>
                  <p className="text-[11px] text-slate-600 pl-3">
                    Your identification document will be used exclusively by authorized Barangay Intake Staff to verify bona fide residency and prevent fraud in clearance issuance.
                  </p>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <div className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                    <span>2. Encrypted Government Storage</span>
                  </div>
                  <p className="text-[11px] text-slate-600 pl-3">
                    Uploaded document images are securely protected and stored in municipal records isolated from public webroot directories.
                  </p>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <div className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-600" />
                    <span>3. Strict Non-Disclosure & Confidentiality</span>
                  </div>
                  <p className="text-[11px] text-slate-600 pl-3">
                    Your personal information and ID photograph will never be shared with unauthorized third parties or used for non-official activities.
                  </p>
                </div>
              </div>

              {/* Checkbox */}
              <label className="flex items-start gap-3 p-3.5 bg-blue-50/90 border-2 border-blue-300 rounded-2xl cursor-pointer select-none transition-all hover:bg-blue-100/70">
                <input
                  type="checkbox"
                  checked={consentModalChecked}
                  onChange={(e) => setConsentModalChecked(e.target.checked)}
                  className="mt-0.5 w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer shrink-0"
                />
                <span className="text-xs font-bold text-slate-900 leading-snug">
                  I agree and consent to the upload, digital storage, and verification of my government-issued ID solely for official barangay validation and clearance issuance.
                </span>
              </label>
            </div>

            {/* Footer Buttons */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowIdConsentModal(false)}
                className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-300 cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmConsent}
                disabled={!consentModalChecked}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-sm cursor-pointer transition-all flex items-center gap-1.5"
              >
                <UploadCloud className="w-3.5 h-3.5" />
                <span>I Agree & Proceed to Upload</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
