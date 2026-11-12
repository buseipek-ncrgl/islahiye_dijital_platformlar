import React from 'react';
import { VerificationStatus } from '../../../types';
import { ShieldCheck, HelpCircle, AlertTriangle } from 'lucide-react';

interface VerificationBadgeProps {
  status: VerificationStatus;
  isDemo?: boolean;
}

export const VerificationBadge: React.FC<VerificationBadgeProps> = ({ status, isDemo }) => {
  if (isDemo || status === 'simulated') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-sans font-medium bg-amber-50 text-amber-900 border border-amber-200 shadow-2xs">
        <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
        <span>Ön İnceleme</span>
      </span>
    );
  }

  if (status === 'verified') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-sans font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
        <span>Doğrulanmış</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-sans font-medium bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs">
      <HelpCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
      <span>Doğrulanmamış</span>
    </span>
  );
};
