import React, { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, FileText, Filter, RefreshCw, Search, Shield, ShieldCheck } from 'lucide-react';
import { apiClient } from '../lib/api';
import type { AuditLog } from '../types';

export const AuditLogViewer: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [chainStatus, setChainStatus] = useState<{ intact: boolean; verifiedCount: number } | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    const res = await apiClient.getAuditLogs();
    setLoading(false);
    if (res.success && res.data) {
      setLogs(res.data);
      if (res.chainIntegrity) {
        setChainStatus(res.chainIntegrity);
      }
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter(log => {
    if (categoryFilter !== 'ALL' && log.category !== categoryFilter) return false;
    if (severityFilter !== 'ALL' && log.severity !== severityFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        log.actionType.toLowerCase().includes(q) ||
        log.userName.toLowerCase().includes(q) ||
        log.details.toLowerCase().includes(q) ||
        log.ipAddress.includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner & Hash-Chain Integrity Status */}
      <div className="glass-panel text-slate-900 p-6 rounded-3xl border border-white/80 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="flex items-start gap-4">
          <div className="p-3.5 bg-blue-50/90 border border-blue-200/90 text-blue-700 rounded-2xl shrink-0 shadow-2xs">
            <Shield className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900">Immutable Audit Trail & Non-Repudiation Ledger</h2>
              <span className="px-2.5 py-0.5 bg-blue-100/90 border border-blue-300 text-blue-900 text-[11px] font-mono font-bold rounded-lg uppercase">
                IAS Compliant
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed font-medium">
              Every administrative action, authentication attempt, cryptographic signing, and clearance status transition is permanently recorded with user identity, IP address, and SHA-256 hash chaining.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto shrink-0">
          {chainStatus && (
            <div
              className={`px-4 py-2.5 rounded-2xl border flex items-center gap-2 text-xs font-bold shadow-2xs ${
                chainStatus.intact
                  ? 'bg-emerald-50/90 border-emerald-300 text-emerald-800'
                  : 'bg-rose-50/90 border-rose-300 text-rose-800'
              }`}
            >
              {chainStatus.intact ? (
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600" />
              )}
              <span>Chain Integrity: {chainStatus.intact ? `100% Intact (${chainStatus.verifiedCount} blocks)` : 'Tampering Detected'}</span>
            </div>
          )}

          <button
            onClick={fetchLogs}
            disabled={loading}
            className="px-4 py-2.5 btn-3d-secondary text-slate-700 text-xs font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Trail
          </button>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="glass-panel p-4 rounded-2xl border border-white/80 shadow-md flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search action, user, IP, or details..."
            className="w-full pl-10 pr-3.5 py-2 glass-input rounded-xl text-xs text-slate-900 placeholder:text-slate-400 font-medium"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <div className="flex items-center gap-1.5 text-xs text-slate-600 font-bold shrink-0">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <span>Category:</span>
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 glass-input rounded-xl text-xs font-bold text-slate-900 cursor-pointer"
          >
            <option value="ALL">All Categories</option>
            <option value="AUTH">AUTH (Logins/Registrations)</option>
            <option value="CLEARANCE">CLEARANCE (Processing/Status)</option>
            <option value="SECURITY">SECURITY (Cryptographic/Probes)</option>
            <option value="ADMIN">ADMIN (System Operations)</option>
          </select>

          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="px-3 py-2 glass-input rounded-xl text-xs font-bold text-slate-900 cursor-pointer"
          >
            <option value="ALL">All Severities</option>
            <option value="INFO">INFO</option>
            <option value="WARN">WARN</option>
            <option value="CRITICAL">CRITICAL</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="glass-card rounded-3xl border border-white/80 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-700 font-bold uppercase tracking-wider font-mono">
              <tr>
                <th className="py-4 px-4">Timestamp</th>
                <th className="py-4 px-4">Actor / Role</th>
                <th className="py-4 px-4">Action Type</th>
                <th className="py-4 px-4">Severity</th>
                <th className="py-4 px-4">Details</th>
                <th className="py-4 px-4">IP Address</th>
                <th className="py-4 px-4 text-right">Hash Link</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-600 font-medium">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-600 mb-2" />
                    Loading cryptographic audit logs...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500 font-medium">
                    No audit records match the current filter criteria.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr
                    key={log.id}
                    onClick={() => setSelectedLog(log)}
                    className="hover:bg-white/60 transition-colors cursor-pointer"
                  >
                    <td className="py-3.5 px-4 font-mono text-slate-600 font-medium whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}{' '}
                      <span className="text-[10px] text-slate-500">
                        {new Date(log.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-bold text-slate-900">{log.userName}</div>
                      <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">{log.userRole}</span>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="px-2.5 py-1 bg-slate-100/90 border border-slate-200 text-slate-800 rounded-lg font-mono text-[10px] font-bold shadow-2xs">
                        {log.actionType}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border shadow-2xs ${
                          log.severity === 'CRITICAL'
                            ? 'bg-rose-50/90 text-rose-800 border-rose-200'
                            : log.severity === 'WARN'
                            ? 'bg-amber-50/90 text-amber-800 border-amber-200'
                            : 'bg-blue-50/90 text-blue-800 border-blue-200'
                        }`}
                      >
                        {log.severity}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 max-w-xs truncate font-medium" title={log.details}>
                      {log.details}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-600 font-medium whitespace-nowrap">
                      {log.ipAddress}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-[10px] text-slate-600 whitespace-nowrap">
                      <span className="text-blue-700 bg-blue-50/90 px-2 py-0.5 rounded-lg border border-blue-200 font-bold shadow-2xs">
                        {log.currentHash.substring(0, 8)}...
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Selected Log Inspector Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
          <div className="glass-panel rounded-3xl p-6 max-w-xl w-full space-y-4 shadow-2xl border border-white/80 text-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200/80">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-sm text-slate-900">Audit Ledger Block Details</h3>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer p-1"
              >
                Close
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 bg-white/70 p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs">
                <div>
                  <span className="text-slate-500 block font-medium">Action:</span>
                  <strong className="text-slate-900 font-mono font-bold">{selectedLog.actionType}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block font-medium">Actor:</span>
                  <strong className="text-slate-900 font-bold">{selectedLog.userName} ({selectedLog.userRole})</strong>
                </div>
                <div>
                  <span className="text-slate-500 block font-medium">IP Address:</span>
                  <span className="font-mono text-slate-700 font-bold">{selectedLog.ipAddress}</span>
                </div>
                <div>
                  <span className="text-slate-500 block font-medium">Timestamp:</span>
                  <span className="font-mono text-slate-700">{new Date(selectedLog.timestamp).toISOString()}</span>
                </div>
              </div>

              <div>
                <span className="text-slate-500 block mb-1 font-medium">Details:</span>
                <p className="p-3.5 bg-white/70 rounded-2xl border border-slate-200/80 text-slate-800 leading-relaxed font-sans font-medium shadow-2xs">
                  {selectedLog.details}
                </p>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-200/80">
                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block font-mono">Previous Block Hash:</span>
                  <code className="text-[10px] font-mono bg-slate-100/90 border border-slate-200 p-2 rounded-xl text-slate-700 block break-all font-medium">
                    {selectedLog.previousHash}
                  </code>
                </div>
                <div>
                  <span className="text-[10px] text-slate-700 font-bold uppercase tracking-wider block font-mono">Current Block Hash (SHA-256):</span>
                  <code className="text-[10px] font-mono bg-blue-50/90 border border-blue-200 p-2 rounded-xl text-blue-800 block break-all font-bold">
                    {selectedLog.currentHash}
                  </code>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
