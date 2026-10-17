import React, { useState } from 'react';
import { 
  BookOpen, X, User, Users, Award, ShieldCheck, CheckCircle2, 
  Lock, ArrowRight, FileCheck, QrCode, FileText, LogIn
} from 'lucide-react';
import type { RoleGuideType } from './SignInPage';

interface PortalGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onQuickFillRole: (role: 'resident' | 'staff' | 'official') => void;
  initialRole?: RoleGuideType;
}

interface GuideContent {
  title: string;
  badge: string;
  badgeColor: string;
  summary: string;
  accessPolicy: string;
  whoIsItFor: string;
  requirements: string[];
  steps: {
    step: number;
    title: string;
    description: string;
  }[];
  demoAccount: {
    name: string;
    title: string;
    role: 'resident' | 'staff' | 'official';
  };
}

const GUIDES_DATA: Record<RoleGuideType, GuideContent> = {
  resident: {
    title: 'Resident Citizen Portal',
    badge: 'Constituent Services',
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-300',
    summary: 'Self-service portal for bona fide residents of Barangay Cabucbucan to request civil documents, track status, and download QR-sealed certificates.',
    whoIsItFor: 'All registered residents of Barangay Cabucbucan, Rizal, Nueva Ecija.',
    accessPolicy: 'Protected by BCrypt salted password hashing and Google Gmail 2-Factor Authentication (OTP). Resident registration requires government ID verification.',
    requirements: [
      'Valid Government-Issued ID (PhilSys, Driver\'s License, Voter\'s ID, etc.)',
      'Proof of residency or local civil registry matching',
      'Active email address for security passcodes & status updates'
    ],
    steps: [
      {
        step: 1,
        title: 'Sign In or Register Account',
        description: 'New residents submit their profile with an attached valid ID. Existing residents sign in with email or username.'
      },
      {
        step: 2,
        title: 'Submit Clearance Request',
        description: 'Select your needed document (Barangay Clearance, Certificate of Residency, Indigency, or Business Permit) and state the legal purpose.'
      },
      {
        step: 3,
        title: 'Track Intake & Approval Status',
        description: 'Monitor real-time progress as Desk Staff reviews your identity and Punong Barangay applies the cryptographic seal.'
      },
      {
        step: 4,
        title: 'Download or Claim QR-Sealed Document',
        description: 'Instantly download your digital PDF certificate with authentic SHA-256 seal and verification QR code.'
      }
    ],
    demoAccount: {
      name: 'Maria Clara Santos',
      title: 'Registered Resident (Purok 1)',
      role: 'resident'
    }
  },
  staff: {
    title: 'Barangay Staff Desk Portal',
    badge: 'Intake & Verification',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    summary: 'Administrative workbench for Barangay Secretaries and Desk Clerks to intake applications, verify resident credentials, and prepare documents.',
    whoIsItFor: 'Authorized administrative personnel and civil registry intake clerks.',
    accessPolicy: 'Strict role-based access control (RBAC). Staff members can review resident IDs, assess fee exemptions (RA 11261), and endorse applications for Captain sign-off.',
    requirements: [
      'Official staff credentials and civil desk authorization',
      'Two-Factor Authentication passcode verification',
      'Adherence to RA 10173 (Data Privacy Act) confidentiality'
    ],
    steps: [
      {
        step: 1,
        title: 'Desk Intake Queue Review',
        description: 'Inspect incoming clearance applications from constituents, checking ID attachments and purpose validity.'
      },
      {
        step: 2,
        title: 'Civil Registry Verification',
        description: 'Cross-check applicant against Barangay master registry and verify First-Time Jobseeker exemption eligibility.'
      },
      {
        step: 3,
        title: 'Endorse for Executive Sign-Off',
        description: 'Route verified documents to the Punong Barangay desk for digital signature and official stamp.'
      },
      {
        step: 4,
        title: 'Release & Audit Archival',
        description: 'Notify resident via email/SMS and archive non-repudiation audit trails into the system log.'
      }
    ],
    demoAccount: {
      name: 'Elena Ramos',
      title: 'Barangay Secretary & Desk Officer',
      role: 'staff'
    }
  },
  official: {
    title: 'Punong Barangay Portal',
    badge: 'Executive Signatory',
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-300',
    summary: 'Executive dashboard for the Punong Barangay (Barangay Captain) to review endorsed documents and digitally seal official certificates.',
    whoIsItFor: 'Barangay Captain and authorized executive signatories.',
    accessPolicy: 'Highest operational clearance. Only the Punong Barangay possesses the digital signing authorization key to issue certificates.',
    requirements: [
      'Executive signatory authentication credentials',
      'TOTP / 2-Factor Authentication session confirmation',
      'Sole authorized signer for non-repudiation seals'
    ],
    steps: [
      {
        step: 1,
        title: 'Executive Docket Review',
        description: 'Review clearance applications that have successfully passed staff verification and compliance checks.'
      },
      {
        step: 2,
        title: 'Digital Signature & SHA-256 Minting',
        description: 'Approve documents to trigger instant cryptographic signing and HMAC hash generation.'
      },
      {
        step: 3,
        title: 'Public QR Code Generation',
        description: 'Documents are minted with public tamper-evident QR codes that anyone can verify against the blockchain-style ledger.'
      },
      {
        step: 4,
        title: 'Governance Oversight',
        description: 'Inspect real-time analytics on clearance volumes, revenue collections, and turnaround times (RA 11032).'
      }
    ],
    demoAccount: {
      name: 'Hon. Cornelio Laugo',
      title: 'Punong Barangay (Barangay Captain)',
      role: 'official'
    }
  }
};

