import React, { useState, useRef, useEffect } from 'react';
import { 
  Bell, CheckCircle2, ChevronDown, Database, KeyRound, LogOut, 
  MessageSquare, QrCode, Shield, ShieldCheck, UserCheck, Users,
  Lock, Smartphone, Fingerprint, ExternalLink, X, AlertCircle, Clock,
  Timer, RotateCcw
} from 'lucide-react';
import type { NotificationRecord, User, UserRole } from '../types';

interface NavbarProps {
  user: User;
  activeView: 'dashboard' | 'signing' | 'audit' | 'playground' | 'schema';
  onSelectView: (view: 'dashboard' | 'signing' | 'audit' | 'playground' | 'schema') => void;
  onOpenVerify?: () => void;
  onSwitchUser?: () => void;
  onLogout: () => void;
  onOpenMfa?: () => void;
  onTestInactivityWarning?: () => void;
  onResetInactivityTimer?: () => void;
  sessionRemainingSeconds?: number;
  timeoutMinutes?: number;
  notifications: NotificationRecord[];
  onOpenFirebaseCloud?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  activeView,
  onSelectView,
  onOpenVerify,
  onSwitchUser,
  onLogout,
  onOpenMfa,
  onTestInactivityWarning,
  onResetInactivityTimer,
  sessionRemainingSeconds,
  timeoutMinutes = 15,
  notifications,
  onOpenFirebaseCloud
}) => {
  const [showRoleMenu, setShowRoleMenu] = useState<boolean>(false);
  const [showNotifMenu, setShowNotifMenu] = useState<boolean>(false);
  const [showSecurityPopover, setShowSecurityPopover] = useState<boolean>(false);
  const [renewNotice, setRenewNotice] = useState<boolean>(false);
  const securityPopoverRef = useRef<HTMLDivElement>(null);

  const formatSessionTime = (seconds?: number) => {
    if (seconds === undefined) return `${timeoutMinutes}:00`;
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleRenewSession = () => {
    onResetInactivityTimer?.();
    setRenewNotice(true);
    setTimeout(() => setRenewNotice(false), 2200);
  };

  // Close security popover on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (securityPopoverRef.current && !securityPopoverRef.current.contains(event.target as Node)) {
        setShowSecurityPopover(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'official':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-100/90 text-purple-900 border border-purple-300/80 shadow-2xs">Punong Barangay (Captain)</span>;
      case 'staff':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100/90 text-blue-900 border border-blue-300/80 shadow-2xs">Desk Staff Officer</span>;
      case 'admin':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100/90 text-amber-900 border border-amber-300/80 shadow-2xs">Cybersecurity Admin</span>;
      case 'resident':
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100/90 text-emerald-900 border border-emerald-300/80 shadow-2xs">Resident Portal</span>;
    }
  };

  return (
    <header className="glass-panel text-slate-900 sticky top-0 z-40 border-b border-white/60 shadow-[0_4px_25px_rgba(15,23,42,0.04)] transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Barangay Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white border border-slate-200/90 p-0.5 shadow-md shadow-blue-900/10 shrink-0 relative overflow-hidden group flex items-center justify-center">
              <img
                src="/brgy_seal.jpg"
                alt="Official Seal of Barangay Cabucbucan"
                className="w-full h-full object-contain rounded-xl group-hover:scale-105 transition-transform"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-extrabold tracking-tight text-slate-900">Barangay Cabucbucan</h1>
                <span className="hidden sm:inline-block px-2 py-0.5 bg-blue-50/90 border border-blue-200/80 text-blue-800 text-[10px] font-bold rounded-lg shadow-2xs">
                  Rizal, Nueva Ecija
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                Official E-Governance & Civil Registry Portal
              </p>
            </div>
          </div>

          {/* Navigation Links - Glass segmented container */}
          <nav className="hidden lg:flex items-center p-1 bg-slate-100/70 backdrop-blur-md rounded-2xl border border-slate-200/60 shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)] gap-1 text-xs font-bold">
            <button
              onClick={() => onSelectView('dashboard')}
              className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
                activeView === 'dashboard' 
                  ? 'btn-3d bg-blue-600 text-white' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              {user.role === 'resident' && 'My E-Services'}
              {user.role === 'staff' && 'Staff Desk'}
              {user.role === 'official' && 'Punong Desk'}
              {user.role === 'admin' && 'Admin Console'}
            </button>

            {(user.role === 'official' || user.role === 'admin') && (
              <button
                onClick={() => onSelectView('signing')}
                className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeView === 'signing' 
                    ? 'btn-3d bg-blue-600 text-white' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <KeyRound className="w-3.5 h-3.5 text-amber-500" />
                Captain Signing
              </button>
            )}

            {(user.role === 'admin' || user.role === 'staff') && (
              <button
                onClick={() => onSelectView('audit')}
                className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeView === 'audit' 
                    ? 'btn-3d bg-blue-600 text-white' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <Shield className="w-3.5 h-3.5 text-emerald-600" />
                Audit Trail
              </button>
            )}

            {user.role === 'admin' && (
              <>
                <button
                  onClick={() => onSelectView('playground')}
                  className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeView === 'playground' 
                      ? 'btn-3d bg-blue-600 text-white' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                  IAS Lab
                </button>

                <button
                  onClick={() => onSelectView('schema')}
                  className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeView === 'schema' 
                      ? 'btn-3d bg-blue-600 text-white' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                  }`}
                >
                  <Database className="w-3.5 h-3.5 text-purple-600" />
                  SQL Schema
                </button>
              </>
            )}
          </nav>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2">
            {/* Public Certificate Verification Button (Admin Only; removed from resident, staff, captain) */}
            {onOpenVerify && user.role === 'admin' && (
              <button
                type="button"
                onClick={onOpenVerify}
                className="btn-3d-secondary px-3 py-1.5 text-blue-900 text-xs font-semibold rounded-2xl transition-all flex items-center gap-1.5 cursor-pointer bg-blue-50/70 border-blue-200/80 hover:bg-blue-100/80"
                title="Verify an official Barangay certificate by Reference Number or QR Code"
              >
                <QrCode className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span className="hidden sm:inline font-bold text-[11px]">Verify Document</span>
              </button>
            )}

            {/* Live Firebase Cloud Database Inspector Button (Admin Only; removed from resident, staff, captain) */}
            {onOpenFirebaseCloud && user.role === 'admin' && (
              <button
                type="button"
                onClick={onOpenFirebaseCloud}
                className="btn-3d px-2.5 py-1.5 text-emerald-950 text-xs font-bold rounded-2xl transition-all flex items-center gap-1.5 cursor-pointer bg-emerald-50/90 border border-emerald-300 hover:bg-emerald-100 shadow-2xs group"
                title="Open live Google Cloud Firestore database, collections, and real-time activity stream"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
                <span className="hidden md:inline font-extrabold text-[11px] text-emerald-900">Firebase Cloud DB</span>
              </button>
            )}

            {/* Persistent Inactivity Session Countdown Timer */}
            {sessionRemainingSeconds !== undefined && (
              <div className="relative">
                <button
                  id="navbar-session-timer-badge"
                  onClick={handleRenewSession}
                  className={`px-3 py-1.5 rounded-2xl border transition-all flex items-center gap-1.5 cursor-pointer text-xs font-semibold backdrop-blur-md ${
                    sessionRemainingSeconds <= 60
                      ? 'bg-rose-50/90 hover:bg-rose-100 text-rose-800 border-rose-300 shadow-[0_0_15px_rgba(244,63,94,0.3)] animate-pulse'
                      : sessionRemainingSeconds <= 300
                        ? 'bg-amber-50/90 hover:bg-amber-100 text-amber-900 border-amber-300 shadow-2xs'
                        : 'bg-white/80 hover:bg-white text-slate-800 border-white/80 shadow-2xs'
                  }`}
                  title="Mandatory Session Inactivity Timeout (NPC & DILG E-Gov Standard). Click to renew session"
                >
                  <span className="relative flex h-2 w-2 shrink-0">
                    {sessionRemainingSeconds <= 60 ? (
                      <>
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-600"></span>
                      </>
                    ) : sessionRemainingSeconds <= 300 ? (
                      <>
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                      </>
                    ) : (
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                    )}
                  </span>

                  <Timer className={`w-3.5 h-3.5 shrink-0 ${
                    sessionRemainingSeconds <= 60
                      ? 'text-rose-600'
                      : sessionRemainingSeconds <= 300
                        ? 'text-amber-600'
                        : 'text-blue-600'
                  }`} />

                  <span className="hidden xl:inline text-[11px] font-medium text-slate-500">
                    {sessionRemainingSeconds <= 60 ? 'Timeout:' : 'Session:'}
                  </span>

                  <span className={`font-mono font-bold text-xs tracking-tight ${
                    sessionRemainingSeconds <= 60
                      ? 'text-rose-700'
                      : sessionRemainingSeconds <= 300
                        ? 'text-amber-800'
                        : 'text-slate-800'
                  }`}>
                    {formatSessionTime(sessionRemainingSeconds)}
                  </span>

                  <span
                    className="p-0.5 rounded text-slate-400 hover:text-blue-600 hover:bg-slate-200/60 transition-colors ml-0.5"
                    title={`Click to reset timer to ${timeoutMinutes}:00`}
                  >
                    <RotateCcw className="w-3 h-3" />
                  </span>
                </button>

                {/* Session Extended Toast Tooltip */}
                {renewNotice && (
                  <div className="absolute top-full mt-1.5 left-1/2 -translate-x-1/2 px-3 py-1 bg-slate-900/90 backdrop-blur-md text-white text-[10px] font-bold rounded-xl shadow-xl whitespace-nowrap z-50 animate-in fade-in zoom-in-95 duration-150">
                    ✓ Session extended to {timeoutMinutes}:00
                  </div>
                )}
              </div>
            )}

            {/* Security Status Indicator (Admin Only; removed from resident, staff, captain) */}
            {user.role === 'admin' && (
              <div className="relative" ref={securityPopoverRef}>
                <button
                  id="security-status-indicator"
                  onClick={() => setShowSecurityPopover(!showSecurityPopover)}
                  className="btn-3d-secondary px-2.5 py-1.5 text-emerald-900 text-xs font-semibold rounded-2xl transition-all flex items-center gap-1.5 cursor-pointer bg-emerald-50/70 border-emerald-200/80"
                  title="View Account Security Status, Encryption & MFA Readiness"
                >
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="hidden md:inline font-bold text-[11px]">Security:</span>
                  <span className="text-[11px] font-medium text-emerald-800 hidden sm:inline">
                    {user.mfaEnabled ? 'AES-256 • MFA' : 'AES-256'}
                  </span>
                </button>

                {/* Detailed Security Status Popover Dropdown */}
                {showSecurityPopover && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 glass-panel rounded-3xl shadow-2xl border border-white/80 p-4 z-50 space-y-3.5 text-xs animate-in fade-in zoom-in-95 duration-150">
                    {/* Popover Header */}
                    <div className="flex items-center justify-between pb-2.5 border-b border-slate-200/80">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-200/80 shadow-2xs">
                          <ShieldCheck className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-900">Security & Protection Status</h4>
                          <p className="text-[10px] text-slate-500">IAS / DILG Standards Compliant</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setShowSecurityPopover(false)}
                        className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Account Identity */}
                    <div className="p-3 bg-slate-50/80 backdrop-blur-xs rounded-2xl border border-slate-200/80 flex items-center justify-between shadow-2xs">
                      <div>
                        <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Account Owner</div>
                        <div className="font-bold text-slate-900 text-xs">{user.fullName}</div>
                        <div className="text-[10px] text-slate-600 font-mono">{user.email}</div>
                      </div>
                      <span className="px-2.5 py-0.5 bg-emerald-100/90 text-emerald-900 text-[10px] font-bold rounded-full border border-emerald-300/80 shadow-2xs">
                        Active
                      </span>
                    </div>

                    {/* Security Metrics */}
                    <div className="space-y-2">
                      {/* Encryption Status */}
                      <div className="p-3 bg-white/70 rounded-2xl border border-slate-200/80 shadow-2xs">
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-1.5 font-bold text-slate-900">
                            <Lock className="w-3.5 h-3.5 text-blue-600" />
                            <span>Encryption Status</span>
                          </div>
                          <span className="px-2 py-0.5 bg-emerald-50 border border-emerald-200/80 text-emerald-700 font-bold text-[9px] rounded-md font-mono">
                            AES-256 GCM
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-600 space-y-0.5">
                          <div className="flex justify-between">
                            <span>Data at Rest:</span>
                            <strong className="text-slate-800">Hardware Encrypted</strong>
                          </div>
                          <div className="flex justify-between">
                            <span>In-Transit Transport:</span>
                            <strong className="text-slate-800">TLS 1.3 / Strict HTTPS</strong>
                          </div>
                          <div className="flex justify-between">
                            <span>Password Vault:</span>
                            <strong className="text-slate-800">BCrypt (Salted $2a$10)</strong>
                          </div>
                        </div>
                      </div>

                      {/* MFA Readiness */}
                      <div className="p-3 bg-white/70 rounded-2xl border border-slate-200/80 shadow-2xs">
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-1.5 font-bold text-slate-900">
                            <Smartphone className="w-3.5 h-3.5 text-purple-600" />
                            <span>Two-Factor Authentication (MFA)</span>
                          </div>
                          <span className="px-2 py-0.5 bg-blue-50 border border-blue-200/80 text-blue-700 font-bold text-[9px] rounded-md font-mono">
                            {user.mfaEnabled ? 'Enforced & Ready' : 'Available'}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-600 space-y-0.5">
                          <div className="flex justify-between">
                            <span>Primary Method:</span>
                            <strong className="text-slate-800">Gmail 6-digit OTP</strong>
                          </div>
                          <div className="flex justify-between">
                            <span>Authenticator TOTP:</span>
                            <strong className="text-slate-800">RFC 6238 Compliant</strong>
                          </div>
                          <div className="flex justify-between">
                            <span>Emergency Recovery:</span>
                            <strong className="text-emerald-700">8 Offline Backup Codes</strong>
                          </div>
                        </div>
                      </div>

                      {/* WebAuthn / Biometrics */}
                      <div className="p-3 bg-white/70 rounded-2xl border border-slate-200/80 shadow-2xs">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-1.5 font-bold text-slate-900">
                            <Fingerprint className="w-3.5 h-3.5 text-amber-600" />
                            <span>Biometrics & Passkeys</span>
                          </div>
                          <span className={`px-2 py-0.5 font-bold text-[9px] rounded-md border font-mono ${
                            user.webauthnEnabled
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}>
                            {user.webauthnEnabled ? 'Passkey Registered' : 'FIDO2 Ready'}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500">
                          {user.webauthnEnabled
                            ? 'W3C WebAuthn Level 2 passkey enrolled for fingerprint / facial hardware authentication.'
                            : 'Hardware biometric passkeys (Touch ID, Windows Hello, YubiKey) supported.'}
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="space-y-2 pt-1">
                      {onOpenMfa && (
                        <button
                          onClick={() => {
                            setShowSecurityPopover(false);
                            onOpenMfa();
                          }}
                          className="btn-3d w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all cursor-pointer text-center flex items-center justify-center gap-1.5 text-xs"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>Manage MFA & Security Credentials</span>
                        </button>
                      )}

                      {onTestInactivityWarning && (
                        <button
                          onClick={() => {
                            setShowSecurityPopover(false);
                            onTestInactivityWarning();
                          }}
                          className="btn-3d-secondary w-full py-2 text-slate-800 font-bold rounded-xl transition-all cursor-pointer text-center flex items-center justify-center gap-1.5 text-xs"
                        >
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                          <span>Preview Inactivity Warning</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifMenu(!showNotifMenu)}
                className="btn-3d-secondary p-2 text-slate-700 hover:text-slate-900 rounded-2xl transition-all cursor-pointer relative"
                title="SMS/Email Notification Center"
              >
                <Bell className="w-4 h-4" />
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-sm shadow-rose-500/50 animate-pulse">
                    {notifications.length}
                  </span>
                )}
              </button>

              {/* Notification dropdown */}
              {showNotifMenu && (
                <div className="absolute right-0 mt-2 w-84 sm:w-96 glass-panel rounded-3xl shadow-2xl border border-white/80 p-4 z-50 space-y-3 animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between pb-2.5 border-b border-slate-200/80">
                    <div>
                      <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <Bell className="w-3.5 h-3.5 text-blue-600" />
                        {user.role === 'official'
                          ? 'Punong Barangay Signature Alerts'
                          : user.role === 'staff'
                            ? 'Barangay Desk & Intake Alerts'
                            : user.role === 'resident'
                              ? 'My Application Alerts'
                              : 'System & Administrative Alerts'}
                      </span>
                      <p className="text-[10px] text-slate-500 font-medium">
                        {user.role === 'official'
                          ? 'Clearances endorsed & awaiting your cryptographic seal'
                          : user.role === 'staff'
                            ? 'Intake queue & clearances ready for physical release'
                            : user.role === 'resident'
                              ? 'Status updates & pickup alerts strictly for your account'
                              : 'Administrative transaction and audit visibility'}
                      </p>
                    </div>
                    <span className="text-[10px] text-blue-800 font-mono font-bold px-2 py-0.5 bg-blue-50 border border-blue-200 rounded-full shadow-2xs">
                      {notifications.length} {notifications.length === 1 ? 'alert' : 'alerts'}
                    </span>
                  </div>
                  
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {notifications.length === 0 ? (
                      <div className="py-6 text-center text-slate-500 space-y-1">
                        <p className="text-xs font-bold text-slate-700">
                          {user.role === 'official'
                            ? 'No clearances awaiting signature'
                            : user.role === 'staff'
                              ? 'No pending desk alerts'
                              : 'No alerts for your account yet'}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {user.role === 'official'
                            ? 'When staff endorses a verified clearance, you will be notified here.'
                            : user.role === 'staff'
                              ? 'New resident submissions and signed releases will appear here.'
                              : 'Updates and pickup notifications for your applications will appear here.'}
                        </p>
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div key={n.id} className="p-3 bg-white/70 hover:bg-white rounded-2xl text-[11px] border border-slate-200/70 space-y-1.5 transition-all shadow-2xs hover:shadow-xs">
                          <div className="flex items-center justify-between font-mono text-[10px]">
                            <div className="flex items-center gap-1.5">
                              <span className={`uppercase font-bold px-1.5 py-0.5 rounded border ${
                                n.targetRole === 'official'
                                  ? 'bg-amber-100 text-amber-900 border-amber-300'
                                  : n.targetRole === 'staff'
                                    ? 'bg-purple-100 text-purple-900 border-purple-300'
                                    : 'bg-blue-100 text-blue-900 border-blue-300'
                              }`}>
                                {n.targetRole === 'official' ? 'CAPTAIN SEAL' : n.targetRole === 'staff' ? 'DESK QUEUE' : (n.type || 'SMS').toUpperCase()}
                              </span>
                              {n.referenceNumber && (
                                <span className="text-emerald-700 font-bold">
                                  #{n.referenceNumber}
                                </span>
                              )}
                            </div>
                            <span className="text-slate-400 font-sans">{new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(n.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                          </div>
                          <p className="text-slate-800 leading-relaxed font-medium">{n.message}</p>
                          {n.residentName && user.role !== 'resident' && (
                            <div className="text-[10px] text-slate-500 font-mono pt-1 border-t border-slate-200/60 flex justify-between">
                              <span>Applicant: <strong className="text-slate-900">{n.residentName}</strong></span>
                              <span>Status: <strong className="text-emerald-700 capitalize">{n.status}</strong></span>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Role Switcher & User Profile Menu */}
            <div className="relative">
              <button
                onClick={() => setShowRoleMenu(!showRoleMenu)}
                className="btn-3d-secondary flex items-center gap-2 pl-3 pr-2.5 py-1.5 rounded-2xl transition-all cursor-pointer text-left"
              >
                <div className="hidden sm:block">
                  <div className="text-xs font-bold text-slate-900 leading-tight">{user.fullName}</div>
                  <div className="text-[10px] text-slate-500 capitalize font-medium">{user.role}</div>
                </div>
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </button>

              {showRoleMenu && (
                <div className="absolute right-0 mt-2 w-64 glass-panel rounded-3xl shadow-2xl border border-white/80 p-3 z-50 space-y-1.5 text-xs animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3 py-2 border-b border-slate-200/80">
                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Signed In User</p>
                    <p className="font-bold text-slate-900 text-sm">{user.fullName}</p>
                    <div className="mt-1.5">{getRoleBadge(user.role)}</div>
                    <div className="mt-2 flex items-center gap-1.5 px-2 py-1 bg-slate-100/80 border border-slate-200/80 rounded-lg text-[10px] text-slate-600 font-medium">
                      <ShieldCheck className="w-3 h-3 text-emerald-600 shrink-0" />
                      <span>3m Auto-Logout (IAS Protected)</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200/80 space-y-1">
                    {/* MFA Security Settings (Admin Only; removed from resident, staff, captain) */}
                    {onOpenMfa && user.role === 'admin' && (
                      <button
                        onClick={() => { onOpenMfa(); setShowRoleMenu(false); }}
                        className="w-full px-3 py-2 text-indigo-700 hover:bg-indigo-50/80 rounded-xl text-left font-semibold flex items-center justify-between cursor-pointer transition-colors"
                      >
                        <span className="flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4 text-indigo-600" />
                          <span>MFA Security (TOTP)</span>
                        </span>
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 shadow-2xs">{user.mfaEnabled ? 'ACTIVE' : 'OFF'}</span>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setShowRoleMenu(false);
                        if (onSwitchUser) onSwitchUser();
                        else onLogout();
                      }}
                      className="w-full px-3 py-2 text-slate-700 hover:bg-slate-100/80 rounded-xl text-left font-semibold flex items-center gap-2 cursor-pointer transition-colors"
                    >
                      <RotateCcw className="w-4 h-4 text-slate-500" />
                      <span>Switch Account</span>
                    </button>

                    <button
                      onClick={() => { onLogout(); setShowRoleMenu(false); }}
                      className="w-full px-3 py-2 text-rose-700 hover:bg-rose-50/80 rounded-xl text-left font-bold flex items-center gap-2 cursor-pointer transition-colors"
                    >
                      <LogOut className="w-4 h-4 text-rose-600" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="flex lg:hidden overflow-x-auto py-2.5 border-t border-slate-200/60 text-xs font-bold gap-1.5 scrollbar-none">
          <button
            onClick={() => onSelectView('dashboard')}
            className={`px-3 py-1.5 rounded-xl shrink-0 cursor-pointer transition-all ${activeView === 'dashboard' ? 'btn-3d bg-blue-600 text-white' : 'text-slate-600 hover:bg-white/60'}`}
          >
            {user.role === 'resident' ? 'My Services' : 'Portal'}
          </button>
          {(user.role === 'official' || user.role === 'admin') && (
            <button
              onClick={() => onSelectView('signing')}
              className={`px-3 py-1.5 rounded-xl shrink-0 cursor-pointer transition-all ${activeView === 'signing' ? 'btn-3d bg-blue-600 text-white' : 'text-slate-600 hover:bg-white/60'}`}
            >
              Captain Signing
            </button>
          )}
          {(user.role === 'admin' || user.role === 'staff') && (
            <button
              onClick={() => onSelectView('audit')}
              className={`px-3 py-1.5 rounded-xl shrink-0 cursor-pointer transition-all ${activeView === 'audit' ? 'btn-3d bg-blue-600 text-white' : 'text-slate-600 hover:bg-white/60'}`}
            >
              Audit Trail
            </button>
          )}
          {user.role === 'admin' && (
            <>
              <button
                onClick={() => onSelectView('playground')}
                className={`px-3 py-1.5 rounded-xl shrink-0 cursor-pointer transition-all ${activeView === 'playground' ? 'btn-3d bg-blue-600 text-white' : 'text-slate-600 hover:bg-white/60'}`}
              >
                IAS Lab
              </button>
              <button
                onClick={() => onSelectView('schema')}
                className={`px-3 py-1.5 rounded-xl shrink-0 cursor-pointer transition-all ${activeView === 'schema' ? 'btn-3d bg-blue-600 text-white' : 'text-slate-600 hover:bg-white/60'}`}
              >
                SQL Schema
              </button>
            </>
          )}

          {/* Mobile Persistent Session Countdown Button */}
          {sessionRemainingSeconds !== undefined && (
            <button
              onClick={handleRenewSession}
              className={`ml-auto px-3 py-1.5 rounded-xl border text-[11px] font-mono font-bold flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer ${
                sessionRemainingSeconds <= 60
                  ? 'bg-rose-50 text-rose-700 border-rose-300 animate-pulse'
                  : sessionRemainingSeconds <= 300
                    ? 'bg-amber-50 text-amber-800 border-amber-300'
                    : 'bg-white/80 text-slate-700 border-white/80 shadow-2xs'
              }`}
              title="Session inactivity timeout. Tap to extend session."
            >
              <Timer className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>{formatSessionTime(sessionRemainingSeconds)}</span>
              <RotateCcw className="w-2.5 h-2.5 text-slate-400" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
