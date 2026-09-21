import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { Card } from '../types';
import { CardVisualizer } from '../components/common/CardVisualizer';
import { StatusBadge } from '../components/common/StatusBadge';
import { CreditCard, Lock, Unlock, Key, Wallet, AlertCircle, X, Search, UserCheck, PlusCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export const CardsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [activeModal, setActiveModal] = useState<'block' | 'unblock' | 'pin' | 'link' | null>(null);

  const [pinInput, setPinInput] = useState('');
  const [reasonInput, setReasonInput] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [actionError, setActionError] = useState<string | null>(null);

  const { data: cards, isLoading } = useQuery({
    queryKey: ['cards'],
    queryFn: () => api.getCards(),
  });

  const { data: customerData } = useQuery({
    queryKey: ['customersListForLinking'],
    queryFn: () => api.getCustomers({ page: 1, pageSize: 100 }),
    enabled: activeModal === 'link',
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

      {/* Main Table */}
      <div className="neo-card overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-primary" />
            <span>Card Inventory List ({cards?.length || 0})</span>
          </h2>
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
                    No cards found. Submit your first prepaid card request to start.
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
