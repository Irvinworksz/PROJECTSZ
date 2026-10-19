import React, { useEffect } from 'react';
import { ShieldAlert, Clock, LogOut, RefreshCw, Lock, AlertTriangle, ShieldCheck } from 'lucide-react';

interface InactivityWarningModalProps {
  isOpen: boolean;
  remainingSeconds: number;
  totalWarningSeconds?: number;
  timeoutMinutes?: number;
  onStaySignedIn: () => void;
  onLogoutNow: () => void;
}

export const InactivityWarningModal: React.FC<InactivityWarningModalProps> = ({
  isOpen,
  remainingSeconds,
  totalWarningSeconds = 20,
  timeoutMinutes = 3,
  onStaySignedIn,
  onLogoutNow
}) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onStaySignedIn();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onLogoutNow();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onStaySignedIn, onLogoutNow]);

  if (!isOpen) return null;

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  
  const maxSeconds = Math.max(1, totalWarningSeconds);
  const percentageRemaining = Math.max(0, Math.min(100, (remainingSeconds / maxSeconds) * 100));

  // Circular progress calculations (Radius = 58, Circumference = 2 * PI * 58 ≈ 364.42)
  const radius = 58;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - percentageRemaining / 100);

  // Urgency thresholds for 20-second warning popup
  const isCritical = remainingSeconds <= 5;
  const isUrgent = remainingSeconds > 5 && remainingSeconds <= 10;

  const headerGradient = isCritical
    ? 'from-rose-600 via-rose-700 to-red-800'
    : isUrgent
    ? 'from-amber-600 via-orange-600 to-amber-700'
    : 'from-amber-600 to-amber-700';

  const strokeColor = isCritical
    ? 'text-rose-600'
    : isUrgent
    ? 'text-orange-500'
    : 'text-amber-500';

  const trackColor = isCritical
    ? 'text-rose-100'
    : isUrgent
    ? 'text-orange-100'
    : 'text-amber-100';

  const badgeBg = isCritical
    ? 'bg-rose-100 text-rose-800 border-rose-300 animate-pulse'
    : isUrgent
    ? 'bg-orange-100 text-orange-900 border-orange-300'
    : 'bg-amber-100 text-amber-900 border-amber-300';

  const progressBarColor = isCritical
    ? 'bg-rose-600'
    : isUrgent
    ? 'bg-orange-500'
    : 'bg-amber-500';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="inactivity-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className={`glass-panel rounded-3xl shadow-2xl border ${isCritical ? 'border-rose-400/80 ring-4 ring-rose-500/20' : 'border-amber-300/80'} max-w-lg w-full overflow-hidden text-slate-900 animate-in zoom-in-95 duration-200`}>
        
        {/* Modal Header */}
        <div className={`bg-gradient-to-r ${headerGradient} text-white p-5 flex items-center justify-between transition-colors duration-500 shadow-md`}>
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center shrink-0 ${isCritical ? 'animate-bounce' : ''}`}>
              <ShieldAlert className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 id="inactivity-dialog-title" className="text-base font-black text-white tracking-tight">
                  Session Inactivity Timeout
                </h3>
                <span className={`px-2.5 py-0.5 text-[9px] font-black uppercase rounded-full border shadow-2xs ${badgeBg}`}>
                  {isCritical ? 'Critical' : isUrgent ? 'Urgent' : 'Warning'}
                </span>
              </div>
              <p className="text-xs text-amber-100 font-medium mt-0.5">
                Government IAS Security & Republic Act 10173 Compliance
              </p>
            </div>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-5">
          
          {/* Explanation Text */}
          <p className="text-xs text-slate-600 text-center leading-relaxed max-w-md mx-auto">
            You have been inactive for nearly <strong className="text-slate-900 font-bold">{timeoutMinutes} minutes</strong>. 
            To prevent unauthorized terminal access and safeguard resident records, your session will automatically lock in:
          </p>

          {/* VISUAL COUNTDOWN TIMER: Prominent Circular SVG Gauge */}
          <div className="flex flex-col items-center justify-center py-2">
            <div className="relative w-40 h-40 flex items-center justify-center">
              {/* Outer decorative ring */}
              <div className={`absolute inset-0 rounded-full border-2 ${isCritical ? 'border-rose-100 animate-ping opacity-25' : 'border-slate-100'}`} />

              <svg className="w-40 h-40 -rotate-90 origin-center drop-shadow-xs" viewBox="0 0 140 140">
                {/* Background Track Ring */}
                <circle
                  cx="70"
                  cy="70"
                  r={radius}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  className={trackColor}
                />
                {/* Dynamic Animated Countdown Arc */}
                <circle
                  cx="70"
                  cy="70"
                  r={radius}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="9"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  className={`${strokeColor} transition-all duration-1000 ease-linear`}
                />
              </svg>

              {/* Centered Digital Countdown Readout */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center select-none pointer-events-none">
                <Clock className={`w-4 h-4 mb-0.5 ${strokeColor} ${isCritical ? 'animate-spin' : ''}`} style={{ animationDuration: isCritical ? '1.5s' : '4s' }} />
                <span className={`font-mono text-4xl font-black tracking-tight leading-none ${isCritical ? 'text-rose-600' : isUrgent ? 'text-orange-600' : 'text-slate-900'}`}>
                  {formattedTime}
                </span>
                <span className={`text-[10px] font-black tracking-widest uppercase mt-1 ${isCritical ? 'text-rose-700' : 'text-slate-500'}`}>
                  {remainingSeconds === 1 ? 'SECOND LEFT' : 'SECONDS LEFT'}
                </span>
              </div>
            </div>

            {/* Visual Segmented / Linear Bar */}
            <div className="w-full max-w-xs mt-3 space-y-1">
              <div className="w-full bg-slate-200/80 rounded-full h-2.5 overflow-hidden border border-slate-300/80 shadow-inner">
                <div
                  className={`h-full transition-all duration-1000 ease-linear rounded-full ${progressBarColor}`}
                  style={{ width: `${percentageRemaining}%` }}
                />
              </div>
              
              {/* Milestone Markers */}
              <div className="flex justify-between text-[10px] font-mono text-slate-600 font-semibold px-0.5">
                <span>0s</span>
                <span>5s</span>
                <span>10s</span>
                <span>15s</span>
                <span>20s</span>
              </div>
            </div>
          </div>

          {/* Security & Regulatory Information Box */}
          <div className="p-3.5 bg-white/70 border border-slate-200/80 rounded-2xl text-[11px] text-slate-600 space-y-1.5 shadow-2xs">
            <div className="flex items-center gap-2 font-bold text-slate-800">
              <Lock className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>Mandatory Terminal Security Standard</span>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-600 font-medium">
              In compliance with <strong>National Privacy Commission (NPC) Circular 16-01</strong> and DILG E-Governance IAS requirements, automated session termination prevents physical shoulder surfing and protects official <strong>HMAC-SHA256 signing keys</strong>.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
            <button
              type="button"
              onClick={onStaySignedIn}
              autoFocus
              className={`flex-1 py-3 px-4 btn-3d ${isCritical ? 'bg-rose-600 hover:bg-rose-700' : 'bg-blue-600 hover:bg-blue-700'} text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer`}
            >
              <RefreshCw className="w-4 h-4" />
              <span>Extend Session & Keep Working</span>
              <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-white/20 rounded text-white/90">
                ↵ Enter
              </kbd>
            </button>

            <button
              type="button"
              onClick={onLogoutNow}
              className="py-3 px-4 btn-3d-secondary text-slate-700 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-4 h-4 text-slate-500" />
              <span>Sign Out Now</span>
              <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-slate-200 rounded text-slate-600">
                Esc
              </kbd>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
