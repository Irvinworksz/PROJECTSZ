import React, { useState } from 'react';
import { Clock, Timer, RotateCcw, AlertTriangle, ShieldCheck, ChevronUp, ChevronDown, LogOut, X } from 'lucide-react';

interface SessionTimerWidgetProps {
  sessionRemainingSeconds: number;
  timeoutMinutes: number;
  onExtendSession: () => void;
  onSetTimeoutMinutes: (minutes: number) => void;
  onTestWarning: () => void;
  onLogout: () => void;
}

export const SessionTimerWidget: React.FC<SessionTimerWidgetProps> = ({
  sessionRemainingSeconds,
  timeoutMinutes,
  onExtendSession,
  onSetTimeoutMinutes,
  onTestWarning,
  onLogout
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [showExtendedToast, setShowExtendedToast] = useState<boolean>(false);

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isCritical = sessionRemainingSeconds <= 60;
  const isUrgent = sessionRemainingSeconds > 60 && sessionRemainingSeconds <= 300;

  const handleExtend = () => {
    onExtendSession();
    setShowExtendedToast(true);
    setTimeout(() => setShowExtendedToast(false), 2500);
  };

  // Progress percentage
  const totalDurationSecs = Math.max(1, timeoutMinutes * 60);
  const percentage = Math.max(0, Math.min(100, (sessionRemainingSeconds / totalDurationSecs) * 100));

  return (
    <aside aria-label="Session status" className="fixed bottom-4 right-4 z-40 flex flex-col items-end gap-2 font-sans select-none pointer-events-auto">
      
      {/* Toast Notification when session is extended */}
      {showExtendedToast && (
        <div className="bg-slate-900 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-lg border border-slate-700 animate-in fade-in slide-in-from-bottom-2 duration-150 flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Session renewed! Timer reset to {timeoutMinutes}:00</span>
        </div>
      )}

      {/* Expanded Control Panel */}
      {isExpanded && (
        <div className="w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 space-y-3.5 animate-in zoom-in-95 duration-150 text-slate-900">
          
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-white ${isCritical ? 'bg-rose-600' : isUrgent ? 'bg-amber-500' : 'bg-blue-600'}`}>
                <Timer className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 leading-tight">Session Auto-Logout</h4>
                <p className="text-[10px] text-slate-500">Government Security Compliance</p>
              </div>
            </div>
            <button
              onClick={() => setIsExpanded(false)}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Digital Timer Readout */}
          <div className={`p-3 rounded-xl border text-center space-y-1.5 transition-colors ${
            isCritical
              ? 'bg-rose-50 border-rose-200 text-rose-950'
              : isUrgent
              ? 'bg-amber-50 border-amber-200 text-amber-950'
              : 'bg-slate-50 border-slate-200 text-slate-900'
          }`}>
            <div className="flex items-center justify-center gap-1.5 text-[11px] font-bold text-slate-600">
              <Clock className="w-3.5 h-3.5" />
              <span>Time Remaining Before Logout</span>
            </div>
            <div className={`font-mono text-3xl font-black tracking-tight ${
              isCritical ? 'text-rose-600 animate-pulse' : isUrgent ? 'text-amber-600' : 'text-blue-600'
            }`}>
              {formatTime(sessionRemainingSeconds)}
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-1000 ease-linear rounded-full ${
                  isCritical ? 'bg-rose-600' : isUrgent ? 'bg-amber-500' : 'bg-blue-600'
                }`}
                style={{ width: `${percentage}%` }}
              />
            </div>
            <p className="text-[10px] text-slate-500">
              Session terminates automatically when countdown reaches 00:00.
            </p>
          </div>

          {/* Duration Selector for Testing / Convenience */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-700 block">
              Set Session Timeout Duration:
            </label>
            <div className="grid grid-cols-4 gap-1">
              {[2, 5, 15, 30].map((mins) => (
                <button
                  key={mins}
                  onClick={() => onSetTimeoutMinutes(mins)}
                  className={`py-1 text-[11px] font-bold rounded-lg border transition-all cursor-pointer ${
                    timeoutMinutes === mins
                      ? 'bg-blue-600 text-white border-blue-700 shadow-2xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                  }`}
                >
                  {mins}m{mins === 2 ? ' (Test)' : ''}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="space-y-2 pt-1 border-t border-slate-100">
            <button
              onClick={handleExtend}
              className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Extend Session (+{timeoutMinutes}m)</span>
            </button>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  onTestWarning();
                  setIsExpanded(false);
                }}
                className="flex-1 py-1.5 px-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-[11px] font-bold rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer"
                title="Immediately triggers the 60-second warning countdown modal for demonstration"
              >
                <AlertTriangle className="w-3 h-3 text-amber-600" />
                <span>Test 60s Warning</span>
              </button>

              <button
                onClick={onLogout}
                className="py-1.5 px-3 bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-slate-200 text-[11px] font-bold rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer"
              >
                <LogOut className="w-3 h-3" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>

        </div>
      )}

      {/* Floating Pill (Always Visible) */}
      <div className={`flex items-center gap-1.5 p-1 rounded-2xl shadow-xl border backdrop-blur-md transition-all ${
        isCritical
          ? 'bg-rose-50/95 border-rose-300 ring-2 ring-rose-400 text-rose-950 animate-pulse'
          : isUrgent
          ? 'bg-amber-50/95 border-amber-300 text-amber-950'
          : 'bg-white/95 border-slate-200 text-slate-800'
      }`}>
        
        {/* Click to open details panel */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 px-2.5 py-1 rounded-xl hover:bg-black/5 transition-colors cursor-pointer"
          title="Click to view automatic session logout options"
        >
          {/* Status Dot */}
          <span className="relative flex h-2.5 w-2.5">
            {isCritical ? (
              <>
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-600"></span>
              </>
            ) : isUrgent ? (
              <>
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
              </>
            ) : (
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            )}
          </span>

          <Timer className={`w-3.5 h-3.5 ${isCritical ? 'text-rose-600' : isUrgent ? 'text-amber-600' : 'text-blue-600'}`} />
          
          <span className="text-[11px] font-medium text-slate-500 hidden sm:inline">
            Auto-Logout:
          </span>

          {/* Live countdown timer */}
          <span className={`font-mono font-bold text-xs tracking-tight ${
            isCritical ? 'text-rose-700' : isUrgent ? 'text-amber-800' : 'text-slate-900'
          }`}>
            {formatTime(sessionRemainingSeconds)}
          </span>

          {isExpanded ? (
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          ) : (
            <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
          )}
        </button>

        {/* Quick inline "Extend" button */}
        <button
          onClick={handleExtend}
          className="px-2 py-1 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-[11px] font-bold shadow-2xs transition-colors flex items-center gap-1 cursor-pointer"
          title={`Reset session timer to ${timeoutMinutes}:00`}
        >
          <RotateCcw className="w-2.5 h-2.5" />
          <span>Extend</span>
        </button>
      </div>

    </aside>
  );
};
