import React from 'react';

interface StatusBadgeProps {
  status: string | number;
  type?: 'card' | 'transaction' | 'generic';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, type = 'generic' }) => {
  const strStatus = String(status).toUpperCase();

  let bgClass = 'bg-muted text-muted-foreground border-muted';
  let dotClass = 'bg-muted-foreground';

  if (strStatus === 'ACTIVE' || strStatus === '00' || strStatus === 'SUCCESS' || strStatus === 'TRUE') {
    bgClass = 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
    dotClass = 'bg-emerald-500';
  } else if (strStatus === 'BLOCKED' || strStatus === '01' || strStatus === 'FAILED' || strStatus === 'FALSE') {
    bgClass = 'bg-rose-500/10 text-rose-500 border-rose-500/20';
    dotClass = 'bg-rose-500';
  } else if (strStatus === 'PENDING' || strStatus === 'PROCESSING') {
    bgClass = 'bg-amber-500/10 text-amber-500 border-amber-500/20';
    dotClass = 'bg-amber-500';
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${bgClass}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotClass}`} />
      {strStatus}
    </span>
  );
};
