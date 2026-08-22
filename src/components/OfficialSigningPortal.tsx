import React, { useState } from 'react';
import { AlertCircle, CheckCircle2, Eye, FileCheck, Image as ImageIcon, KeyRound, Lock, Printer, QrCode, Shield, ShieldCheck, Sparkles, X, ZoomIn } from 'lucide-react';
import confetti from 'canvas-confetti';
import { apiClient } from '../lib/api';
import type { ClearanceRequest } from '../types';

interface OfficialSigningPortalProps {
  requests: ClearanceRequest[];
  onRefresh: () => void;
  onViewDocument: (req: ClearanceRequest) => void;
  onOpenVerify: (ref?: string) => void;
}

export const OfficialSigningPortal: React.FC<OfficialSigningPortalProps> = ({
  requests,
  onRefresh,
  onViewDocument,
  onOpenVerify
}) => {
  const [signingId, setSigningId] = useState<string | null>(null);
  const [signingSuccess, setSigningSuccess] = useState<string>('');
  const [inspectingReq, setInspectingReq] = useState<ClearanceRequest | null>(null);

  const pendingSigning = requests.filter(r => r.status === 'for_signature');
  const alreadySigned = requests.filter(r => r.status === 'ready_for_collection' || r.status === 'issued');

  const handleSignDocument = async (req: ClearanceRequest) => {
    setSigningId(req.id);
    setSigningSuccess('');

    const res = await apiClient.signRequest(req.id);
    setSigningId(null);

    if (res.success && res.data) {
      setSigningSuccess(`Successfully generated HMAC-SHA256 cryptographic seal for ${req.referenceNumber}`);
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 }
      });
      onRefresh();
    }
  };

  return (
    <div className="space-y-6">
      {/* Official Signatory Authority Banner */}
      <div className="bg-white text-slate-900 p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-amber-50 border border-amber-200 text-amber-700 rounded-2xl shrink-0">
            <KeyRound className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900">Office of the Punong Barangay - Cryptographic Signing Desk</h2>
              <span className="px-2 py-0.5 bg-amber-100 border border-amber-300 text-amber-900 text-[10px] font-bold rounded">
                Exclusive Authority
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed font-medium">
              Applying your official digital signature calculates an immutable canonical SHA-256 fingerprint, embeds an anti-forgery HMAC seal, and creates a public QR verification token.
            </p>
            <div className="flex items-center gap-3 text-xs text-slate-500 mt-3 font-mono">
              <span>Signatory: <strong className="text-slate-800">Hon. Cornelio Laugo</strong></span>
              <span>•</span>
              <span>Key Fingerprint: <code className="text-amber-800 font-bold bg-amber-50 px-1 py-0.5 rounded border border-amber-200">KEY-FP-NE-CABUCBUCAN-01</code></span>
            </div>
          </div>
        </div>
      </div>

      {signingSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs rounded-xl flex items-center gap-2 font-bold">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{signingSuccess}</span>
        </div>
      )}

      {/* Pending Signing Queue */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-600" />
            <span>Pending Digital Authorization & Signing ({pendingSigning.length})</span>
          </h3>
          <span className="text-xs text-slate-500 font-medium">Awaiting Punong Barangay Seal</span>
        </div>

        {pendingSigning.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 shadow-sm space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
            <h4 className="text-sm font-bold text-slate-800">Signing Queue Clear</h4>
            <p className="text-xs text-slate-500 font-medium">
              All endorsed clearances have received official cryptographic signatures.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {pendingSigning.map((req) => (
              <div
                key={req.id}
                className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-slate-300 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono font-bold text-sm text-purple-800 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-200">
                      {req.referenceNumber}
                    </span>
                    <h4 className="font-bold text-slate-900 text-base">{req.residentName}</h4>
                    <span className="text-xs text-slate-500 font-medium">({req.purok})</span>
                  </div>

                  <div className="text-xs text-slate-600 space-y-1 font-medium">
                    <p><strong className="text-slate-800 uppercase font-bold">Document:</strong> {req.documentType.replace(/_/g, ' ')}</p>
                    <p><strong className="text-slate-800 font-bold">Purpose:</strong> {req.purpose}</p>
                    {req.staffRemarks && (
                      <p className="text-slate-700 bg-purple-50/50 p-2.5 rounded-xl border border-purple-200 italic">
                        <strong className="text-purple-900 not-italic font-bold">Endorsement Note:</strong> {req.staffRemarks}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto shrink-0">
                  <button
                    onClick={() => setInspectingReq(req)}
                    className="px-3.5 py-2.5 bg-slate-50 hover:bg-slate-100 text-blue-700 text-xs font-bold rounded-xl border border-blue-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                    Inspect ID
                  </button>

                  <button
                    onClick={() => onViewDocument(req)}
                    className="px-4 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-300 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    Preview Certificate
                  </button>

                  <button
                    onClick={() => handleSignDocument(req)}
                    disabled={signingId === req.id}
                    className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <ShieldCheck className="w-4 h-4 text-emerald-300" />
                    <span>{signingId === req.id ? 'Signing & Hashing...' : 'Authorize & Apply HMAC Signature'}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Signed History */}
      <div className="space-y-3 pt-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <FileCheck className="w-4 h-4 text-emerald-600" />
          <span>Recently Signed & Issued Clearances ({alreadySigned.length})</span>
        </h3>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase">
                <tr>
                  <th className="py-3 px-4">Ref Number</th>
                  <th className="py-3 px-4">Resident</th>
                  <th className="py-3 px-4">Document</th>
                  <th className="py-3 px-4">Signed Date</th>
                  <th className="py-3 px-4">SHA-256 Crypto Seal</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {alreadySigned.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-blue-600">{req.referenceNumber}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{req.residentName}</td>
                    <td className="py-3 px-4 uppercase font-bold text-slate-700">{req.documentType.replace(/_/g, ' ')}</td>
                    <td className="py-3 px-4 font-mono text-slate-500 font-medium">
                      {req.signedAt ? new Date(req.signedAt).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="py-3 px-4 font-mono text-[10px] text-emerald-800">
                      <span className="bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-bold">
                        {req.cryptoHash ? req.cryptoHash.substring(0, 16) + '...' : 'Signed'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right space-x-1">
                      <button
                        onClick={() => onViewDocument(req)}
                        className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-bold cursor-pointer border border-slate-300"
                      >
                        Print
                      </button>
                      <button
                        onClick={() => onOpenVerify(req.referenceNumber)}
                        className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold cursor-pointer"
                      >
                        Verify QR
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Punong Barangay Attached ID Inspection Modal */}
      {inspectingReq && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900">Signatory Verification - Resident Attached ID</h3>
              </div>
              <button
                onClick={() => setInspectingReq(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex justify-center p-4 bg-slate-50 rounded-xl border border-slate-200">
              {inspectingReq.idAttachmentUrl ? (
                <img
                  src={inspectingReq.idAttachmentUrl}
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
                        {inspectingReq.residentName.charAt(0)}
                      </div>
                      <span className="text-[9px] text-amber-300 font-mono mt-1 font-bold">VERIFIED</span>
                    </div>

                    <div className="space-y-1.5 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-300 uppercase font-semibold">Applicant Name:</span>
                        <div className="font-bold text-white text-sm">{inspectingReq.residentName}</div>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-300 uppercase font-semibold">Address:</span>
                        <div className="text-slate-100">{inspectingReq.residentAddress}</div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div>
                          <span className="text-[10px] text-slate-300 uppercase font-semibold">Purok / Zone:</span>
                          <div className="text-slate-100 font-mono">{inspectingReq.purok}</div>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-300 uppercase font-semibold">Attachment:</span>
                          <div className="text-emerald-300 font-bold">{inspectingReq.idAttachmentName || 'PhilSys ID'}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-700 flex items-center justify-between text-[11px] font-mono text-slate-300">
                    <span>Identity Status: <strong className="text-emerald-300">Validated by Staff</strong></span>
                    <span className="text-blue-300 font-bold">{inspectingReq.referenceNumber}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-slate-600 font-mono font-medium">
                Document Ref: <strong className="text-blue-600 font-bold">{inspectingReq.referenceNumber}</strong>
              </span>
              <button
                type="button"
                onClick={() => setInspectingReq(null)}
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
