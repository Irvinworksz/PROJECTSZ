import React, { useState, useEffect } from 'react';
import { 
  AlertCircle, Bell, CheckCircle2, Clock, Download, Eye, FileCheck, FileCode, FilePlus2, 
  FileText, FileUp, Info, Lock, Phone, Plus, Printer, QrCode, RefreshCw, 
  Search, Shield, ShieldAlert, ShieldCheck, Smartphone, Trash2, Upload, UserCheck, X 
} from 'lucide-react';
import { StatusPipeline } from './StatusPipeline';
import { MfaSettingsModal } from './MfaSettingsModal';
import { apiClient } from '../lib/api';
import type { ClearanceRequest, ClearanceType, ClearanceUrgency, ResidentProfile, UploadedDocument, User } from '../types';

interface ResidentDashboardProps {
  user: User;
  profile: ResidentProfile | null;
  requests: ClearanceRequest[];
  onRefresh: () => void;
  onViewDocument: (req: ClearanceRequest) => void;
  onUserUpdated?: (user: User) => void;
}

export const ResidentDashboard: React.FC<ResidentDashboardProps> = ({
  user,
  profile,
  requests,
  onRefresh,
  onViewDocument,
  onUserUpdated
}) => {
  const [activeTab, setActiveTab] = useState<'applications' | 'vault' | 'security'>('applications');
  const [showApplyModal, setShowApplyModal] = useState<boolean>(false);
  const [showMfaModal, setShowMfaModal] = useState<boolean>(false);
  
  // Documents Vault State
  const [vaultDocuments, setVaultDocuments] = useState<UploadedDocument[]>([]);
  const [loadingVault, setLoadingVault] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [docCategory, setDocCategory] = useState<'proof_of_residency' | 'valid_id' | 'business_permit_attachment' | 'indigency_proof'>('valid_id');
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadScanResult, setUploadScanResult] = useState<any>(null);
  const [uploadError, setUploadError] = useState<string>('');
  const [simulateMalware, setSimulateMalware] = useState<boolean>(false);

  // Application Form State
  const [docType, setDocType] = useState<ClearanceType>('barangay_clearance');
  const [purpose, setPurpose] = useState<string>('Local Employment / Job Requirement');
  const [customPurpose, setCustomPurpose] = useState<string>('');
  const [urgency, setUrgency] = useState<ClearanceUrgency>('standard');
  const [applicantContactNumber, setApplicantContactNumber] = useState<string>(user.contactNumber || '');
  const [businessName, setBusinessName] = useState<string>('');
  const [businessNature, setBusinessNature] = useState<string>('Retail Store / Sari-Sari Store');
  const [monthlyIncome, setMonthlyIncome] = useState<number>(7500);
  const [assistanceType, setAssistanceType] = useState<string>('Medical & Hospitalization Assistance (DSWD / PGH)');
  const [selectedVaultDocId, setSelectedVaultDocId] = useState<string>('');
  const [idAttachmentName, setIdAttachmentName] = useState<string>('philsys_national_id_front.jpg');
  const [customIdUploadUrl, setCustomIdUploadUrl] = useState<string>('');
  const [idSourceType, setIdSourceType] = useState<'upload' | 'vault' | 'standard'>('standard');
  const [idUploadConsentAgreed, setIdUploadConsentAgreed] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string>('');

  // Profile Edit State
  const [showEditProfileModal, setShowEditProfileModal] = useState<boolean>(false);
  const [editPhone, setEditPhone] = useState<string>(user.contactNumber || '');
  const [editAddress, setEditAddress] = useState<string>(user.address || '');
  const [editPurok, setEditPurok] = useState<string>(user.purok || 'Purok 1');
  const [editEmergencyContact, setEditEmergencyContact] = useState<string>(profile?.emergencyContact || '');
  const [editYears, setEditYears] = useState<number>(profile?.yearsOfResidency || 1);
  const [savingProfile, setSavingProfile] = useState<boolean>(false);
  const [profileMsg, setProfileMsg] = useState<string>('');
  const [profileError, setProfileError] = useState<string>('');

  useEffect(() => {
    setApplicantContactNumber(user.contactNumber || '');
    setEditPhone(user.contactNumber || '');
    setEditAddress(user.address || '');
    setEditPurok(user.purok || 'Purok 1');
  }, [user]);

  useEffect(() => {
    loadVaultDocuments();
  }, []);

  const loadVaultDocuments = async () => {
    setLoadingVault(true);
    const res = await apiClient.getUploadedDocuments();
    setLoadingVault(false);
    if (res.success && res.documents) {
      setVaultDocuments(res.documents);
      if (res.documents.length > 0 && !selectedVaultDocId) {
        setSelectedVaultDocId(res.documents[0].id);
      }
    }
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadError('');
    setUploadScanResult(null);

    let fileToUpload = selectedFile;

    // Simulate malware test if enabled
    if (simulateMalware) {
      const eicarString = `X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*`;
      fileToUpload = new File([eicarString], 'eicar_malware_test_sample.com', { type: 'text/plain' });
    }

    if (!fileToUpload) {
      setUploadError('Please select a document file to scan and upload.');
      return;
    }

    setUploading(true);
    const res = await apiClient.uploadDocument(fileToUpload, docCategory);
    setUploading(false);

    if (res.success && res.document) {
      setUploadScanResult({
        success: true,
        scanReport: res.scanReport,
        document: res.document
      });
      setSelectedFile(null);
      setSimulateMalware(false);
      loadVaultDocuments();
    } else {
      setUploadError(res.error || 'Malware or policy violation detected. File upload rejected.');
      setUploadScanResult({
        success: false,
        scanReport: res.scanReport,
        error: res.error
      });
    }
  };

  const handleDeleteDocument = async (id: string) => {
    if (!confirm('Are you sure you want to delete this document from your secure vault?')) return;
    const res = await apiClient.deleteUploadedDocument(id);
    if (res.success) {
      loadVaultDocuments();
    }
  };

  const getDocTypeTitle = (type: ClearanceType) => {
    switch (type) {
      case 'barangay_clearance': return 'Barangay Clearance';
      case 'certificate_of_indigency': return 'Certificate of Indigency';
      case 'certificate_of_residency': return 'Certificate of Residency';
      case 'business_permit': return 'Barangay Business Clearance';
      default: return type;
    }
  };

  const handleSubmitApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const finalPurpose = purpose === 'Other Purpose' ? customPurpose : purpose;
    if (!finalPurpose.trim()) {
      setFormError('Please specify the purpose of your application.');
      return;
    }

    if (docType === 'business_permit' && !businessName.trim()) {
      setFormError('Business name is required for Business Clearance applications.');
      return;
    }

    if (idSourceType === 'upload' && !idUploadConsentAgreed) {
      setFormError('Please review and agree to the ID verification consent before submitting.');
      return;
    }

    let chosenAttachmentName = idAttachmentName;
    let chosenAttachmentUrl = customIdUploadUrl || undefined;

    if (idSourceType === 'vault' && selectedVaultDocId) {
      const vDoc = vaultDocuments.find(d => d.id === selectedVaultDocId);
      if (vDoc) {
        chosenAttachmentName = vDoc.originalName;
        chosenAttachmentUrl = vDoc.viewUrl || undefined;
      }
    } else if (idSourceType === 'upload' && customIdUploadUrl) {
      chosenAttachmentName = idAttachmentName || 'uploaded_government_id.jpg';
      chosenAttachmentUrl = customIdUploadUrl;
    }

    setIsSubmitting(true);
    const res = await apiClient.submitRequest({
      documentType: docType,
      purpose: finalPurpose,
      urgency,
      contactNumber: applicantContactNumber,
      businessName: docType === 'business_permit' ? businessName : undefined,
      businessNature: docType === 'business_permit' ? businessNature : undefined,
      businessAddress: docType === 'business_permit' ? user.address : undefined,
      monthlyIncome: docType === 'certificate_of_indigency' ? monthlyIncome : undefined,
      assistanceType: docType === 'certificate_of_indigency' ? assistanceType : undefined,
      idAttachmentName: chosenAttachmentName,
      idAttachmentUrl: chosenAttachmentUrl
    });

    setIsSubmitting(false);

    if (res.success) {
      setShowApplyModal(false);
      onRefresh();
      // Reset form
      setCustomPurpose('');
      setBusinessName('');
    } else {
      setFormError(res.error || 'Failed to submit application.');
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError('');
    setProfileMsg('');

    const cleanPhone = editPhone.replace(/[^0-9]/g, '');
    if (/[^0-9]/.test(editPhone.trim()) || cleanPhone.length !== 11) {
      setProfileError('Mobile contact number must be exactly 11 numeric digits (e.g. 09171234567) with no special characters, dashes, or spaces.');
      return;
    }

    setSavingProfile(true);

    const res = await apiClient.updateProfile({
      contactNumber: cleanPhone,
      address: editAddress,
      purok: editPurok,
      emergencyContact: editEmergencyContact,
      yearsOfResidency: editYears
    });

    setSavingProfile(false);

    if (res.success && res.user) {
      setProfileMsg('Contact information updated successfully.');
      if (onUserUpdated) onUserUpdated(res.user);
      setTimeout(() => {
        setShowEditProfileModal(false);
        setProfileMsg('');
      }, 1200);
    } else {
      setProfileError(res.error || 'Failed to update profile.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Resident Identity Header Card */}
      <div className="glass-panel p-6 rounded-3xl border border-white/80 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-700 to-indigo-600 text-white flex items-center justify-center font-bold text-xl shadow-md shadow-blue-500/30 border border-blue-400/30 shrink-0">
            {user.fullName.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900">{user.fullName}</h2>
              <span className="px-2.5 py-0.5 bg-emerald-50/90 border border-emerald-300 text-emerald-900 text-xs font-bold rounded-full flex items-center gap-1 shadow-2xs">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                Verified Resident
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-1 font-medium">
              {user.address} • <strong className="text-slate-900">{user.purok}</strong>
            </p>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 mt-2">
              <span>{profile?.idType || user.idType || 'Official ID'}: <span className="text-slate-900 font-bold font-mono">{profile?.idNumber || user.idNumber || 'VERIFIED-RES'}</span></span>
              <span className="text-slate-300">•</span>
              <span>Civil Status: <span className="text-slate-900 font-bold">{profile?.civilStatus || 'Single'}</span></span>
              <span className="text-slate-300">•</span>
              <span>Residency: <span className="text-slate-900 font-bold">{profile?.yearsOfResidency || 5} Years</span></span>
              <span className="text-slate-300">•</span>
              <span>Contact: <span className="text-slate-900 font-bold font-mono">{profile?.contactNumber || user.contactNumber}</span></span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <button
            onClick={() => setShowEditProfileModal(true)}
            className="px-4 py-2.5 btn-3d-secondary text-slate-800 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer"
          >
            <Phone className="w-4 h-4 text-blue-600" />
            <span>Edit Contact Info</span>
          </button>

          <button
            onClick={() => setShowMfaModal(true)}
            className="px-4 py-2.5 btn-3d-secondary text-slate-800 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer"
          >
            <Smartphone className="w-4 h-4 text-indigo-600" />
            <span>MFA: {user.mfaEnabled ? 'Active (TOTP)' : 'Disabled'}</span>
          </button>

          <button
            onClick={() => setShowApplyModal(true)}
            className="px-5 py-2.5 btn-3d bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            Request New E-Clearance
          </button>
        </div>
      </div>

      {/* Resident Navigation Tabs */}
      <div className="glass-card p-1.5 rounded-2xl flex items-center gap-1 border border-white/80 w-fit max-w-full overflow-x-auto">
        <button
          onClick={() => setActiveTab('applications')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === 'applications'
              ? 'btn-3d bg-blue-600 text-white'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>My Applications ({requests.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('vault')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === 'vault'
              ? 'btn-3d bg-blue-600 text-white'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Secure Document Vault ({vaultDocuments.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === 'security'
              ? 'btn-3d bg-blue-600 text-white'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <Lock className="w-4 h-4 text-indigo-600" />
          <span>IAS Security & MFA Settings</span>
        </button>
      </div>

      {/* TAB 1: APPLICATIONS & PIPELINE */}
      {activeTab === 'applications' && (
        <div className="space-y-6">
          {/* Step-by-Step Resident Instruction Guide */}
          <div className="glass-dark text-white rounded-3xl p-6 shadow-xl border border-white/10 space-y-4 relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-amber-400" />
                  <span>How to Apply for Barangay Documents (Step-by-Step Guide)</span>
                </h3>
                <p className="text-xs text-blue-200 mt-0.5">
                  Follow these 4 simple steps to receive your official cryptographically verified clearance.
                </p>
              </div>
              <button
                onClick={() => setShowApplyModal(true)}
                className="px-4 py-2.5 btn-3d bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Start New Application</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div className="p-3.5 bg-white/5 backdrop-blur-xs rounded-2xl border border-white/10 space-y-1.5 hover:bg-white/10 transition-colors">
                <div className="flex items-center gap-2 text-amber-300 font-bold text-[11px] uppercase tracking-wider font-mono">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-center flex items-center justify-center font-black text-[10px] shadow-sm">1</span>
                  <span>Select Document</span>
                </div>
                <p className="text-blue-100 text-[11px] leading-relaxed">
                  Choose from Barangay Clearance, Certificate of Residency, Indigency (DSWD/Medical), or Business Permit.
                </p>
              </div>

              <div className="p-3.5 bg-white/5 backdrop-blur-xs rounded-2xl border border-white/10 space-y-1.5 hover:bg-white/10 transition-colors">
                <div className="flex items-center gap-2 text-amber-300 font-bold text-[11px] uppercase tracking-wider font-mono">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-center flex items-center justify-center font-black text-[10px] shadow-sm">2</span>
                  <span>Purpose & Proof</span>
                </div>
                <p className="text-blue-100 text-[11px] leading-relaxed">
                  State your purpose (Job, School, Loan, Travel). First-Time Jobseekers enjoy a 100% free fee waiver under RA 11261.
                </p>
              </div>

              <div className="p-3.5 bg-white/5 backdrop-blur-xs rounded-2xl border border-white/10 space-y-1.5 hover:bg-white/10 transition-colors">
                <div className="flex items-center gap-2 text-amber-300 font-bold text-[11px] uppercase tracking-wider font-mono">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-center flex items-center justify-center font-black text-[10px] shadow-sm">3</span>
                  <span>Barangay Review</span>
                </div>
                <p className="text-blue-100 text-[11px] leading-relaxed">
                  Desk staff verifies your residency, voter status, and blotter records. You receive real-time SMS status updates.
                </p>
              </div>

              <div className="p-3.5 bg-white/5 backdrop-blur-xs rounded-2xl border border-white/10 space-y-1.5 hover:bg-white/10 transition-colors">
                <div className="flex items-center gap-2 text-amber-300 font-bold text-[11px] uppercase tracking-wider font-mono">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-center flex items-center justify-center font-black text-[10px] shadow-sm">4</span>
                  <span>Digital Sign & Release</span>
                </div>
                <p className="text-blue-100 text-[11px] leading-relaxed">
                  Punong Barangay digitally signs with an HMAC cryptographic seal. Download, print, or scan QR for instant verification.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              <span>Real-Time E-Clearance Processing Pipeline</span>
            </h3>
            <span className="text-xs text-slate-600 font-mono font-medium">Strict Data Isolation (IAS Privacy Enforced)</span>
          </div>

          {requests.length === 0 ? (
            <div className="p-12 text-center glass-panel rounded-3xl border border-white/80 shadow-md space-y-3">
              <FilePlus2 className="w-12 h-12 text-slate-400 mx-auto" />
              <h4 className="text-sm font-bold text-slate-800">No active clearance applications</h4>
              <p className="text-xs text-slate-600 max-w-sm mx-auto">
                Submit your request online to obtain official Barangay Clearances, Indigency Certificates, and Business Clearances with cryptographic verification.
              </p>
              <button
                onClick={() => setShowApplyModal(true)}
                className="px-4 py-2.5 btn-3d bg-blue-600 text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                Apply Now
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map((req) => (
                <div
                  key={req.id}
                  className="glass-card p-6 rounded-3xl border border-white/80 shadow-md hover:shadow-xl transition-all space-y-4"
                >
                  {/* Header row */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200/80">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono font-bold text-sm text-blue-900 bg-blue-50/90 px-3 py-1 rounded-xl border border-blue-200/80 shadow-2xs">
                        {req.referenceNumber}
                      </span>
                      <h4 className="font-bold text-slate-900 text-sm">{getDocTypeTitle(req.documentType)}</h4>
                      {req.urgency === 'urgent_medical' && (
                        <span className="px-2.5 py-0.5 bg-rose-100/90 border border-rose-300 text-rose-900 text-[10px] font-bold rounded-full">
                          Urgent Medical
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500 font-mono font-medium">
                        Submitted: {new Date(req.submittedAt).toLocaleDateString()}
                      </span>

                      {(req.status === 'ready_for_collection' || req.status === 'issued') && (
                        <button
                          onClick={() => onViewDocument(req)}
                          className="px-3.5 py-1.5 btn-3d bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          View / Print Certificate
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Purpose & Details */}
                  <div className="text-xs text-slate-700 space-y-1">
                    <p><strong className="text-slate-900 font-bold">Purpose:</strong> {req.purpose}</p>
                    {req.staffRemarks && (
                      <p className="text-slate-800 bg-slate-50/80 p-3 rounded-2xl border border-slate-200/80 italic">
                        <strong className="text-blue-700 not-italic font-bold">Staff Remarks:</strong> {req.staffRemarks}
                      </p>
                    )}
                  </div>

                  {/* Real-time Status Pipeline Progress */}
                  <div className="pt-2">
                    <StatusPipeline
                      status={req.status}
                      submittedAt={req.submittedAt}
                      reviewedAt={req.reviewedAt}
                      signedAt={req.signedAt}
                      issuedAt={req.issuedAt}
                      rejectionReason={req.rejectionReason}
                    />
                  </div>

                  {/* Transaction-Specific Status Updates & Pickup Alerts */}
                  {(() => {
                    const residentNotifs = (req.notificationsSent || []).filter(notif =>
                      (notif.targetRole === 'resident' || !notif.targetRole) &&
                      (!notif.residentId || notif.residentId === user.id)
                    );
                    if (residentNotifs.length === 0) return null;
                    return (
                      <div className="p-3.5 glass-panel rounded-2xl border border-white/60 space-y-2">
                        <div className="flex items-center justify-between text-[11px] text-slate-700 font-bold">
                          <span className="flex items-center gap-1.5 text-blue-700">
                            <Bell className="w-3.5 h-3.5 text-blue-600" />
                            Status & Pickup Alerts for {req.referenceNumber}
                          </span>
                          <span className="text-[10px] text-slate-500 font-medium font-mono">Auto-updated</span>
                        </div>
                        <div className="space-y-1.5">
                          {residentNotifs.map((notif) => (
                            <div key={notif.id} className="p-2.5 glass-card rounded-xl text-xs border border-white/60 flex items-start gap-2.5">
                              <span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-blue-100 text-blue-900 border border-blue-200 rounded-lg shrink-0 mt-0.5 font-mono">
                                {req.status === 'ready_for_collection' ? 'Ready for Pickup' : req.status === 'issued' ? 'Completed' : 'Status Update'}
                              </span>
                              <div className="flex-1 min-w-0">
                                <p className="text-slate-800 text-xs leading-snug font-medium">{notif.message}</p>
                                <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">
                                  {new Date(notif.timestamp).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Cryptographic Seal badge if signed */}
                  {req.cryptoHash && (
                    <div className="pt-3 border-t border-slate-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[11px]">
                      <div className="flex items-center gap-1.5 text-emerald-800 font-bold">
                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                        <span>Cryptographically Sealed (SHA-256): <code className="text-slate-600 font-mono">{req.cryptoHash.substring(0, 20)}...</code></span>
                      </div>
                      <span className="text-slate-600 font-mono">Signatory: <span className="text-slate-900 font-bold">{req.signedByOfficialName || 'Punong Barangay'}</span></span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: SECURE DOCUMENT VAULT & MALWARE SCANNER */}
      {activeTab === 'vault' && (
        <div className="space-y-6">
          {/* Vault Header Banner */}
          <div className="p-6 glass-panel rounded-3xl border border-white/80 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-6 h-6 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900">Protected Document Repository</h3>
              </div>
              <p className="text-xs text-slate-600 max-w-2xl leading-relaxed font-medium">
                Official documents and identity credentials uploaded here are verified via secure file validation, protected against unauthorized access, and encrypted in compliance with Republic Act No. 10173 (Data Privacy Act).
              </p>
            </div>
            <button
              onClick={loadVaultDocuments}
              className="px-4 py-2.5 btn-3d-secondary text-slate-800 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingVault ? 'animate-spin' : ''}`} />
              Refresh Vault
            </button>
          </div>

          {/* Upload Form */}
          <div className="glass-card p-6 rounded-3xl border border-white/80 shadow-md space-y-4">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <FileUp className="w-4 h-4 text-blue-600" />
              <span>Upload Supporting Civil Document (Automated Security Scan)</span>
            </h4>

            {uploadError && (
              <div className="p-3.5 bg-rose-50/90 border border-rose-200/90 text-rose-900 text-xs rounded-2xl flex items-center gap-2 shadow-2xs">
                <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
                <div>
                  <span className="font-bold">Security Violation Detected: </span>
                  <span>{uploadError}</span>
                </div>
              </div>
            )}

            {uploadScanResult && uploadScanResult.success && (
              <div className="p-3.5 bg-emerald-50/90 border border-emerald-200/90 text-emerald-900 text-xs rounded-2xl space-y-1 shadow-2xs">
                <div className="flex items-center gap-1.5 font-bold text-emerald-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>File Clean & Verified: {uploadScanResult.document.originalName}</span>
                </div>
                <div className="text-[11px] font-mono text-slate-700 pl-5">
                  SHA-256: {uploadScanResult.scanReport?.sha256Hash} • MIME: {uploadScanResult.scanReport?.detectedMime} • Outside Webroot Storage OK
                </div>
              </div>
            )}

            <form onSubmit={handleFileUpload} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Document Category *
                  </label>
                  <select
                    value={docCategory}
                    onChange={(e) => setDocCategory(e.target.value as any)}
                    className="w-full px-3 py-2.5 glass-input rounded-xl text-xs text-slate-900 font-medium"
                  >
                    <option value="valid_id">Philippine Government Valid ID (PhilSys, UMID, Driver's License)</option>
                    <option value="proof_of_residency">Proof of Residency (Billing Statement, Lease Agreement)</option>
                    <option value="business_permit_attachment">Business Registration (DTI / SEC / Mayor's Form)</option>
                    <option value="indigency_proof">Indigency Certificate / Case Study Assessment</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Choose File (PDF, JPG, PNG, WEBP - Max 10MB) *
                  </label>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.webp,.txt"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setSelectedFile(e.target.files[0]);
                        setSimulateMalware(false);
                      }
                    }}
                    className="w-full text-xs text-slate-700 file:mr-3 file:py-2 file:px-3.5 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-600 file:text-white hover:file:bg-blue-700 file:cursor-pointer glass-input rounded-xl p-1"
                  />
                </div>
              </div>

              {/* Interactive Security Attack Simulator Checkbox */}
              <div className="p-3.5 bg-indigo-50/80 rounded-2xl border border-indigo-200/80 flex items-center justify-between shadow-2xs">
                <div className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    id="malwareTest"
                    checked={simulateMalware}
                    onChange={(e) => {
                      setSimulateMalware(e.target.checked);
                      if (e.target.checked) setSelectedFile(null);
                    }}
                    className="accent-indigo-600 w-4 h-4 cursor-pointer rounded"
                  />
                  <label htmlFor="malwareTest" className="text-xs font-medium text-slate-900 cursor-pointer">
                    <strong className="text-indigo-900 font-bold">Penetration Test Mode:</strong> Inject EICAR Antivirus Malware Test Payload to verify IAS scanner intercept
                  </label>
                </div>
                <span className="text-[10px] text-indigo-950 bg-indigo-100/90 px-2.5 py-0.5 rounded-lg font-mono uppercase font-bold border border-indigo-200">IAS Security Lab</span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-1">
                <button
                  type="submit"
                  disabled={uploading || (!selectedFile && !simulateMalware)}
                  className="px-6 py-2.5 btn-3d bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl cursor-pointer flex items-center gap-2 disabled:opacity-50"
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-300" />
                  <span>{uploading ? 'Scanning & Hashing...' : simulateMalware ? 'Test Intercept (EICAR Payload)' : 'Scan & Secure Upload'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* List of Stored Documents in Vault */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-emerald-600" />
              <span>Encrypted Document Repository ({vaultDocuments.length} files)</span>
            </h4>

            {vaultDocuments.length === 0 ? (
              <div className="p-8 text-center glass-panel rounded-3xl border border-white/80 text-xs text-slate-500 font-medium">
                No documents uploaded yet. Upload your Valid IDs and Proof of Residency above.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {vaultDocuments.map((doc) => (
                  <div
                    key={doc.id}
                    className="glass-card p-4 rounded-3xl border border-white/80 shadow-sm hover:shadow-md transition-all space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2.5">
                        <div className="p-2.5 bg-blue-50/90 border border-blue-200 text-blue-700 rounded-xl shrink-0 shadow-2xs">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <h5 className="text-xs font-bold text-slate-900 truncate max-w-xs">{doc.originalName}</h5>
                          <span className="text-[10px] text-slate-500 uppercase font-mono font-bold">{doc.documentCategory.replace(/_/g, ' ')}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeleteDocument(doc.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50/80 rounded-xl transition-colors cursor-pointer"
                        title="Delete from Vault"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="p-2.5 bg-slate-50/80 rounded-2xl border border-slate-200/80 text-[10px] font-mono text-slate-600 space-y-1">
                      <div className="flex justify-between">
                        <span>Integrity Hash (SHA-256):</span>
                        <span className="text-slate-900 font-bold truncate max-w-[180px]">{doc.sha256Hash}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Antivirus Scan:</span>
                        <span className="text-emerald-700 font-bold">CLEAN (0 Threats)</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Vault Path:</span>
                        <span className="text-slate-500">data/secure_document_vault/...</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1 text-[11px]">
                      <span className="text-slate-500 font-medium font-mono">{(doc.fileSize / 1024).toFixed(1)} KB • {new Date(doc.uploadedAt).toLocaleDateString()}</span>
                      <a
                        href={doc.viewUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1 btn-3d-secondary text-blue-700 font-bold rounded-xl flex items-center gap-1.5"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Stream / View</span>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: IAS SECURITY & MFA SETTINGS */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          <div className="glass-panel p-6 rounded-3xl border border-white/80 shadow-md space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-indigo-50/90 border border-indigo-200 text-indigo-700 rounded-2xl shadow-2xs">
                  <Smartphone className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Multi-Factor Authentication (TOTP)</h3>
                  <p className="text-xs text-slate-600 font-medium">RFC 6238 Time-Based One-Time Password Standard</p>
                </div>
              </div>
              <button
                onClick={() => setShowMfaModal(true)}
                className="px-4 py-2.5 btn-3d bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                Manage MFA Config
              </button>
            </div>

            <div className="p-4 bg-white/60 rounded-2xl border border-slate-200/80 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-900">Current MFA Status:</span>
                <p className="text-xs text-slate-600 font-medium">
                  {user.mfaEnabled
                    ? 'Active. Your account requires 6-digit TOTP verification from Google Authenticator / Microsoft Authenticator on each sign in.'
                    : 'Disabled. Protect your account against credential stuffing by enabling TOTP multi-factor authentication.'}
                </p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold shrink-0 ml-4 font-mono ${
                user.mfaEnabled
                  ? 'bg-emerald-100 border border-emerald-300 text-emerald-900'
                  : 'bg-amber-100 border border-amber-300 text-amber-900'
              }`}>
                {user.mfaEnabled ? 'Protected (2FA On)' : 'Unprotected (2FA Off)'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="glass-card p-5 rounded-3xl border border-white/80 shadow-sm space-y-2">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-blue-600" />
                Data Privacy & Encryption
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                In compliance with RA 10173 (Data Privacy Act of 2012), your personal records, contact information, and attached credentials are encrypted at rest with AES-256 and authenticated with salted BCrypt hashes.
              </p>
            </div>

            <div className="glass-card p-5 rounded-3xl border border-white/80 shadow-sm space-y-2">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Non-Repudiation Audit Trail
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                All clearance issuances and administrative actions are stamped into an immutable SHA-256 cryptographic chain, preventing document forgery and unauthorized alteration.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Application Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-xl glass-panel text-slate-800 rounded-3xl shadow-2xl border border-white/80 my-8 overflow-hidden">
            <div className="px-6 py-4 bg-white/60 text-slate-900 flex items-center justify-between border-b border-slate-200/80">
              <div className="flex items-center gap-2.5">
                <FilePlus2 className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-sm text-slate-900">Online E-Clearance Request Form</h3>
              </div>
              <button
                onClick={() => setShowApplyModal(false)}
                className="text-slate-500 hover:text-slate-900 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleSubmitApplication} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-rose-50/90 border border-rose-200/90 text-rose-900 text-xs rounded-2xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span className="font-bold">{formError}</span>
                </div>
              )}

              {/* Document Type Selection */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 font-mono">
                  Select Document Type *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {[
                    { id: 'barangay_clearance', name: 'Barangay Clearance', fee: '₱50.00' },
                    { id: 'certificate_of_indigency', name: 'Certificate of Indigency', fee: 'Free (₱0.00)' },
                    { id: 'certificate_of_residency', name: 'Certificate of Residency', fee: '₱50.00' },
                    { id: 'business_permit', name: 'Barangay Business Clearance', fee: '₱350.00' }
                  ].map(t => (
                    <label
                      key={t.id}
                      className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                        docType === t.id
                          ? 'border-blue-600 bg-blue-50/80 shadow-md ring-2 ring-blue-500/30'
                          : 'border-slate-200/80 bg-white/70 hover:bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900">{t.name}</span>
                        <input
                          type="radio"
                          name="docType"
                          value={t.id}
                          checked={docType === t.id}
                          onChange={(e) => setDocType(e.target.value as ClearanceType)}
                          className="text-blue-600 accent-blue-600"
                        />
                      </div>
                      <span className="text-[10px] font-mono text-slate-600 font-bold mt-1.5">{t.fee}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Purpose Selection */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1 font-mono">
                  Purpose of Application *
                </label>
                <select
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  className="w-full px-3 py-2.5 glass-input rounded-xl text-xs text-slate-900 font-medium"
                >
                  <option value="Local Employment / Job Requirement">Local Employment / Job Requirement</option>
                  <option value="Postal ID / Government ID Application">Postal ID / Government ID Application</option>
                  <option value="Bank Account Opening / Credit Facility">Bank Account Opening / Credit Facility</option>
                  <option value="Police / NBI Clearance Application">Police / NBI Clearance Application</option>
                  <option value="Scholarship / Educational Financial Aid">Scholarship / Educational Financial Aid</option>
                  <option value="Medical Assistance at PGH / Hospitalization (DSWD)">Medical Assistance at PGH / Hospitalization (DSWD)</option>
                  <option value="Water / Electric Service Connection">Water / Electric Service Connection</option>
                  <option value="Other Purpose">Other Purpose (Specify Below)</option>
                </select>
              </div>

              {purpose === 'Other Purpose' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Specify Purpose:</label>
                  <input
                    type="text"
                    value={customPurpose}
                    onChange={(e) => setCustomPurpose(e.target.value)}
                    placeholder="Enter detailed purpose..."
                    className="w-full px-3 py-2.5 glass-input rounded-xl text-xs text-slate-900 placeholder:text-slate-400 font-medium"
                  />
                </div>
              )}

              {/* Conditional: Indigency specific details */}
              {docType === 'certificate_of_indigency' && (
                <div className="p-3.5 bg-amber-50/80 rounded-2xl border border-amber-200/80 space-y-3 shadow-2xs">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                    <Info className="w-4 h-4 text-amber-600" />
                    <span>Indigency Declaration Details</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block">Monthly Family Income (₱):</label>
                      <input
                        type="number"
                        value={monthlyIncome}
                        onChange={(e) => setMonthlyIncome(Number(e.target.value))}
                        className="w-full px-3 py-2 glass-input rounded-xl text-xs font-mono text-slate-900 font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block">Assistance Program:</label>
                      <select
                        value={assistanceType}
                        onChange={(e) => setAssistanceType(e.target.value)}
                        className="w-full px-3 py-2 glass-input rounded-xl text-xs text-slate-900 font-medium"
                      >
                        <option value="Medical & Hospitalization (DSWD)">Medical & Hospitalization (DSWD)</option>
                        <option value="Educational Scholarship (Provincial / LGU Rizal)">Educational Scholarship (Provincial / LGU Rizal)</option>
                        <option value="Burial / Funeral Assistance">Burial / Funeral Assistance</option>
                        <option value="Public Attorney Legal Aid (PAO)">Public Attorney Legal Aid (PAO)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {docType === 'business_permit' && (
                <div className="p-3.5 bg-blue-50/80 rounded-2xl border border-blue-200/80 space-y-3 shadow-2xs">
                  <span className="text-xs font-bold text-blue-900">Business Enterprise Information</span>
                  <div className="space-y-2">
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block">Business Registered Trade Name:</label>
                      <input
                        type="text"
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                        placeholder="e.g. Dela Cruz Mini-Mart & Carinderia"
                        className="w-full px-3 py-2.5 glass-input rounded-xl text-xs text-slate-900 placeholder:text-slate-400 font-medium"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block">Nature of Business:</label>
                      <input
                        type="text"
                        value={businessNature}
                        onChange={(e) => setBusinessNature(e.target.value)}
                        placeholder="e.g. Grocery Retail, Eatery, Laundry Shop"
                        className="w-full px-3 py-2.5 glass-input rounded-xl text-xs text-slate-900 placeholder:text-slate-400 font-medium"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Urgency & Attached Document Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Processing Urgency</label>
                  <select
                    value={urgency}
                    onChange={(e) => setUrgency(e.target.value as ClearanceUrgency)}
                    className="w-full px-3 py-2.5 glass-input rounded-xl text-xs text-slate-900 font-medium"
                  >
                    <option value="standard">Standard (1-2 Business Days)</option>
                    <option value="express">Express Priority (Same Day)</option>
                    <option value="urgent_medical">Urgent Medical Emergency</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Attached Government ID Proof *</label>
                  
                  <div className="flex rounded-xl bg-slate-100/90 p-1 border border-slate-200/80 mb-2.5">
                    <button
                      type="button"
                      onClick={() => setIdSourceType('standard')}
                      className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                        idSourceType === 'standard' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Official Philippine ID
                    </button>
                    <button
                      type="button"
                      onClick={() => setIdSourceType('upload')}
                      className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                        idSourceType === 'upload' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Upload ID Photo / Scan
                    </button>
                    {vaultDocuments.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setIdSourceType('vault')}
                        className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                          idSourceType === 'vault' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        From Vault ({vaultDocuments.length})
                      </button>
                    )}
                  </div>

                  {idSourceType === 'standard' && (
                    <div className="space-y-2">
                      <select
                        value={idAttachmentName}
                        onChange={(e) => {
                          setIdAttachmentName(e.target.value);
                          setCustomIdUploadUrl('');
                        }}
                        className="w-full px-3 py-2.5 glass-input rounded-xl text-xs text-slate-900 font-medium"
                      >
                        <option value="philsys_national_id_front.jpg">Philippine National ID (PhilSys Digital / Physical)</option>
                        <option value="umid_card_scan.pdf">UMID / SSS ID Card</option>
                        <option value="voters_id_san_isidro.jpg">COMELEC Voter's ID / Certification</option>
                        <option value="drivers_license_lto.jpg">LTO Driver's License</option>
                        <option value="passport_dha_ph.jpg">Philippine Passport (DFA)</option>
                      </select>
                      <div className="p-2.5 bg-white/60 rounded-xl border border-slate-200/80 flex items-center justify-between text-[11px] text-slate-600">
                        <span className="flex items-center gap-1.5 font-semibold">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                          <span>PhilSys Registered Identity</span>
                        </span>
                        <span className="font-mono text-slate-900 font-bold">{profile?.idNumber || 'PHIL-2024-8841'}</span>
                      </div>
                    </div>
                  )}

                  {idSourceType === 'upload' && (
                    <div className="space-y-2">
                      <input
                        type="file"
                        accept="image/png, image/jpeg, image/webp, application/pdf"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setIdAttachmentName(file.name);
                            if (file.type.startsWith('image/')) {
                              const reader = new FileReader();
                              reader.onload = (loadEvt) => {
                                setCustomIdUploadUrl(loadEvt.target?.result as string);
                              };
                              reader.readAsDataURL(file);
                            } else {
                              setCustomIdUploadUrl('');
                            }
                          }
                        }}
                        className="w-full text-xs text-slate-700 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-600 file:text-white hover:file:bg-blue-700 file:cursor-pointer glass-input rounded-xl p-1"
                      />

                      <label className="flex items-start gap-2 p-2 bg-blue-50/70 border border-blue-200/80 rounded-xl cursor-pointer text-[11px] text-slate-700 select-none">
                        <input
                          type="checkbox"
                          checked={idUploadConsentAgreed}
                          onChange={(e) => setIdUploadConsentAgreed(e.target.checked)}
                          className="mt-0.5 w-3.5 h-3.5 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer shrink-0"
                        />
                        <span>
                          I agree that my uploaded identification document will be used exclusively by authorized Barangay Cabucbucan intake staff for civil identity and clearance verification.
                        </span>
                      </label>
                      {customIdUploadUrl && (
                        <div className="relative p-2.5 bg-slate-50/90 rounded-2xl border border-blue-200 flex items-center gap-3">
                          <img
                            src={customIdUploadUrl}
                            alt="Uploaded ID Preview"
                            className="w-16 h-12 object-cover rounded-xl border border-slate-300 shrink-0"
                          />
                          <div className="overflow-hidden text-xs">
                            <span className="font-bold text-slate-900 block truncate">{idAttachmentName}</span>
                            <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Ready for verification
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {idSourceType === 'vault' && (
                    <select
                      value={selectedVaultDocId}
                      onChange={(e) => setSelectedVaultDocId(e.target.value)}
                      className="w-full px-3 py-2.5 glass-input rounded-xl text-xs text-slate-900 font-medium"
                    >
                      {vaultDocuments.map((vd) => (
                        <option key={vd.id} value={vd.id}>
                          {vd.originalName} ({vd.documentCategory.replace(/_/g, ' ')})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              {/* Applicant Contact Number for Release & SMS updates */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1 font-mono">
                  Applicant Contact Mobile Number (For SMS Tracking & Release) *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    inputMode="tel"
                    value={applicantContactNumber}
                    onChange={(e) => setApplicantContactNumber(e.target.value)}
                    required
                    placeholder="09171234567"
                    className="w-full pl-10 pr-3 py-2.5 glass-input rounded-xl text-xs font-mono text-slate-900 placeholder:text-slate-400 font-bold"
                  />
                </div>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  You can modify your contact number directly to receive instant SMS updates and security OTPs.
                </span>
              </div>

              {/* Notification Notice */}
              <div className="p-3 bg-white/60 rounded-2xl border border-slate-200/80 flex items-center gap-2 text-xs text-slate-700">
                <Phone className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Automated SMS updates will be dispatched to: <strong className="text-slate-900 font-mono">{applicantContactNumber || user.contactNumber}</strong></span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowApplyModal(false)}
                  className="px-4 py-2.5 text-slate-600 text-xs font-bold hover:text-slate-900 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 btn-3d bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Submitting Application...' : 'Confirm & Submit Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Resident Profile / Contact Info Modal */}
      {showEditProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-md glass-panel text-slate-800 rounded-3xl shadow-2xl border border-white/80 my-8 overflow-hidden">
            <div className="px-6 py-4 bg-white/60 text-slate-900 flex items-center justify-between border-b border-slate-200/80">
              <div className="flex items-center gap-2.5">
                <Phone className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-sm text-slate-900">Update Resident Contact Details</h3>
              </div>
              <button
                onClick={() => setShowEditProfileModal(false)}
                className="text-slate-500 hover:text-slate-900 text-xs font-bold cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="p-6 space-y-4">
              {profileMsg && (
                <div className="p-3 bg-emerald-50/90 border border-emerald-200/90 text-emerald-900 text-xs rounded-2xl flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span className="font-bold">{profileMsg}</span>
                </div>
              )}

              {profileError && (
                <div className="p-3 bg-rose-50/90 border border-rose-200/90 text-rose-900 text-xs rounded-2xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span className="font-bold">{profileError}</span>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Mobile Contact Number *
                  </label>
                  <span className={`text-[10px] font-mono font-bold ${editPhone.length === 11 ? 'text-emerald-700' : 'text-slate-400'}`}>
                    {editPhone.length === 11 ? '✓ 11 digits' : `${editPhone.length}/11`}
                  </span>
                </div>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]{11}"
                  maxLength={11}
                  minLength={11}
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value.replace(/[^0-9]/g, '').slice(0, 11))}
                  required
                  placeholder="09171234567"
                  className="w-full px-3 py-2.5 glass-input rounded-xl text-xs font-mono text-slate-900 font-bold"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Must be exactly 11 numeric digits without special characters or spaces.
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Street / House Address *
                </label>
                <input
                  type="text"
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  required
                  placeholder="e.g. Purok 3, Barangay Cabucbucan"
                  className="w-full px-3 py-2.5 glass-input rounded-xl text-xs text-slate-900 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Purok / Zone *
                  </label>
                  <select
                    value={editPurok}
                    onChange={(e) => setEditPurok(e.target.value)}
                    className="w-full px-3 py-2.5 glass-input rounded-xl text-xs text-slate-900 font-medium"
                  >
                    <option value="Purok 1">Purok 1</option>
                    <option value="Purok 2">Purok 2</option>
                    <option value="Purok 3">Purok 3</option>
                    <option value="Purok 4">Purok 4</option>
                    <option value="Purok 5">Purok 5</option>
                    <option value="Purok 6">Purok 6</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Years of Residency
                  </label>
                  <input
                    type="number"
                    value={editYears}
                    onChange={(e) => setEditYears(Number(e.target.value))}
                    min={1}
                    className="w-full px-3 py-2.5 glass-input rounded-xl text-xs font-mono text-slate-900 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Emergency Contact Phone Number
                </label>
                <input
                  type="text"
                  inputMode="tel"
                  value={editEmergencyContact}
                  onChange={(e) => setEditEmergencyContact(e.target.value)}
                  placeholder="09189876543"
                  className="w-full px-3 py-2.5 glass-input rounded-xl text-xs font-mono text-slate-900 font-bold"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditProfileModal(false)}
                  className="px-4 py-2.5 text-slate-600 text-xs font-bold hover:text-slate-900 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="px-5 py-2.5 btn-3d bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl cursor-pointer disabled:opacity-50"
                >
                  {savingProfile ? 'Saving Changes...' : 'Save Contact Information'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MFA Settings Modal */}
      {showMfaModal && (
        <MfaSettingsModal
          isOpen={showMfaModal}
          onClose={() => setShowMfaModal(false)}
          user={user}
          onUserUpdated={(updatedUser) => {
            if (onUserUpdated) onUserUpdated(updatedUser);
          }}
        />
      )}
    </div>
  );
};
