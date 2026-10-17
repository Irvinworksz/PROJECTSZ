import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, ShieldAlert, CheckCircle2, AlertTriangle, 
  Search, X, Copy, Check, ExternalLink, QrCode, FileText, 
  Lock, Calendar, User, Building, Award 
} from 'lucide-react';
import { apiClient } from '../lib/api';
import type { VerificationResult } from '../types';

interface PublicVerificationModalProps {
  isOpen: boolean;
  initialRef?: string;
  onClose: () => void;
}

export const PublicVerificationModal: React.FC<PublicVerificationModalProps> = ({
  isOpen,
  initialRef = '',
  onClose
}) => {
  const [query, setQuery] = useState<string>(initialRef);
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [copiedHash, setCopiedHash] = useState<boolean>(false);

  const handleVerify = async (searchRef?: string) => {
    const targetRef = (typeof searchRef === 'string' ? searchRef : query).trim();
    if (!targetRef) {
      setErrorMsg('Please enter a clearance reference number or QR hash token.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    try {
      const res = await apiClient.verifyDocument(targetRef);
      if (res.success && res.data) {
        setResult(res.data);
      } else {
        setErrorMsg(res.error || 'Unable to complete verification check.');
      }
    } catch {
      setErrorMsg('Network error connecting to verification registry.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  useEffect(() => {
    if (!isOpen) return;

    if (initialRef && initialRef.trim()) {
      setQuery(initialRef.trim());
      handleVerify(initialRef.trim());
    } else {
      setQuery('BC-2026-0842');
      handleVerify('BC-2026-0842');
    }
  }, [initialRef, isOpen]);

  if (!isOpen) return null;

  const sampleRefs = [
    { label: 'Barangay Clearance', ref: 'BC-2026-0842' },
    { label: 'Indigency Certificate', ref: 'IND-2026-0419' },
    { label: 'Residency Certificate', ref: 'RES-2026-0312' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-white/80 overflow-hidden my-8">
        
        {/* Header Bar */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950 text-white p-6 border-b border-white/10 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200/90 p-0.5 flex items-center justify-center shrink-0 overflow-hidden shadow-md">
              <img
                src="/brgy_seal.jpg"
                alt="Barangay Cabucbucan Official Seal"
                className="w-full h-full object-contain rounded-xl"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold tracking-tight text-white">Public Document Verification Portal</h3>
                <span className="px-2 py-0.5 bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[10px] font-bold rounded-full font-mono">
                  IAS Live
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Barangay Cabucbucan • Non-Repudiation Digital Certificate Authenticity Check
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-5 text-slate-900 font-sans">
          
          {/* Search Box */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 block">
              Enter Official Reference Number or QR Payload Hash:
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
                  placeholder="e.g. BC-2026-0842 or IND-2026-0419"
                  className="w-full pl-10 pr-3.5 py-2.5 glass-input rounded-xl text-xs font-mono font-bold text-slate-900"
                />
              </div>
              <button
                onClick={() => handleVerify()}
                disabled={loading}
                className="btn-3d px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                {loading ? 'Verifying...' : 'Verify Now'}
              </button>
            </div>

            {/* Quick-test Samples */}
            <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-slate-500">
              <span className="font-semibold">Quick Test:</span>
              {sampleRefs.map((sample) => (
                <button
                  key={sample.ref}
                  type="button"
                  onClick={() => {
                    setQuery(sample.ref);
                    handleVerify(sample.ref);
                  }}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 rounded-lg border border-slate-200 transition-colors font-mono cursor-pointer"
                >
                  {sample.ref} ({sample.label.split(' ')[0]})
                </button>
              ))}
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Verification Result Card */}
          {result && (
            <div className={`p-5 rounded-2xl border transition-all ${
              result.isValid 
                ? 'bg-gradient-to-br from-emerald-50/60 via-white to-emerald-50/30 border-emerald-200 shadow-sm'
                : 'bg-gradient-to-br from-rose-50/60 via-white to-rose-50/30 border-rose-200 shadow-sm'
            }`}>
              
              {/* Verdict Header */}
              <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-200/80">
                <div className="flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
                    result.isValid 
                      ? 'bg-emerald-500 text-white' 
                      : 'bg-rose-500 text-white'
                  }`}>
                    {result.isValid ? <ShieldCheck className="w-6 h-6" /> : <ShieldAlert className="w-6 h-6" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-extrabold text-slate-900 tracking-tight">
                        {result.isValid ? 'Authentic Official Certificate' : 'Certificate Verification Failed'}
                      </h4>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        result.isValid 
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                          : 'bg-rose-100 text-rose-800 border border-rose-300'
                      }`}>
                        {result.isValid ? 'VERIFIED' : 'INVALID'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">
                      {result.message}
                    </p>
                  </div>
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-4 text-xs">
                <div className="p-3 bg-white/80 rounded-xl border border-slate-200/80 space-y-1">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Document Reference</span>
                  <div className="font-mono font-bold text-blue-700 text-sm">{result.referenceNumber}</div>
                </div>

                <div className="p-3 bg-white/80 rounded-xl border border-slate-200/80 space-y-1">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Document Classification</span>
                  <div className="font-bold text-slate-900 uppercase">{result.documentType?.replace(/_/g, ' ')}</div>
                </div>

                <div className="p-3 bg-white/80 rounded-xl border border-slate-200/80 space-y-1">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Resident Applicant</span>
                  <div className="font-bold text-slate-900">{result.residentName || 'N/A'}</div>
                </div>

                <div className="p-3 bg-white/80 rounded-xl border border-slate-200/80 space-y-1">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Executive Signatory</span>
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-purple-600" />
                    <span>{result.signatory || 'Hon. Cornelio Laugo'}</span>
                  </div>
                </div>
              </div>

              {/* Cryptographic SHA-256 Canonical Digest */}
              {result.cryptoHash && (
                <div className="mt-3.5 p-3.5 bg-slate-900 text-white rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono font-bold text-emerald-400 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5" />
                      <span>Canonical SHA-256 Digest (RFC 6234):</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyHash(result.cryptoHash)}
                      className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[11px] font-mono flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      {copiedHash ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedHash ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <div className="font-mono text-[11px] text-slate-300 break-all bg-slate-950 p-2 rounded-lg border border-slate-800 selection:bg-blue-600 selection:text-white">
                    {result.cryptoHash}
                  </div>
                </div>
              )}

              {/* Regulatory Assurance Note */}
              <div className="mt-3.5 p-2.5 bg-blue-50/70 border border-blue-200/80 rounded-xl text-[11px] text-blue-900 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  This verification response was generated directly from Barangay Cabucbucan's immutable civil registry records, compliant with 
                  <strong> Republic Act No. 8792 (Electronic Commerce Act)</strong> and Information Assurance & Security standards.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-500">
          <span className="font-mono text-[11px]">System Timestamp: {new Date().toLocaleDateString()}</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl cursor-pointer transition-colors"
          >
            Close Verification
          </button>
        </div>
      </div>
    </div>
  );
};
