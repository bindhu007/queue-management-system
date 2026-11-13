import React, { useState } from 'react';
import { useQueue } from '../context/QueueContext';
import ServingCard from '../components/ServingCard';
import TokenList from '../components/TokenList';
import { 
  Layers, 
  PlusCircle, 
  UserPlus, 
  Clock, 
  Users, 
  CheckCircle, 
  Monitor, 
  Sparkles, 
  History 
} from 'lucide-react';
import { formatTimestamp, getStatusBadge } from '../utils/formatters';

export default function QueueManagerView({ 
  onOpenCreateQueue, 
  onOpenAddToken, 
  onOpenCancelModal, 
  onOpenSlipModal 
}) {
  const { 
    queues, 
    selectedQueueId, 
    setSelectedQueueId, 
    currentQueueDetail, 
    waitingTokens, 
    inServiceToken, 
    recentActivity, 
    serveTopToken, 
    loading 
  } = useQueue();

  const activeQueue = currentQueueDetail || queues.find(q => q.id === selectedQueueId);

  const handleServeTop = () => {
    if (selectedQueueId) {
      serveTopToken(selectedQueueId);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-300">
      
      {/* Left Sidebar: Queues List (4 cols) */}
      <div className="lg:col-span-4 space-y-4">
        
        {/* Queue Selector Card */}
        <div className="rounded-2xl glass-panel border border-slate-800 bg-slate-900/70 p-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Service Queues ({queues.length})
              </h3>
            </div>
            <button
              onClick={onOpenCreateQueue}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-600 hover:text-white transition"
              title="Create new queue"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>New</span>
            </button>
          </div>

          {/* Queue Navigation List */}
          <div className="space-y-2">
            {queues.map((q) => {
              const isSelected = q.id === selectedQueueId;
              return (
                <div
                  key={q.id}
                  onClick={() => setSelectedQueueId(q.id)}
                  className={`p-3 rounded-xl cursor-pointer border transition-all ${
                    isSelected
                      ? 'bg-indigo-950/40 border-indigo-500/50 shadow-md shadow-indigo-950/30'
                      : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700/80 hover:bg-slate-900/60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-mono text-xs font-extrabold px-2 py-0.5 rounded bg-slate-800 text-indigo-400 border border-slate-700">
                        {q.prefix}
                      </span>
                      <span className="text-sm font-bold text-slate-200 truncate">
                        {q.name}
                      </span>
                    </div>
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 shrink-0">
                      {q.waiting_count || 0} wait
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 pt-2 border-t border-slate-850 border-slate-800/50">
                    <span className="flex items-center gap-1">
                      <Monitor className="w-3 h-3 text-slate-500" />
                      <span>{q.counter_name || 'Counter 1'}</span>
                    </span>
                    {q.current_serving_token ? (
                      <span className="text-emerald-400 font-mono font-semibold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Serving {q.current_serving_token}
                      </span>
                    ) : (
                      <span className="text-slate-400">Counter Idle</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Tips / Instructions Card */}
        <div className="rounded-2xl glass-panel border border-slate-800 bg-slate-900/40 p-4 text-xs text-slate-400 space-y-2">
          <div className="font-bold text-slate-300 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Queue Manager Actions</span>
          </div>
          <ul className="space-y-1.5 list-disc list-inside text-slate-400 leading-relaxed">
            <li>Click <strong className="text-indigo-300">Assign Top Token</strong> to call token #1 for service.</li>
            <li>Use the <strong className="text-slate-200">↑ / ↓ buttons</strong> to reorder tokens dynamically.</li>
            <li>Audio chime & voice synthesis announce called tokens automatically.</li>
            <li>Tokens can be cancelled with audit reasons logged.</li>
          </ul>
        </div>

      </div>

      {/* Main Content Area: Active Queue Control & Waiting List (8 cols) */}
      <div className="lg:col-span-8 space-y-5">
        
        {/* Active Queue Banner & Header */}
        {activeQueue ? (
          <div className="p-5 rounded-2xl glass-panel border border-slate-800 bg-gradient-to-r from-slate-900 via-indigo-950/20 to-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="font-mono text-sm font-extrabold px-2.5 py-1 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
                  {activeQueue.prefix}
                </span>
                <h2 className="text-xl font-extrabold text-white">
                  {activeQueue.name}
                </h2>
              </div>
              <p className="text-xs text-slate-400 mt-1 max-w-xl">
                {activeQueue.description || 'Dedicated queue management desk and customer processing counter'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onOpenAddToken}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/25 transition active:scale-95"
              >
                <UserPlus className="w-4 h-4" />
                <span>Issue Token</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="p-5 rounded-2xl glass-panel border border-slate-800 text-center text-slate-400">
            Select or create a queue from the sidebar.
          </div>
        )}

        {/* Currently Serving Counter Card (Req 6) */}
        <ServingCard 
          queue={activeQueue} 
          onServeTop={handleServeTop} 
        />

        {/* Waiting Tokens List & Reordering (Req 4, 5, 6, 7) */}
        <TokenList
          tokens={waitingTokens}
          queue={activeQueue}
          onServeTop={handleServeTop}
          onOpenCancelModal={onOpenCancelModal}
          onOpenSlipModal={onOpenSlipModal}
        />

        {/* Recently Processed Tokens Ticker */}
        {recentActivity && recentActivity.length > 0 && (
          <div className="mt-6 rounded-2xl glass-panel border border-slate-800 bg-slate-900/50 p-4">
            <div className="flex items-center gap-2 pb-2.5 border-b border-slate-800 mb-3">
              <History className="w-4 h-4 text-slate-400" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Recently Processed in this Queue
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {recentActivity.slice(0, 6).map((tok) => {
                const statusBadge = getStatusBadge(tok.status);
                return (
                  <div key={tok.id} className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs flex items-center justify-between">
                    <div>
                      <span className="font-mono font-bold text-slate-200 block">{tok.token_number}</span>
                      <span className="text-[11px] text-slate-400 truncate max-w-[120px] block">{tok.customer_name}</span>
                    </div>
                    <div className="text-right">
                      <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${statusBadge.bg}`}>
                        {statusBadge.label}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono block mt-1">
                        {formatTimestamp(tok.completed_at || tok.cancelled_at)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
