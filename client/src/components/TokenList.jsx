import React, { useState, useEffect } from 'react';
import { useQueue } from '../context/QueueContext';
import { 
  ArrowUp, 
  ArrowDown, 
  ArrowUpToLine, 
  UserX, 
  Printer, 
  Play, 
  Clock, 
  Search, 
  Users, 
  Zap, 
  AlertCircle 
} from 'lucide-react';
import { getPriorityBadge, formatTimestamp } from '../utils/formatters';

export default function TokenList({ 
  tokens, 
  queue, 
  onServeTop, 
  onOpenCancelModal, 
  onOpenSlipModal 
}) {
  const { moveTokenUp, moveTokenDown, moveTokenTop } = useQueue();
  const [search, setSearch] = useState('');
  const [, setTick] = useState(0);

  // Ticking state every 15s to update wait time displays smoothly
  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 15000);
    return () => clearInterval(timer);
  }, []);

  // Compute live elapsed minutes from ISO date
  const getElapsedWait = (dateStr) => {
    if (!dateStr) return '0 min';
    const created = new Date(dateStr).getTime();
    const diffMin = Math.max(0, Math.floor((Date.now() - created) / 60000));
    if (diffMin < 1) return '< 1 min';
    if (diffMin >= 60) {
      return `${Math.floor(diffMin / 60)}h ${diffMin % 60}m`;
    }
    return `${diffMin} min`;
  };

  const filteredTokens = (tokens || []).filter((t) => {
    if (!search.trim()) return true;
    const query = search.toLowerCase();
    return (
      t.customer_name.toLowerCase().includes(query) ||
      t.token_number.toLowerCase().includes(query) ||
      (t.customer_phone && t.customer_phone.toLowerCase().includes(query)) ||
      (t.notes && t.notes.toLowerCase().includes(query))
    );
  });

  const topWaitingToken = tokens && tokens.length > 0 ? tokens[0] : null;

  return (
    <div className="space-y-4">
      
      {/* Action Bar: 1-Click Serve Next + Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/60 p-3.5 rounded-2xl border border-slate-800">
        
        {/* Prominent 1-Click "Serve Top Token" button (Req 6) */}
        <button
          onClick={onServeTop}
          disabled={!topWaitingToken}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white shadow-lg shadow-indigo-600/30 transition active:scale-95 group"
          title="Assign top token at position #1 directly for service"
        >
          <Zap className="w-4 h-4 fill-amber-300 text-amber-300 group-hover:scale-110 transition-transform" />
          <span>Assign Top Token for Service</span>
          {topWaitingToken && (
            <span className="ml-1.5 px-2 py-0.5 rounded-md bg-indigo-700/80 font-mono text-white text-[11px]">
              {topWaitingToken.token_number}
            </span>
          )}
        </button>

        {/* Search / Filter */}
        <div className="relative flex-1 max-w-xs">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tokens or names..."
            className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-950/80 border border-slate-800 focus:border-indigo-500 text-xs text-slate-100 placeholder-slate-500 outline-none transition"
          />
        </div>

      </div>

      {/* Waiting Tokens Count & Summary */}
      <div className="flex items-center justify-between text-xs text-slate-400 px-1">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-indigo-400" />
          <span className="font-semibold text-slate-200">
            {tokens?.length || 0} People Waiting
          </span>
          <span className="text-slate-600">•</span>
          <span>Ordered by queue priority</span>
        </div>
        {topWaitingToken && (
          <div className="text-[11px] text-slate-400">
            Next up: <span className="text-indigo-400 font-bold">{topWaitingToken.token_number}</span> ({topWaitingToken.customer_name})
          </div>
        )}
      </div>

      {/* List Container */}
      {filteredTokens.length === 0 ? (
        <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-12 text-center">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto mb-3">
            <Users className="w-6 h-6" />
          </div>
          <h4 className="text-base font-bold text-slate-200">No Waiting Tokens</h4>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {search ? 'No tokens matching your search query.' : 'The queue is currently clear. Click "Issue Token" to add a new person to the queue.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredTokens.map((token, index) => {
            const isTop = token.position === 1;
            const isLast = token.position === tokens.length;
            const prioBadge = getPriorityBadge(token.priority);

            return (
              <div
                key={token.id}
                className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border transition-all ${
                  isTop
                    ? 'bg-indigo-950/20 border-indigo-500/40 shadow-md shadow-indigo-950/20'
                    : 'bg-slate-900/70 border-slate-800/90 hover:border-slate-700/90'
                }`}
              >
                {/* Left Section: Position + Token Code + Customer Info */}
                <div className="flex items-center gap-3.5 min-w-0">
                  
                  {/* Queue Position Badge */}
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                    isTop
                      ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/40 ring-2 ring-indigo-400/30'
                      : 'bg-slate-800 text-slate-300'
                  }`}>
                    #{token.position}
                  </div>

                  {/* Token Number */}
                  <div className="shrink-0">
                    <span className="text-base font-mono font-extrabold text-white tracking-tight">
                      {token.token_number}
                    </span>
                  </div>

                  {/* Customer Information */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-200 truncate">
                        {token.customer_name}
                      </span>
                      {prioBadge && (
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full shrink-0 ${prioBadge.bg}`}>
                          {prioBadge.label}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                      {token.customer_phone && (
                        <span className="truncate">{token.customer_phone}</span>
                      )}
                      {token.notes && (
                        <span className="truncate text-slate-400 italic">“{token.notes}”</span>
                      )}
                    </div>
                  </div>

                </div>

                {/* Right Section: Live Wait Timer + Reordering Buttons + Actions */}
                <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/80">
                  
                  {/* Elapsed Wait Time */}
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/60 text-slate-300 text-xs font-mono">
                    <Clock className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Wait: {getElapsedWait(token.created_at)}</span>
                  </div>

                  {/* Req 5: Move Up & Move Down Reordering Controls */}
                  <div className="flex items-center bg-slate-950/80 p-0.5 rounded-lg border border-slate-800">
                    {/* Move Up */}
                    <button
                      onClick={() => moveTokenUp(token.id)}
                      disabled={isTop}
                      className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-20 disabled:hover:bg-transparent disabled:cursor-not-allowed transition"
                      title="Move Up in queue (Shift Position -1)"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>

                    {/* Move Down */}
                    <button
                      onClick={() => moveTokenDown(token.id)}
                      disabled={isLast}
                      className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-20 disabled:hover:bg-transparent disabled:cursor-not-allowed transition"
                      title="Move Down in queue (Shift Position +1)"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>

                    {/* Direct Move to Top */}
                    <button
                      onClick={() => moveTokenTop(token.id)}
                      disabled={isTop}
                      className="p-1.5 rounded-md text-slate-400 hover:text-indigo-400 hover:bg-slate-800 disabled:opacity-20 disabled:hover:bg-transparent disabled:cursor-not-allowed transition"
                      title="Promote directly to position #1"
                    >
                      <ArrowUpToLine className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Print Slip */}
                  <button
                    onClick={() => onOpenSlipModal(token)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
                    title="View & Print Token Slip"
                  >
                    <Printer className="w-4 h-4" />
                  </button>

                  {/* Req 7: Cancel Token from Queue */}
                  <button
                    onClick={() => onOpenCancelModal(token)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
                    title="Cancel Token from Queue"
                  >
                    <UserX className="w-4 h-4" />
                  </button>

                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
