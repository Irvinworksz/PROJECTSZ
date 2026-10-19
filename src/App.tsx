import React, { useEffect, useState } from 'react';
import { Navbar } from './components/Navbar';
import { SignInPage } from './components/SignInPage';
import { ResidentDashboard } from './components/ResidentDashboard';
import { StaffDashboard } from './components/StaffDashboard';
import { CyberAdminDashboard } from './components/CyberAdminDashboard';
import { OfficialSigningPortal } from './components/OfficialSigningPortal';
import { AuditLogViewer } from './components/AuditLogViewer';
import { IASSecurityPlayground } from './components/IASSecurityPlayground';
import { DatabaseSchemaExplorer } from './components/DatabaseSchemaExplorer';
import { DocumentPrintModal } from './components/DocumentPrintModal';
import { PublicVerificationModal } from './components/PublicVerificationModal';
import { AuthModal } from './components/AuthModal';
import { MfaSettingsModal } from './components/MfaSettingsModal';
import { InactivityWarningModal } from './components/InactivityWarningModal';
import { FirebaseCloudConsoleModal } from './components/FirebaseCloudConsoleModal';
import { useInactivityTimeout } from './hooks/useInactivityTimeout';
import { apiClient } from './lib/api';
import type { ClearanceRequest, NotificationRecord, ResidentProfile, User, UserRole } from './types';
import { RefreshCw, Shield, ShieldCheck } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [residentProfile, setResidentProfile] = useState<ResidentProfile | null>(null);
  const [requests, setRequests] = useState<ClearanceRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [sessionExpiredNotice, setSessionExpiredNotice] = useState<string | null>(null);

  // Active view state
  const [activeView, setActiveView] = useState<'dashboard' | 'signing' | 'audit' | 'playground' | 'schema'>('dashboard');

  // Modals state
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const [isMfaOpen, setIsMfaOpen] = useState<boolean>(false);
  const [selectedDocToPrint, setSelectedDocToPrint] = useState<ClearanceRequest | null>(null);
  const [isVerifyOpen, setIsVerifyOpen] = useState<boolean>(false);
  const [verifyInitialRef, setVerifyInitialRef] = useState<string>('');
  const [isFirebaseCloudOpen, setIsFirebaseCloudOpen] = useState<boolean>(false);

  // Notifications
  const [allNotifications, setAllNotifications] = useState<NotificationRecord[]>([]);

  // Check for public QR verification URL parameter on boot (?verify=BC-2026-XXXX)
  useEffect(() => {
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const verifyRef = searchParams.get('verify');
      if (verifyRef && verifyRef.trim()) {
        setVerifyInitialRef(verifyRef.trim());
        setIsVerifyOpen(true);
      }
    } catch {
      // Ignore URL parsing errors
    }
  }, []);

  // Initial Boot: Check active auth session
  useEffect(() => {
    const initAuth = async () => {
      setLoading(true);
      const token = apiClient.getToken();

      if (token) {
        const meRes = await apiClient.getMe();
        if (meRes.success && meRes.user) {
          setCurrentUser(meRes.user);
          if (meRes.profile) setResidentProfile(meRes.profile);
          await loadClearances(meRes.user);
          setLoading(false);
          return;
        } else {
          // Stale, invalid, or expired session: clean up completely
          apiClient.clearAuth();
          setCurrentUser(null);
          setResidentProfile(null);
        }
      } else {
        apiClient.clearAuth();
        setCurrentUser(null);
        setResidentProfile(null);
      }

      setLoading(false);
    };

    initAuth();
  }, []);

  const loadClearances = async (userOverride?: any) => {
    const activeUser = (userOverride && typeof userOverride === 'object' && 'role' in userOverride)
      ? (userOverride as User)
      : currentUser;

    const [res, notifRes] = await Promise.all([
      apiClient.getClearances(),
      apiClient.getNotifications()
    ]);

    if (res.success && res.data) {
      setRequests(res.data);
    }

    if (notifRes.success && Array.isArray(notifRes.data)) {
      setAllNotifications(notifRes.data);
    } else if (res.success && res.data) {
      // User-Isolated Notification Fallback Filtering (Strict RBAC isolation)
      const notifs: NotificationRecord[] = [];
      
      res.data.forEach(r => {
        if (r.notificationsSent && r.notificationsSent.length > 0) {
          if (activeUser && activeUser.role === 'resident') {
            // Resident only sees notifications meant for their specific account
            const userNotifs = r.notificationsSent.filter(n => 
              (n.targetRole === 'resident' || !n.targetRole) &&
              n.residentId === activeUser.id
            );
            notifs.push(...userNotifs);
          } else if (activeUser && activeUser.role === 'official') {
            // Punong Barangay Captain ONLY sees official signature requests and captain alerts (NO resident personal SMS)
            const officialNotifs = r.notificationsSent.filter(n => 
              n.targetRole === 'official'
            );
            notifs.push(...officialNotifs);
          } else if (activeUser && activeUser.role === 'staff') {
            // Barangay Staff ONLY sees desk queue notices and staff review alerts (NO resident personal SMS)
            const staffNotifs = r.notificationsSent.filter(n => 
              n.targetRole === 'staff'
            );
            notifs.push(...staffNotifs);
          } else if (activeUser && activeUser.role === 'admin') {
            // Cyber Admin sees administrative alerts and system log notifications
            const adminNotifs = r.notificationsSent.filter(n => 
              n.targetRole === 'admin' || n.targetRole === 'staff' || n.targetRole === 'official'
            );
            notifs.push(...adminNotifs);
          }
        }
      });

      setAllNotifications(notifs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
    }
  };

  const handleSwitchAccount = () => {
    handleLogout('user_logout');
    setSessionExpiredNotice('You have been signed out. Please enter credentials for the account you wish to access.');
  };

  const handleLogout = (reason: 'inactivity_timeout' | 'user_logout' = 'user_logout') => {
    apiClient.logout(reason);
    setCurrentUser(null);
    setResidentProfile(null);
    setRequests([]);
    setAllNotifications([]);
    setActiveView('dashboard');
    setIsAuthOpen(false);
    setIsMfaOpen(false);
    setSelectedDocToPrint(null);

    if (reason === 'inactivity_timeout') {
      setSessionExpiredNotice(
        'For security compliance (IAS & DILG E-Governance Standards), your session was automatically logged out after 3 minutes of inactivity. Please sign in again to resume.'
      );
    } else {
      setSessionExpiredNotice(null);
    }
  };

  const handleInactivityTimeout = React.useCallback(() => {
    handleLogout('inactivity_timeout');
  }, []);

  const {
    showWarning,
    remainingSeconds,
    sessionRemainingSeconds,
    resetTimer,
    simulateWarningTest,
    setTimeoutMinutes,
    timeoutMinutes
  } = useInactivityTimeout({
    enabled: !!currentUser,
    onTimeout: handleInactivityTimeout,
    timeoutMs: 3 * 60 * 1000, // 3 minutes of inactivity
    warningMs: 20 * 1000 // 20 seconds warning dialog before auto-logout
  });

  const handleAuthSuccess = (user: User, profile?: ResidentProfile) => {
    setSessionExpiredNotice(null);
    setCurrentUser(user);
    setResidentProfile(profile || null);
    setActiveView('dashboard');
    loadClearances(user);
  };

  if (loading) {
    return (
      <div className="min-h-screen ambient-bg flex flex-col items-center justify-center text-slate-900 space-y-6 font-sans p-6">
        <div className="glass-panel p-8 rounded-3xl shadow-xl flex flex-col items-center space-y-4 max-w-sm w-full text-center border border-white/80">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/30">
              <RefreshCw className="w-8 h-8 animate-spin" />
            </div>
            <div className="absolute -inset-1 bg-blue-500/20 rounded-2xl blur-md -z-10 animate-pulse" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-base font-bold text-slate-900 tracking-tight">Barangay Cabucbucan E-Clearance</h2>
            <p className="text-xs text-slate-600 font-medium">Securing Cryptographic Key Stores & Database Sessions...</p>
          </div>
          <div className="w-full bg-slate-200/70 h-1.5 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full animate-pulse w-3/4" />
          </div>
        </div>
      </div>
    );
  }

  // If no authenticated user, show the full professional government sign-in & registration portal
  if (!currentUser) {
    return (
      <div className="min-h-screen ambient-bg flex flex-col font-sans">
        <SignInPage
          onAuthSuccess={handleAuthSuccess}
          sessionExpiredNotice={sessionExpiredNotice}
          onClearExpiredNotice={() => setSessionExpiredNotice(null)}
          onOpenVerify={() => {
            setVerifyInitialRef('');
            setIsVerifyOpen(true);
          }}
        />
        <PublicVerificationModal
          isOpen={isVerifyOpen}
          initialRef={verifyInitialRef}
          onClose={() => setIsVerifyOpen(false)}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen ambient-bg text-slate-900 flex flex-col font-sans selection:bg-blue-600 selection:text-white relative">
      {/* Top Navigation */}
      {currentUser && (
        <Navbar
          user={currentUser}
          activeView={activeView}
          onSelectView={setActiveView}
          onOpenVerify={() => {
            setVerifyInitialRef('');
            setIsVerifyOpen(true);
          }}
          onSwitchUser={handleSwitchAccount}
          onLogout={handleLogout}
          onOpenMfa={() => setIsMfaOpen(true)}
          onTestInactivityWarning={() => simulateWarningTest(20)}
          onResetInactivityTimer={resetTimer}
          sessionRemainingSeconds={sessionRemainingSeconds}
          timeoutMinutes={timeoutMinutes}
          notifications={allNotifications}
          onOpenFirebaseCloud={() => setIsFirebaseCloudOpen(true)}
        />
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 relative z-10">
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
                    onUserUpdated={(updatedUser) => setCurrentUser(updatedUser)}
                  />
                )}

                {currentUser.role === 'staff' && (
                  <StaffDashboard
                    requests={requests}
                    onRefresh={loadClearances}
                    onViewDocument={(req) => setSelectedDocToPrint(req)}
                  />
                )}

                {currentUser.role === 'admin' && (
                  <CyberAdminDashboard
                    user={currentUser}
                    requests={requests}
                    onRefresh={loadClearances}
                    onViewDocument={(req) => setSelectedDocToPrint(req)}
                    onSelectView={setActiveView}
                    onOpenMfa={() => setIsMfaOpen(true)}
                  />
                )}

                {currentUser.role === 'official' && (
                  <OfficialSigningPortal
                    requests={requests}
                    onRefresh={loadClearances}
                    onViewDocument={(req) => setSelectedDocToPrint(req)}
                  />
                )}
              </>
            )}

            {activeView === 'signing' && (
              <OfficialSigningPortal
                requests={requests}
                onRefresh={loadClearances}
                onViewDocument={(req) => setSelectedDocToPrint(req)}
              />
            )}

            {activeView === 'audit' && (currentUser.role === 'admin' || currentUser.role === 'staff') && <AuditLogViewer />}

            {activeView === 'playground' && currentUser.role === 'admin' && (
              <IASSecurityPlayground
                onSimulateInactivityWarning={() => simulateWarningTest(20)}
              />
            )}

            {activeView === 'schema' && currentUser.role === 'admin' && <DatabaseSchemaExplorer />}

            {/* Access Restriction Fallback for Unauthorized Direct View Access */}
            {(activeView === 'playground' || activeView === 'schema') && currentUser.role !== 'admin' && (
              <div className="py-12 text-center space-y-4 glass-panel border border-white/80 shadow-xl rounded-3xl p-8 max-w-lg mx-auto animate-in fade-in zoom-in-95 duration-200">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-300 text-amber-700 flex items-center justify-center mx-auto shadow-sm">
                  <Shield className="w-7 h-7" />
                </div>
                <h3 className="text-base font-bold text-slate-900 tracking-tight">Restricted Administrative System</h3>
                <p className="text-xs text-slate-600 leading-relaxed max-w-md mx-auto">
                  The IAS Security Laboratory and Relational SQL Schema tools are strictly restricted to authorized 
                  <strong> Cybersecurity Administrators & System Developers</strong>.
                </p>
                <button
                  onClick={() => setActiveView('dashboard')}
                  className="btn-3d px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl cursor-pointer transition-all"
                >
                  Return to My Workspace
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="py-20 text-center space-y-4 glass-panel border border-white/80 shadow-xl rounded-3xl p-8 max-w-md mx-auto">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Authentication Required</h2>
            <p className="text-xs text-slate-600">Please sign in to access your Barangay Portal records.</p>
            <button
              onClick={() => setIsAuthOpen(true)}
              className="btn-3d px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl cursor-pointer transition-all"
            >
              Open Sign In Dialog
            </button>
          </div>
        )}
      </main>

      {/* Official Government Portal Footer */}
      <footer className="bg-white/80 border-t border-slate-200 py-4 text-slate-600 text-xs font-sans print:hidden relative z-10 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center gap-2.5 justify-center sm:justify-start">
            <img
              src="/brgy_seal.jpg"
              alt="Seal of Barangay Cabucbucan"
              className="w-6 h-6 object-contain rounded-full border border-slate-200 shrink-0"
              referrerPolicy="no-referrer"
            />
            <p className="text-xs font-bold text-slate-800">
              Republic of the Philippines • Barangay Cabucbucan, Rizal, Nueva Ecija
            </p>
          </div>
          <p className="text-[11px] text-slate-500 font-medium">
            Official E-Clearance & Civil Registry Portal
          </p>
        </div>
      </footer>

      {/* Printable Certificate Modal */}
      {selectedDocToPrint && (
        <DocumentPrintModal
          request={selectedDocToPrint}
          onClose={() => setSelectedDocToPrint(null)}
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

      {/* Floating Session Auto-Logout Timer Widget: Hidden per user design preference */}

      {/* Global Automatic Inactivity Timeout Warning Modal (Triggers at 20s remaining) */}
      <InactivityWarningModal
        isOpen={showWarning && !!currentUser}
        remainingSeconds={remainingSeconds}
        totalWarningSeconds={20}
        timeoutMinutes={timeoutMinutes}
        onStaySignedIn={resetTimer}
        onLogoutNow={() => handleLogout('user_logout')}
      />

      {/* Public Document Verification Modal */}
      <PublicVerificationModal
        isOpen={isVerifyOpen}
        initialRef={verifyInitialRef}
        onClose={() => setIsVerifyOpen(false)}
      />

      {/* Real-Time Google Cloud Firestore Database & Activity Console */}
      <FirebaseCloudConsoleModal
        isOpen={isFirebaseCloudOpen}
        onClose={() => setIsFirebaseCloudOpen(false)}
        currentUser={currentUser}
      />
    </div>
  );
}
