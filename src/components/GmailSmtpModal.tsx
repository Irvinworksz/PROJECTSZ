import React, { useState, useEffect } from 'react';
import { 
  Mail, Shield, ShieldCheck, KeyRound, Check, X, 
  AlertCircle, Send, ExternalLink, RefreshCw, Eye, EyeOff, Lock, CheckCircle2
} from 'lucide-react';

interface GmailSmtpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const GmailSmtpModal: React.FC<GmailSmtpModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [gmailUser, setGmailUser] = useState<string>('');
  const [gmailAppPassword, setGmailAppPassword] = useState<string>('');
  const [forwardingEmail, setForwardingEmail] = useState<string>('delacruzjohnirvin05@gmail.com');
  const [forwardAllMfaToAdmin, setForwardAllMfaToAdmin] = useState<boolean>(true);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  
  const [loading, setLoading] = useState<boolean>(false);
  const [testing, setTesting] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isConfigured, setIsConfigured] = useState<boolean>(false);
  const [provider, setProvider] = useState<string>('none');

  useEffect(() => {
    if (!isOpen) return;

    const fetchCurrentSettings = async () => {
      try {
        const res = await fetch('/api/email/settings');
        const data = await res.json();
        if (data.success) {
          setIsConfigured(Boolean(data.configured));
          setProvider(data.provider || 'none');
          if (data.sender) {
            setGmailUser(data.sender);
          }
          if (data.forwardingEmail) {
            setForwardingEmail(data.forwardingEmail);
          }
          if (typeof data.forwardAllMfaToAdmin === 'boolean') {
            setForwardAllMfaToAdmin(data.forwardAllMfaToAdmin);
          }
        }
      } catch {
        // Ignore fetch errors on initial load
      }
    };

    fetchCurrentSettings();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatusMessage('');
    setErrorMessage('');

    try {
      const res = await fetch('/api/email/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gmailUser: gmailUser.trim(),
          gmailAppPassword: gmailAppPassword.trim(),
          forwardingEmail: forwardingEmail.trim().toLowerCase(),
          forwardAllMfaToAdmin: Boolean(forwardAllMfaToAdmin)
        })
      });

      const data = await res.json();
      if (data.success) {
        setIsConfigured(Boolean(data.configured));
        setStatusMessage('Email dispatch gateway settings saved successfully.');
        if (onSuccess) onSuccess();
      } else {
        setErrorMessage(data.error || 'Failed to update email settings.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Network error saving settings.');
    } finally {
      setLoading(false);
    }
  };

  const handleTestEmail = async () => {
    const testRecipient = forwardingEmail.trim() || gmailUser.trim();
    if (!testRecipient || !testRecipient.includes('@')) {
      setErrorMessage('Please provide a valid destination email address to test dispatch.');
      return;
    }

    setTesting(true);
    setStatusMessage('');
    setErrorMessage('');

    try {
      const res = await fetch('/api/email/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientEmail: testRecipient })
      });

      const data = await res.json();
      if (data.delivered) {
        setStatusMessage(`Live test email successfully delivered to ${testRecipient}! Message ID: ${data.messageId}`);
      } else {
        setErrorMessage(data.message || data.error || 'Delivery test failed. Check your Gmail App Password.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Network error while attempting test dispatch.');
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-xl w-full overflow-hidden text-slate-900">
        
        {/* Header */}
        <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/30 border border-blue-400/40 text-blue-300 flex items-center justify-center shrink-0">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white tracking-tight">Gmail 2FA Dispatch Gateway</h3>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  isConfigured 
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                }`}>
                  {isConfigured ? 'Live SMTP Active' : 'Setup Required'}
                </span>
              </div>
              <p className="text-[11px] text-slate-300">
                NIST SP 800-63B Authenticator Assurance Level 2 (AAL2) Out-of-Band Channel
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSaveSettings} className="p-6 space-y-4">
          
          {/* Information & Instructions Banner */}
          <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-2xl text-xs space-y-2 text-blue-950">
            <div className="font-bold flex items-center gap-1.5 text-blue-900">
              <ShieldCheck className="w-4 h-4 text-blue-700 shrink-0" />
              <span>Real Google Gmail Two-Factor Authentication</span>
            </div>
            <p className="text-[11px] text-blue-900 leading-relaxed">
              When configured, the system connects directly to Google Gmail SMTP (Port 465 SSL/TLS) to send real 6-digit authentication passcodes to Barangay Staff, the Punong Barangay, and resident users.
            </p>
            <div className="text-[11px] text-blue-800 bg-white/80 p-2.5 rounded-xl border border-blue-200/80 space-y-1">
              <div className="font-bold text-slate-800 flex items-center gap-1">
                <span>How to obtain a Google App Password:</span>
                <a 
                  href="https://myaccount.google.com/apppasswords" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 inline-flex items-center gap-0.5 underline font-semibold ml-1"
                >
                  <span>Google App Passwords</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <p className="text-[10px] text-slate-600">
                1. Enable 2-Step Verification in your Google Account. <br />
                2. Visit Google App Passwords, generate a 16-character password for "Mail". <br />
                3. Paste the 16 characters below.
              </p>
            </div>
          </div>

          {statusMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-medium leading-snug">{statusMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span className="font-medium leading-snug">{errorMessage}</span>
            </div>
          )}

          {/* Form Fields */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Sending Gmail Account (Username)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={gmailUser}
                  onChange={(e) => setGmailUser(e.target.value)}
                  placeholder="e.g. municipal.office@gmail.com"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Google App Password (16 Characters)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={gmailAppPassword}
                  onChange={(e) => setGmailAppPassword(e.target.value)}
                  placeholder="xxxx xxxx xxxx xxxx"
                  className="w-full pl-9 pr-10 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Evaluation & Forwarding Address */}
            <div className="pt-2 border-t border-slate-200">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Evaluation Forwarding Gmail (Receive All 2FA Codes)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Send className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={forwardingEmail}
                  onChange={(e) => setForwardingEmail(e.target.value)}
                  placeholder="e.g. delacruzjohnirvin05@gmail.com"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                Whenever Staff, Captain, or Resident logs in, a live 2FA verification email will be dispatched to this Gmail address.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="forwardAll"
                checked={forwardAllMfaToAdmin}
                onChange={(e) => setForwardAllMfaToAdmin(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
              />
              <label htmlFor="forwardAll" className="text-xs font-semibold text-slate-700 cursor-pointer">
                Automatically forward Staff and Captain 2FA codes to this address
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2">
            <button
              type="button"
              onClick={handleTestEmail}
              disabled={testing || loading}
              className="w-full sm:w-auto px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-300 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
              <span>{testing ? 'Sending Test...' : 'Send Live Test Email'}</span>
            </button>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 sm:flex-initial px-4 py-2 bg-white hover:bg-slate-50 text-slate-600 text-xs font-bold rounded-xl border border-slate-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 sm:flex-initial px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{loading ? 'Saving...' : 'Save & Activate'}</span>
              </button>
            </div>
          </div>

        </form>
      </div>
    </div>
  );
};
