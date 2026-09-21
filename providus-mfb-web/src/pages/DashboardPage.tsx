import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { Users, CreditCard, ShieldCheck, Wallet, ArrowUpRight, ArrowDownLeft, PlusCircle, RefreshCw, Sparkles } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Link } from 'react-router-dom';

const chartData = [
  { name: 'Mon', load: 1200000, unload: 300000 },
  { name: 'Tue', load: 1800000, unload: 450000 },
  { name: 'Wed', load: 1400000, unload: 200000 },
  { name: 'Thu', load: 2200000, unload: 600000 },
  { name: 'Fri', load: 3100000, unload: 900000 },
  { name: 'Sat', load: 2800000, unload: 750000 },
  { name: 'Sun', load: 3500000, unload: 800000 },
];

export const DashboardPage: React.FC = () => {
  const { data: summary, isLoading, refetch } = useQuery({
    queryKey: ['dashboardSummary'],
    queryFn: api.getDashboardSummary,
  });

  const { data: auditLogs } = useQuery({
    queryKey: ['recentAuditLogs'],
    queryFn: () => api.getAuditLogs({ pageSize: 5 }),
  });

  const formatNaira = (amount: number) => {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);
  };

  const pieData = [
    { name: 'Active Cards', value: summary?.activeCards || 0, color: '#10b981' },
    { name: 'Blocked Cards', value: summary?.blockedCards || 0, color: '#f43f5e' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            <span>LuminaPay Overview</span>
            <Sparkles className="w-5 h-5 text-amber-500" />
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Real-time digital banking metrics & Providus FIP card infrastructure performance
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => refetch()}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-muted hover:bg-muted/80 text-foreground border border-border text-xs font-semibold transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5 text-muted-foreground" />
            <span>Refresh Data</span>
          </button>
          <Link
            to="/cards/issue"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-md shadow-primary/25 hover:opacity-90 transition-opacity"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Issue New Card</span>
          </Link>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Total Customers */}
        <div className="p-5 neo-card space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Total Customers
            </span>
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-mono font-bold text-foreground">
              {isLoading ? '...' : summary?.totalCustomers ?? 0}
            </p>
            <p className="text-[11px] text-emerald-500 font-medium mt-1 flex items-center gap-1">
              <ArrowUpRight className="w-3.5 h-3.5" /> +12% this week
            </p>
          </div>
        </div>

        {/* Card 2: Active Cards */}
        <div className="p-5 neo-card space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Active Cards
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-mono font-bold text-foreground">
              {isLoading ? '...' : summary?.activeCards ?? 0}
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">
              Out of {summary?.totalCards ?? 0} total issued
            </p>
          </div>
        </div>

        {/* Card 3: Total Card Balance */}
        <div className="p-5 neo-card space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Cumulative Balance
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-mono font-bold text-emerald-400">
              {isLoading ? '...' : formatNaira(summary?.totalCardBalanceNaira ?? 0)}
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">
              Held across all cards
            </p>
          </div>
        </div>

        {/* Card 4: 24h Funding Volume */}
        <div className="p-5 neo-card space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              24h Funding Load
            </span>
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-mono font-bold text-foreground">
              {isLoading ? '...' : formatNaira(summary?.fundingVolume24hLoadNaira ?? 0)}
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">
              Unload: {formatNaira(summary?.fundingVolume24hUnloadNaira ?? 0)}
            </p>
          </div>
        </div>
      </div>

      {/* Visualizations Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <div className="lg:col-span-2 p-6 neo-card space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-foreground">Funding Volume Trends</h3>
              <p className="text-xs text-muted-foreground">Load (Credit) vs Unload (Debit) activity</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-mono">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                <span className="text-muted-foreground">Load (Credit)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span className="text-muted-foreground">Unload (Debit)</span>
              </div>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorLoad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorUnload" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#F59E0B" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} tickFormatter={(val) => `₦${val / 1000}k`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0D1322', borderColor: '#1E293B', borderRadius: '12px' }}
                  formatter={(val: any) => [`₦${Number(val).toLocaleString()}`, '']}
                />
                <Area type="monotone" dataKey="load" stroke="#6366F1" strokeWidth={2} fillOpacity={1} fill="url(#colorLoad)" />
                <Area type="monotone" dataKey="unload" stroke="#F59E0B" strokeWidth={2} fillOpacity={1} fill="url(#colorUnload)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Card Status Donut Chart */}
        <div className="p-6 neo-card space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-foreground">Card Status Ratio</h3>
            <p className="text-xs text-muted-foreground">Active vs Blocked distribution</p>
          </div>

          <div className="h-48 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0D1322', borderRadius: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-2 border-t border-border pt-4 text-xs font-mono">
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-1.5 text-emerald-500 font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-500" /> Active Cards
              </span>
              <span className="font-bold text-foreground">{summary?.activeCards ?? 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-1.5 text-rose-500 font-semibold">
                <span className="w-2 h-2 rounded-full bg-rose-500" /> Blocked Cards
              </span>
              <span className="font-bold text-foreground">{summary?.blockedCards ?? 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity Section */}
      <div className="p-6 neo-card space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-foreground">Recent System Audit Stream</h3>
          <Link to="/audit" className="text-xs font-semibold text-primary hover:underline">
            View All Audit Logs →
          </Link>
        </div>

        <div className="divide-y divide-border text-xs">
          {auditLogs?.items.map((log) => (
            <div key={log.id} className="py-3 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-mono font-bold">
                  {log.action.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-foreground">{log.action}</p>
                  <p className="text-muted-foreground text-[11px] font-mono">
                    Actor: {log.actor} • Entity: {log.entity} (#{log.entityId})
                  </p>
                </div>
              </div>
              <div className="text-right font-mono text-[11px]">
                <p className="text-emerald-500 font-bold">{log.result}</p>
                <p className="text-muted-foreground">{new Date(log.timestamp).toLocaleTimeString()}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
