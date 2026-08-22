import React, { useState } from 'react';
import { Bell, CheckCircle2, ChevronDown, Database, KeyRound, LogOut, MessageSquare, QrCode, Shield, ShieldCheck, UserCheck, Users } from 'lucide-react';
import type { NotificationRecord, User, UserRole } from '../types';

interface NavbarProps {
  user: User;
  activeView: 'dashboard' | 'signing' | 'audit' | 'playground' | 'schema';
  onSelectView: (view: 'dashboard' | 'signing' | 'audit' | 'playground' | 'schema') => void;
  onOpenVerify: () => void;
  onSwitchUser: (role: UserRole) => void;
  onLogout: () => void;
  onOpenMfa?: () => void;
  notifications: NotificationRecord[];
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  activeView,
  onSelectView,
  onOpenVerify,
  onSwitchUser,
  onLogout,
  onOpenMfa,
  notifications
}) => {
  const [showRoleMenu, setShowRoleMenu] = useState<boolean>(false);
  const [showNotifMenu, setShowNotifMenu] = useState<boolean>(false);

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'official':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-900 border border-purple-300">Punong Barangay (Captain)</span>;
      case 'staff':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-900 border border-blue-300">Desk Staff Officer</span>;
      case 'admin':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">Cybersecurity Admin</span>;
      case 'resident':
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">Resident Portal</span>;
    }
  };

  return (
    <header className="bg-white text-slate-900 border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Barangay Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 border border-blue-700 flex items-center justify-center text-white shadow-sm font-bold text-xs p-1 text-center leading-none shrink-0">
              <span>BRGY CAB</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold tracking-tight text-slate-900">Barangay Cabucbucan</h1>
                <span className="hidden sm:inline-block px-2 py-0.5 bg-blue-50 border border-blue-200 text-blue-800 text-[10px] font-bold rounded-md">
                  Rizal, Nueva Ecija
                </span>
              </div>
              <p className="text-[11px] text-slate-600 font-medium">
                Secure E-Clearance & Records Management System (Purok 1 - Purok 6)
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1.5 text-xs font-bold">
            <button
              onClick={() => onSelectView('dashboard')}
              className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
                activeView === 'dashboard' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {user.role === 'resident' && 'My E-Services Portal'}
              {user.role === 'staff' && 'Barangay Staff Desk'}
              {user.role === 'official' && 'Official Punong Desk'}
              {user.role === 'admin' && 'Admin Console'}
            </button>

            {(user.role === 'official' || user.role === 'admin') && (
              <button
                onClick={() => onSelectView('signing')}
                className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeView === 'signing' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <KeyRound className="w-4 h-4 text-amber-500" />
                Captain Signing Desk
              </button>
            )}

            {(user.role === 'admin' || user.role === 'staff') && (
              <button
                onClick={() => onSelectView('audit')}
                className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeView === 'audit' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Shield className="w-4 h-4 text-emerald-600" />
                Audit Trail (Non-Repudiation)
              </button>
            )}

            {user.role === 'admin' && (
              <>
                <button
                  onClick={() => onSelectView('playground')}
                  className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeView === 'playground' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  IAS Security Lab
                </button>

                <button
                  onClick={() => onSelectView('schema')}
                  className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeView === 'schema' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Database className="w-4 h-4 text-purple-600" />
                  SQL Schema
                </button>
              </>
            )}
          </nav>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2.5">
            {/* Public Verify Button */}
            <button
              onClick={onOpenVerify}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl border border-slate-300 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
              title="Public Document QR Verification"
            >
              <QrCode className="w-4 h-4 text-emerald-600" />
              <span className="hidden sm:inline">Verify QR</span>
            </button>

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifMenu(!showNotifMenu)}
                className="p-2 text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl border border-slate-300 transition-colors cursor-pointer relative shadow-2xs"
                title="SMS/Email Notification Center"
              >
                <Bell className="w-4 h-4" />
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {notifications.length}
                  </span>
                )}
              </button>

              {/* Notification dropdown */}
              {showNotifMenu && (
                <div className="absolute right-0 mt-2 w-84 sm:w-96 bg-white text-slate-900 rounded-2xl shadow-xl border border-slate-200 p-3.5 z-50 space-y-2.5">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <div>
                      <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <Bell className="w-3.5 h-3.5 text-blue-600" />
                        {user.role === 'resident' ? 'Application Status Notifications' : 'Barangay Transaction Alerts'}
                      </span>
                      <p className="text-[10px] text-slate-600 font-medium">
                        {user.role === 'resident' 
                          ? `Document updates & pickup readiness alerts`
                          : `Administrative overview (${user.role.toUpperCase()})`}
                      </p>
                    </div>
                    <span className="text-[10px] text-blue-800 font-mono font-bold px-2 py-0.5 bg-blue-50 border border-blue-200 rounded-full">
                      {notifications.length} {notifications.length === 1 ? 'alert' : 'alerts'}
                    </span>
                  </div>
                  
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {notifications.length === 0 ? (
                      <div className="py-6 text-center text-slate-500 space-y-1">
                        <p className="text-xs font-medium">No alerts for your account yet.</p>
                        <p className="text-[10px] text-slate-400">SMS updates for your applications will appear here.</p>
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div key={n.id} className="p-3 bg-slate-50 hover:bg-slate-100 rounded-xl text-[11px] border border-slate-200 space-y-1.5 transition-colors">
                          <div className="flex items-center justify-between font-mono text-[10px]">
                            <div className="flex items-center gap-1.5">
                              <span className="uppercase text-blue-800 font-bold px-1.5 py-0.5 bg-blue-100 border border-blue-200 rounded">
                                {n.type.toUpperCase()}
                              </span>
                              {n.referenceNumber && (
                                <span className="text-emerald-700 font-bold">
                                  #{n.referenceNumber}
                                </span>
                              )}
                            </div>
                            <span className="text-slate-500 font-sans">{new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(n.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                          </div>
                          <p className="text-slate-800 leading-relaxed font-medium">{n.message}</p>
                          {n.residentName && user.role !== 'resident' && (
                            <div className="text-[10px] text-slate-600 font-mono pt-1 border-t border-slate-200 flex justify-between">
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
                className="flex items-center gap-2 pl-2.5 pr-2 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-xl border border-slate-300 transition-colors cursor-pointer text-left shadow-2xs"
              >
                <div className="hidden sm:block">
                  <div className="text-xs font-bold text-slate-900">{user.fullName}</div>
                  <div className="text-[10px] text-slate-600 capitalize font-medium">{user.role}</div>
                </div>
                <ChevronDown className="w-4 h-4 text-slate-500" />
              </button>

              {showRoleMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-white text-slate-900 rounded-2xl shadow-xl border border-slate-200 p-2.5 z-50 space-y-1 text-xs">
                  <div className="px-3 py-2 border-b border-slate-200">
                    <p className="text-[10px] uppercase font-bold text-slate-500">Logged in as:</p>
                    <p className="font-bold text-slate-900">{user.fullName}</p>
                    <div className="mt-1">{getRoleBadge(user.role)}</div>
                  </div>

                  <div className="pt-1">
                    <span className="px-3 text-[10px] uppercase font-bold text-slate-500 block mb-1">
                      Quick Switch Demo Role (RBAC):
                    </span>
                    <button
                      onClick={() => { onSwitchUser('resident'); setShowRoleMenu(false); }}
                      className={`w-full px-3 py-2 rounded-lg text-left font-semibold transition-colors flex items-center justify-between cursor-pointer ${
                        user.role === 'resident' ? 'bg-blue-50 text-blue-900 border border-blue-200 font-bold' : 'hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <span>1. Resident (Juan)</span>
                      {user.role === 'resident' && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
                    </button>

                    <button
                      onClick={() => { onSwitchUser('staff'); setShowRoleMenu(false); }}
                      className={`w-full px-3 py-2 rounded-lg text-left font-semibold transition-colors flex items-center justify-between cursor-pointer ${
                        user.role === 'staff' ? 'bg-blue-50 text-blue-900 border border-blue-200 font-bold' : 'hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <span>2. Desk Staff (Elena)</span>
                      {user.role === 'staff' && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
                    </button>

                    <button
                      onClick={() => { onSwitchUser('official'); setShowRoleMenu(false); }}
                      className={`w-full px-3 py-2 rounded-lg text-left font-semibold transition-colors flex items-center justify-between cursor-pointer ${
                        user.role === 'official' ? 'bg-blue-50 text-blue-900 border border-blue-200 font-bold' : 'hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <span>3. Punong Barangay (Captain)</span>
                      {user.role === 'official' && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
                    </button>

                    <button
                      onClick={() => { onSwitchUser('admin'); setShowRoleMenu(false); }}
                      className={`w-full px-3 py-2 rounded-lg text-left font-semibold transition-colors flex items-center justify-between cursor-pointer ${
                        user.role === 'admin' ? 'bg-blue-50 text-blue-900 border border-blue-200 font-bold' : 'hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <span>4. Cybersecurity Admin</span>
                      {user.role === 'admin' && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
                    </button>
                  </div>

                  <div className="pt-2 border-t border-slate-200 space-y-1">
                    {onOpenMfa && (
                      <button
                        onClick={() => { onOpenMfa(); setShowRoleMenu(false); }}
                        className="w-full px-3 py-2 text-indigo-700 hover:bg-indigo-50 rounded-lg text-left font-semibold flex items-center justify-between cursor-pointer transition-colors"
                      >
                        <span className="flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4 text-indigo-600" />
                          <span>MFA Security (TOTP)</span>
                        </span>
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">{user.mfaEnabled ? 'ACTIVE' : 'OFF'}</span>
                      </button>
                    )}

                    <button
                      onClick={() => { onLogout(); setShowRoleMenu(false); }}
                      className="w-full px-3 py-2 text-rose-700 hover:bg-rose-50 rounded-lg text-left font-bold flex items-center gap-2 cursor-pointer transition-colors"
                    >
                      <LogOut className="w-4 h-4 text-rose-600" />
                      <span>Sign Out / Switch Account</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="flex lg:hidden overflow-x-auto py-2 border-t border-slate-200 text-xs font-bold gap-1">
          <button
            onClick={() => onSelectView('dashboard')}
            className={`px-3 py-1 rounded-lg shrink-0 cursor-pointer ${activeView === 'dashboard' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            {user.role === 'resident' ? 'My Services' : 'Portal'}
          </button>
          {(user.role === 'official' || user.role === 'admin') && (
            <button
              onClick={() => onSelectView('signing')}
              className={`px-3 py-1 rounded-lg shrink-0 cursor-pointer ${activeView === 'signing' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              Captain Signing
            </button>
          )}
          {(user.role === 'admin' || user.role === 'staff') && (
            <button
              onClick={() => onSelectView('audit')}
              className={`px-3 py-1 rounded-lg shrink-0 cursor-pointer ${activeView === 'audit' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              Audit Trail
            </button>
          )}
          {user.role === 'admin' && (
            <>
              <button
                onClick={() => onSelectView('playground')}
                className={`px-3 py-1 rounded-lg shrink-0 cursor-pointer ${activeView === 'playground' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                IAS Lab
              </button>
              <button
                onClick={() => onSelectView('schema')}
                className={`px-3 py-1 rounded-lg shrink-0 cursor-pointer ${activeView === 'schema' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                SQL Schema
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
