import React, { useState, useEffect } from 'react';
import { 
  AlertCircle, Bell, CheckCircle2, Clock, Download, Eye, FileCheck, FileCode, FilePlus2, 
  FileText, Info, Phone, Plus, Printer, QrCode, RefreshCw, 
  Search, Shield, ShieldAlert, ShieldCheck, UserCheck, X 
} from 'lucide-react';
import { StatusPipeline } from './StatusPipeline';
import { apiClient } from '../lib/api';
import type { ClearanceRequest, ClearanceType, ClearanceUrgency, ResidentProfile, User } from '../types';

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
  const [showApplyModal, setShowApplyModal] = useState<boolean>(false);
  
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
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string>('');

  // Profile Edit State
  const [showEditProfileModal, setShowEditProfileModal] = useState<boolean>(false);
  const [editPhone, setEditPhone] = useState<string>(user.contactNumber || '');
  const [editAddress, setEditAddress] = useState<string>(user.address || '');
  const [editPurok, setEditPurok] = useState<string>(user.purok || 'Purok 1');
  const [editCivilStatus, setEditCivilStatus] = useState<string>(profile?.civilStatus || user.civilStatus || 'Single');
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
    setEditCivilStatus(profile?.civilStatus || user.civilStatus || 'Single');
    setEditEmergencyContact(profile?.emergencyContact || '');
    setEditYears(profile?.yearsOfResidency || 1);
  }, [user, profile]);

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

    // Automatically attach resident's verified registered ID submitted during account creation
    const registeredIdPhoto = profile?.idPhotoUrl || user.idPhotoUrl || user.avatarUrl || undefined;
    const registeredIdName = profile?.idPhotoName || user.idPhotoName || 'registered_resident_id.jpg';

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
      idAttachmentName: registeredIdName,
      idAttachmentUrl: registeredIdPhoto
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
      yearsOfResidency: editYears,
      civilStatus: editCivilStatus
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
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-700 to-indigo-600 text-white flex items-center justify-center font-bold text-xl shadow-md shadow-blue-500/30 border border-blue-400/30 shrink-0 overflow-hidden">
            {(user.avatarUrl || profile?.idPhotoUrl) ? (
              <img
                src={user.avatarUrl || profile?.idPhotoUrl}
                alt={user.fullName}
                className="w-full h-full object-cover"
              />
            ) : (
              user.fullName.charAt(0)
            )}
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
            onClick={() => setShowApplyModal(true)}
            className="px-5 py-2.5 btn-3d bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            Request New E-Clearance
          </button>
        </div>
      </div>

      {/* Main E-Clearance Applications Workspace */}
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
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 font-mono uppercase tracking-wider">
                    Attached Government ID Proof (From Registration) *
                  </label>
                  
                  <div className="p-3 bg-gradient-to-r from-blue-50/90 via-indigo-50/60 to-blue-50/90 rounded-2xl border border-blue-200/90 space-y-2 shadow-2xs">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800 flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                        <span>{profile?.idType || user.idType || 'Official Valid Government ID'}</span>
                      </span>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/90 border border-emerald-300 px-2 py-0.5 rounded-full font-mono">
                        VERIFIED ON FILE
                      </span>
                    </div>

                    <div className="flex items-center gap-3 pt-1">
                      {(profile?.idPhotoUrl || user.idPhotoUrl || user.avatarUrl) ? (
                        <div className="w-16 h-12 rounded-xl overflow-hidden border border-blue-300 bg-slate-900 shadow-xs shrink-0">
                          <img
                            src={profile?.idPhotoUrl || user.idPhotoUrl || user.avatarUrl}
                            alt="Registered ID"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-16 h-12 rounded-xl bg-blue-100 border border-blue-300 flex items-center justify-center text-[10px] font-bold text-blue-800 shrink-0">
                          ID CARD
                        </div>
                      )}
                      <div className="text-[11px] leading-snug">
                        <div className="font-bold text-slate-900 font-mono">
                          {profile?.idNumber || user.idNumber || 'PHIL-RES-VERIFIED'}
                        </div>
                        <div className="text-slate-500 text-[10px] mt-0.5">
                          Uploaded during registration · Automatically attached for Desk Staff and Punong Barangay verification.
                        </div>
                      </div>
                    </div>
                  </div>
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
                  Civil Status *
                </label>
                <select
                  value={editCivilStatus}
                  onChange={(e) => setEditCivilStatus(e.target.value)}
                  className="w-full px-3 py-2.5 glass-input rounded-xl text-xs text-slate-900 font-bold"
                >
                  <option value="Single">Single</option>
                  <option value="Married">Married</option>
                  <option value="Widowed">Widowed</option>
                </select>
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
    </div>
  );
};
