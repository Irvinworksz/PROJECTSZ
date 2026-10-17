import React from 'react';
import { Check, X, Shield, ShieldCheck, ShieldAlert } from 'lucide-react';

interface PasswordStrengthMeterProps {
  password: string;
  confirmPassword?: string;
  showRequirementsList?: boolean;
}

export interface PasswordAnalysis {
  score: number; // 0 to 5
  percent: number; // 0 to 100
  label: string;
  colorClass: string;
  barColorClass: string;
  textColorClass: string;
  isCompliant: boolean;
  rules: {
    length: boolean;
    uppercase: boolean;
    lowercase: boolean;
    number: boolean;
    special: boolean;
    match?: boolean;
  };
}

export function evaluatePassword(password: string, confirmPassword?: string): PasswordAnalysis {
  if (!password) {
    return {
      score: 0,
      percent: 0,
      label: 'Enter password',
      colorClass: 'bg-slate-200',
      barColorClass: 'bg-slate-300',
      textColorClass: 'text-slate-400',
      isCompliant: false,
      rules: {
        length: false,
        uppercase: false,
        lowercase: false,
        number: false,
        special: false,
        match: confirmPassword !== undefined ? false : undefined
      }
    };
  }

  const length = password.length >= 8;
  const uppercase = /[A-Z]/.test(password);
  const lowercase = /[a-z]/.test(password);
  const number = /[0-9]/.test(password);
  const special = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password);
  const match = confirmPassword !== undefined ? (confirmPassword.length > 0 && password === confirmPassword) : undefined;

  let score = 0;
  if (length) score += 1;
  if (uppercase) score += 1;
  if (lowercase) score += 1;
  if (number) score += 1;
  if (special) score += 1;

  // Bonus for longer length
  if (password.length >= 12 && score === 5) {
    // Top tier
  }

  let label = 'Very Weak';
  let barColorClass = 'bg-rose-500';
  let textColorClass = 'text-rose-600';

  if (score === 1) {
    label = 'Weak';
    barColorClass = 'bg-rose-500';
    textColorClass = 'text-rose-600';
  } else if (score === 2) {
    label = 'Fair';
    barColorClass = 'bg-amber-500';
    textColorClass = 'text-amber-600';
  } else if (score === 3) {
    label = 'Moderate';
    barColorClass = 'bg-amber-500';
    textColorClass = 'text-amber-600';
  } else if (score === 4) {
    label = 'Strong';
    barColorClass = 'bg-blue-600';
    textColorClass = 'text-blue-600';
  } else if (score === 5) {
    label = 'Very Strong • IAS Compliant';
    barColorClass = 'bg-emerald-600';
    textColorClass = 'text-emerald-600';
  }

  const percent = Math.min(100, Math.round((score / 5) * 100));
  // IAS Compliant requires at least 8 chars + 1 special symbol
  const isCompliant = length && special;

  return {
    score,
    percent,
    label,
    colorClass: barColorClass,
    barColorClass,
    textColorClass,
    isCompliant,
    rules: {
      length,
      uppercase,
      lowercase,
      number,
      special,
      match
    }
  };
}

export const PasswordStrengthMeter: React.FC<PasswordStrengthMeterProps> = ({
  password,
  confirmPassword,
  showRequirementsList = true
}) => {
  const analysis = evaluatePassword(password, confirmPassword);
  const segments = [1, 2, 3, 4, 5];

  if (!password) {
    return null;
  }

  return (
    <div className="space-y-2 pt-1">
      {/* Header with Strength Label and Score */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
          {analysis.isCompliant ? (
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          ) : (
            <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
          )}
          <span>Password Strength:</span>
        </span>
        <div className="flex items-center gap-1.5">
          <span className={`text-[11px] font-bold ${analysis.textColorClass}`}>
            {analysis.label}
          </span>
          <span className="text-[10px] text-slate-500 font-mono font-medium">
            ({analysis.percent}%)
          </span>
        </div>
      </div>

      {/* Visual Multi-Segment Progress Bar */}
      <div className="grid grid-cols-5 gap-1.5 h-1.5 w-full">
        {segments.map((step) => {
          const isFilled = analysis.score >= step;
          return (
            <div
              key={step}
              className={`h-full rounded-full transition-all duration-300 ${
                isFilled ? analysis.barColorClass : 'bg-slate-200'
              }`}
            />
          );
        })}
      </div>

      {/* Live Requirement Checklist */}
      {showRequirementsList && (
        <div className="pt-1 text-[11px] space-y-1">
          <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-slate-600">
            <div className={`flex items-center gap-1.5 ${analysis.rules.length ? 'text-emerald-700 font-semibold' : 'text-slate-500'}`}>
              {analysis.rules.length ? (
                <Check className="w-3 h-3 text-emerald-600 shrink-0" />
              ) : (
                <span className="w-1.5 h-1.5 rounded-full bg-slate-300 ml-1 mr-0.5 shrink-0" />
              )}
              <span>Min. 8 characters ({password.length}/8)</span>
            </div>

            <div className={`flex items-center gap-1.5 ${analysis.rules.special ? 'text-emerald-700 font-semibold' : 'text-slate-500'}`}>
              {analysis.rules.special ? (
                <Check className="w-3 h-3 text-emerald-600 shrink-0" />
              ) : (
                <span className="w-1.5 h-1.5 rounded-full bg-slate-300 ml-1 mr-0.5 shrink-0" />
              )}
              <span>Special symbol (!@#$)</span>
            </div>

            <div className={`flex items-center gap-1.5 ${analysis.rules.uppercase && analysis.rules.lowercase ? 'text-emerald-700 font-semibold' : 'text-slate-500'}`}>
              {analysis.rules.uppercase && analysis.rules.lowercase ? (
                <Check className="w-3 h-3 text-emerald-600 shrink-0" />
              ) : (
                <span className="w-1.5 h-1.5 rounded-full bg-slate-300 ml-1 mr-0.5 shrink-0" />
              )}
              <span>Upper & lower case</span>
            </div>

            <div className={`flex items-center gap-1.5 ${analysis.rules.number ? 'text-emerald-700 font-semibold' : 'text-slate-500'}`}>
              {analysis.rules.number ? (
                <Check className="w-3 h-3 text-emerald-600 shrink-0" />
              ) : (
                <span className="w-1.5 h-1.5 rounded-full bg-slate-300 ml-1 mr-0.5 shrink-0" />
              )}
              <span>Numbers (0-9)</span>
            </div>
          </div>

          {confirmPassword !== undefined && confirmPassword.length > 0 && (
            <div className={`flex items-center gap-1.5 pt-0.5 border-t border-slate-100 ${analysis.rules.match ? 'text-emerald-700 font-semibold' : 'text-rose-600 font-semibold'}`}>
              {analysis.rules.match ? (
                <Check className="w-3 h-3 text-emerald-600 shrink-0" />
              ) : (
                <X className="w-3 h-3 text-rose-500 shrink-0" />
              )}
              <span>{analysis.rules.match ? 'Passwords match' : 'Passwords do not match'}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
