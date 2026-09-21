import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { CardTransaction, FundingTransaction } from '../types';
import { Receipt, Wallet, ChevronLeft, ChevronRight, Filter, Info, X } from 'lucide-react';

export const TransactionsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'card' | 'funding'>('card');
  const [page, setPage] = useState(1);
  const [selectedCardTx, setSelectedCardTx] = useState<CardTransaction | null>(null);

  const { data: cardTxData, isLoading: isLoadingCard } = useQuery({
    queryKey: ['cardTransactions', page],
    queryFn: () => api.getCardTransactions({ page, pageSize: 10 }),
    enabled: activeTab === 'card',
  });

  const { data: fundingTxData, isLoading: isLoadingFunding } = useQuery({
    queryKey: ['fundingTransactions', page],
    queryFn: () => api.getFundingTransactions({ page, pageSize: 10 }),
    enabled: activeTab === 'funding',
  });

  const formatNaira = (amount?: number) => {
    if (amount === undefined || amount === null) return '—';
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="border-b border-border pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            <Receipt className="w-6 h-6 text-primary" />
            <span>Transaction Intelligence</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Reconciliation & statement history fetched from Providus `card-transactions` & `fund-transactions`
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-muted p-1 rounded-xl border border-border text-xs font-bold self-start">
          <button
            onClick={() => { setActiveTab('card'); setPage(1); }}
            className={`px-4 py-2 rounded-lg transition-all ${
              activeTab === 'card' ? 'bg-primary text-primary-foreground shadow-md' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Prepaid Card Transactions
          </button>
          <button
            onClick={() => { setActiveTab('funding'); setPage(1); }}
            className={`px-4 py-2 rounded-lg transition-all ${
              activeTab === 'funding' ? 'bg-primary text-primary-foreground shadow-md' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Prepaid Funding History
          </button>
        </div>
      </div>

      {/* Card Transactions Table */}
      {activeTab === 'card' && (
        <div className="neo-card overflow-hidden">
          <div className="overflow-auto max-h-[500px] w-full">
            <table className="w-full text-left text-xs min-w-[650px]">
              <thead className="bg-muted/90 backdrop-blur-sm border-b border-border text-muted-foreground font-semibold uppercase tracking-wider whitespace-nowrap sticky top-0 z-10">
                <tr>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Masked PAN</th>
                  <th className="py-3.5 px-4">Merchant / Location</th>
                  <th className="py-3.5 px-4">RRN</th>
                  <th className="py-3.5 px-4">Amount</th>
                  <th className="py-3.5 px-4">Impact</th>
                  <th className="py-3.5 px-4 text-right">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border whitespace-nowrap">
                {isLoadingCard ? (
                  <tr><td colSpan={7} className="py-8 text-center text-muted-foreground">Loading card transactions...</td></tr>
                ) : cardTxData?.items.length === 0 ? (
                  <tr><td colSpan={7} className="py-8 text-center text-muted-foreground">No card transactions recorded yet.</td></tr>
                ) : (
                  cardTxData?.items.map((tx, idx) => (
                    <tr key={idx} className="hover:bg-muted/40 transition-colors">
                      <td className="py-3 px-4 font-mono text-muted-foreground">
                        {tx.transactionDate ? new Date(tx.transactionDate).toLocaleString() : '—'}
                      </td>
                      <td className="py-3 px-4 font-mono text-foreground font-semibold">{tx.maskedPan || '—'}</td>
                      <td className="py-3 px-4 font-semibold text-foreground">{tx.merchantNameLoc || 'Point of Sale / Web'}</td>
                      <td className="py-3 px-4 font-mono text-primary">{tx.rrn || '—'}</td>
                      <td className="py-3 px-4 font-mono font-bold text-foreground">
                        {formatNaira(tx.amount)}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                          tx.impactType === 'CREDIT' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'
                        }`}>
                          {tx.impactType || 'DEBIT'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setSelectedCardTx(tx)}
                          className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                        >
                          <Info className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="p-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
            <span>Page {cardTxData?.page ?? 1} of {Math.ceil((cardTxData?.total ?? 0) / 10) || 1}</span>
            <div className="flex items-center gap-2">
              <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="p-1.5 rounded border border-border disabled:opacity-40">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button disabled={!cardTxData || page * 10 >= cardTxData.total} onClick={() => setPage((p) => p + 1)} className="p-1.5 rounded border border-border disabled:opacity-40">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Funding Transactions Table */}
      {activeTab === 'funding' && (
        <div className="neo-card overflow-hidden">
          <div className="overflow-auto max-h-[500px] w-full">
            <table className="w-full text-left text-xs min-w-[650px]">
              <thead className="bg-muted/90 backdrop-blur-sm border-b border-border text-muted-foreground font-semibold uppercase tracking-wider whitespace-nowrap sticky top-0 z-10">
                <tr>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Masked PAN</th>
                  <th className="py-3.5 px-4">Cardholder</th>
                  <th className="py-3.5 px-4">Amount</th>
                  <th className="py-3.5 px-4">Impact</th>
                  <th className="py-3.5 px-4">Currency</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border whitespace-nowrap">
                {isLoadingFunding ? (
                  <tr><td colSpan={6} className="py-8 text-center text-muted-foreground">Loading funding transactions...</td></tr>
                ) : fundingTxData?.items.length === 0 ? (
                  <tr><td colSpan={6} className="py-8 text-center text-muted-foreground">No funding transactions recorded yet.</td></tr>
                ) : (
                  fundingTxData?.items.map((tx, idx) => (
                    <tr key={idx} className="hover:bg-muted/40 transition-colors">
                      <td className="py-3 px-4 font-mono text-muted-foreground">
                        {tx.transactionDate ? new Date(tx.transactionDate).toLocaleString() : '—'}
                      </td>
                      <td className="py-3 px-4 font-mono text-foreground font-semibold">{tx.maskedPan || '—'}</td>
                      <td className="py-3 px-4 font-semibold text-foreground">{tx.cardholder || '—'}</td>
                      <td className="py-3 px-4 font-mono font-bold text-foreground">{formatNaira(tx.amount)}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                          tx.impactType === 'CREDIT' || tx.impactType === 'LOAD' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'
                        }`}>
                          {tx.impactType || 'LOAD'}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-muted-foreground">{tx.currency || 'NGN'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="p-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
            <span>Page {fundingTxData?.page ?? 1} of {Math.ceil((fundingTxData?.total ?? 0) / 10) || 1}</span>
            <div className="flex items-center gap-2">
              <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="p-1.5 rounded border border-border disabled:opacity-40">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button disabled={!fundingTxData || page * 10 >= fundingTxData.total} onClick={() => setPage((p) => p + 1)} className="p-1.5 rounded border border-border disabled:opacity-40">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Slide-over Modal */}
      {selectedCardTx && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border w-full max-w-lg rounded-2xl shadow-2xl p-4 sm:p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200 text-xs max-h-[90vh] overflow-y-auto m-2 sm:m-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-bold text-base text-foreground">Transaction Detail Inspection</h3>
              <button onClick={() => setSelectedCardTx(null)} className="p-1 rounded text-muted-foreground hover:bg-muted">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 rounded-xl bg-muted/60 border border-border space-y-2 font-mono">
              <div className="flex justify-between"><span className="text-muted-foreground">RRN:</span><span className="text-primary font-bold">{selectedCardTx.rrn}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Terminal ID:</span><span>{selectedCardTx.terminalId || '—'}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Merchant ID:</span><span>{selectedCardTx.merchantId || '—'}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Location:</span><span>{selectedCardTx.merchantNameLoc || '—'}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Amount:</span><span className="text-emerald-400 font-bold">{formatNaira(selectedCardTx.amount)}</span></div>
            </div>

            <div className="flex justify-end pt-2">
              <button onClick={() => setSelectedCardTx(null)} className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