export const PortalGuideModal: React.FC<PortalGuideModalProps> = ({
  isOpen,
  onClose,
  onQuickFillRole,
  initialRole = 'resident'
}) => {
  const [selectedRole, setSelectedRole] = useState<RoleGuideType>(initialRole);

  if (!isOpen) return null;

  const guide = GUIDES_DATA[selectedRole];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-white/80 overflow-hidden my-8 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950 text-white p-5 border-b border-white/10 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white border border-slate-200/90 p-0.5 shadow-md flex items-center justify-center shrink-0 overflow-hidden">
              <img
                src="/brgy_seal.jpg"
                alt="Barangay Cabucbucan Official Seal"
                className="w-full h-full object-contain rounded-xl"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold tracking-tight text-white">
                  Barangay Cabucbucan • Portal User Guide
                </h3>
                <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 text-[10px] font-bold rounded-full font-mono border border-blue-400/30">
                  Gov.ph Standard
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Official operational workflows, security access policies, and role instructions
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close user guide"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Role Selector Navigation Tabs */}
        <div className="grid grid-cols-3 p-2 bg-slate-100 border-b border-slate-200 shrink-0 gap-2">
          <button
            type="button"
            onClick={() => setSelectedRole('resident')}
            className={`p-2.5 rounded-2xl text-left transition-all cursor-pointer flex items-center gap-2.5 border ${
              selectedRole === 'resident'
                ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <div className={`p-1.5 rounded-xl ${selectedRole === 'resident' ? 'bg-white/20 text-white' : 'bg-blue-50 text-blue-600'}`}>
              <User className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold truncate">Resident Citizen</div>
              <div className={`text-[10px] truncate ${selectedRole === 'resident' ? 'text-blue-100' : 'text-slate-500'}`}>
                Apply & Track
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setSelectedRole('staff')}
            className={`p-2.5 rounded-2xl text-left transition-all cursor-pointer flex items-center gap-2.5 border ${
              selectedRole === 'staff'
                ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <div className={`p-1.5 rounded-xl ${selectedRole === 'staff' ? 'bg-white/20 text-white' : 'bg-emerald-50 text-emerald-600'}`}>
              <Users className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold truncate">Barangay Desk</div>
              <div className={`text-[10px] truncate ${selectedRole === 'staff' ? 'text-emerald-100' : 'text-slate-500'}`}>
                Intake & Assess
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setSelectedRole('official')}
            className={`p-2.5 rounded-2xl text-left transition-all cursor-pointer flex items-center gap-2.5 border ${
              selectedRole === 'official'
                ? 'bg-purple-600 border-purple-600 text-white shadow-sm'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <div className={`p-1.5 rounded-xl ${selectedRole === 'official' ? 'bg-white/20 text-white' : 'bg-purple-50 text-purple-600'}`}>
              <Award className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold truncate">Punong Barangay</div>
              <div className={`text-[10px] truncate ${selectedRole === 'official' ? 'text-purple-100' : 'text-slate-500'}`}>
                Executive Sign
              </div>
            </div>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1 text-slate-900 font-sans">
          
          {/* Active Role Hero */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className={`px-2.5 py-0.5 text-[10px] font-extrabold uppercase rounded-full border ${guide.badgeColor}`}>
                  {guide.badge}
                </span>
                <h4 className="text-sm font-extrabold text-slate-900">{guide.title}</h4>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed max-w-xl">
                {guide.summary}
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                onQuickFillRole(guide.demoAccount.role);
                onClose();
              }}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-amber-300 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs shrink-0 self-start sm:self-auto"
            >
              <LogIn className="w-3.5 h-3.5 text-amber-400" />
              <span>Quick-Fill {guide.title.split(' ')[0]}</span>
            </button>
          </div>

          {/* Access Policy & Target Audience */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="p-3.5 bg-blue-50/70 border border-blue-200/80 rounded-2xl space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900">
                <Lock className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span>Authentication & Security Policy</span>
              </div>
              <p className="text-[11px] text-blue-800 leading-relaxed">
                {guide.accessPolicy}
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Target Users & Scope</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                {guide.whoIsItFor}
              </p>
            </div>
          </div>

          {/* Step-by-Step Workflow */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h5 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5 font-mono">
                <FileCheck className="w-4 h-4 text-blue-600" />
                <span>Step-by-Step Workflow Process</span>
              </h5>
              <span className="text-[10px] text-slate-500 font-medium font-mono">
                RA 11032 Ease of Doing Business
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {guide.steps.map((st) => (
                <div key={st.step} className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-2xs flex items-start gap-3 hover:border-blue-300 transition-colors">
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-extrabold flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                    {st.step}
                  </div>
                  <div className="space-y-0.5">
                    <h6 className="text-xs font-bold text-slate-900">{st.title}</h6>
                    <p className="text-[11px] text-slate-600 leading-relaxed">{st.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Requirements & Checklist */}
          <div className="p-4 bg-amber-50/60 border border-amber-200/80 rounded-2xl space-y-2">
            <div className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-amber-600" />
              <span>Prerequisites & Requirements Checklist:</span>
            </div>
            <ul className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {guide.requirements.map((req, i) => (
                <li key={i} className="text-[11px] text-amber-900 flex items-start gap-1.5 bg-white/70 p-2 rounded-xl border border-amber-200/50">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                  <span>{req}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-600 flex items-center gap-2">
            <span className="font-bold text-slate-900">{guide.demoAccount.name}</span>
            <span className="text-slate-400">•</span>
            <span className="text-slate-500">{guide.demoAccount.title}</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-initial px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-300 cursor-pointer"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => {
                onQuickFillRole(guide.demoAccount.role);
                onClose();
              }}
              className="flex-1 sm:flex-initial px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>Switch to this Role</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
