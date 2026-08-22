import React, { useState } from 'react';
import { AlertCircle, Bell, CheckCircle2, Clock, Eye, FileCheck, Filter, Image as ImageIcon, MessageSquare, Phone, Printer, QrCode, RefreshCw, Search, Send, ShieldAlert, ShieldCheck, Sparkles, UserCheck, X, ZoomIn } from 'lucide-react';
import { apiClient } from '../lib/api';
import type { ClearanceRequest, RequestStatus } from '../types';

interface StaffDashboardProps {
  requests: ClearanceRequest[];
  onRefresh: () => void;
  onViewDocument: (req: ClearanceRequest) => void;
  onOpenVerify: (ref?: string) => void;
}

export const StaffDashboard: React.FC<StaffDashboardProps> = ({
  requests,
  onRefresh,
  onViewDocument,
  onOpenVerify
}) => {
  const [selectedReq, setSelectedReq] = useState<ClearanceRequest | null>(null);
  const [showIdZoomModal, setShowIdZoomModal] = useState<boolean>(false);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
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
      {/* Overview Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs font-bold text-slate-600">Submitted (Queue)</span>
          <div className="text-2xl font-black text-blue-600">
            {requests.filter(r => r.status === 'submitted').length}
          </div>
          <span className="text-[10px] text-slate-500 font-medium">Needs initial ID check</span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs font-bold text-slate-600">Under Review</span>
          <div className="text-2xl font-black text-amber-600">
            {requests.filter(r => r.status === 'under_review').length}
          </div>
          <span className="text-[10px] text-slate-500 font-medium">Background blotter check</span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs font-bold text-slate-600">For Captain Signature</span>
          <div className="text-2xl font-black text-indigo-600">
            {requests.filter(r => r.status === 'for_signature').length}
          </div>
          <span className="text-[10px] text-slate-500 font-medium">Awaiting HMAC seal</span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs font-bold text-slate-600">Ready / Released</span>
          <div className="text-2xl font-black text-emerald-600">
            {requests.filter(r => r.status === 'ready_for_collection' || r.status === 'issued').length}
          </div>
          <span className="text-[10px] text-slate-500 font-medium">Cryptographically sealed</span>
        </div>
      </div>

      {/* Staff Review Queue Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search ref #, resident name, purok..."
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Ref Number</th>
                <th className="py-3.5 px-4">Resident Applicant</th>
                <th className="py-3.5 px-4">Document Type</th>
                <th className="py-3.5 px-4">Purpose</th>
                <th className="py-3.5 px-4">Current Status</th>
                <th className="py-3.5 px-4">Fee / OR</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500 font-medium">
                    No clearance requests match the selected filter.
                  </td>
                </tr>
              ) : (
                filteredRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-blue-600 whitespace-nowrap">
                      {req.referenceNumber}
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
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${
                          req.status === 'issued'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : req.status === 'ready_for_collection'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                            : req.status === 'for_signature'
                            ? 'bg-purple-50 text-purple-800 border-purple-300'
                            : req.status === 'under_review'
                            ? 'bg-amber-50 text-amber-800 border-amber-300'
                            : req.status === 'rejected'
                            ? 'bg-rose-50 text-rose-800 border-rose-300'
                            : 'bg-blue-50 text-blue-800 border-blue-300'
                        }`}
                      >
                        {req.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-800 font-bold whitespace-nowrap">
                      ₱{req.feeAmount.toFixed(2)}{' '}
                      {req.orNumber && <span className="text-[10px] text-slate-500 font-normal block">({req.orNumber})</span>}
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap space-x-1">
                      {req.status !== 'issued' && req.status !== 'rejected' && (
                        <button
                          onClick={() => handleOpenReview(req)}
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs transition-colors cursor-pointer shadow-xs"
                        >
                          Review
                        </button>
                      )}

                      {req.status === 'ready_for_collection' && (
                        <button
                          onClick={() => handleMarkIssued(req)}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs transition-colors cursor-pointer shadow-xs"
                        >
                          Mark Released
                        </button>
                      )}

                      {(req.status === 'ready_for_collection' || req.status === 'issued') && (
                        <button
                          onClick={() => onViewDocument(req)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          title="Print Document"
                        >
                          <Printer className="w-4 h-4 inline" />
                        </button>
                      )}

                      <button
                        onClick={() => onOpenVerify(req.referenceNumber)}
                        className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                        title="Verify Hash & QR"
                      >
                        <QrCode className="w-4 h-4 inline" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review Modal */}
      {selectedReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-xl bg-white text-slate-800 rounded-2xl shadow-2xl border border-slate-200 my-8 overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 text-slate-900 flex items-center justify-between border-b border-slate-200">
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
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-900 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span className="font-bold">{reviewError}</span>
                </div>
              )}

              {/* Resident Summary Card */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-2 gap-2 text-xs">
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
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
                    <span>Resident Attached Government ID</span>
                  </span>
                  <span className="text-[11px] font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200 flex items-center gap-1 font-bold">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    <span>{selectedReq.idAttachmentName || 'PhilSys National ID'}</span>
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 relative group overflow-hidden">
                  {selectedReq.idAttachmentUrl ? (
                    <div className="flex flex-col sm:flex-row items-center gap-3">
                      <div className="relative w-full sm:w-44 h-28 rounded-lg overflow-hidden border border-slate-300 bg-white shrink-0 cursor-pointer shadow-xs" onClick={() => setShowIdZoomModal(true)}>
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
                          className="mt-1 px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <ZoomIn className="w-3 h-3" /> Inspect High-Resolution ID
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* High-Fidelity PhilSys / Philippine Government ID Card Simulation */
                    <div className="p-3 bg-gradient-to-r from-slate-100 via-blue-50/50 to-slate-100 rounded-xl border border-blue-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-14 h-16 rounded-lg bg-white border-2 border-amber-400 overflow-hidden flex flex-col items-center justify-center text-slate-800 shrink-0 relative shadow-xs">
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
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shrink-0 transition-colors shadow-xs"
                      >
                        <ZoomIn className="w-3.5 h-3.5" /> View ID Card
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Staff Verification Checklist */}
              <div className="space-y-2 pt-1">
                <span className="text-xs font-bold text-slate-900 block">Staff Identity & Blotter Cross-Check:</span>
                <div className="space-y-1.5 text-xs bg-blue-50/60 p-3 rounded-xl border border-blue-200">
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
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Update Pipeline Status *
                </label>
                <select
                  value={targetStatus}
                  onChange={(e) => setTargetStatus(e.target.value as RequestStatus)}
                  className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="under_review">1. Keep Under Review (Further Verification)</option>
                  <option value="for_signature">2. Forward to Punong Barangay FOR SIGNATURE</option>
                  <option value="rejected">3. Reject Application (Issue Rejection Notice)</option>
                </select>
              </div>

              {/* Conditional: Rejection Reason */}
              {targetStatus === 'rejected' ? (
                <div>
                  <label className="block text-xs font-bold text-rose-700 mb-1">Official Rejection Reason *</label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="State reason (e.g. Unverified address, pending Lupon complaint, blurred ID)..."
                    rows={2}
                    className="w-full px-3 py-2 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 placeholder:text-rose-400 font-medium focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Staff Verification Remarks</label>
                  <input
                    type="text"
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="Staff notes for applicant and Punong Barangay..."
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              {/* OR Number */}
              {selectedReq.feeAmount > 0 && targetStatus !== 'rejected' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Fee Required:</label>
                    <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900">
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
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}

              <div className="p-2.5 bg-blue-50 rounded-xl border border-blue-200 flex items-center gap-2 text-xs text-blue-900 font-medium">
                <Bell className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span>The applicant's portal notifications and pipeline status will be updated immediately.</span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedReq(null)}
                  className="px-4 py-2 text-slate-600 text-xs font-bold hover:text-slate-900 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
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
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900">Government Identity Proof Inspection</h3>
              </div>
              <button
                onClick={() => setShowIdZoomModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex justify-center p-4 bg-slate-50 rounded-xl border border-slate-200">
              {selectedReq.idAttachmentUrl ? (
                <img
                  src={selectedReq.idAttachmentUrl}
                  alt="Full Resolution ID"
                  className="max-h-[60vh] object-contain rounded-lg border border-slate-300 shadow-md"
                />
              ) : (
                <div className="w-full max-w-md bg-gradient-to-br from-slate-800 via-slate-900 to-indigo-950 p-6 rounded-2xl border-2 border-amber-400/80 shadow-xl space-y-4 text-white">
                  <div className="flex items-center justify-between border-b border-amber-400/40 pb-3">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-amber-300 tracking-wider block">Republic of the Philippines</span>
                      <span className="text-xs font-black text-white">Philippine Identification System (PhilID)</span>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center font-bold text-xs text-white">
                      PH
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="w-24 h-28 bg-slate-950 rounded-xl border-2 border-slate-700 overflow-hidden flex flex-col items-center justify-center text-white shrink-0 relative">
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
                className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-colors cursor-pointer border border-slate-300"
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
