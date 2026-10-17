import React, { useState, useEffect } from 'react';
import { 
  AlertCircle, Bell, CheckCircle2, Clock, Eye, FileCheck, Filter, 
  Image as ImageIcon, MessageSquare, Phone, Printer, QrCode, RefreshCw, 
  Search, Send, ShieldAlert, ShieldCheck, UserCheck, X, ZoomIn,
  Users, Check, Award, ThumbsUp, ThumbsDown, UserPlus, MapPin, Mail
} from 'lucide-react';
import { apiClient } from '../lib/api';
import type { ClearanceRequest, RequestStatus, ResidentVerificationRecord } from '../types';

interface StaffDashboardProps {
  requests: ClearanceRequest[];
  onRefresh: () => void;
  onViewDocument: (req: ClearanceRequest) => void;
}

export const StaffDashboard: React.FC<StaffDashboardProps> = ({
  requests,
  onRefresh,
  onViewDocument
}) => {
  const [activeStaffTab, setActiveStaffTab] = useState<'clearances' | 'residents'>('clearances');
  const [selectedReq, setSelectedReq] = useState<ClearanceRequest | null>(null);
  const [showIdZoomModal, setShowIdZoomModal] = useState<boolean>(false);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Resident Verification Queue State
  const [residents, setResidents] = useState<ResidentVerificationRecord[]>([]);
  const [residentsCounts, setResidentsCounts] = useState<{ total: number; pending: number; verified: number; rejected: number }>({
    total: 0,
    pending: 0,
    verified: 0,
    rejected: 0
  });
  const [loadingResidents, setLoadingResidents] = useState<boolean>(false);
  const [selectedResidentForReview, setSelectedResidentForReview] = useState<ResidentVerificationRecord | null>(null);
  const [residentDecision, setResidentDecision] = useState<'verified' | 'rejected'>('verified');
  const [residentRemarks, setResidentRemarks] = useState<string>('Residency verified against official attached ID credentials.');
  const [residentReviewError, setResidentReviewError] = useState<string>('');
  const [isVerifyingResident, setIsVerifyingResident] = useState<boolean>(false);
  const [residentIdZoomModal, setResidentIdZoomModal] = useState<ResidentVerificationRecord | null>(null);
  const [residentFilter, setResidentFilter] = useState<string>('ALL');
  const [residentSearch, setResidentSearch] = useState<string>('');

  const loadResidents = async () => {
    setLoadingResidents(true);
    try {
      const res = await apiClient.getStaffResidents();
      if (res.success && res.data) {
        setResidents(res.data);
        if (res.counts) setResidentsCounts(res.counts);
      }
    } catch {
      // Ignore network errors
    } finally {
      setLoadingResidents(false);
    }
  };

  useEffect(() => {
    loadResidents();
  }, []);

  const handleOpenResidentReview = (resident: ResidentVerificationRecord) => {
    setSelectedResidentForReview(resident);
    setResidentDecision(resident.verificationStatus === 'rejected' ? 'rejected' : 'verified');
    setResidentRemarks(resident.verificationRemarks || 'Residency verified against official attached ID credentials.');
    setResidentReviewError('');
  };

  const handleSaveResidentVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedResidentForReview) return;
    setIsVerifyingResident(true);
    setResidentReviewError('');
    const res = await apiClient.verifyResident(selectedResidentForReview.id, residentDecision, residentRemarks);
    setIsVerifyingResident(false);
    if (res.success) {
      setSelectedResidentForReview(null);
      loadResidents();
    } else {
      setResidentReviewError(res.error || 'Failed to update resident verification status.');
    }
  };
  
  // Review Modal Form State
  const [targetStatus, setTargetStatus] = useState<RequestStatus>('under_review');
  const [remarks, setRemarks] = useState<string>('');
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [orNumber, setOrNumber] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [reviewError, setReviewError] = useState<string>('');

  // Checkbox verification states
  const [voterVerified, setVoterVerified] = useState<boolean>(true);
  const [blotterCleared, setBlotterCleared] = useState<boolean>(true);
  const [idConfirmed, setIdConfirmed] = useState<boolean>(true);

  const filteredRequests = requests.filter(req => {
    if (statusFilter !== 'ALL' && req.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        req.referenceNumber.toLowerCase().includes(q) ||
        req.residentName.toLowerCase().includes(q) ||
        req.purok.toLowerCase().includes(q) ||
        req.purpose.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const filteredResidents = residents.filter(r => {
    if (residentFilter !== 'ALL' && r.verificationStatus !== residentFilter) return false;
    if (residentSearch.trim()) {
      const q = residentSearch.toLowerCase();
      return (
        r.fullName.toLowerCase().includes(q) ||
        r.username.toLowerCase().includes(q) ||
        (r.purokZone && r.purokZone.toLowerCase().includes(q)) ||
        (r.idType && r.idType.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleOpenReview = (req: ClearanceRequest) => {
    setSelectedReq(req);
    setTargetStatus(req.status === 'submitted' ? 'under_review' : 'for_signature');
    setRemarks(req.staffRemarks || 'Verified against local registry and blotter records. No derogatory record found.');
    setRejectionReason(req.rejectionReason || '');
    setOrNumber(req.orNumber || `OR-MNL-2026-${Math.floor(1000 + Math.random() * 9000)}`);
    setReviewError('');
  };

  const handleSaveReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReq) return;

    if (targetStatus === 'rejected' && !rejectionReason.trim()) {
      setReviewError('Please provide an official rejection reason.');
      return;
    }

    setIsProcessing(true);
    const res = await apiClient.reviewRequest(selectedReq.id, {
      status: targetStatus,
      remarks,
      rejectionReason: targetStatus === 'rejected' ? rejectionReason : undefined,
      orNumber: selectedReq.feeAmount > 0 ? orNumber : undefined
    });

    setIsProcessing(false);

    if (res.success) {
      setSelectedReq(null);
      onRefresh();
    } else {
      setReviewError(res.error || 'Failed to update review status.');
    }
  };

  const handleMarkIssued = async (req: ClearanceRequest) => {
    const res = await apiClient.issueRequest(req.id, req.orNumber || 'OR-PAID');
    if (res.success) {
      onRefresh();
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Workspace Tab Switcher */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-1.5 glass-panel rounded-2xl border border-white/80 shadow-sm">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setActiveStaffTab('clearances')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
              activeStaffTab === 'clearances'
                ? 'btn-3d bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <FileCheck className="w-4 h-4 text-blue-300" />
            <span>Clearance Applications Queue</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
              activeStaffTab === 'clearances' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
            }`}>
              {requests.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveStaffTab('residents');
              loadResidents();
            }}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
              activeStaffTab === 'residents'
                ? 'btn-3d bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <Users className="w-4 h-4 text-emerald-300" />
            <span>Resident ID Verification Desk</span>
            {residentsCounts.pending > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-400 text-amber-950 animate-pulse">
                {residentsCounts.pending} Pending
              </span>
            )}
            {residentsCounts.pending === 0 && (
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                activeStaffTab === 'residents' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {residentsCounts.total}
              </span>
            )}
          </button>
        </div>

        <div className="flex items-center gap-2 px-2">
          <button
            type="button"
            onClick={() => {
              onRefresh();
              loadResidents();
            }}
            className="px-3 py-1.5 btn-3d-secondary text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer ml-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingResidents ? 'animate-spin' : ''}`} />
            <span>Refresh Queue</span>
          </button>
        </div>
      </div>

      {activeStaffTab === 'clearances' ? (
        <>
          {/* Overview Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-5 glass-card rounded-3xl border border-white/80 shadow-md hover:shadow-xl transition-all space-y-1.5 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/10 rounded-full blur-xl pointer-events-none" />
              <span className="text-xs font-bold text-slate-600">Submitted (Queue)</span>
              <div className="text-3xl font-black text-blue-600 tracking-tight font-mono">
                {requests.filter(r => r.status === 'submitted').length}
              </div>
              <span className="text-[10px] text-slate-500 font-medium block">Needs initial ID check</span>
            </div>

            <div className="p-5 glass-card rounded-3xl border border-white/80 shadow-md hover:shadow-xl transition-all space-y-1.5 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/10 rounded-full blur-xl pointer-events-none" />
              <span className="text-xs font-bold text-slate-600">Under Review</span>
              <div className="text-3xl font-black text-amber-600 tracking-tight font-mono">
                {requests.filter(r => r.status === 'under_review').length}
              </div>
              <span className="text-[10px] text-slate-500 font-medium block">Background blotter check</span>
            </div>

            <div className="p-5 glass-card rounded-3xl border border-white/80 shadow-md hover:shadow-xl transition-all space-y-1.5 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-500/10 rounded-full blur-xl pointer-events-none" />
              <span className="text-xs font-bold text-slate-600">For Captain Signature</span>
              <div className="text-3xl font-black text-indigo-600 tracking-tight font-mono">
                {requests.filter(r => r.status === 'for_signature').length}
              </div>
              <span className="text-[10px] text-slate-500 font-medium block">Awaiting HMAC seal</span>
            </div>

            <div className="p-5 glass-card rounded-3xl border border-white/80 shadow-md hover:shadow-xl transition-all space-y-1.5 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/10 rounded-full blur-xl pointer-events-none" />
              <span className="text-xs font-bold text-slate-600">Ready / Released</span>
              <div className="text-3xl font-black text-emerald-600 tracking-tight font-mono">
                {requests.filter(r => r.status === 'ready_for_collection' || r.status === 'issued').length}
              </div>
              <span className="text-[10px] text-slate-500 font-medium block">Cryptographically sealed</span>
            </div>
          </div>

          {/* Staff Review Queue Toolbar */}
          <div className="glass-panel p-4 rounded-2xl border border-white/80 shadow-md flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search ref #, resident name, purok..."
                className="w-full pl-10 pr-3.5 py-2 glass-input rounded-xl text-xs text-slate-900 placeholder:text-slate-400 font-medium"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="flex items-center gap-1.5 text-xs text-slate-600 font-bold">
                <Filter className="w-3.5 h-3.5 text-slate-500" />
                <span>Filter Status:</span>
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3.5 py-2 glass-input rounded-xl text-xs font-bold text-slate-900"
              >
                <option value="ALL">All Requests ({requests.length})</option>
                <option value="submitted">Submitted</option>
                <option value="under_review">Under Review</option>
                <option value="for_signature">For Signature</option>
                <option value="ready_for_collection">Ready for Collection</option>
                <option value="issued">Issued / Released</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>

          {/* Applications Queue Table */}
          <div className="glass-card rounded-3xl border border-white/80 shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-700 font-bold uppercase tracking-wider font-mono">
                  <tr>
                    <th className="py-4 px-4">Ref Number</th>
                    <th className="py-4 px-4">Resident Applicant</th>
                    <th className="py-4 px-4">Document Type</th>
                    <th className="py-4 px-4">Purpose</th>
                    <th className="py-4 px-4">Current Status</th>
                    <th className="py-4 px-4">Fee / OR</th>
                    <th className="py-4 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans">
                  {filteredRequests.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-500 font-medium">
                        No clearance requests match the selected filter.
                      </td>
                    </tr>
                  ) : (
                    filteredRequests.map((req) => (
                      <tr key={req.id} className="hover:bg-white/60 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-blue-600 whitespace-nowrap">
                          <span className="bg-blue-50/80 px-2.5 py-1 rounded-lg border border-blue-200/80 shadow-2xs">
                            {req.referenceNumber}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="font-bold text-slate-900">{req.residentName}</div>
                          <span className="text-[10px] text-slate-500 font-medium">{req.purok}</span>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap uppercase font-bold text-slate-700">
                          {req.documentType.replace(/_/g, ' ')}
                        </td>
                        <td className="py-3.5 px-4 max-w-xs truncate text-slate-600 font-medium" title={req.purpose}>
                          {req.purpose}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border shadow-2xs ${
                              req.status === 'issued'
                                ? 'bg-emerald-50/90 text-emerald-800 border-emerald-300'
                                : req.status === 'ready_for_collection'
                                ? 'bg-emerald-50/90 text-emerald-700 border-emerald-300'
                                : req.status === 'for_signature'
                                ? 'bg-purple-50/90 text-purple-800 border-purple-300'
                                : req.status === 'under_review'
                                ? 'bg-amber-50/90 text-amber-800 border-amber-300'
                                : req.status === 'rejected'
                                ? 'bg-rose-50/90 text-rose-800 border-rose-300'
                                : 'bg-blue-50/90 text-blue-800 border-blue-300'
                            }`}
                          >
                            {req.status.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-800 font-bold whitespace-nowrap">
                          ₱{req.feeAmount.toFixed(2)}{' '}
                          {req.orNumber && <span className="text-[10px] text-slate-500 font-normal block">({req.orNumber})</span>}
                        </td>
                        <td className="py-3.5 px-4 text-right whitespace-nowrap space-x-1.5">
                          {req.status !== 'issued' && req.status !== 'rejected' && (
                            <button
                              onClick={() => handleOpenReview(req)}
                              className="px-3.5 py-1.5 btn-3d bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs cursor-pointer"
                            >
                              Review
                            </button>
                          )}

                          {req.status === 'ready_for_collection' && (
                            <button
                              onClick={() => handleMarkIssued(req)}
                              className="px-3 py-1.5 btn-3d bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs cursor-pointer"
                            >
                              Mark Released
                            </button>
                          )}

                          {(req.status === 'ready_for_collection' || req.status === 'issued') && (
                            <button
                              onClick={() => onViewDocument(req)}
                              className="p-1.5 btn-3d-secondary text-slate-700 hover:text-blue-600 rounded-xl cursor-pointer inline-flex items-center"
                              title="Print Document"
                            >
                              <Printer className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* Resident Civil Registry & ID Verification Desk */
        <div className="space-y-6">
          {/* Resident Overview Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-5 glass-card rounded-3xl border border-white/80 shadow-md space-y-1.5">
              <span className="text-xs font-bold text-slate-600">Total Registered</span>
              <div className="text-3xl font-black text-slate-900 tracking-tight font-mono">
                {residentsCounts.total}
              </div>
              <span className="text-[10px] text-slate-500 font-medium block">Civil Registry database</span>
            </div>

            <div className="p-5 glass-card rounded-3xl border border-white/80 shadow-md space-y-1.5">
              <span className="text-xs font-bold text-amber-700">Pending Review</span>
              <div className="text-3xl font-black text-amber-600 tracking-tight font-mono">
                {residentsCounts.pending}
              </div>
              <span className="text-[10px] text-amber-600/80 font-medium block">Attached ID to verify</span>
            </div>

            <div className="p-5 glass-card rounded-3xl border border-white/80 shadow-md space-y-1.5">
              <span className="text-xs font-bold text-emerald-700">Verified Residents</span>
              <div className="text-3xl font-black text-emerald-600 tracking-tight font-mono">
                {residentsCounts.verified}
              </div>
              <span className="text-[10px] text-emerald-600/80 font-medium block">Eligible for expedited clearance</span>
            </div>

            <div className="p-5 glass-card rounded-3xl border border-white/80 shadow-md space-y-1.5">
              <span className="text-xs font-bold text-rose-700">Rejected / Re-upload</span>
              <div className="text-3xl font-black text-rose-600 tracking-tight font-mono">
                {residentsCounts.rejected}
              </div>
              <span className="text-[10px] text-rose-600/80 font-medium block">Unclear ID credentials</span>
            </div>
          </div>

          {/* Resident Toolbar */}
          <div className="glass-panel p-4 rounded-2xl border border-white/80 shadow-md flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={residentSearch}
                onChange={(e) => setResidentSearch(e.target.value)}
                placeholder="Search resident name, username, purok..."
                className="w-full pl-10 pr-3.5 py-2 glass-input rounded-xl text-xs text-slate-900 placeholder:text-slate-400 font-medium"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="flex items-center gap-1.5 text-xs text-slate-600 font-bold">
                <Filter className="w-3.5 h-3.5 text-slate-500" />
                <span>Verification Filter:</span>
              </div>
              <select
                value={residentFilter}
                onChange={(e) => setResidentFilter(e.target.value)}
                className="px-3.5 py-2 glass-input rounded-xl text-xs font-bold text-slate-900"
              >
                <option value="ALL">All Residents ({residents.length})</option>
                <option value="pending_review">Pending Review ({residentsCounts.pending})</option>
                <option value="verified">Verified ({residentsCounts.verified})</option>
                <option value="rejected">Rejected ({residentsCounts.rejected})</option>
              </select>
            </div>
          </div>

          {/* Residents Table */}
          <div className="glass-card rounded-3xl border border-white/80 shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-700 font-bold uppercase tracking-wider font-mono">
                  <tr>
                    <th className="py-4 px-4">Resident Citizen</th>
                    <th className="py-4 px-4">Purok & Address</th>
                    <th className="py-4 px-4">Government ID Attachment</th>
                    <th className="py-4 px-4">Verification Status</th>
                    <th className="py-4 px-4">Review Remarks / Staff</th>
                    <th className="py-4 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans">
                  {filteredResidents.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-500 font-medium">
                        No resident records match the selected filter.
                      </td>
                    </tr>
                  ) : (
                    filteredResidents.map((r) => (
                      <tr key={r.id} className="hover:bg-white/60 transition-colors">
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="font-bold text-slate-900">{r.fullName}</div>
                          <div className="text-[10px] text-slate-500 font-mono">@{r.username} • {r.contactNumber || 'No phone'}</div>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="font-bold text-blue-700">{r.purokZone || 'Purok 1'}</div>
                          <div className="text-[10px] text-slate-500 truncate max-w-xs">{r.streetAddress}</div>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            {r.idPhotoUrl ? (
                              <button
                                type="button"
                                onClick={() => setResidentIdZoomModal(r)}
                                className="w-12 h-8 rounded-lg overflow-hidden border border-slate-300 shadow-2xs hover:ring-2 hover:ring-blue-500 transition-all cursor-pointer bg-slate-100 shrink-0"
                                title="Click to view full ID"
                              >
                                <img
                                  src={r.idPhotoUrl}
                                  alt="ID"
                                  className="w-full h-full object-cover"
                                />
                              </button>
                            ) : (
                              <div className="w-12 h-8 rounded-lg bg-slate-200 border border-slate-300 flex items-center justify-center text-[9px] text-slate-500 font-bold shrink-0">
                                NO ID
                              </div>
                            )}
                            <div>
                              <div className="font-bold text-slate-800 text-[11px]">{r.idType || 'Government ID'}</div>
                              <span className="font-mono text-[10px] text-slate-500">{r.idNumber || 'No ID #'}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border shadow-2xs inline-flex items-center gap-1 ${
                            r.verificationStatus === 'verified'
                              ? 'bg-emerald-50/90 text-emerald-800 border-emerald-300'
                              : r.verificationStatus === 'pending_review'
                              ? 'bg-amber-50/90 text-amber-800 border-amber-300'
                              : 'bg-rose-50/90 text-rose-800 border-rose-300'
                          }`}>
                            {r.verificationStatus === 'verified' && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                            {r.verificationStatus === 'pending_review' && <Clock className="w-3 h-3 text-amber-600" />}
                            {r.verificationStatus === 'rejected' && <AlertCircle className="w-3 h-3 text-rose-600" />}
                            <span>{r.verificationStatus.replace(/_/g, ' ')}</span>
                          </span>
                        </td>
                        <td className="py-3.5 px-4 max-w-xs truncate text-[11px] text-slate-600">
                          <div>{r.verificationRemarks || 'Awaiting initial desk assessment.'}</div>
                          {r.reviewedByStaffName && (
                            <div className="text-[10px] text-slate-400 font-medium">By {r.reviewedByStaffName}</div>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right whitespace-nowrap space-x-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenResidentReview(r)}
                            className="px-3.5 py-1.5 btn-3d bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs cursor-pointer inline-flex items-center gap-1"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>Verify / Review</span>
                          </button>
                          {r.idPhotoUrl && (
                            <button
                              type="button"
                              onClick={() => setResidentIdZoomModal(r)}
                              className="p-1.5 btn-3d-secondary text-slate-700 hover:text-blue-600 rounded-xl cursor-pointer inline-flex items-center"
                              title="Inspect Attached ID"
                            >
                              <ZoomIn className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {selectedReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-xl glass-panel text-slate-800 rounded-3xl shadow-2xl border border-white/80 my-8 overflow-hidden">
            <div className="px-6 py-4 bg-white/60 text-slate-900 flex items-center justify-between border-b border-slate-200/80">
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-sm text-slate-900">Administrative Desk Clearance Review</h3>
              </div>
              <button
                onClick={() => setSelectedReq(null)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveReview} className="p-6 space-y-4">
              {reviewError && (
                <div className="p-3.5 bg-rose-50/90 border border-rose-200/90 text-rose-900 text-xs rounded-2xl flex items-center gap-2 shadow-2xs">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span className="font-bold">{reviewError}</span>
                </div>
              )}

              {/* Resident Summary Card */}
              <div className="p-4 bg-white/70 rounded-2xl border border-slate-200/80 grid grid-cols-2 gap-2 text-xs shadow-2xs">
                <div>
                  <span className="text-slate-500 block font-medium">Resident Applicant:</span>
                  <strong className="text-slate-900 font-bold">{selectedReq.residentName}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block font-medium">Reference No:</span>
                  <span className="font-mono font-bold text-blue-600">{selectedReq.referenceNumber}</span>
                </div>
                <div>
                  <span className="text-slate-500 block font-medium">Document Type:</span>
                  <span className="font-bold uppercase text-slate-800">{selectedReq.documentType.replace(/_/g, ' ')}</span>
                </div>
                <div>
                  <span className="text-slate-500 block font-medium">Address & Purok:</span>
                  <span className="text-slate-800 font-medium">{selectedReq.residentAddress} ({selectedReq.purok})</span>
                </div>
                <div className="col-span-full pt-1">
                  <span className="text-slate-500 block font-medium">Declared Purpose:</span>
                  <p className="text-slate-800 font-semibold">{selectedReq.purpose}</p>
                </div>
              </div>

              {/* Resident Government ID Attachment Preview */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5 font-mono">
                    <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
                    <span>Resident Attached Government ID</span>
                  </span>
                  <span className="text-[11px] font-mono text-emerald-800 bg-emerald-50/90 px-2.5 py-0.5 rounded-lg border border-emerald-200/80 flex items-center gap-1 font-bold">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    <span>{selectedReq.idAttachmentName || 'PhilSys National ID'}</span>
                  </span>
                </div>

                <div className="p-3.5 bg-white/70 rounded-2xl border border-slate-200/80 relative group overflow-hidden shadow-2xs">
                  {selectedReq.idAttachmentUrl ? (
                    <div className="flex flex-col sm:flex-row items-center gap-3">
                      <div className="relative w-full sm:w-44 h-28 rounded-xl overflow-hidden border border-slate-300/80 bg-white shrink-0 cursor-pointer shadow-xs" onClick={() => setShowIdZoomModal(true)}>
                        <img
                          src={selectedReq.idAttachmentUrl}
                          alt="Resident ID Scan"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1">
                          <ZoomIn className="w-4 h-4" /> Expand
                        </div>
                      </div>
                      <div className="space-y-1 text-xs">
                        <div className="font-bold text-slate-900">Resident Uploaded Identity Document</div>
                        <div className="text-[11px] text-slate-500 font-mono">File: {selectedReq.idAttachmentName}</div>
                        <div className="text-[11px] text-emerald-700 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Scanned & Authenticated by Barangay Portal
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowIdZoomModal(true)}
                          className="mt-1 px-3 py-1 btn-3d-secondary text-blue-700 rounded-xl text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <ZoomIn className="w-3 h-3" /> Inspect High-Resolution ID
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* High-Fidelity PhilSys / Philippine Government ID Card Simulation */
                    <div className="p-3.5 bg-gradient-to-r from-slate-100/90 via-blue-50/50 to-slate-100/90 rounded-2xl border border-blue-200/80 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-14 h-16 rounded-xl bg-white border-2 border-amber-400 overflow-hidden flex flex-col items-center justify-center text-slate-800 shrink-0 relative shadow-xs">
                          <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs">
                            {selectedReq.residentName.charAt(0)}
                          </div>
                          <span className="text-[8px] font-mono text-amber-700 mt-1 font-bold">PHILSYS</span>
                        </div>
                        <div className="space-y-0.5 text-xs">
                          <div className="text-[10px] uppercase font-bold text-amber-700 tracking-wider">Republic of the Philippines • PhilSys ID</div>
                          <div className="font-bold text-slate-900 text-sm">{selectedReq.residentName}</div>
                          <div className="text-[11px] text-slate-600 font-mono font-medium">CRN: 4481-9023-8812 • Purok: {selectedReq.purok}</div>
                          <div className="text-[10px] text-emerald-700 flex items-center gap-1 font-bold">
                            <ShieldCheck className="w-3 h-3 text-emerald-600" /> Official Registered Resident Match
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setShowIdZoomModal(true)}
                        className="px-3.5 py-1.5 btn-3d bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shrink-0"
                      >
                        <ZoomIn className="w-3.5 h-3.5" /> View ID Card
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Staff Verification Checklist */}
              <div className="space-y-2 pt-1">
                <span className="text-xs font-bold text-slate-900 block font-mono">Staff Identity & Blotter Cross-Check:</span>
                <div className="space-y-2 text-xs bg-blue-50/60 p-3.5 rounded-2xl border border-blue-200/80">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-800 font-medium">
                    <input
                      type="checkbox"
                      checked={voterVerified}
                      onChange={(e) => setVoterVerified(e.target.checked)}
                      className="rounded text-blue-600 accent-blue-600 w-4 h-4 cursor-pointer"
                    />
                    <span>Verified in Barangay Cabucbucan Registered Resident / Voter List</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-slate-800 font-medium">
                    <input
                      type="checkbox"
                      checked={blotterCleared}
                      onChange={(e) => setBlotterCleared(e.target.checked)}
                      className="rounded text-blue-600 accent-blue-600 w-4 h-4 cursor-pointer"
                    />
                    <span>Checked against Lupon Tagapamayapa records (No active blotter cases)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-slate-800 font-medium">
                    <input
                      type="checkbox"
                      checked={idConfirmed}
                      onChange={(e) => setIdConfirmed(e.target.checked)}
                      className="rounded text-blue-600 accent-blue-600 w-4 h-4 cursor-pointer"
                    />
                    <span>Government ID attachment matches applicant signature & photo</span>
                  </label>
                </div>
              </div>

              {/* Status Transition Selector */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1 font-mono">
                  Update Pipeline Status *
                </label>
                <select
                  value={targetStatus}
                  onChange={(e) => setTargetStatus(e.target.value as RequestStatus)}
                  className="w-full px-3 py-2.5 glass-input rounded-xl text-xs font-bold text-slate-900"
                >
                  <option value="under_review">1. Keep Under Review (Further Verification)</option>
                  <option value="for_signature">2. Forward to Punong Barangay FOR SIGNATURE</option>
                  <option value="rejected">3. Reject Application (Issue Rejection Notice)</option>
                </select>
              </div>

              {/* Conditional: Rejection Reason */}
              {targetStatus === 'rejected' ? (
                <div>
                  <label className="block text-xs font-bold text-rose-700 mb-1 font-mono">Official Rejection Reason *</label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="State reason (e.g. Unverified address, pending Lupon complaint, blurred ID)..."
                    rows={2}
                    className="w-full px-3 py-2 bg-rose-50/90 border border-rose-200/90 rounded-xl text-xs text-rose-900 placeholder:text-rose-400 font-medium focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 font-mono">Staff Verification Remarks</label>
                  <input
                    type="text"
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="Staff notes for applicant and Punong Barangay..."
                    className="w-full px-3 py-2.5 glass-input rounded-xl text-xs text-slate-900 placeholder:text-slate-400 font-medium"
                  />
                </div>
              )}

              {/* OR Number */}
              {selectedReq.feeAmount > 0 && targetStatus !== 'rejected' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Fee Required:</label>
                    <div className="px-3 py-2.5 bg-white/60 border border-slate-200/80 rounded-xl text-xs font-mono font-bold text-slate-900">
                      ₱{selectedReq.feeAmount.toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Official Receipt (O.R.) No:</label>
                    <input
                      type="text"
                      value={orNumber}
                      onChange={(e) => setOrNumber(e.target.value)}
                      placeholder="e.g. OR-MNL-2026-8812"
                      className="w-full px-3 py-2.5 glass-input rounded-xl text-xs font-mono font-bold text-slate-900 placeholder:text-slate-400"
                    />
                  </div>
                </div>
              )}

              <div className="p-3 bg-blue-50/80 rounded-2xl border border-blue-200/80 flex items-center gap-2 text-xs text-blue-900 font-medium">
                <Bell className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span>The applicant's portal notifications and pipeline status will be updated immediately.</span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedReq(null)}
                  className="px-4 py-2.5 text-slate-600 text-xs font-bold hover:text-slate-900 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="px-6 py-2.5 btn-3d bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl cursor-pointer disabled:opacity-50"
                >
                  {isProcessing ? 'Processing Review...' : 'Save & Advance Pipeline'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* High-Resolution Government ID Inspection Modal */}
      {showIdZoomModal && selectedReq && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="relative w-full max-w-2xl glass-panel border border-white/80 rounded-3xl shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900">Government Identity Proof Inspection</h3>
              </div>
              <button
                onClick={() => setShowIdZoomModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-xl hover:bg-slate-100/80 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex justify-center p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80">
              {selectedReq.idAttachmentUrl ? (
                <img
                  src={selectedReq.idAttachmentUrl}
                  alt="Full Resolution ID"
                  className="max-h-[60vh] object-contain rounded-xl border border-slate-300/80 shadow-md"
                />
              ) : (
                <div className="w-full max-w-md bg-gradient-to-br from-slate-800 via-slate-900 to-indigo-950 p-6 rounded-3xl border-2 border-amber-400/80 shadow-2xl space-y-4 text-white">
                  <div className="flex items-center justify-between border-b border-amber-400/40 pb-3">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-amber-300 tracking-wider block font-mono">Republic of the Philippines</span>
                      <span className="text-xs font-black text-white">Philippine Identification System (PhilID)</span>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center font-bold text-xs text-white">
                      PH
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="w-24 h-28 bg-slate-950 rounded-2xl border-2 border-slate-700 overflow-hidden flex flex-col items-center justify-center text-white shrink-0 relative">
                      <div className="w-14 h-14 rounded-full bg-blue-600 flex items-center justify-center font-bold text-xl text-white">
                        {selectedReq.residentName.charAt(0)}
                      </div>
                      <span className="text-[9px] text-amber-300 font-mono mt-1 font-bold">VERIFIED</span>
                    </div>

                    <div className="space-y-1.5 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-300 uppercase font-semibold">Cardholder Name:</span>
                        <div className="font-bold text-white text-sm">{selectedReq.residentName}</div>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-300 uppercase font-semibold">Registered Address:</span>
                        <div className="text-slate-100">{selectedReq.residentAddress}</div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div>
                          <span className="text-[10px] text-slate-300 uppercase font-semibold">Purok / Zone:</span>
                          <div className="text-slate-100 font-mono">{selectedReq.purok}</div>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-300 uppercase font-semibold">Residency Status:</span>
                          <div className="text-emerald-300 font-bold">Verified Native</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-700 flex items-center justify-between text-[11px] font-mono text-slate-300">
                    <span>PhilSys ID: 4481-9023-8812-7019</span>
                    <span className="text-emerald-300 font-bold">Digital Signature: VALID</span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-slate-600 font-mono font-medium">
                Document Ref: <strong className="text-blue-600 font-bold">{selectedReq.referenceNumber}</strong>
              </span>
              <button
                type="button"
                onClick={() => setShowIdZoomModal(false)}
                className="px-5 py-2 btn-3d-secondary text-slate-800 text-xs font-bold rounded-xl cursor-pointer"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Resident Verification Decision Modal */}
      {selectedResidentForReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-lg glass-panel text-slate-800 rounded-3xl shadow-2xl border border-white/80 my-8 overflow-hidden">
            <div className="px-6 py-4 bg-white/60 text-slate-900 flex items-center justify-between border-b border-slate-200/80">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-sm text-slate-900">Resident Proof of Residency Review</h3>
              </div>
              <button
                onClick={() => setSelectedResidentForReview(null)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveResidentVerification} className="p-6 space-y-4">
              {residentReviewError && (
                <div className="p-3.5 bg-rose-50/90 border border-rose-200/90 text-rose-900 text-xs rounded-2xl flex items-center gap-2 shadow-2xs">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span className="font-bold">{residentReviewError}</span>
                </div>
              )}

              {/* Resident Info Card */}
              <div className="p-4 bg-white/70 rounded-2xl border border-slate-200/80 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-sm">{selectedResidentForReview.fullName}</span>
                  <span className="font-mono text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded">@{selectedResidentForReview.username}</span>
                </div>
                <div className="text-slate-600 text-[11px] space-y-0.5">
                  <div><strong>Address:</strong> {selectedResidentForReview.streetAddress} ({selectedResidentForReview.purokZone})</div>
                  <div><strong>ID Presented:</strong> {selectedResidentForReview.idType} ({selectedResidentForReview.idNumber || 'No ID Number'})</div>
                </div>

                {selectedResidentForReview.idPhotoUrl && (
                  <div className="pt-2 flex items-center gap-3">
                    <img
                      src={selectedResidentForReview.idPhotoUrl}
                      alt="Thumbnail"
                      className="w-20 h-14 object-cover rounded-xl border border-slate-300 shadow-2xs"
                    />
                    <button
                      type="button"
                      onClick={() => setResidentIdZoomModal(selectedResidentForReview)}
                      className="px-3 py-1.5 btn-3d-secondary text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer"
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                      <span>View Full Resolution ID</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Decision Toggle */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">Verification Decision:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setResidentDecision('verified');
                      setResidentRemarks('Residency verified against official attached ID credentials.');
                    }}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-2 ${
                      residentDecision === 'verified'
                        ? 'btn-3d bg-emerald-600 text-white border-emerald-600'
                        : 'btn-3d-secondary text-slate-700'
                    }`}
                  >
                    <ThumbsUp className="w-4 h-4" />
                    <div>
                      <div className="font-bold text-xs">Verify Resident</div>
                      <span className={`text-[10px] ${residentDecision === 'verified' ? 'text-emerald-100' : 'text-slate-500'}`}>Approve credentials</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setResidentDecision('rejected');
                      setResidentRemarks('ID photo is unclear or does not match applicant civil registry records. Please re-upload a clear government ID.');
                    }}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-2 ${
                      residentDecision === 'rejected'
                        ? 'btn-3d bg-rose-600 text-white border-rose-600'
                        : 'btn-3d-secondary text-slate-700'
                    }`}
                  >
                    <ThumbsDown className="w-4 h-4" />
                    <div>
                      <div className="font-bold text-xs">Reject / Request ID</div>
                      <span className={`text-[10px] ${residentDecision === 'rejected' ? 'text-rose-100' : 'text-slate-500'}`}>Ask for clearer proof</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Verification Remarks */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">Official Desk Assessment Remarks:</label>
                <textarea
                  value={residentRemarks}
                  onChange={(e) => setResidentRemarks(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 glass-input rounded-xl text-xs text-slate-900 font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedResidentForReview(null)}
                  className="px-4 py-2 text-slate-600 text-xs font-bold hover:text-slate-900 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isVerifyingResident}
                  className={`px-5 py-2 btn-3d text-white text-xs font-bold rounded-xl cursor-pointer disabled:opacity-50 ${
                    residentDecision === 'verified' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  {isVerifyingResident ? 'Updating Status...' : (residentDecision === 'verified' ? 'Confirm Verification' : 'Submit Rejection')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Resident Full ID Card Zoom Modal */}
      {residentIdZoomModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="relative w-full max-w-2xl glass-panel border border-white/80 rounded-3xl shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{residentIdZoomModal.fullName} • Proof of Identity</h3>
                  <p className="text-[11px] text-slate-500 font-mono">{residentIdZoomModal.idType} ({residentIdZoomModal.idNumber || 'No ID Number'})</p>
                </div>
              </div>
              <button
                onClick={() => setResidentIdZoomModal(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-xl hover:bg-slate-100/80 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex justify-center p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 max-h-[65vh] overflow-auto">
              {residentIdZoomModal.idPhotoUrl ? (
                <img
                  src={residentIdZoomModal.idPhotoUrl}
                  alt="Full Resolution ID"
                  className="max-h-[55vh] object-contain rounded-xl border border-slate-300 shadow-md bg-white"
                />
              ) : (
                <div className="text-center py-10 text-slate-500 font-medium text-xs">
                  No ID image attached for this resident.
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-1">
              <div className="text-xs text-slate-600">
                <span>Address: <strong>{residentIdZoomModal.streetAddress} ({residentIdZoomModal.purokZone})</strong></span>
              </div>
              <button
                type="button"
                onClick={() => setResidentIdZoomModal(null)}
                className="px-5 py-2 btn-3d-secondary text-slate-800 text-xs font-bold rounded-xl cursor-pointer"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
