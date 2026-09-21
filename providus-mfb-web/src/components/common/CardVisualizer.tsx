import React from 'react';
import { Card } from '../../types';
import { StatusBadge } from './StatusBadge';
import { Cpu, Wifi } from 'lucide-react';

interface CardVisualizerProps {
  card: Card;
  skin?: 'indigo' | 'obsidian' | 'amber';
  onAction?: (action: 'fund' | 'unfund' | 'block' | 'unblock' | 'pin') => void;
}

export const CardVisualizer: React.FC<CardVisualizerProps> = ({
  card,
  skin = 'indigo',
}) => {
  const formatNaira = (kobo: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(kobo / 100);
  };

  const getSkinBg = () => {
    switch (skin) {
      case 'indigo':
        return 'bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 border-indigo-500/40 shadow-indigo-950/50';
      case 'amber':
        return 'bg-gradient-to-br from-slate-950 via-amber-950/60 to-zinc-900 border-amber-500/40 shadow-amber-950/50';
      default:
        return 'bg-gradient-to-br from-slate-950 via-slate-900 to-black border-slate-700/60';
    }
  };

  return (
    <div className={`relative group w-full max-w-sm rounded-2xl p-6 text-white shadow-2xl border overflow-hidden transition-all duration-300 hover:scale-[1.02] font-sans ${getSkinBg()}`}>
      {/* Decorative Glow Elements */}
      <div className="absolute -right-10 -bottom-10 w-44 h-44 rounded-full bg-primary/20 blur-3xl pointer-events-none" />
      <div className="absolute -left-10 -top-10 w-36 h-36 rounded-full bg-amber-500/10 blur-2xl pointer-events-none" />

      {/* Card Header */}
      <div className="relative z-10 flex justify-between items-start mb-6">
        <div>
          <h3 className="text-lg font-extrabold tracking-tight text-white flex items-center gap-1">
            <span className="text-indigo-400 font-mono font-black text-xl">Lumina</span>
            <span className="text-amber-400 font-extrabold text-xl">Pay</span>
          </h3>
          <p className="text-[10px] text-slate-400 font-mono uppercase tracking-widest">Prepaid Card</p>
        </div>
        <StatusBadge status={card.status} type="card" />
      </div>

      {/* Chip & Contactless Icons */}
      <div className="relative z-10 flex items-center justify-between mb-6">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-7 rounded-md bg-gradient-to-tr from-amber-400 to-amber-300 border border-amber-200 flex items-center justify-center shadow-inner">
            <Cpu className="w-6 h-6 text-amber-950" />
          </div>
          <Wifi className="w-5 h-5 text-slate-300 rotate-90" />
        </div>
        <span className="text-[11px] font-mono text-slate-400 tracking-wider">ID: #{card.providusCardId}</span>
      </div>

      {/* Masked PAN */}
      <div className="relative z-10 mb-5">
        <p className="font-mono text-lg tracking-widest text-white font-semibold drop-shadow-sm">
          {card.maskedPan}
        </p>
      </div>

      {/* Footer Info & Balance */}
      <div className="relative z-10 flex justify-between items-end pt-3 border-t border-white/10">
        <div>
          <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Cardholder</p>
          <p className="text-xs font-bold text-white tracking-wide truncate max-w-[150px]">
            {card.nameOnCard}
          </p>
        </div>

        <div className="text-right">
          <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Balance</p>
          <p className="text-base font-mono font-bold text-emerald-400 drop-shadow-sm">
            {formatNaira(card.balance)}
          </p>
        </div>
      </div>
    </div>
  );
};
