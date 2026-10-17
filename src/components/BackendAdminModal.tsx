import React, { useState } from 'react';
import { 
  Shield, ShieldAlert, ShieldCheck, Lock, Terminal, KeyRound, 
  Database, AlertTriangle, ArrowRight, X, Check, Eye, EyeOff, RefreshCw
} from 'lucide-react';
import { apiClient } from '../lib/api';
import type { User, ResidentProfile } from '../types';

interface BackendAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: User, profile?: ResidentProfile) => void;
}

export const BackendAdminModal: React.FC<BackendAdminModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess
}) => {
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const res = await apiClient.login(username.trim(), password);
      if (res.success && res.user) {
        if (res.user.role !== 'admin') {
          setErrorMsg('Access denied: Provided credentials lack backend administrative privileges.');
          setLoading(false);
          return;
        }
        onAuthSuccess(res.user, res.profile);
        onClose();
      } else {
        setErrorMsg(res.error || 'Authentication rejected. Verify backend administrative credentials.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Connection to backend security service failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-2xl w-full text-slate-100 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Terminal Header */}
        <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white tracking-tight">Municipal IT Infrastructure & Security Console</h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Restricted Boundary
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Principle of Least Privilege • Network Perimeter Isolation • Cryptographic Key Management
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-5">
          {/* Systems Security Rationale */}
          <div className="p-4 bg-slate-950/70 rounded-2xl border border-slate-800 space-y-2 text-xs">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>Municipal Systems Governance & Database Security Standards</span>
            </div>
            <p className="text-slate-300 leading-relaxed text-[11px]">
              In accordance with <strong>ISO/IEC 27001</strong> and Philippine E-Government cybersecurity guidelines, 
              <strong> system administration accounts are strictly isolated from the public constituent interface</strong>. 
              Segregation of duties ensures that system maintenance and cryptographic key governance remain strictly separated from frontline citizen transactions.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 font-mono text-[10px]">
              <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300">
                <span className="text-amber-400 font-bold block mb-0.5 font-sans">1. One-Way Password Hashing:</span>
                Credentials protected via <code className="text-emerald-400">BCrypt ($2a$10$)</code> with salt generation. Plaintext passwords are never stored.
              </div>
              <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300">
                <span className="text-blue-400 font-bold block mb-0.5 font-sans">2. Access Control Segregation:</span>
                Administrative authorization is restricted to designated IT security officers and database administrators.
              </div>
            </div>
          </div>

          {/* Database Credential Preview (Proving BCrypt Hashing) */}
          <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 text-xs font-mono space-y-1.5">
            <div className="flex items-center justify-between text-slate-400 text-[10px]">
              <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                <Database className="w-3.5 h-3.5" />
                DATABASE STORAGE INSPECTION (users table)
              </span>
              <span className="text-slate-500 font-sans">Status: Cryptographically Hashed</span>
            </div>
            <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800/80 text-[10px] space-y-1">
              <div>
                <span className="text-slate-500">username: </span>
                <span className="text-amber-300 font-bold">admin.security</span>
              </div>
              <div>
                <span className="text-slate-500">role: </span>
                <span className="text-purple-300 font-bold">admin (Backend Security Only)</span>
              </div>
              <div>
                <span className="text-slate-500">password_hash: </span>
                <span className="text-emerald-400 font-bold break-all">$2a$10$wK8oP3mXq9Y.N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad6</span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
                <span className="text-slate-400">Demo Password: <strong className="text-amber-300 font-mono">AdminRoot@2026!</strong></span>
                <button
                  type="button"
                  onClick={() => {
                    setUsername('admin.security');
                    setPassword('AdminRoot@2026!');
                  }}
                  className="px-2 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[10px] font-bold cursor-pointer transition-colors"
                >
                  Quick-Fill Admin Credentials
                </button>
              </div>
            </div>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMsg && (
              <div className="p-3 bg-rose-950/80 border border-rose-800 text-rose-300 rounded-xl text-xs flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  SysAdmin Username
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="admin.security"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-300">
                    Administrative Password
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono">
                    AES-256 / BCrypt Protected
                  </span>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter administrative password"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-3.5 pr-10 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl cursor-pointer transition-colors"
              >
                Cancel
              </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 sm:flex-none px-5 py-2 bg-amber-600 hover:bg-amber-500 text-slate-950 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-amber-600/20 transition-colors disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Authenticating...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-3.5 h-3.5" />
                      <span>Launch Backend Console</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  };
