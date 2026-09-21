import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  PlusCircle,
  Wallet,
  Receipt,
  ShieldAlert,
  Sparkles,
  X,
} from 'lucide-react';

const navItems = [
  { path: '/', label: 'Overview', icon: LayoutDashboard },
  { path: '/customers', label: 'Customers', icon: Users },
  { path: '/cards', label: 'Card Inventory', icon: CreditCard },
  { path: '/cards/issue', label: 'Prepaid Card Requests', icon: PlusCircle },
  { path: '/funding', label: 'Card Funding', icon: Wallet },
  { path: '/transactions', label: 'Transactions', icon: Receipt },
  { path: '/audit', label: 'Audit & FIP Logs', icon: ShieldAlert },
];

interface SidebarProps {
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onCloseMobile }) => {
  return (
    <aside className="w-64 h-screen border-r border-border bg-card flex flex-col justify-between shrink-0 overflow-hidden select-none">
      {/* Brand Header */}
      <div className="h-16 border-b border-border px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-amber-500 flex items-center justify-center text-white font-black font-mono shadow-md shadow-indigo-500/20">
            L
          </div>
          <div>
            <h1 className="font-extrabold text-base tracking-tight text-foreground flex items-center gap-1">
              <span className="text-primary font-mono font-black">Lumina</span>
              <span className="text-amber-500 font-extrabold">Pay</span>
            </h1>
            <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
              Digital Banking
            </p>
          </div>
        </div>

        {/* Close button for mobile drawer */}
        {onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 rounded-lg text-muted-foreground hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation Section (Scrollable if viewport is short) */}
      <nav className="p-4 space-y-1.5 flex-1 overflow-y-auto custom-scrollbar">
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-3 mb-2">
          Main Platform
        </p>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end
              onClick={onCloseMobile}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-md shadow-primary/25 font-bold'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/80'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="p-4 border-t border-border bg-muted/40 shrink-0">
        <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
          <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
          <div className="truncate">
            <p className="font-semibold text-foreground text-[11px] truncate">Providus FIP Partner</p>
            <p className="text-[10px] font-mono text-muted-foreground">LuminaPay v2.0</p>
          </div>
        </div>
      </div>
    </aside>
  );
};
