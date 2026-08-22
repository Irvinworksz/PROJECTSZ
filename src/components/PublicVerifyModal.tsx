import React, { useState } from 'react';
import { AlertTriangle, CheckCircle2, QrCode, Search, ShieldAlert, ShieldCheck, X } from 'lucide-react';
import { apiClient } from '../lib/api';
import type { VerificationResult } from '../types';

interface PublicVerifyModalProps {
  initialRef?: string;
  onClose: () => void;
}

export const PublicVerifyModal: React.FC<PublicVerifyModalProps> = ({ initialRef = '', onClose }) => {
  const [query, setQuery] = useState<string>(initialRef);
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<VerificationResult | null>(null);

  const handleVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setResult(null);

    const res = await apiClient.verifyDocument(query.trim());
    setLoading(false);
    if (res.success && res.data) {
      setResult(res.data);
    } else {
      setResult({
        isValid: false,
        referenceNumber: query,
        documentType: 'barangay_clearance',
        residentName: 'N/A',
        signatory: 'N/A',
        cryptoHash: '',
        status: 'rejected',
        message: res.error || 'Verification query failed.'
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 border-b border-slate-800 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 border border-blue-500/30 text-blue-400 rounded-xl">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Public Document Integrity & QR Verification</h3>
              <p className="text-xs text-slate-300">Validate official Barangay clearances against immutable database records</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 bg-white">
          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Enter Document Reference No. or SHA-256 Crypto Hash
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="e.g. BC-2026-0842 or SHA-256 hash..."
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading || !query.trim()}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-sm rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer shrink-0"
                >
                  {loading ? (
                    <span>Verifying...</span>
                  ) : (
                    <>
                      <QrCode className="w-4 h-4" />
                      Verify Proof
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Quick Demo Pre-fill suggestions */}
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <span className="font-medium">Quick Test:</span>
              <button
                type="button"
                onClick={() => { setQuery('BC-2026-0842'); }}
                className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 font-mono rounded-lg cursor-pointer transition-colors font-medium"
              >
                BC-2026-0842 (Valid)
              </button>
              <button
                type="button"
                onClick={() => { setQuery('IND-2026-0193'); }}
                className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 font-mono rounded-lg cursor-pointer transition-colors font-medium"
              >
                IND-2026-0193 (Pending)
              </button>
              <button
                type="button"
                onClick={() => { setQuery('FAKE-BC-9999'); }}
                className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-mono rounded-lg cursor-pointer transition-colors font-medium"
              >
                FAKE-BC-9999 (Invalid)
              </button>
            </div>
          </form>

          {/* Verification Results Card */}
          {result && (
            <div
              className={`p-5 rounded-2xl border transition-all ${
                result.isValid
                  ? 'bg-emerald-50 border-emerald-300'
                  : result.tamperAlert
                  ? 'bg-rose-50 border-rose-300'
                  : 'bg-amber-50 border-amber-300'
              }`}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`p-3 rounded-xl shrink-0 ${
                    result.isValid
                      ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                      : result.tamperAlert
                      ? 'bg-rose-100 text-rose-700 border border-rose-300'
                      : 'bg-amber-100 text-amber-700 border border-amber-300'
                  }`}
                >
                  {result.isValid ? (
                    <CheckCircle2 className="w-7 h-7" />
                  ) : result.tamperAlert ? (
                    <ShieldAlert className="w-7 h-7" />
                  ) : (
                    <AlertTriangle className="w-7 h-7" />
                  )}
                </div>

                <div className="flex-1 space-y-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide ${
                          result.isValid
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : result.tamperAlert
                            ? 'bg-rose-100 text-rose-800 border border-rose-300'
                            : 'bg-amber-100 text-amber-800 border border-amber-300'
                        }`}
                      >
                        {result.isValid ? 'Authentic Document' : result.tamperAlert ? 'Tamper Detected' : 'Unverified Record'}
                      </span>
                      <span className="text-xs font-mono text-slate-500 font-semibold">Ref: {result.referenceNumber}</span>
                    </div>
                    <p className="text-sm font-semibold text-slate-900 mt-1.5">{result.message}</p>
                  </div>

                  {result.isValid && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-emerald-200 text-xs">
                      <div>
                        <span className="text-slate-600 block font-medium">Issued To:</span>
                        <strong className="text-slate-900 font-bold text-sm">{result.residentName}</strong>
                      </div>
                      <div>
                        <span className="text-slate-600 block font-medium">Document Type:</span>
                        <strong className="text-slate-900 font-bold uppercase">{result.documentType.replace(/_/g, ' ')}</strong>
                      </div>
                      <div>
                        <span className="text-slate-600 block font-medium">Authorized Signatory:</span>
                        <strong className="text-slate-900 font-bold">{result.signatory}</strong>
                      </div>
                      <div>
                        <span className="text-slate-600 block font-medium">Issue Timestamp:</span>
                        <span className="font-mono text-slate-700 font-semibold">{result.issuedDate ? new Date(result.issuedDate).toLocaleString() : 'N/A'}</span>
                      </div>
                      <div className="col-span-full pt-2">
                        <span className="text-slate-600 block mb-1 font-medium">Cryptographic Fingerprint (SHA-256):</span>
                        <code className="text-[11px] bg-white p-2 rounded-lg border border-emerald-200 text-emerald-900 font-mono break-all block shadow-2xs font-semibold">
                          {result.cryptoHash}
                        </code>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
