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
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-xs text-[11px] font-mono font-medium bg-amber-50 text-amber-900 border border-amber-200/80">
        <AlertTriangle className="w-3 h-3 text-amber-600" />
        <span>Temsili Demo</span>
      </span>
    );
  }

  if (status === 'verified') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-xs text-[11px] font-mono font-semibold bg-forest-50 text-forest-800 border border-forest-200">
        <ShieldCheck className="w-3 h-3 text-forest-600" />
        <span>Doğrulanmış</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-xs text-[11px] font-mono font-medium bg-slate-100 text-slate-700 border border-slate-200">
      <HelpCircle className="w-3 h-3 text-slate-400" />
      <span>Doğrulanmamış</span>
    </span>
  );
};
