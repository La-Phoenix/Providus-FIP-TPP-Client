import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api/client';
import { Wallet, ArrowUpRight, ArrowDownLeft, AlertCircle, CheckCircle2, CreditCard } from 'lucide-react';

export const FundingPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const preselectedCardId = searchParams.get('cardId');

  const [activeTab, setActiveTab] = useState<'load' | 'unload'>('load');
  const [selectedCardId, setSelectedCardId] = useState<string>(preselectedCardId || '');
  const [amountNaira, setAmountNaira] = useState<string>('');
  const [txRef, setTxRef] = useState<string>('');

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const { data: cards } = useQuery({
    queryKey: ['cards'],
    queryFn: () => api.getCards(),
  });

  useEffect(() => {
    if (preselectedCardId) {
      setSelectedCardId(preselectedCardId);
    } else if (cards && cards.length > 0 && !selectedCardId) {
      setSelectedCardId(cards[0].id);
    }
  }, [preselectedCardId, cards]);

  const selectedCard = cards?.find((c) => c.id === selectedCardId);

  const fundMutation = useMutation({
    mutationFn: (payload: { cardId: string; amount: number; transactionRef?: string }) =>
      activeTab === 'load'
        ? api.fundCard(payload.cardId, payload)
        : api.unfundCard(payload.cardId, payload),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['cards'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
      queryClient.invalidateQueries({ queryKey: ['fundingTransactions'] });

      setFeedback({
        type: 'success',
        msg: `${activeTab === 'load' ? 'Load' : 'Unload'} operation successful on Providus FIP.${res.newBalance !== undefined ? ` Updated Card Balance: ₦${(res.newBalance / 100).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : ''}`,
      });
      setAmountNaira('');
      setTxRef('');
    },
    onError: (err: any) => {
      setFeedback({
        type: 'error',
        msg: err.message || `${activeTab === 'load' ? 'Fund load' : 'Fund unload'} failed.`,
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    const numAmount = parseFloat(amountNaira);
    if (!selectedCardId || isNaN(numAmount) || numAmount <= 0) {
      setFeedback({ type: 'error', msg: 'Please enter a valid positive amount.' });
      return;
    }

    if (activeTab === 'unload' && selectedCard && numAmount * 100 > selectedCard.balance) {
      setFeedback({ type: 'error', msg: 'Unload amount exceeds available card balance.' });
      return;
    }

    fundMutation.mutate({
      cardId: selectedCardId,
      amount: numAmount,
      transactionRef: txRef || undefined,
    });
  };

  const amountKobo = Math.round((parseFloat(amountNaira) || 0) * 100);

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="border-b border-border pb-6">
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
          <Wallet className="w-6 h-6 text-emerald-500" />
          <span>Card Funding & Money Movement</span>
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Direct Providus `fund/load` and `fund/unload` integrations with zero-optimistic balance safeguards
        </p>
      </div>

      {/* Workspace Card */}
      <div className="neo-card p-6 space-y-6">
        {/* Tab Switcher */}
        <div className="grid grid-cols-2 p-1 rounded-xl bg-muted border border-border text-xs font-bold">
          <button
            onClick={() => { setActiveTab('load'); setFeedback(null); }}
            className={`py-2.5 rounded-lg flex items-center justify-center gap-2 transition-all ${
              activeTab === 'load' ? 'bg-emerald-600 text-white shadow-md' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>Fund Load (Credit)</span>
          </button>
          <button
            onClick={() => { setActiveTab('unload'); setFeedback(null); }}
            className={`py-2.5 rounded-lg flex items-center justify-center gap-2 transition-all ${
              activeTab === 'unload' ? 'bg-rose-600 text-white shadow-md' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <ArrowDownLeft className="w-4 h-4" />
            <span>Fund Unload (Debit)</span>
          </button>
        </div>

        {feedback && (
          <div className={`p-4 rounded-xl text-xs flex items-center gap-3 border ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
              : 'bg-rose-500/10 border-rose-500/20 text-rose-500'
          }`}>
            {feedback.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
            <span className="font-medium">{feedback.msg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 text-xs">
          {/* Card Selection */}
          <div>
            <label className="font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
              Select Target Card *
            </label>
            <select
              value={selectedCardId}
              onChange={(e) => setSelectedCardId(e.target.value)}
              className="w-full p-3 rounded-xl bg-muted border border-border text-foreground font-mono focus:outline-none focus:border-primary"
            >
              {cards?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nameOnCard} — {c.maskedPan} (Balance: ₦{(c.balance / 100).toLocaleString()})
                </option>
              ))}
            </select>
          </div>

          {selectedCard && (
            <div className="p-3.5 rounded-xl bg-muted/60 border border-border flex justify-between items-center font-mono">
              <span className="text-muted-foreground">Current Providus Card Balance:</span>
              <span className="text-base font-bold text-emerald-400">
                ₦{(selectedCard.balance / 100).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
              </span>
            </div>
          )}

          {/* Amount Input */}
          <div>
            <label className="font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
              Amount in Nigerian Naira (₦) *
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-3 text-muted-foreground font-bold font-mono">₦</span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={amountNaira}
                onChange={(e) => setAmountNaira(e.target.value)}
                placeholder="5000.00"
                className="w-full p-3 pl-8 rounded-xl bg-muted/60 border border-border text-foreground font-mono text-base font-bold focus:outline-none focus:border-primary"
              />
            </div>
            <p className="text-[11px] font-mono text-muted-foreground mt-1">
              Providus Minor Units Conversion: <span className="text-primary font-bold">{amountKobo.toLocaleString()} Kobo</span>
            </p>
          </div>

          {/* Preset Buttons */}
          <div className="flex gap-2">
            {[5000, 10000, 50000, 100000].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setAmountNaira(preset.toString())}
                className="px-3 py-1.5 rounded-lg border border-border bg-muted hover:bg-muted/80 font-mono text-[11px] font-semibold text-foreground"
              >
                +₦{preset.toLocaleString()}
              </button>
            ))}
          </div>

          {/* Transaction Note */}
          <div>
            <label className="font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
              Transaction Reference / Note (Optional)
            </label>
            <input
              type="text"
              value={txRef}
              onChange={(e) => setTxRef(e.target.value)}
              placeholder="e.g. MFB Partner Account Funding Ref #9042"
              className="w-full p-2.5 rounded-xl bg-muted/60 border border-border text-foreground focus:outline-none focus:border-primary"
            />
          </div>

          <div className="pt-4 border-t border-border flex justify-end">
            <button
              type="submit"
              disabled={fundMutation.isPending}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-xs shadow-lg transition-all disabled:opacity-50 ${
                activeTab === 'load'
                  ? 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-emerald-600/20'
                  : 'bg-rose-600 text-white hover:bg-rose-500 shadow-rose-600/20'
              }`}
            >
              <Wallet className="w-4 h-4" />
              <span>
                {fundMutation.isPending
                  ? 'Executing with Providus FIP...'
                  : `Execute Fund ${activeTab === 'load' ? 'Load' : 'Unload'}`}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
