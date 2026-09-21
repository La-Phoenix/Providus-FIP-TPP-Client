import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { Card } from '../types';
import { CardVisualizer } from '../components/common/CardVisualizer';
import { StatusBadge } from '../components/common/StatusBadge';
import {
  ArrowLeft,
  User,
  CreditCard,
  Wallet,
  ShieldCheck,
  Lock,
  Unlock,
  KeyRound,
  DollarSign,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Phone,
  Mail,
  Globe,
  MapPin,
  Calendar,
  X,
  PlusCircle,
  Eye,
} from 'lucide-react';

export const CustomerDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'cards' | 'funding' | 'transactions'>('cards');
  const [modalAction, setModalAction] = useState<{
    type: 'fund' | 'unfund' | 'pin' | 'block' | 'unblock';
    cardId: string;
    maskedPan: string;
  } | null>(null);

  const [amountInput, setAmountInput] = useState<string>('');
  const [pinInput, setPinInput] = useState<string>('');
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const { data: detail, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['customerDetail', id],
    queryFn: () => api.getCustomerDetails(id!),
    enabled: !!id,
  });

  const { data: fundingTransactions } = useQuery({
    queryKey: ['customerFundingTx', id],
    queryFn: () => api.getFundingTransactions({ customerId: id, page: 1, pageSize: 50 }),
    enabled: !!id,
  });

  const { data: cardTransactions } = useQuery({
    queryKey: ['customerCardTx', id],
    queryFn: () => api.getCardTransactions({ customerId: id, page: 1, pageSize: 50 }),
    enabled: !!id,
  });

  const fundMutation = useMutation({
    mutationFn: ({ cardId, amount }: { cardId: string; amount: number }) =>
      api.fundCard(cardId, { cardId, amount }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['customerDetail', id] });
      queryClient.invalidateQueries({ queryKey: ['customerFundingTx', id] });
      queryClient.invalidateQueries({ queryKey: ['cards'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
      const newBalFormatted =
        res.newBalance !== undefined
          ? ` (Updated Card Balance: ₦${(res.newBalance / 100).toLocaleString('en-NG', { minimumFractionDigits: 2 })})`
          : '';
      setActionSuccess(`Card fund load successful!${newBalFormatted}`);
      setModalAction(null);
      setAmountInput('');
    },
    onError: (err: Error) => {
      setActionError(err.message || 'Failed to load card');
    },
  });

  const unfundMutation = useMutation({
    mutationFn: ({ cardId, amount }: { cardId: string; amount: number }) =>
      api.unfundCard(cardId, { cardId, amount }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['customerDetail', id] });
      queryClient.invalidateQueries({ queryKey: ['customerFundingTx', id] });
      queryClient.invalidateQueries({ queryKey: ['cards'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
      const newBalFormatted =
        res.newBalance !== undefined
          ? ` (Updated Card Balance: ₦${(res.newBalance / 100).toLocaleString('en-NG', { minimumFractionDigits: 2 })})`
          : '';
      setActionSuccess(`Card fund unload successful!${newBalFormatted}`);
      setModalAction(null);
      setAmountInput('');
    },
    onError: (err: Error) => {
      setActionError(err.message || 'Failed to unload card');
    },
  });

  const blockMutation = useMutation({
    mutationFn: (cardId: string) => api.blockCard(cardId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customerDetail', id] });
      queryClient.invalidateQueries({ queryKey: ['cards'] });
      setActionSuccess('Card blocked successfully');
      setModalAction(null);
    },
    onError: (err: Error) => {
      setActionError(err.message || 'Failed to block card');
    },
  });

  const unblockMutation = useMutation({
    mutationFn: (cardId: string) => api.unblockCard(cardId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customerDetail', id] });
      queryClient.invalidateQueries({ queryKey: ['cards'] });
      setActionSuccess('Card unblocked successfully');
      setModalAction(null);
    },
    onError: (err: Error) => {
      setActionError(err.message || 'Failed to unblock card');
    },
  });

  const pinMutation = useMutation({
    mutationFn: ({ cardId, pin }: { cardId: string; pin: string }) =>
      api.setCardPin(cardId, pin),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customerDetail', id] });
      setActionSuccess('Card PIN updated successfully');
      setModalAction(null);
      setPinInput('');
    },
    onError: (err: Error) => {
      setActionError(err.message || 'Failed to set PIN');
    },
  });

  const handleActionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    setActionSuccess(null);

    if (!modalAction) return;

    if (modalAction.type === 'fund' || modalAction.type === 'unfund') {
      const amt = parseFloat(amountInput);
      if (isNaN(amt) || amt <= 0) {
        setActionError('Please enter a valid positive amount.');
        return;
      }
      if (modalAction.type === 'fund') {
        fundMutation.mutate({ cardId: modalAction.cardId, amount: amt });
      } else {
        unfundMutation.mutate({ cardId: modalAction.cardId, amount: amt });
      }
    } else if (modalAction.type === 'pin') {
      if (!/^\d{4}$/.test(pinInput)) {
        setActionError('PIN must be exactly 4 digits.');
        return;
      }
      pinMutation.mutate({ cardId: modalAction.cardId, pin: pinInput });
    } else if (modalAction.type === 'block') {
      blockMutation.mutate(modalAction.cardId);
    } else if (modalAction.type === 'unblock') {
      unblockMutation.mutate(modalAction.cardId);
    }
  };

  const formatNaira = (kobo: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(kobo / 100);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (isError || !detail) {
    return (
      <div className="p-4 sm:p-6 space-y-4">
        <Link
          to="/customers"
          className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Customers
        </Link>
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{(error as Error)?.message || 'Failed to load customer details'}</span>
        </div>
      </div>
    );
  }

  const {
    customer,
    account,
    cards,
    totalCardBalanceInKobo,
    totalAccountBalanceInKobo,
    combinedBalanceInKobo,
  } = detail;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div className="flex items-center gap-3">
          <Link
            to="/customers"
            className="p-2 rounded-xl bg-muted hover:bg-muted/80 text-foreground border border-border transition-colors shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground">
                {customer.firstName} {customer.middleName ? `${customer.middleName} ` : ''}
                {customer.lastName}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-primary/10 text-primary border border-primary/20">
                Active Customer
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5 flex-wrap">
              <span>Providus Customer ID:</span>
              <code className="font-mono text-primary font-bold">{customer.providusCustomerId}</code>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => refetch()}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-muted hover:bg-muted/80 text-foreground border border-border text-xs font-semibold transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5 text-muted-foreground" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {actionSuccess && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
          <button
            onClick={() => setActionSuccess(null)}
            className="text-emerald-500 hover:text-emerald-400"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {actionError && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{actionError}</span>
          </div>
          <button
            onClick={() => setActionError(null)}
            className="text-rose-500 hover:text-rose-400"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Customer Contact Profile Bar */}
      <div className="neo-card p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 text-xs">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary shrink-0">
            <Phone className="w-4 h-4" />
          </div>
          <div>
            <p className="text-muted-foreground font-semibold">Phone Number</p>
            <p className="font-mono text-foreground font-bold mt-0.5">{customer.phone}</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 shrink-0">
            <Mail className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-muted-foreground font-semibold">Email Address</p>
            <p className="text-foreground font-semibold mt-0.5 truncate">{customer.email || '—'}</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 shrink-0">
            <Globe className="w-4 h-4" />
          </div>
          <div>
            <p className="text-muted-foreground font-semibold">Nationality & Country</p>
            <p className="text-foreground font-semibold mt-0.5">
              {customer.nationality} ({customer.residentCountry || 'NG'})
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 shrink-0">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <p className="text-muted-foreground font-semibold">Onboarded Date</p>
            <p className="font-mono text-foreground font-bold mt-0.5">
              {new Date(customer.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      {/* Financial Overview Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="neo-card p-5 sm:p-6 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-muted-foreground">MFB Account Balance</p>
            <p className="text-2xl font-extrabold text-foreground mono-num">
              {formatNaira(totalAccountBalanceInKobo)}
            </p>
            <p className="text-[11px] text-muted-foreground">
              Acc No: <span className="font-mono font-bold text-primary">{account.accountNumber}</span>
            </p>
          </div>
          <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-400">
            <Wallet className="w-6 h-6" />
          </div>
        </div>

        <div className="neo-card p-5 sm:p-6 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-muted-foreground">Total Cards Balance</p>
            <p className="text-2xl font-extrabold text-emerald-400 mono-num">
              {formatNaira(totalCardBalanceInKobo)}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {cards.length} Linked Card{cards.length === 1 ? '' : 's'}
            </p>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400">
            <CreditCard className="w-6 h-6" />
          </div>
        </div>

        <div className="neo-card p-5 sm:p-6 flex items-center justify-between border-primary/40 bg-gradient-to-br from-card via-card to-primary/10">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-muted-foreground">Combined Net Wealth</p>
            <p className="text-2xl font-extrabold text-primary mono-num">
              {formatNaira(combinedBalanceInKobo)}
            </p>
            <p className="text-[11px] text-muted-foreground">Total Customer Liquidity</p>
          </div>
          <div className="p-3 rounded-2xl bg-primary/20 text-primary">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-border text-xs font-bold gap-6">
        <button
          onClick={() => setActiveTab('cards')}
          className={`pb-3 transition-colors flex items-center gap-2 border-b-2 ${
            activeTab === 'cards'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Linked Cards ({cards.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('funding')}
          className={`pb-3 transition-colors flex items-center gap-2 border-b-2 ${
            activeTab === 'funding'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <ArrowUpRight className="w-4 h-4" />
          <span>Funding History</span>
        </button>

        <button
          onClick={() => setActiveTab('transactions')}
          className={`pb-3 transition-colors flex items-center gap-2 border-b-2 ${
            activeTab === 'transactions'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <ArrowDownLeft className="w-4 h-4" />
          <span>Card Purchase Activity</span>
        </button>
      </div>

      {/* Tab 1: Cards Section */}
      {activeTab === 'cards' && (
        <div className="space-y-8">
          {cards.length === 0 ? (
            <div className="neo-card p-12 text-center text-muted-foreground space-y-3">
              <CreditCard className="w-12 h-12 mx-auto text-muted-foreground/40" />
              <p className="font-semibold text-sm">No cards linked to this customer yet.</p>
              <p className="text-xs">
                You can link inventory cards from the Cards Management screen.
              </p>
            </div>
          ) : (
            <>
              {/* Visual Cards Showcase */}
              <div className="space-y-3">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
                  Card Showcase
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {cards.map((c) => {
                    const cardModel: Card = {
                      id: c.localCardId || c.providusCardId,
                      customerId: c.customerId || '',
                      providusCardId: c.providusCardId,
                      maskedPan: c.maskedPan,
                      nameOnCard: c.nameOnCard,
                      expiryDate: c.expiryDate,
                      balance: c.balanceInKobo,
                      status: c.status,
                      createdAt: '',
                      updatedAt: '',
                    };

                    return (
                      <div key={c.providusCardId} className="space-y-3">
                        <CardVisualizer card={cardModel} />
                        <div className="flex items-center justify-between gap-2 px-1 flex-wrap">
                          <span className="font-mono text-xs text-muted-foreground">
                            {c.providusCardId}
                          </span>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <button
                              onClick={() => {
                                setActionError(null);
                                setModalAction({
                                  type: 'fund',
                                  cardId: c.localCardId || c.providusCardId,
                                  maskedPan: c.maskedPan,
                                });
                              }}
                              className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 font-semibold text-[11px] flex items-center gap-1"
                            >
                              <ArrowUpRight className="w-3 h-3" /> Fund
                            </button>

                            <button
                              onClick={() => {
                                setActionError(null);
                                setModalAction({
                                  type: 'unfund',
                                  cardId: c.localCardId || c.providusCardId,
                                  maskedPan: c.maskedPan,
                                });
                              }}
                              className="px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 font-semibold text-[11px] flex items-center gap-1"
                            >
                              <ArrowDownLeft className="w-3 h-3" /> Unload
                            </button>

                            <button
                              onClick={() => {
                                setActionError(null);
                                setModalAction({
                                  type: 'pin',
                                  cardId: c.localCardId || c.providusCardId,
                                  maskedPan: c.maskedPan,
                                });
                              }}
                              className="px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 font-semibold text-[11px] flex items-center gap-1"
                            >
                              <KeyRound className="w-3 h-3" /> PIN
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Responsive High-Density Table */}
              <div className="neo-card overflow-hidden">
                <div className="p-4 border-b border-border flex items-center justify-between">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-primary" />
                    <span>Card Inventory Table ({cards.length})</span>
                  </h3>
                </div>

                <div className="overflow-x-auto w-full">
                  <table className="w-full text-left text-xs min-w-[700px]">
                    <thead className="bg-muted/90 backdrop-blur-sm border-b border-border text-muted-foreground font-semibold uppercase tracking-wider whitespace-nowrap">
                      <tr>
                        <th className="py-3.5 px-4">Name on Card</th>
                        <th className="py-3.5 px-4">Providus Card ID</th>
                        <th className="py-3.5 px-4">Masked PAN</th>
                        <th className="py-3.5 px-4">Expiry</th>
                        <th className="py-3.5 px-4">Balance</th>
                        <th className="py-3.5 px-4">Status</th>
                        <th className="py-3.5 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border whitespace-nowrap">
                      {cards.map((c) => (
                        <tr key={c.providusCardId} className="hover:bg-muted/40 transition-colors">
                          <td className="py-3 px-4 font-bold text-foreground">{c.nameOnCard}</td>
                          <td className="py-3 px-4 font-mono font-bold text-primary">
                            {c.providusCardId}
                          </td>
                          <td className="py-3 px-4 font-mono text-foreground">{c.maskedPan}</td>
                          <td className="py-3 px-4 font-mono text-muted-foreground">
                            {c.expiryDate}
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-emerald-400">
                            {formatNaira(c.balanceInKobo)}
                          </td>
                          <td className="py-3 px-4">
                            <StatusBadge status={c.status} type="card" />
                          </td>
                          <td className="py-3 px-4 text-right space-x-2">
                            <button
                              onClick={() => {
                                setActionError(null);
                                setModalAction({
                                  type: 'fund',
                                  cardId: c.localCardId || c.providusCardId,
                                  maskedPan: c.maskedPan,
                                });
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 font-semibold text-[11px]"
                            >
                              <ArrowUpRight className="w-3 h-3" /> Fund
                            </button>

                            <button
                              onClick={() => {
                                setActionError(null);
                                setModalAction({
                                  type: 'unfund',
                                  cardId: c.localCardId || c.providusCardId,
                                  maskedPan: c.maskedPan,
                                });
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 font-semibold text-[11px]"
                            >
                              <ArrowDownLeft className="w-3 h-3" /> Unload
                            </button>

                            <button
                              onClick={() => {
                                setActionError(null);
                                setModalAction({
                                  type: 'pin',
                                  cardId: c.localCardId || c.providusCardId,
                                  maskedPan: c.maskedPan,
                                });
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 font-semibold text-[11px]"
                            >
                              <KeyRound className="w-3 h-3" /> PIN
                            </button>

                            {c.status === 'Active' || c.status === '00' ? (
                              <button
                                onClick={() => {
                                  setActionError(null);
                                  setModalAction({
                                    type: 'block',
                                    cardId: c.localCardId || c.providusCardId,
                                    maskedPan: c.maskedPan,
                                  });
                                }}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 font-semibold text-[11px]"
                              >
                                <Lock className="w-3 h-3" /> Block
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  setActionError(null);
                                  setModalAction({
                                    type: 'unblock',
                                    cardId: c.localCardId || c.providusCardId,
                                    maskedPan: c.maskedPan,
                                  });
                                }}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 font-semibold text-[11px]"
                              >
                                <Unlock className="w-3 h-3" /> Unblock
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Tab 2: Funding Transactions */}
      {activeTab === 'funding' && (
        <div className="neo-card overflow-hidden">
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left text-xs min-w-[650px]">
              <thead className="bg-muted/90 backdrop-blur-sm border-b border-border text-muted-foreground font-semibold uppercase tracking-wider whitespace-nowrap">
                <tr>
                  <th className="py-3.5 px-4">Date & Time</th>
                  <th className="py-3.5 px-4">Operation</th>
                  <th className="py-3.5 px-4">Masked PAN</th>
                  <th className="py-3.5 px-4">Amount</th>
                  <th className="py-3.5 px-4">Impact</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border whitespace-nowrap">
                {fundingTransactions?.items && fundingTransactions.items.length > 0 ? (
                  fundingTransactions.items.map((tx, idx) => (
                    <tr key={idx} className="hover:bg-muted/40 transition-colors">
                      <td className="py-3 px-4 font-mono text-muted-foreground">
                        {tx.transactionDate
                          ? new Date(tx.transactionDate).toLocaleString('en-GB')
                          : '—'}
                      </td>
                      <td className="py-3 px-4 font-bold text-foreground">
                        {tx.tranType === 1 || tx.impactType === 'Credit' ? 'Fund Load' : 'Fund Unload'}
                      </td>
                      <td className="py-3 px-4 font-mono text-foreground">
                        {tx.maskedPan || '—'}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-foreground">
                        {formatNaira(tx.amountInKobo || (tx.amount || 0) * 100)}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                            tx.impactType === 'Credit'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}
                        >
                          {tx.impactType || 'Credit'}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-muted-foreground">
                      No funding transactions recorded.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Card Transactions */}
      {activeTab === 'transactions' && (
        <div className="neo-card overflow-hidden">
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left text-xs min-w-[650px]">
              <thead className="bg-muted/90 backdrop-blur-sm border-b border-border text-muted-foreground font-semibold uppercase tracking-wider whitespace-nowrap">
                <tr>
                  <th className="py-3.5 px-4">Date & Time</th>
                  <th className="py-3.5 px-4">Merchant Name</th>
                  <th className="py-3.5 px-4">RRN</th>
                  <th className="py-3.5 px-4">Amount</th>
                  <th className="py-3.5 px-4">Impact</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border whitespace-nowrap">
                {cardTransactions?.items && cardTransactions.items.length > 0 ? (
                  cardTransactions.items.map((tx, idx) => (
                    <tr key={idx} className="hover:bg-muted/40 transition-colors">
                      <td className="py-3 px-4 font-mono text-muted-foreground">
                        {tx.transactionDate
                          ? new Date(tx.transactionDate).toLocaleString('en-GB')
                          : '—'}
                      </td>
                      <td className="py-3 px-4 font-bold text-foreground">
                        {tx.merchantNameLoc || 'Merchant Purchase'}
                      </td>
                      <td className="py-3 px-4 font-mono text-muted-foreground">{tx.rrn || '—'}</td>
                      <td className="py-3 px-4 font-mono font-bold text-foreground">
                        {formatNaira(tx.amountInKobo || (tx.amount || 0) * 100)}
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          {tx.impactType || 'Debit'}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-muted-foreground">
                      No card purchase transactions found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Action Modal */}
      {modalAction && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border w-full max-w-md rounded-2xl shadow-2xl p-4 sm:p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                {modalAction.type === 'fund' && (
                  <>
                    <ArrowUpRight className="w-4 h-4 text-emerald-400" />
                    <span>Fund Card ({modalAction.maskedPan})</span>
                  </>
                )}
                {modalAction.type === 'unfund' && (
                  <>
                    <ArrowDownLeft className="w-4 h-4 text-rose-400" />
                    <span>Unload Card ({modalAction.maskedPan})</span>
                  </>
                )}
                {modalAction.type === 'pin' && (
                  <>
                    <KeyRound className="w-4 h-4 text-indigo-400" />
                    <span>Set Card PIN ({modalAction.maskedPan})</span>
                  </>
                )}
                {modalAction.type === 'block' && (
                  <>
                    <Lock className="w-4 h-4 text-rose-400" />
                    <span>Block Card ({modalAction.maskedPan})</span>
                  </>
                )}
                {modalAction.type === 'unblock' && (
                  <>
                    <Unlock className="w-4 h-4 text-emerald-400" />
                    <span>Unblock Card ({modalAction.maskedPan})</span>
                  </>
                )}
              </h3>
              <button
                onClick={() => setModalAction(null)}
                className="p-1 rounded-lg text-muted-foreground hover:bg-muted"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {(modalAction.type === 'fund' || modalAction.type === 'unfund') && (
              <form onSubmit={handleActionSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="font-semibold text-muted-foreground block mb-1">
                    Amount (₦ Major Units / Naira) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    value={amountInput}
                    onChange={(e) => setAmountInput(e.target.value)}
                    placeholder="e.g. 5000"
                    className="w-full p-2.5 rounded-xl bg-muted/60 border border-border focus:outline-none focus:border-indigo-500 text-foreground font-mono text-sm"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setModalAction(null)}
                    className="px-4 py-2 rounded-xl border border-border text-foreground hover:bg-muted font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={fundMutation.isPending || unfundMutation.isPending}
                    className={`px-4 py-2 rounded-xl text-white font-bold disabled:opacity-50 ${
                      modalAction.type === 'fund'
                        ? 'bg-emerald-600 hover:bg-emerald-500'
                        : 'bg-rose-600 hover:bg-rose-500'
                    }`}
                  >
                    {fundMutation.isPending || unfundMutation.isPending
                      ? 'Processing...'
                      : modalAction.type === 'fund'
                      ? 'Confirm Load'
                      : 'Confirm Unload'}
                  </button>
                </div>
              </form>
            )}

            {modalAction.type === 'pin' && (
              <form onSubmit={handleActionSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="font-semibold text-muted-foreground block mb-1">
                    New 4-Digit Card PIN *
                  </label>
                  <input
                    type="password"
                    maxLength={4}
                    required
                    value={pinInput}
                    onChange={(e) => setPinInput(e.target.value)}
                    placeholder="••••"
                    className="w-full p-2.5 rounded-xl bg-muted/60 border border-border focus:outline-none focus:border-indigo-500 text-foreground text-center font-mono text-lg tracking-widest"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setModalAction(null)}
                    className="px-4 py-2 rounded-xl border border-border text-foreground hover:bg-muted font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={pinMutation.isPending}
                    className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-500 disabled:opacity-50"
                  >
                    {pinMutation.isPending ? 'Updating...' : 'Set PIN'}
                  </button>
                </div>
              </form>
            )}

            {(modalAction.type === 'block' || modalAction.type === 'unblock') && (
              <div className="space-y-4 text-xs">
                <p className="text-muted-foreground">
                  Are you sure you want to {modalAction.type} card{' '}
                  <span className="font-mono font-bold text-foreground">
                    {modalAction.maskedPan}
                  </span>
                  ?
                </p>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setModalAction(null)}
                    className="px-4 py-2 rounded-xl border border-border text-foreground hover:bg-muted font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleActionSubmit}
                    disabled={blockMutation.isPending || unblockMutation.isPending}
                    className={`px-4 py-2 rounded-xl text-white font-bold disabled:opacity-50 ${
                      modalAction.type === 'block'
                        ? 'bg-rose-600 hover:bg-rose-500'
                        : 'bg-emerald-600 hover:bg-emerald-500'
                    }`}
                  >
                    {blockMutation.isPending || unblockMutation.isPending
                      ? 'Processing...'
                      : 'Confirm'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
