import React from 'react';
import { CheckCircle2, Circle, CircleDot, Lock, ShieldCheck } from 'lucide-react';
import { WorkpaperStatus } from '../../types/atlas';

export const WorkpaperStatusIcon: React.FC<{ status: WorkpaperStatus; className?: string }> = ({
  status,
  className = 'w-3.5 h-3.5 shrink-0',
}) => {
  switch (status) {
    case 'Kosong':
      return <Circle className={`${className} text-slate-400`} aria-label="Kosong" />;
    case 'Draft':
      return <CircleDot className={`${className} text-amber-600`} aria-label="Draft" />;
    case 'Prepared':
      return <CheckCircle2 className={`${className} text-blue-600`} aria-label="Prepared" />;
    case 'Reviewed':
      return <ShieldCheck className={`${className} text-sky-600`} aria-label="Reviewed" />;
    case 'Locked':
      return <Lock className={`${className} text-emerald-600`} aria-label="Locked" />;
  }
};

export const WorkpaperStatusBadge: React.FC<{ status: WorkpaperStatus }> = ({ status }) => {
  const styles: Record<WorkpaperStatus, string> = {
    Kosong: 'bg-slate-100 text-slate-700 border-slate-300',
    Draft: 'bg-amber-100 text-amber-800 border-amber-300',
    Prepared: 'bg-blue-100 text-blue-800 border-blue-300',
    Reviewed: 'bg-sky-100 text-sky-800 border-sky-300',
    Locked: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold rounded border whitespace-nowrap ${styles[status]}`}
    >
      <WorkpaperStatusIcon status={status} className="w-3 h-3" />
      {status === 'Locked' ? 'Partner Locked' : status}
    </span>
  );
};
