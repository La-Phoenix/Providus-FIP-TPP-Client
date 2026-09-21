import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { AuditLog, FipRequest } from '../types';
import { ShieldAlert, Terminal, ChevronLeft, ChevronRight, CheckCircle2, XCircle, Code, Info, X } from 'lucide-react';

export const AuditPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'audit' | 'fip'>('audit');
  const [page, setPage] = useState(1);
  const [selectedFipRequest, setSelectedFipRequest] = useState<FipRequest | null>(null);

  const { data: auditData, isLoading: isLoadingAudit } = useQuery({
    queryKey: ['auditLogs', page],
    queryFn: () => api.getAuditLogs({ page, pageSize: 10 }),
    enabled: activeTab === 'audit',
  });

  const { data: fipData, isLoading: isLoadingFip } = useQuery({
    queryKey: ['fipRequests', page],
    queryFn: () => api.getFipRequests({ page, pageSize: 10 }),
    enabled: activeTab === 'fip',
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="border-b border-border pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-amber-500" />
            <span>Audit & Integration Inspector</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            System audit history & Providus FIP HTTP request diagnostics (without secret leakage)
          </p>
        </div>

        <div className="flex bg-muted p-1 rounded-xl border border-border text-xs font-bold self-start">
          <button
            onClick={() => { setActiveTab('audit'); setPage(1); }}
            className={`px-4 py-2 rounded-lg transition-all ${
              activeTab === 'audit' ? 'bg-primary text-primary-foreground shadow-md' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            System Audit Log
          </button>
          <button
            onClick={() => { setActiveTab('fip'); setPage(1); }}
            className={`px-4 py-2 rounded-lg transition-all ${
              activeTab === 'fip' ? 'bg-primary text-primary-foreground shadow-md' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Providus FIP Requests
          </button>
        </div>
      </div>

      {/* System Audit Log Table */}
      {activeTab === 'audit' && (
        <div className="neo-card overflow-hidden">
          <div className="overflow-auto max-h-[500px] w-full">
            <table className="w-full text-left text-xs min-w-[650px]">
              <thead className="bg-muted/90 backdrop-blur-sm border-b border-border text-muted-foreground font-semibold uppercase tracking-wider whitespace-nowrap sticky top-0 z-10">
                <tr>
                  <th className="py-3.5 px-4">Timestamp</th>
                  <th className="py-3.5 px-4">Actor</th>
                  <th className="py-3.5 px-4">Action</th>
                  <th className="py-3.5 px-4">Entity</th>
                  <th className="py-3.5 px-4">Entity ID</th>
                  <th className="py-3.5 px-4">Result</th>
                  <th className="py-3.5 px-4">Correlation ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border whitespace-nowrap">
                {isLoadingAudit ? (
                  <tr><td colSpan={7} className="py-8 text-center text-muted-foreground">Loading audit logs...</td></tr>
                ) : auditData?.items.length === 0 ? (
                  <tr><td colSpan={7} className="py-8 text-center text-muted-foreground">No audit logs recorded yet.</td></tr>
                ) : (
                  auditData?.items.map((log) => (
                    <tr key={log.id} className="hover:bg-muted/40 transition-colors">
                      <td className="py-3 px-4 font-mono text-muted-foreground">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 font-semibold text-foreground">{log.actor}</td>
                      <td className="py-3 px-4 font-bold text-primary">{log.action}</td>
                      <td className="py-3 px-4 text-foreground">{log.entity}</td>
                      <td className="py-3 px-4 font-mono text-muted-foreground">{log.entityId || '—'}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                          log.result === 'Success' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'
                        }`}>
                          {log.result}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-muted-foreground text-[11px]">
                        {log.correlationId || '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="p-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
            <span>Page {auditData?.page ?? 1} of {Math.ceil((auditData?.total ?? 0) / 10) || 1}</span>
            <div className="flex items-center gap-2">
              <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="p-1.5 rounded border border-border disabled:opacity-40">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button disabled={!auditData || page * 10 >= auditData.total} onClick={() => setPage((p) => p + 1)} className="p-1.5 rounded border border-border disabled:opacity-40">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Providus FIP Requests Table */}
      {activeTab === 'fip' && (
        <div className="neo-card overflow-hidden">
          <div className="overflow-auto max-h-[500px] w-full">
            <table className="w-full text-left text-xs min-w-[650px]">
              <thead className="bg-muted/90 backdrop-blur-sm border-b border-border text-muted-foreground font-semibold uppercase tracking-wider whitespace-nowrap sticky top-0 z-10">
                <tr>
                  <th className="py-3.5 px-4">Operation</th>
                  <th className="py-3.5 px-4">HTTP Status</th>
                  <th className="py-3.5 px-4">Success</th>
                  <th className="py-3.5 px-4">Duration</th>
                  <th className="py-3.5 px-4">Correlation ID</th>
                  <th className="py-3.5 px-4">Started At</th>
                  <th className="py-3.5 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border whitespace-nowrap">
                {isLoadingFip ? (
                  <tr><td colSpan={7} className="py-8 text-center text-muted-foreground">Loading Providus FIP requests...</td></tr>
                ) : fipData?.items.length === 0 ? (
                  <tr><td colSpan={7} className="py-8 text-center text-muted-foreground">No FIP request logs recorded yet.</td></tr>
                ) : (
                  fipData?.items.map((fip) => (
                    <tr key={fip.id} className="hover:bg-muted/40 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-primary">{fip.operation}</td>
                      <td className="py-3 px-4 font-mono font-semibold">
                        <span className={fip.httpStatusCode >= 200 && fip.httpStatusCode < 300 ? 'text-emerald-500' : 'text-rose-500'}>
                          {fip.httpStatusCode}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {fip.success ? (
                          <span className="flex items-center gap-1 text-emerald-500 font-bold"><CheckCircle2 className="w-3.5 h-3.5" /> OK</span>
                        ) : (
                          <span className="flex items-center gap-1 text-rose-500 font-bold"><XCircle className="w-3.5 h-3.5" /> FAIL</span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono text-muted-foreground">{fip.durationMs ? `${fip.durationMs}ms` : '—'}</td>
                      <td className="py-3 px-4 font-mono text-muted-foreground text-[11px]">{fip.correlationId}</td>
                      <td className="py-3 px-4 font-mono text-muted-foreground">{new Date(fip.startedAt).toLocaleTimeString()}</td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setSelectedFipRequest(fip)}
                          className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                        >
                          <Terminal className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="p-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
            <span>Page {fipData?.page ?? 1} of {Math.ceil((fipData?.total ?? 0) / 10) || 1}</span>
            <div className="flex items-center gap-2">
              <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="p-1.5 rounded border border-border disabled:opacity-40">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button disabled={!fipData || page * 10 >= fipData.total} onClick={() => setPage((p) => p + 1)} className="p-1.5 rounded border border-border disabled:opacity-40">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Diagnostics Drawer / Modal */}
      {selectedFipRequest && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border w-full max-w-xl rounded-2xl shadow-2xl p-4 sm:p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200 text-xs max-h-[90vh] overflow-y-auto m-2 sm:m-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                <Terminal className="w-5 h-5 text-primary" />
                <span>FIP Request Diagnostic Inspector</span>
              </h3>
              <button onClick={() => setSelectedFipRequest(null)} className="p-1 rounded text-muted-foreground hover:bg-muted">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 font-mono space-y-2">
              <div className="flex justify-between"><span className="text-slate-500">Operation:</span><span className="text-sky-400 font-bold">{selectedFipRequest.operation}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Correlation ID:</span><span className="text-slate-300">{selectedFipRequest.correlationId}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Providus Request No:</span><span>{selectedFipRequest.providusRequestNo || 'N/A'}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">HTTP Code:</span><span className={selectedFipRequest.httpStatusCode === 200 ? 'text-emerald-400' : 'text-rose-400'}>{selectedFipRequest.httpStatusCode}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Latency:</span><span>{selectedFipRequest.durationMs}ms</span></div>
              {selectedFipRequest.errorCode && <div className="flex justify-between"><span className="text-slate-500">Error Code:</span><span className="text-rose-400">{selectedFipRequest.errorCode}</span></div>}
              {selectedFipRequest.errorMessage && <div className="pt-2 border-t border-slate-800 text-rose-300">Message: {selectedFipRequest.errorMessage}</div>}
            </div>

            <p className="text-[11px] text-muted-foreground italic">
              Note: Cryptographic private keys, CMS payloads, client secrets, and access tokens are strictly omitted for security.
            </p>

            <div className="flex justify-end pt-2">
              <button onClick={() => setSelectedFipRequest(null)} className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
