import React, { useState } from 'react';
import { ThemeToggle } from '../common/ThemeToggle';
import { SearchModal } from '../common/SearchModal';
import { Search, Menu } from 'lucide-react';

interface HeaderProps {
  onOpenMobileMenu?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenMobileMenu }) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  return (
    <>
      <header className="h-16 border-b border-border bg-card/85 backdrop-blur-md shrink-0 px-4 md:px-6 flex items-center justify-between min-w-0">
        {/* Left Side: Mobile Menu Button & Search Trigger */}
        <div className="flex items-center gap-2 md:gap-4 min-w-0">
          {onOpenMobileMenu && (
            <button
              onClick={onOpenMobileMenu}
              className="lg:hidden p-2 rounded-xl border border-border bg-muted/60 text-foreground hover:bg-muted"
              title="Open Navigation Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          <button
            onClick={() => setIsSearchOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-muted/70 text-muted-foreground hover:text-foreground border border-border text-xs transition-colors truncate max-w-[160px] sm:max-w-xs"
          >
            <Search className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Search...</span>
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-background border border-border rounded text-muted-foreground ml-2">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Right Controls: Gateway Status & Theme Toggle */}
        <div className="flex items-center gap-2.5 sm:gap-4 shrink-0">
          {/* Live Providus Gateway Status Pill */}
          <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-semibold">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="hidden sm:inline">Gateway:</span>
            <span className="font-mono text-[10px] sm:text-[11px] font-bold">ONLINE</span>
          </div>

          <ThemeToggle />

          {/* User Avatar */}
          <div className="flex items-center gap-2 border-l border-border pl-2 sm:pl-4">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-amber-500 text-white flex items-center justify-center font-extrabold text-xs shadow-md shrink-0">
              LP
            </div>
            <div className="hidden lg:block text-left">
              <p className="text-xs font-bold leading-none text-foreground">Lumina Admin</p>
              <p className="text-[10px] font-mono text-muted-foreground">Partner #4092</p>
            </div>
          </div>
        </div>
      </header>

      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
};
