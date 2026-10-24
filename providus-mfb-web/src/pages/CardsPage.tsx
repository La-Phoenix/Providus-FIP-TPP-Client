import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { Card } from '../types';
import { CardVisualizer } from '../components/common/CardVisualizer';
import { StatusBadge } from '../components/common/StatusBadge';
import { CreditCard, Lock, Unlock, Key, Wallet, AlertCircle, X, Search, UserCheck, PlusCircle, Filter, RotateCcw, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';

export const CardsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [activeModal, setActiveModal] = useState<'block' | 'unblock' | 'pin' | 'link' | null>(null);

  const [pinInput, setPinInput] = useState('');
  const [reasonInput, setReasonInput] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [actionError, setActionError] = useState<string | null>(null);

  // Providus FIP Card Filters (GET /api/v1/cards)
  const [filterPan, setFilterPan] = useState('');
  const [filterName, setFilterName] = useState('');
  const [filterCustomerId, setFilterCustomerId] = useState('');
  const [useCustomerSelect, setUseCustomerSelect] = useState(true);
  const [appliedFilters, setAppliedFilters] = useState<{
    customerId?: string;
    maskedPan?: string;
    nameOnCard?: string;
  }>({});

  const { data: cards, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['cards', appliedFilters],
    queryFn: () => api.getCards(appliedFilters),
  });

  const { data: customerData } = useQuery({
    queryKey: ['customersListForDropdown'],
    queryFn: () => api.getCustomers({ page: 1, pageSize: 100 }),
  });

  const blockMutation = useMutation({
    mutationFn: (id: string) => api.blockCard(id, reasonInput),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cards'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
      closeModals();
    },
    onError: (err: any) => setActionError(err.message || 'Block card failed'),
  });

  const unblockMutation = useMutation({
    mutationFn: (id: string) => api.unblockCard(id, reasonInput),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cards'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
      closeModals();
    },
    onError: (err: any) => setActionError(err.message || 'Unblock card failed'),
  });

  const pinMutation = useMutation({
    mutationFn: ({ id, pin }: { id: string; pin: string }) => api.setCardPin(id, pin),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cards'] });
      closeModals();
    },
    onError: (err: any) => setActionError(err.message || 'Set PIN failed'),
  });

  const linkCardMutation = useMutation({
    mutationFn: ({ customerId, cardId }: { customerId: string; cardId: string }) =>
      api.addCard({ customerId, cardId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cards'] });
      closeModals();
    },
    onError: (err: any) => setActionError(err.message || 'Card linking failed'),
  });

  const closeModals = () => {
    setActiveModal(null);
    setSelectedCard(null);
    setPinInput('');
    setReasonInput('');
    setSelectedCustomerId('');
    setActionError(null);
  };

  const handleBlockConfirm = () => {
    if (selectedCard) blockMutation.mutate(selectedCard.id);
  };

  const handleUnblockConfirm = () => {
    if (selectedCard) unblockMutation.mutate(selectedCard.id);
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCard || pinInput.length !== 4) {
      setActionError('PIN must be exactly 4 digits.');
      return;
    }
    pinMutation.mutate({ id: selectedCard.id, pin: pinInput });
  };

  const handleLinkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCard || !selectedCustomerId) {
      setActionError('Please select a customer to link.');
      return;
    }
    linkCardMutation.mutate({ customerId: selectedCustomerId, cardId: selectedCard.id });
  };

  const handleApplyFilters = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const filters: { customerId?: string; maskedPan?: string; nameOnCard?: string } = {};
    if (filterPan.trim()) filters.maskedPan = filterPan.trim();
    if (filterName.trim()) filters.nameOnCard = filterName.trim();
    if (filterCustomerId.trim()) filters.customerId = filterCustomerId.trim();
    setAppliedFilters(filters);
  };

  const handleResetFilters = () => {
    setFilterPan('');
    setFilterName('');
    setFilterCustomerId('');
    setAppliedFilters({});
  };

  const hasActiveFilters = Boolean(
    appliedFilters.maskedPan || appliedFilters.nameOnCard || appliedFilters.customerId
  );

  const formatNaira = (kobo: number) => {
    return '₦' + (kobo / 100).toLocaleString('en-NG', { minimumFractionDigits: 2 });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
            Card Inventory
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Manage Providus prepaid cards, card status, PINs, and customer assignments
          </p>
        </div>

        <Link
          to="/cards/issue"
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-md shadow-primary/20 hover:opacity-90 transition-opacity self-start"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Prepaid Card Requests</span>
        </Link>
      </div>

      {/* Visual Cards Grid */}
      {cards && cards.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xs font-extrabold tracking-wider uppercase text-muted-foreground">
            Active Card Showcase
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cards.slice(0, 3).map((card) => (
              <div key={card.id} className="space-y-3">
                <CardVisualizer card={card} />
                <div className="flex items-center justify-between text-xs px-1">
                  <span className="font-mono text-muted-foreground">{card.providusCardId}</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => { setSelectedCard(card); setActiveModal('link'); }}
                      className="px-2 py-1 rounded-md bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 text-[11px] font-semibold flex items-center gap-1"
                    >
                      <UserCheck className="w-3 h-3" /> Link Customer
                    </button>
                    <Link
                      to={`/funding?cardId=${card.id}`}
                      className="px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 text-[11px] font-semibold flex items-center gap-1"
                    >
                      <Wallet className="w-3 h-3" /> Fund
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Providus FIP Card Filters Section */}
      <div className="neo-card p-5 space-y-4 border border-border bg-card/60 backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 pb-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-primary" />
            <span className="text-xs font-bold uppercase tracking-wider text-foreground">
              CardInfra / Providus FIP Filters
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-primary/10 text-primary border border-primary/20">
              GET /api/v1/cards
            </span>
          </div>
          <div className="flex items-center gap-3">
            {isFetching && (
              <span className="text-[11px] text-muted-foreground animate-pulse flex items-center gap-1.5">
                <RefreshCw className="w-3 h-3 animate-spin text-primary" /> Syncing with FIP...
              </span>
            )}
            <button
              type="button"
              onClick={() => refetch()}
              className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
              title="Refresh cards directly from Providus FIP"
            >
              <RefreshCw className="w-3 h-3" /> Refresh
            </button>
          </div>
        </div>

        <form onSubmit={handleApplyFilters} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Masked PAN Filter */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-muted-foreground" />
                <span>Masked PAN</span>
              </label>
              <input
                type="text"
                value={filterPan}
                onChange={(e) => setFilterPan(e.target.value)}
                placeholder="e.g. 506142xxxxxxxxx5671"
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground font-mono"
              />
            </div>

            {/* Name On Card Filter */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1.5">
                <Search className="w-3.5 h-3.5 text-muted-foreground" />
                <span>Name on Card</span>
              </label>
              <input
                type="text"
                value={filterName}
                onChange={(e) => setFilterName(e.target.value)}
                placeholder="e.g. lp2139456 or Cardholder Name"
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground"
              />
            </div>

            {/* Customer Filter */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>Customer ID</span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setUseCustomerSelect(!useCustomerSelect);
                    setFilterCustomerId('');
                  }}
                  className="text-[10px] text-primary hover:underline font-medium"
                >
                  {useCustomerSelect ? 'Type Custom ID' : 'Select Customer'}
                </button>
              </div>
              {useCustomerSelect ? (
                <select
                  value={filterCustomerId}
                  onChange={(e) => setFilterCustomerId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary truncate"
                >
                  <option value="">All Customers (No customer filter)</option>
                  {customerData?.items.map((c) => (
                    <option key={c.id} value={c.providusCustomerId || c.id}>
                      {c.firstName} {c.lastName} ({c.providusCustomerId ? `FIP: ${c.providusCustomerId}` : `ID: ${c.id.substring(0, 8)}`})
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={filterCustomerId}
                  onChange={(e) => setFilterCustomerId(e.target.value)}
                  placeholder="e.g. Providus Customer ID or GUID"
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground font-mono"
                />
              )}
            </div>
          </div>

          {/* Action buttons & Active badges */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-border/40">
            <div className="flex items-center gap-2">
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-md shadow-primary/20 hover:opacity-90 transition-opacity"
              >
                <Filter className="w-3.5 h-3.5" />
                <span>Apply FIP Filter</span>
              </button>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground text-xs font-semibold transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Filters</span>
                </button>
              )}
            </div>

            {/* Active filter badges */}
            {hasActiveFilters && (
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="text-[11px] text-muted-foreground font-medium">Applied:</span>
                {appliedFilters.maskedPan && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary/10 text-primary font-mono text-[11px] border border-primary/20">
                    PAN: {appliedFilters.maskedPan}
                    <button
                      type="button"
                      onClick={() => {
                        const next = { ...appliedFilters };
                        delete next.maskedPan;
                        setFilterPan('');
                        setAppliedFilters(next);
                      }}
                      className="hover:text-foreground"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {appliedFilters.nameOnCard && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-[11px] border border-primary/20">
                    Name: {appliedFilters.nameOnCard}
                    <button
                      type="button"
                      onClick={() => {
                        const next = { ...appliedFilters };
                        delete next.nameOnCard;
                        setFilterName('');
                        setAppliedFilters(next);
                      }}
                      className="hover:text-foreground"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {appliedFilters.customerId && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary/10 text-primary font-mono text-[11px] border border-primary/20">
                    Cust: {appliedFilters.customerId}
                    <button
                      type="button"
                      onClick={() => {
                        const next = { ...appliedFilters };
                        delete next.customerId;
                        setFilterCustomerId('');
                        setAppliedFilters(next);
                      }}
                      className="hover:text-foreground"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
              </div>
            )}
          </div>
        </form>
      </div>

      {/* Main Table */}
      <div className="neo-card overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-primary" />
              <span>Card Inventory List ({cards?.length || 0})</span>
            </h2>
            {hasActiveFilters && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-primary/10 text-primary border border-primary/20">
                Filtered from FIP
              </span>
            )}
          </div>
          {isFetching && (
            <span className="text-[11px] text-muted-foreground animate-pulse flex items-center gap-1.5">
              <RefreshCw className="w-3 h-3 animate-spin text-primary" /> Syncing...
            </span>
          )}
        </div>

        <div className="overflow-auto max-h-[500px] w-full">
          <table className="w-full text-left text-xs min-w-[750px]">
            <thead className="bg-muted/90 backdrop-blur-sm border-b border-border text-muted-foreground font-semibold uppercase tracking-wider whitespace-nowrap sticky top-0 z-10">
              <tr>
                <th className="py-3.5 px-4">Providus Card ID</th>
                <th className="py-3.5 px-4">Name on Card</th>
                <th className="py-3.5 px-4">Masked PAN</th>
                <th className="py-3.5 px-4">Expiry</th>
                <th className="py-3.5 px-4">Balance</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border whitespace-nowrap">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-muted-foreground">
                    Loading cards...
                  </td>
                </tr>
              ) : cards?.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-muted-foreground">
                    {hasActiveFilters ? (
                      <div className="space-y-2">
                        <p>No cards found matching the specified Providus FIP filter criteria.</p>
                        <button
                          type="button"
                          onClick={handleResetFilters}
                          className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 font-semibold text-xs inline-flex items-center gap-1"
                        >
                          <RotateCcw className="w-3 h-3" /> Clear filters and show all cards
                        </button>
                      </div>
                    ) : (
                      'No cards found. Submit your first prepaid card request to start.'
                    )}
                  </td>
                </tr>
              ) : (
                cards?.map((card) => (
                  <tr key={card.id} className="hover:bg-muted/40 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-primary">{card.providusCardId}</td>
                    <td className="py-3 px-4 font-semibold text-foreground">{card.nameOnCard}</td>
                    <td className="py-3 px-4 font-mono text-foreground">{card.maskedPan}</td>
                    <td className="py-3 px-4 font-mono text-muted-foreground">{card.expiryDate}</td>
                    <td className="py-3 px-4 font-mono font-bold text-emerald-400">
                      {formatNaira(card.balance)}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={card.status} type="card" />
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      {card.customerId ? (
                        <Link
                          to={`/customers/${card.customerId}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 font-semibold text-[11px]"
                          title="View customer details and balances"
                        >
                          <UserCheck className="w-3 h-3" /> Account Details
                        </Link>
                      ) : (
                        <button
                          onClick={() => { setSelectedCard(card); setActiveModal('link'); }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 font-semibold text-[11px]"
                          title="Link card to an onboarded customer"
                        >
                          <UserCheck className="w-3 h-3" /> Link Customer
                        </button>
                      )}

                      <Link
                        to={`/funding?cardId=${card.id}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 font-semibold text-[11px]"
                      >
                        <Wallet className="w-3 h-3" /> Fund
                      </Link>

                      {card.status === 'Active' || card.status === '00' ? (
                        <button
                          onClick={() => { setSelectedCard(card); setActiveModal('block'); }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 font-semibold text-[11px]"
                        >
                          <Lock className="w-3 h-3" /> Block
                        </button>
                      ) : (
                        <button
                          onClick={() => { setSelectedCard(card); setActiveModal('unblock'); }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-500/10 text-sky-500 hover:bg-sky-500/20 font-semibold text-[11px]"
                        >
                          <Unlock className="w-3 h-3" /> Unblock
                        </button>
                      )}

                      <button
                        onClick={() => { setSelectedCard(card); setActiveModal('pin'); }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-muted text-foreground hover:bg-muted/80 font-semibold text-[11px]"
                      >
                        <Key className="w-3 h-3" /> Set PIN
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {activeModal && selectedCard && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border w-full max-w-md rounded-2xl shadow-2xl p-4 sm:p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto m-2 sm:m-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                {activeModal === 'link' && <UserCheck className="w-4 h-4 text-indigo-400" />}
                {activeModal === 'block' && <Lock className="w-4 h-4 text-rose-500" />}
                {activeModal === 'unblock' && <Unlock className="w-4 h-4 text-sky-500" />}
                {activeModal === 'pin' && <Key className="w-4 h-4 text-amber-500" />}
                <span className="capitalize">{activeModal === 'link' ? 'Link Card to Customer' : `${activeModal} Card`}</span>
              </h2>
              <button onClick={closeModals} className="p-1 rounded-lg text-muted-foreground hover:bg-muted">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-muted/60 border border-border text-xs font-mono space-y-1">
              <p><span className="text-muted-foreground">Providus Card ID:</span> <span className="text-primary font-bold">{selectedCard.providusCardId}</span></p>
              <p><span className="text-muted-foreground">Masked PAN:</span> {selectedCard.maskedPan}</p>
              <p><span className="text-muted-foreground">Cardholder:</span> {selectedCard.nameOnCard}</p>
            </div>

            {actionError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{actionError}</span>
              </div>
            )}

            {/* Link Card to Customer Modal */}
            {activeModal === 'link' && (
              <form onSubmit={handleLinkSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="font-semibold text-muted-foreground block mb-1">Select Customer *</label>
                  <select
                    required
                    value={selectedCustomerId}
                    onChange={(e) => setSelectedCustomerId(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-muted/60 border border-border focus:outline-none focus:border-indigo-500 text-foreground"
                  >
                    <option value="">-- Choose Customer --</option>
                    {customerData?.items.map((cust) => (
                      <option key={cust.id} value={cust.id}>
                        {cust.firstName} {cust.lastName} ({cust.providusCustomerId})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={closeModals} className="px-4 py-2 rounded-xl border border-border">Cancel</button>
                  <button
                    type="submit"
                    disabled={linkCardMutation.isPending}
                    className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-500 disabled:opacity-50"
                  >
                    {linkCardMutation.isPending ? 'Linking...' : 'Link Card'}
                  </button>
                </div>
              </form>
            )}

            {activeModal === 'block' && (
              <div className="space-y-4 text-xs">
                <p className="text-muted-foreground">
                  Are you sure you want to block this card? This will prevent authorization on Providus network until unblocked.
                </p>
                <div>
                  <label className="font-semibold text-muted-foreground block mb-1">Reason (Optional)</label>
                  <input
                    type="text"
                    value={reasonInput}
                    onChange={(e) => setReasonInput(e.target.value)}
                    placeholder="e.g. Lost card reported by user"
                    className="w-full p-2.5 rounded-xl bg-muted/60 border border-border focus:outline-none focus:border-rose-500 text-foreground"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button onClick={closeModals} className="px-4 py-2 rounded-xl border border-border">Cancel</button>
                  <button
                    onClick={handleBlockConfirm}
                    disabled={blockMutation.isPending}
                    className="px-4 py-2 rounded-xl bg-rose-600 text-white font-bold hover:bg-rose-700 disabled:opacity-50"
                  >
                    {blockMutation.isPending ? 'Blocking...' : 'Confirm Block'}
                  </button>
                </div>
              </div>
            )}

            {activeModal === 'unblock' && (
              <div className="space-y-4 text-xs">
                <p className="text-muted-foreground">
                  Confirm unblocking card #{selectedCard.providusCardId}. Card will return to ACTIVE status on Providus network.
                </p>
                <div className="flex justify-end gap-3 pt-2">
                  <button onClick={closeModals} className="px-4 py-2 rounded-xl border border-border">Cancel</button>
                  <button
                    onClick={handleUnblockConfirm}
                    disabled={unblockMutation.isPending}
                    className="px-4 py-2 rounded-xl bg-sky-600 text-white font-bold hover:bg-sky-700 disabled:opacity-50"
                  >
                    {unblockMutation.isPending ? 'Unblocking...' : 'Confirm Unblock'}
                  </button>
                </div>
              </div>
            )}

            {activeModal === 'pin' && (
              <form onSubmit={handlePinSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="font-semibold text-muted-foreground block mb-1">Enter New 4-Digit PIN *</label>
                  <input
                    type="password"
                    maxLength={4}
                    required
                    value={pinInput}
                    onChange={(e) => setPinInput(e.target.value)}
                    placeholder="••••"
                    className="w-full p-2.5 rounded-xl bg-muted/60 border border-border focus:outline-none focus:border-amber-500 font-mono text-center text-lg tracking-widest text-foreground"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={closeModals} className="px-4 py-2 rounded-xl border border-border">Cancel</button>
                  <button
                    type="submit"
                    disabled={pinMutation.isPending}
                    className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold hover:bg-amber-400 disabled:opacity-50"
                  >
                    {pinMutation.isPending ? 'Updating...' : 'Set PIN'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
