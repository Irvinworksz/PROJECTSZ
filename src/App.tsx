import React, { useEffect, useState } from 'react';
import { Navbar } from './components/Navbar';
import { SignInPage } from './components/SignInPage';
import { ResidentDashboard } from './components/ResidentDashboard';
import { StaffDashboard } from './components/StaffDashboard';
import { OfficialSigningPortal } from './components/OfficialSigningPortal';
import { AuditLogViewer } from './components/AuditLogViewer';
import { IASSecurityPlayground } from './components/IASSecurityPlayground';
import { DatabaseSchemaExplorer } from './components/DatabaseSchemaExplorer';
import { DocumentPrintModal } from './components/DocumentPrintModal';
import { PublicVerifyModal } from './components/PublicVerifyModal';
import { AuthModal } from './components/AuthModal';
import { MfaSettingsModal } from './components/MfaSettingsModal';
import { apiClient } from './lib/api';
import type { ClearanceRequest, NotificationRecord, ResidentProfile, User, UserRole } from './types';
import { RefreshCw, Shield, ShieldCheck } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [residentProfile, setResidentProfile] = useState<ResidentProfile | null>(null);
  const [requests, setRequests] = useState<ClearanceRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Active view state
  const [activeView, setActiveView] = useState<'dashboard' | 'signing' | 'audit' | 'playground' | 'schema'>('dashboard');

  // Modals state
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const [isMfaOpen, setIsMfaOpen] = useState<boolean>(false);
  const [isVerifyOpen, setIsVerifyOpen] = useState<boolean>(false);
  const [verifyInitialRef, setVerifyInitialRef] = useState<string>('');
  const [selectedDocToPrint, setSelectedDocToPrint] = useState<ClearanceRequest | null>(null);

  // Notifications
  const [allNotifications, setAllNotifications] = useState<NotificationRecord[]>([]);

  // Initial Boot: Check URL query params for ?verify=... and check active auth session
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const verifyParam = urlParams.get('verify');
    if (verifyParam) {
      setVerifyInitialRef(verifyParam);
      setIsVerifyOpen(true);
    }

    const initAuth = async () => {
      setLoading(true);
      const storedUser = apiClient.getStoredUser();
      const token = apiClient.getToken();

      if (token && storedUser) {
        const meRes = await apiClient.getMe();
        if (meRes.success && meRes.user) {
          setCurrentUser(meRes.user);
          if (meRes.profile) setResidentProfile(meRes.profile);
          await loadClearances(meRes.user);
          setLoading(false);
          return;
        }
      }

      setLoading(false);
    };

    initAuth();
  }, []);

  const loadClearances = async (userOverride?: User | null) => {
    const activeUser = userOverride !== undefined ? userOverride : currentUser;
    const res = await apiClient.getClearances();
    if (res.success && res.data) {
      setRequests(res.data);
      
      // User-Isolated Notification Filtering
      const notifs: NotificationRecord[] = [];
      
      res.data.forEach(r => {
        if (r.notificationsSent && r.notificationsSent.length > 0) {
          // If logged in as a resident, only show notifications strictly matching their own resident ID or contact
          if (activeUser && activeUser.role === 'resident') {
            const userNotifs = r.notificationsSent.filter(n => 
              (!n.residentId || n.residentId === activeUser.id) &&
              (!n.recipient || n.recipient === activeUser.contactNumber || n.recipient === 'Resident Contact' || n.recipient === activeUser.email)
            );
            notifs.push(...userNotifs);
          } else if (activeUser && (activeUser.role === 'official' || activeUser.role === 'staff' || activeUser.role === 'admin')) {
            // Staff, Official, and Admin see transaction updates tailored to administrative oversight
            notifs.push(...r.notificationsSent);
          } else {
            notifs.push(...r.notificationsSent);
          }
        }
      });

      setAllNotifications(notifs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
    }
  };

  const handleRoleSwitch = async (role: UserRole) => {
    setLoading(true);
    let u = 'juan.delacruz';
    let p = 'Resident@2026!';

    if (role === 'staff') {
      u = 'staff.elena';
      p = 'StaffSecure@2026!';
    } else if (role === 'official') {
      u = 'capt.laugo';
      p = 'CaptainAuth@2026!';
    } else if (role === 'admin') {
      u = 'admin.security';
      p = 'AdminRoot@2026!';
    }

    const res = await apiClient.login(u, p);
    setLoading(false);
    if (res.success && res.user) {
      setCurrentUser(res.user);
      if (res.profile) setResidentProfile(res.profile);
      setActiveView('dashboard');
      loadClearances(res.user);
    }
  };

  const handleLogout = () => {
    apiClient.clearAuth();
    setCurrentUser(null);
    setResidentProfile(null);
    setRequests([]);
    setAllNotifications([]);
  };

  const handleAuthSuccess = (user: User, profile?: ResidentProfile) => {
    setCurrentUser(user);
    if (profile) setResidentProfile(profile);
    loadClearances(user);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-slate-900 space-y-4 font-sans">
        <RefreshCw className="w-10 h-10 text-blue-600 animate-spin" />
        <div className="text-center space-y-1">
          <h2 className="text-lg font-bold text-slate-900">Secure Barangay E-Clearance System</h2>
          <p className="text-xs text-slate-600 font-mono">Initializing Cryptographic Key Stores & Parameterized Database...</p>
        </div>
      </div>
    );
  }

  // If no authenticated user, show the full professional government sign-in & registration portal
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
        <SignInPage
          onAuthSuccess={handleAuthSuccess}
          onOpenVerify={() => { setVerifyInitialRef(''); setIsVerifyOpen(true); }}
        />

        {/* Public QR / Reference Verification Modal */}
        {isVerifyOpen && (
          <PublicVerifyModal
            initialRef={verifyInitialRef}
            onClose={() => setIsVerifyOpen(false)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Navigation */}
      {currentUser && (
        <Navbar
          user={currentUser}
          activeView={activeView}
          onSelectView={setActiveView}
          onOpenVerify={() => { setVerifyInitialRef(''); setIsVerifyOpen(true); }}
          onSwitchUser={handleRoleSwitch}
          onLogout={handleLogout}
          onOpenMfa={() => setIsMfaOpen(true)}
          notifications={allNotifications}
        />
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {currentUser ? (
          <>
            {/* View Dispatcher */}
            {activeView === 'dashboard' && (
              <>
                {currentUser.role === 'resident' && (
                  <ResidentDashboard
                    user={currentUser}
                    profile={residentProfile}
                    requests={requests}
                    onRefresh={loadClearances}
                    onViewDocument={(req) => setSelectedDocToPrint(req)}
                    onOpenVerify={(ref) => { setVerifyInitialRef(ref || ''); setIsVerifyOpen(true); }}
                    onUserUpdated={(updatedUser) => setCurrentUser(updatedUser)}
                  />
                )}

                {(currentUser.role === 'staff' || currentUser.role === 'admin') && (
                  <StaffDashboard
                    requests={requests}
                    onRefresh={loadClearances}
                    onViewDocument={(req) => setSelectedDocToPrint(req)}
                    onOpenVerify={(ref) => { setVerifyInitialRef(ref || ''); setIsVerifyOpen(true); }}
                  />
                )}

                {currentUser.role === 'official' && (
                  <OfficialSigningPortal
                    requests={requests}
                    onRefresh={loadClearances}
                    onViewDocument={(req) => setSelectedDocToPrint(req)}
                    onOpenVerify={(ref) => { setVerifyInitialRef(ref || ''); setIsVerifyOpen(true); }}
                  />
                )}
              </>
            )}

            {activeView === 'signing' && (
              <OfficialSigningPortal
                requests={requests}
                onRefresh={loadClearances}
                onViewDocument={(req) => setSelectedDocToPrint(req)}
                onOpenVerify={(ref) => { setVerifyInitialRef(ref || ''); setIsVerifyOpen(true); }}
              />
            )}

            {activeView === 'audit' && (currentUser.role === 'admin' || currentUser.role === 'staff') && <AuditLogViewer />}

            {activeView === 'playground' && currentUser.role === 'admin' && <IASSecurityPlayground />}

            {activeView === 'schema' && currentUser.role === 'admin' && <DatabaseSchemaExplorer />}

            {/* Access Restriction Fallback for Unauthorized Direct View Access */}
            {(activeView === 'playground' || activeView === 'schema') && currentUser.role !== 'admin' && (
              <div className="py-12 text-center space-y-4 bg-white border border-slate-200 shadow-sm rounded-2xl p-8 max-w-lg mx-auto">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto">
                  <Shield className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Restricted Administrative System</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  The IAS Security Laboratory and Relational SQL Schema tools are restricted to authorized 
                  <strong> Cybersecurity Administrators & System Developers</strong>.
                </p>
                <button
                  onClick={() => setActiveView('dashboard')}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer transition-colors"
                >
                  Return to My Workspace
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="py-20 text-center space-y-4 bg-white border border-slate-200 shadow-sm rounded-2xl p-8 max-w-md mx-auto">
            <h2 className="text-2xl font-bold text-slate-900">Authentication Required</h2>
            <p className="text-xs text-slate-600">Please sign in to access your Barangay Portal records.</p>
            <button
              onClick={() => setIsAuthOpen(true)}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer transition-all"
            >
              Open Sign In Dialog
            </button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white text-slate-600 text-xs py-6 border-t border-slate-200 font-sans print:hidden shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="space-y-0.5">
            <p className="font-bold text-slate-800">Republic of the Philippines • Barangay Cabucbucan, Rizal, Nueva Ecija</p>
            <p className="text-[11px] text-slate-500 font-mono">
              Secure E-Clearance Portal • IAS Compliant (Confidentiality, Integrity, Availability, Non-Repudiation)
            </p>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <button
              onClick={() => setActiveView('playground')}
              className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer font-semibold"
            >
              Security Lab
            </button>
            <span className="text-slate-300">•</span>
            <button
              onClick={() => setActiveView('schema')}
              className="text-purple-600 hover:text-purple-800 hover:underline cursor-pointer font-semibold"
            >
              SQL DDL
            </button>
            <span className="text-slate-300">•</span>
            <button
              onClick={() => { setVerifyInitialRef(''); setIsVerifyOpen(true); }}
              className="text-emerald-600 hover:text-emerald-800 hover:underline cursor-pointer font-semibold"
            >
              QR Verification
            </button>
          </div>
        </div>
      </footer>

      {/* Printable Certificate Modal */}
      {selectedDocToPrint && (
        <DocumentPrintModal
          request={selectedDocToPrint}
          onClose={() => setSelectedDocToPrint(null)}
        />
      )}

      {/* Public QR / Reference Verification Modal */}
      {isVerifyOpen && (
        <PublicVerifyModal
          initialRef={verifyInitialRef}
          onClose={() => setIsVerifyOpen(false)}
        />
      )}

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />

      {/* Global MFA Settings Modal */}
      {currentUser && (
        <MfaSettingsModal
          isOpen={isMfaOpen}
          onClose={() => setIsMfaOpen(false)}
          user={currentUser}
          onUserUpdated={(updatedUser) => setCurrentUser(updatedUser)}
        />
      )}
    </div>
  );
}
