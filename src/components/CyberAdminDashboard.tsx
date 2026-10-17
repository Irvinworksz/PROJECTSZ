import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, ShieldAlert, Lock, KeyRound, Database, Terminal, 
  RefreshCw, CheckCircle2, AlertTriangle, Activity, Users, FileCheck, 
  QrCode, Eye, Zap, Server, HardDrive, Smartphone, Cpu, Layers
} from 'lucide-react';
import { apiClient } from '../lib/api';
import { StaffDashboard } from './StaffDashboard';
import type { ClearanceRequest, User } from '../types';

interface CyberAdminDashboardProps {
  user: User;
  requests: ClearanceRequest[];
  onRefresh: () => void;
  onViewDocument: (req: ClearanceRequest) => void;
  onSelectView: (view: 'dashboard' | 'signing' | 'audit' | 'playground' | 'schema') => void;
  onOpenMfa: () => void;
}

export const CyberAdminDashboard: React.FC<CyberAdminDashboardProps> = ({
  user,
  requests,
  onRefresh,
  onViewDocument,
  onSelectView,
  onOpenMfa
}) => {
  const [adminTab, setAdminTab] = useState<'cyber_ops' | 'staff_queue'>('cyber_ops');
  const [telemetry, setTelemetry] = useState<any>(null);
  const [encryptionStatus, setEncryptionStatus] = useState<any>(null);
  const [loadingTelemetry, setLoadingTelemetry] = useState<boolean>(false);
  const [resetMessage, setResetMessage] = useState<string>('');

  const loadTelemetry = async () => {
    setLoadingTelemetry(true);
    try {
      const [diagRes, encRes] = await Promise.all([
        apiClient.getDiagnostics(),
        apiClient.getEncryptionStatus()
      ]);
      if (diagRes.success && diagRes.data) {
        setTelemetry(diagRes.data);
      }
      if (encRes.success) {
        setEncryptionStatus(encRes);
      }
    } catch {
      // Ignore network errors in telemetry
    } finally {
      setLoadingTelemetry(false);
    }
  };

  useEffect(() => {
    loadTelemetry();
  }, []);

  const totalRequests = requests.length;
  const sealedRequests = requests.filter(r => r.status === 'ready_for_collection' || r.status === 'issued').length;
  const pendingRequests = requests.filter(r => r.status === 'pending_review' || r.status === 'under_review').length;
  const forSignatureRequests = requests.filter(r => r.status === 'for_signature').length;

  return (
    <div className="space-y-6">
      {/* Admin Workspace Mode Switcher */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-1.5 glass-panel rounded-2xl border border-white/80 shadow-sm">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setAdminTab('cyber_ops')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
              adminTab === 'cyber_ops'
                ? 'btn-3d bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span>Cybersecurity Station & Monitoring</span>
          </button>

          <button
            type="button"
            onClick={() => setAdminTab('staff_queue')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
              adminTab === 'staff_queue'
                ? 'btn-3d bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <FileCheck className="w-4 h-4 text-blue-300" />
            <span>Clearance Pipeline & Civil Registry</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-white/20 text-white">
              {requests.length} Requests
            </span>
          </button>
        </div>

        <div className="flex items-center gap-2 px-2">
          <span className="text-[11px] text-slate-500 font-mono hidden md:inline">
            Role: <strong className="text-amber-600 font-bold uppercase">Super Admin</strong>
          </span>
        </div>
      </div>

      {adminTab === 'staff_queue' ? (
        <StaffDashboard
          requests={requests}
          onRefresh={onRefresh}
          onViewDocument={onViewDocument}
        />
      ) : (
        <>
          {/* Top Banner: Cyber Admin Executive Authority */}
          <div className="bg-slate-900 text-white p-6 rounded-3xl border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="flex items-start gap-4">
              <div className="p-3.5 bg-amber-500/20 border border-amber-400/40 text-amber-300 rounded-2xl shrink-0 shadow-lg shadow-amber-500/10">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <h2 className="text-xl font-extrabold text-white tracking-tight">Municipal IT & Information Security Console</h2>
                  <span className="px-2.5 py-0.5 bg-amber-400/20 border border-amber-400/30 text-amber-300 text-[11px] font-bold rounded-full">
                    Systems Administrator Active
                  </span>
                  <span className="px-2.5 py-0.5 bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-[11px] font-bold rounded-full flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    Security Controls Operational
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1.5 max-w-3xl leading-relaxed">
                  Barangay Cabucbucan Systems and Information Security Management Center. Supervising digital certificate integrity (SHA-256 HMAC), data confidentiality (AES-256-GCM), perimeter access throttling, and non-repudiation audit trails.
                </p>
                <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-slate-400 font-mono">
                  <span>Signatory: <strong className="text-white">{user.fullName}</strong></span>
                  <span>•</span>
                  <span>Role: <strong className="text-amber-400 uppercase">Cyber Admin</strong></span>
                  <span>•</span>
                  <span>MFA: <strong className="text-emerald-400">Active</strong></span>
                  <span>•</span>
                  <span>AES-256 Key: <strong className="text-blue-300">{encryptionStatus?.keyFingerprint || 'Derived SHA-256'}</strong></span>
                </div>
              </div>
            </div>

            <div className="flex flex-row md:flex-col gap-2 shrink-0">
              <button
                onClick={() => { onRefresh(); loadTelemetry(); }}
                disabled={loadingTelemetry}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingTelemetry ? 'animate-spin' : ''}`} />
                <span>Refresh Diagnostics</span>
              </button>
              <button
                onClick={onOpenMfa}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>MFA & Passkey Settings</span>
              </button>
            </div>
          </div>

      {resetMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{resetMessage}</span>
        </div>
      )}

      {/* IAS 4-Pillar Security Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Confidentiality */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
              <Lock className="w-5 h-5" />
            </div>
            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold rounded-full">
              Protected
            </span>
          </div>
          <h3 className="text-sm font-bold text-slate-900 mt-3">Confidentiality</h3>
          <p className="text-xs text-slate-500 mt-0.5">AES-256 Storage & TLS 1.3</p>
          <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-600 space-y-1">
            <div className="flex justify-between">
              <span>Password Hashing:</span>
              <strong className="text-slate-800">BCrypt (10 rounds)</strong>
            </div>
            <div className="flex justify-between">
              <span>Sensitive Fields:</span>
              <strong className="text-emerald-700 font-bold">AES-256-GCM (At Rest)</strong>
            </div>
            <div className="flex justify-between">
              <span>Disk Store:</span>
              <strong className="text-slate-800 font-mono text-[10px]">Encrypted Envelopes</strong>
            </div>
          </div>
        </div>

        {/* Integrity */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold rounded-full">
              HMAC Sealed
            </span>
          </div>
          <h3 className="text-sm font-bold text-slate-900 mt-3">Integrity</h3>
          <p className="text-xs text-slate-500 mt-0.5">Digital Signatures & Tamper Proof</p>
          <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-600 space-y-1">
            <div className="flex justify-between">
              <span>Sealed Documents:</span>
              <strong className="text-emerald-700">{sealedRequests} / {totalRequests}</strong>
            </div>
            <div className="flex justify-between">
              <span>Hashing Algorithm:</span>
              <strong className="text-slate-800">SHA-256 RFC 6234</strong>
            </div>
          </div>
        </div>

        {/* Availability */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl border border-amber-100">
              <Activity className="w-5 h-5" />
            </div>
            <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold rounded-full">
              Rate Shield Active
            </span>
          </div>
          <h3 className="text-sm font-bold text-slate-900 mt-3">Availability</h3>
          <p className="text-xs text-slate-500 mt-0.5">DDoS & Brute-Force Defense</p>
          <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-600 space-y-1">
            <div className="flex justify-between">
              <span>Rate Limit Hits:</span>
              <strong className="text-slate-800">{telemetry?.rateLimiter?.globalRateLimitHits ?? 0}</strong>
            </div>
            <div className="flex justify-between">
              <span>Brute Lockouts:</span>
              <strong className="text-slate-800">{telemetry?.rateLimiter?.globalBruteForceLockouts ?? 0}</strong>
            </div>
          </div>
        </div>

        {/* Non-Repudiation */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl border border-purple-100">
              <Terminal className="w-5 h-5" />
            </div>
            <span className="px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-bold rounded-full">
              Immutable Log
            </span>
          </div>
          <h3 className="text-sm font-bold text-slate-900 mt-3">Non-Repudiation</h3>
          <p className="text-xs text-slate-500 mt-0.5">Merkle Hash Chain Audit</p>
          <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-600 space-y-1">
            <div className="flex justify-between">
              <span>Log Chaining:</span>
              <strong className="text-purple-700">Active (SHA-256)</strong>
            </div>
            <div className="flex justify-between">
              <span>Signature Authority:</span>
              <strong className="text-slate-800">Hon. Cornelio Laugo</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Launch Control Hub */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-4">
          <Zap className="w-4 h-4 text-amber-500" />
          <span>IAS Cybersecurity Operations & Tools</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
          <button
            onClick={() => onSelectView('playground')}
            className="p-4 bg-slate-50 hover:bg-blue-50/60 border border-slate-200 hover:border-blue-300 rounded-xl text-left transition-all group cursor-pointer"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-blue-100 text-blue-700 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold text-blue-600 uppercase">Live Probe</span>
            </div>
            <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-700">IAS Security Lab</h4>
            <p className="text-[11px] text-slate-500 mt-1 leading-normal">
              Execute live penetration probes: SQL Injection, Stored XSS defense, and HMAC document tamper verification.
            </p>
          </button>

          <button
            onClick={() => onSelectView('audit')}
            className="p-4 bg-slate-50 hover:bg-purple-50/60 border border-slate-200 hover:border-purple-300 rounded-xl text-left transition-all group cursor-pointer"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-purple-100 text-purple-700 rounded-lg group-hover:bg-purple-600 group-hover:text-white transition-colors">
                <Terminal className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold text-purple-600 uppercase">Audit Trail</span>
            </div>
            <h4 className="text-xs font-bold text-slate-900 group-hover:text-purple-700">Non-Repudiation Audit</h4>
            <p className="text-[11px] text-slate-500 mt-1 leading-normal">
              Review immutable cryptographic chain of system events, authentication logins, clearance approvals, and admin actions.
            </p>
          </button>

          <button
            onClick={() => onSelectView('schema')}
            className="p-4 bg-slate-50 hover:bg-emerald-50/60 border border-slate-200 hover:border-emerald-300 rounded-xl text-left transition-all group cursor-pointer"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <Database className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold text-emerald-600 uppercase">Database</span>
            </div>
            <h4 className="text-xs font-bold text-slate-900 group-hover:text-emerald-700">SQL Schema Explorer</h4>
            <p className="text-[11px] text-slate-500 mt-1 leading-normal">
              Inspect relational SQLite/PostgreSQL table structures, foreign key constraints, indexes, and schema definitions.
            </p>
          </button>

          <button
            onClick={() => onSelectView('signing')}
            className="p-4 bg-slate-50 hover:bg-amber-50/60 border border-slate-200 hover:border-amber-300 rounded-xl text-left transition-all group cursor-pointer"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-amber-100 text-amber-700 rounded-lg group-hover:bg-amber-600 group-hover:text-white transition-colors">
                <KeyRound className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold text-amber-600 uppercase">Executive</span>
            </div>
            <h4 className="text-xs font-bold text-slate-900 group-hover:text-amber-700">Captain Signing Desk</h4>
            <p className="text-[11px] text-slate-500 mt-1 leading-normal">
              Monitor documents awaiting Hon. Cornelio Laugo's executive cryptographic digital seal and final authorization.
            </p>
          </button>
        </div>
      </div>

      {/* Clearance Registry & Security Oversight */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-blue-600" />
              <span>Clearance Document Registry & Integrity Status</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Live tracking of official barangay requests, verification stages, and cryptographic seals.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">
              Total Requests: <strong className="text-slate-900">{totalRequests}</strong>
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
              <tr>
                <th className="px-4 py-3">Reference & Type</th>
                <th className="px-4 py-3">Resident & Purok</th>
                <th className="px-4 py-3">Purpose</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Integrity Seal</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {requests.slice(0, 8).map((req) => (
                <tr key={req.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-mono font-bold text-blue-700">{req.referenceNumber}</div>
                    <div className="text-[11px] text-slate-500">{req.type}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-bold text-slate-900">{req.residentName}</div>
                    <div className="text-[11px] text-slate-500">{req.purok}</div>
                  </td>
                  <td className="px-4 py-3 max-w-xs truncate" title={req.purpose}>
                    {req.purpose}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${
                      req.status === 'issued' || req.status === 'ready_for_collection'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : req.status === 'for_signature'
                        ? 'bg-purple-50 text-purple-700 border border-purple-200'
                        : req.status === 'under_review'
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : req.status === 'rejected'
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      {req.status.replace(/_/g, ' ').toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {req.digitalSignature ? (
                      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="font-mono text-[10px]">{req.digitalSignature.substring(0, 10)}...</span>
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-400 italic">Pending Seal</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => onViewDocument(req)}
                        className="p-1.5 hover:bg-slate-100 text-slate-600 hover:text-slate-900 rounded-lg transition-colors cursor-pointer"
                        title="View Official Certificate"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
    )}
  </div>
);
};
