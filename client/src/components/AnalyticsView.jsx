import React, { useEffect, useState } from 'react';
import { useQueue } from '../context/QueueContext';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { 
  Clock, 
  Users, 
  CheckCircle2, 
  AlertTriangle, 
  TrendingUp, 
  Activity, 
  Filter, 
  ArrowUpRight, 
  Sparkles 
} from 'lucide-react';
import { formatWaitTime, formatTimestamp } from '../utils/formatters';

export default function AnalyticsView() {
  const { queues, analytics, fetchAnalytics, reseedDemo } = useQueue();
  const [selectedQueueFilter, setSelectedQueueFilter] = useState('all');

  useEffect(() => {
    fetchAnalytics(selectedQueueFilter);
  }, [selectedQueueFilter, fetchAnalytics]);

  const kpis = analytics?.kpis || {
    totalTokens: 0,
    waiting: 0,
    inService: 0,
    completed: 0,
    cancelled: 0,
    avgWaitTimeMinutes: 0,
    avgServiceTimeMinutes: 0,
    maxWaitTimeMinutes: 0,
    estimatedNextWaitMinutes: 0
  };

  const hourlyData = analytics?.hourlyTrends || [];
  const queueCompData = analytics?.queueComparison || [];
  const statusData = analytics?.statusDistribution || [];
  const cancelReasons = analytics?.cancellationReasons || [];
  const events = analytics?.recentEvents || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Analytics Header & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-400" />
            <span>Queue Performance & Trends Analytics</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time throughput, wait time efficiency, and operational queue depth
          </p>
        </div>

        {/* Filter Dropdown & Demo Reseed */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
            <Filter className="w-3.5 h-3.5 text-indigo-400" />
            <select
              value={selectedQueueFilter}
              onChange={(e) => setSelectedQueueFilter(e.target.value)}
              className="bg-transparent text-slate-200 outline-none text-xs cursor-pointer font-medium"
            >
              <option value="all" className="bg-slate-900 text-slate-200">All Queues Combined</option>
              {queues.map((q) => (
                <option key={q.id} value={q.id} className="bg-slate-900 text-slate-200">
                  {q.name} ({q.prefix})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={reseedDemo}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/20 hover:bg-amber-500/20 transition"
            title="Populate realistic analytics sample"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Reseed Sample</span>
          </button>
        </div>
      </div>

      {/* KPI Summary Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1: Average Wait Time */}
        <div className="p-4 rounded-2xl glass-panel border border-slate-800 bg-gradient-to-br from-indigo-950/30 to-slate-900/60">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Avg. Wait Time
            </span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl lg:text-3xl font-extrabold font-mono text-white">
              {formatWaitTime(kpis.avgWaitTimeMinutes)}
            </span>
            <span className="text-[10px] text-emerald-400 flex items-center font-semibold">
              <ArrowUpRight className="w-3 h-3" /> Target &lt; 10m
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Max wait experienced today: <span className="text-slate-300 font-mono">{formatWaitTime(kpis.maxWaitTimeMinutes)}</span>
          </p>
        </div>

        {/* KPI 2: Average Service Duration */}
        <div className="p-4 rounded-2xl glass-panel border border-slate-800 bg-gradient-to-br from-purple-950/30 to-slate-900/60">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Avg. Service Time
            </span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl lg:text-3xl font-extrabold font-mono text-white">
              {formatWaitTime(kpis.avgServiceTimeMinutes)}
            </span>
            <span className="text-[10px] text-purple-300 font-medium">Per Session</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Est. wait for next joiner: <span className="text-purple-300 font-mono font-semibold">~{formatWaitTime(kpis.estimatedNextWaitMinutes)}</span>
          </p>
        </div>

        {/* KPI 3: Total Completed */}
        <div className="p-4 rounded-2xl glass-panel border border-slate-800 bg-gradient-to-br from-emerald-950/30 to-slate-900/60">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Completed Today
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl lg:text-3xl font-extrabold font-mono text-white">
              {kpis.completed}
            </span>
            <span className="text-[10px] text-slate-400">
              / {kpis.totalTokens} total issued
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Cancellation rate: <span className="text-slate-300 font-semibold">{kpis.totalTokens ? Math.round((kpis.cancelled / kpis.totalTokens) * 100) : 0}%</span>
          </p>
        </div>

        {/* KPI 4: Currently Waiting */}
        <div className="p-4 rounded-2xl glass-panel border border-slate-800 bg-gradient-to-br from-amber-950/30 to-slate-900/60">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Active Queue Depth
            </span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl lg:text-3xl font-extrabold font-mono text-white">
              {kpis.waiting}
            </span>
            <span className="text-[10px] text-amber-300 font-medium">In Waiting Line</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Currently In Service: <span className="text-emerald-400 font-semibold">{kpis.inService} at counters</span>
          </p>
        </div>

      </div>

      {/* Main Charts: Trends & Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Chart 1: Queue Length Trends (Time Series Area Chart) - Req 8 */}
        <div className="lg:col-span-2 p-5 rounded-2xl glass-panel border border-slate-800 bg-slate-900/70">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Hourly Queue Length & Flow Trends</span>
              </h3>
              <p className="text-xs text-slate-400">
                Incoming token requests vs served customers across operating hours
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-slate-300">
                <span className="w-3 h-3 rounded-full bg-indigo-500 inline-block"></span> Incoming
              </span>
              <span className="flex items-center gap-1.5 text-slate-300">
                <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span> Served
              </span>
              <span className="flex items-center gap-1.5 text-slate-300">
                <span className="w-3 h-3 rounded-full bg-amber-500 inline-block"></span> Queue Depth
              </span>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hourlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorIncoming" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorServed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="hour" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem' }} 
                  itemStyle={{ fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="incoming" name="Tokens Issued" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorIncoming)" />
                <Area type="monotone" dataKey="served" name="Tokens Served" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorServed)" />
                <Line type="monotone" dataKey="waitingEst" name="Waiting Line Depth" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Status Distribution Donut Chart */}
        <div className="p-5 rounded-2xl glass-panel border border-slate-800 bg-slate-900/70 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white">Token Status Breakdown</h3>
            <p className="text-xs text-slate-400 mt-0.5">Distribution of all tokens recorded today</p>
          </div>

          <div className="h-56 w-full my-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            {statusData.map((s, idx) => (
              <div key={idx} className="flex items-center gap-2 p-1.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                <span className="text-slate-400 truncate">{s.name}:</span>
                <span className="font-bold text-slate-200 ml-auto font-mono">{s.value}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Secondary Row: Queue Comparison & Recent Audit Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Queue Comparison Bar Chart */}
        <div className="p-5 rounded-2xl glass-panel border border-slate-800 bg-slate-900/70">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white">Queue Volume Comparison</h3>
              <p className="text-xs text-slate-400">Total volume and waiting load by service queue</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={queueCompData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="prefix" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem' }} 
                />
                <Bar dataKey="total_tokens" name="Total Issued" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                <Bar dataKey="waiting" name="Waiting Now" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                <Bar dataKey="completed" name="Completed" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Cancellation Breakdown & Real-Time Event Audit Log */}
        <div className="p-5 rounded-2xl glass-panel border border-slate-800 bg-slate-900/70 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-white">Recent Queue Activity & Audit Trail</h3>
              <span className="text-[11px] text-slate-400">Live operational logs</span>
            </div>
            <p className="text-xs text-slate-400 mb-3">Timestamped trace of token assignments, movements, and completions</p>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {events.length === 0 ? (
              <div className="text-xs text-slate-500 text-center py-8">No recent events recorded.</div>
            ) : (
              events.map((ev) => {
                let badgeBg = 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
                if (ev.event_type === 'TOKEN_SERVED') badgeBg = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
                if (ev.event_type === 'TOKEN_CANCELLED') badgeBg = 'bg-rose-500/10 text-rose-400 border-rose-500/20';
                if (ev.event_type === 'TOKEN_COMPLETED') badgeBg = 'bg-teal-500/10 text-teal-400 border-teal-500/20';

                return (
                  <div key={ev.id} className="flex items-center justify-between gap-3 p-2 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border shrink-0 ${badgeBg}`}>
                        {ev.event_type.replace('TOKEN_', '')}
                      </span>
                      <span className="text-slate-300 truncate font-medium">
                        {ev.details}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 font-mono shrink-0">
                      {formatTimestamp(ev.timestamp)}
                    </span>
                  </div>
                );
              })
            )}
          </div>

          {cancelReasons.length > 0 && (
            <div className="mt-3 pt-3 border-t border-slate-800">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Top Cancellation Reasons:
              </span>
              <div className="flex flex-wrap gap-2">
                {cancelReasons.map((r, i) => (
                  <span key={i} className="text-xs px-2 py-0.5 rounded-lg bg-rose-500/10 text-rose-300 border border-rose-500/20">
                    {r.reason} ({r.count})
                  </span>
                ))}
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
