import React, { useState, useEffect } from 'react';
import { Search, X, User, CreditCard, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    navigate(`/cards?search=${encodeURIComponent(query)}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center pt-20 px-4">
      <div className="bg-card border border-border w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <form onSubmit={handleSearch} className="flex items-center gap-3 px-4 py-3.5 border-b border-border">
          <Search className="w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search customers, cards by PAN / Providus ID..."
            className="flex-1 bg-transparent text-sm focus:outline-none text-foreground placeholder:text-muted-foreground"
            autoFocus
          />
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-muted-foreground hover:bg-muted"
          >
            <X className="w-5 h-5" />
          </button>
        </form>

        <div className="p-4 space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2">
            Quick Navigation
          </p>
          <div className="space-y-1">
            <button
              onClick={() => { navigate('/customers'); onClose(); }}
              className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-muted text-left text-sm transition-colors"
            >
              <div className="flex items-center gap-2.5 text-foreground">
                <User className="w-4 h-4 text-primary" />
                <span>Customer Directory</span>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
            </button>
            <button
              onClick={() => { navigate('/cards'); onClose(); }}
              className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-muted text-left text-sm transition-colors"
            >
              <div className="flex items-center gap-2.5 text-foreground">
                <CreditCard className="w-4 h-4 text-emerald-500" />
                <span>Card Inventory</span>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
