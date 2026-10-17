import React from 'react';
import { CheckCircle2, Clock, FileCheck, ShieldAlert, Award, UserCheck } from 'lucide-react';
import type { RequestStatus } from '../types';

interface StatusPipelineProps {
  status: RequestStatus;
  submittedAt?: string;
  reviewedAt?: string;
  signedAt?: string;
  issuedAt?: string;
  rejectionReason?: string;
}

export const StatusPipeline: React.FC<StatusPipelineProps> = ({
  status,
  submittedAt,
  reviewedAt,
  signedAt,
  issuedAt,
  rejectionReason
}) => {
  const steps = [
    {
      id: 'submitted',
      label: 'Submitted',
      desc: 'Application received & logged',
      icon: Clock,
      date: submittedAt
    },
    {
      id: 'under_review',
      label: 'Under Review',
      desc: 'ID check & records verification',
      icon: UserCheck,
      date: reviewedAt
    },
    {
      id: 'for_signature',
      label: 'For Signature',
      desc: 'Punong Barangay digital seal',
      icon: Award,
      date: signedAt
    },
    {
      id: 'ready_for_collection',
      label: 'Ready for Collection',
      desc: 'Signed & verifiable with QR',
      icon: FileCheck,
      date: issuedAt || signedAt
    }
  ];

  const getStepIndex = (s: RequestStatus): number => {
    switch (s) {
      case 'submitted': return 0;
      case 'under_review': return 1;
      case 'for_signature': return 2;
      case 'ready_for_collection': return 3;
      case 'issued': return 3;
      case 'rejected': return -1;
      default: return 0;
    }
  };

  const currentIndex = getStepIndex(status);
  const isRejected = status === 'rejected';

  if (isRejected) {
    return (
      <div id="pipeline-rejected-banner" className="p-4 bg-rose-50 border border-rose-200 rounded-xl">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-rose-100 rounded-lg text-rose-700 mt-0.5">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-rose-900">Application Returned / Rejected</h4>
            <p className="text-xs text-rose-800 mt-1 font-medium">
              Reason: {rejectionReason || 'Incomplete identity credentials or conflicting records.'}
            </p>
            <p className="text-xs text-rose-700 mt-2">
              Please review the feedback above or visit the Barangay Hall Desk for resolution.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="pipeline-progress-container" className="py-3">
      <div className="relative flex items-center justify-between">
        {/* Connection line background */}
        <div className="absolute left-6 right-6 top-5 h-1 bg-slate-200 -z-0" />
        {/* Active connection line */}
        <div
          className="absolute left-6 top-5 h-1 bg-blue-600 transition-all duration-500 -z-0 shadow-xs"
          style={{ width: `${Math.min(100, Math.max(0, (currentIndex / (steps.length - 1)) * 100))}%` }}
        />

        {steps.map((step, idx) => {
          const isPassed = idx < currentIndex || (idx === currentIndex && status === 'issued');
          const isCurrent = idx === currentIndex && status !== 'issued';
          const Icon = step.icon;

          return (
            <div key={step.id} className="flex flex-col items-center text-center relative z-10 max-w-[100px] sm:max-w-[120px]">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 shadow-sm ${
                  isPassed
                    ? 'bg-blue-600 border-blue-700 text-white shadow-blue-200'
                    : isCurrent
                    ? 'bg-amber-500 border-amber-600 text-white ring-4 ring-amber-100 animate-pulse shadow-amber-200'
                    : 'bg-white border-slate-300 text-slate-400'
                }`}
              >
                {isPassed ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
              </div>

              <span className={`text-xs font-bold mt-2 ${isCurrent ? 'text-amber-800' : isPassed ? 'text-slate-900' : 'text-slate-500'}`}>
                {step.label}
              </span>
              <span className="text-[10px] text-slate-600 leading-tight mt-0.5 hidden sm:block font-medium">
                {step.desc}
              </span>
              {step.date && (
                <span className="text-[9px] font-mono text-slate-500 mt-1 font-semibold">
                  {new Date(step.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
