import React, { useState, useEffect } from 'react';
import { useQueue } from '../context/QueueContext';
import { announcer } from './AudioChime';
import { 
  PlayCircle, 
  CheckCircle, 
  Volume2, 
  Clock, 
  User, 
  Sparkles, 
  ArrowRightCircle, 
  Phone 
} from 'lucide-react';
import { getPriorityBadge } from '../utils/formatters';

export default function ServingCard({ queue, onServeTop }) {
  const { inServiceToken, completeToken } = useQueue();
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Live timer for currently served token
  useEffect(() => {
    if (!inServiceToken || !inServiceToken.served_at) {
      setElapsedSeconds(0);
      return;
    }

    const servedTime = new Date(inServiceToken.served_at).getTime();

    const updateTimer = () => {
      const now = Date.now();
      const diffSec = Math.max(0, Math.floor((now - servedTime) / 1000));
      setElapsedSeconds(diffSec);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [inServiceToken]);

  const formatTimer = (sec) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleRecall = () => {
    if (inServiceToken) {
      announcer.announceToken(inServiceToken.token_number, queue?.counter_name || 'Counter 1');
    }
  };

  const prioBadge = inServiceToken ? getPriorityBadge(inServiceToken.priority) : null;

  return (
    <div className="relative rounded-2xl overflow-hidden glass-panel border border-slate-800 bg-gradient-to-b from-slate-900/90 to-slate-950/90 p-5 shadow-xl">
      
      {/* Top Banner Status */}
      <div className="flex items-center justify-between pb-3.5 mb-3.5 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${inServiceToken ? 'bg-emerald-400 opacity-75' : 'bg-slate-500 opacity-40'}`}></span>
            <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${inServiceToken ? 'bg-emerald-500' : 'bg-slate-500'}`}></span>
          </span>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
            {queue?.counter_name || 'Counter 1'}
          </span>
          <span className="text-slate-600">•</span>
          <span className="text-xs text-slate-400 font-medium">
            {inServiceToken ? 'Active Session' : 'Ready for Next Customer'}
          </span>
        </div>

        {inServiceToken && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-mono font-semibold">
            <Clock className="w-3.5 h-3.5" />
            <span>{formatTimer(elapsedSeconds)}</span>
          </div>
        )}
      </div>

      {inServiceToken ? (
        /* Currently Serving Details */
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="px-4 py-3 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-center">
              <span className="text-[10px] uppercase font-bold text-indigo-400 block tracking-wider">
                CURRENT TOKEN
              </span>
              <span className="text-3xl font-extrabold font-mono text-white tracking-tight">
                {inServiceToken.token_number}
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-lg font-bold text-slate-100">{inServiceToken.customer_name}</h4>
                {prioBadge && (
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${prioBadge.bg}`}>
                    {prioBadge.label}
                  </span>
                )}
              </div>
              <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-3">
                {inServiceToken.customer_phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-3 h-3 text-slate-500" />
                    <span>{inServiceToken.customer_phone}</span>
                  </span>
                )}
                {inServiceToken.notes && (
                  <span className="text-slate-400 italic">“{inServiceToken.notes}”</span>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons for active session */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={handleRecall}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition active:scale-95"
              title="Repeat audio chime and counter announcement"
            >
              <Volume2 className="w-4 h-4 text-indigo-400" />
              <span>Announce Again</span>
            </button>

            <button
              onClick={() => completeToken(inServiceToken.id)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30 transition active:scale-95"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Complete Service</span>
            </button>
          </div>
        </div>
      ) : (
        /* Empty Counter State */
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-800/80 flex items-center justify-center text-slate-400">
              <Sparkles className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-200">
                Counter is currently available
              </div>
              <div className="text-xs text-slate-400">
                Click "Assign Top Token for Service" to call the first person waiting in line.
              </div>
            </div>
          </div>

          <button
            onClick={onServeTop}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white shadow-lg shadow-indigo-600/30 transition active:scale-95"
          >
            <PlayCircle className="w-4 h-4" />
            <span>Serve Top Token (#1)</span>
          </button>
        </div>
      )}

    </div>
  );
}
