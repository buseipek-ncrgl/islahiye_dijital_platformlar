import React from 'react';
import { PublicationStatus } from '../../../types';
import { CheckCircle2, Clock, FileEdit, Archive } from 'lucide-react';

interface StatusBadgeProps {
  status: PublicationStatus;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  switch (status) {
    case 'published':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-xs text-[11px] font-mono font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          <span>Yayında</span>
        </span>
      );
    case 'in_review':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-xs text-[11px] font-mono font-semibold bg-blue-50 text-blue-800 border border-blue-200">
          <Clock className="w-3 h-3 text-blue-600" />
          <span>İncelemede</span>
        </span>
      );
    case 'draft':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-xs text-[11px] font-mono font-semibold bg-amber-50 text-amber-800 border border-amber-200">
          <FileEdit className="w-3 h-3 text-amber-600" />
          <span>Taslak</span>
        </span>
      );
    case 'archived':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-xs text-[11px] font-mono font-semibold bg-slate-100 text-slate-700 border border-slate-200">
          <Archive className="w-3 h-3 text-slate-500" />
          <span>Arşivde</span>
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-xs text-[11px] font-mono font-medium bg-slate-100 text-slate-600">
          <span>{status}</span>
        </span>
      );
  }
};
