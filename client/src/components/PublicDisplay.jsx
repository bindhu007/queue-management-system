import React, { useState, useEffect } from 'react';
import { useQueue } from '../context/QueueContext';
import { announcer } from './AudioChime';
import { 
  Tv, 
  Volume2, 
  VolumeX, 
  Clock, 
  Users, 
  Sparkles, 
  Radio, 
  ArrowRight 
} from 'lucide-react';
import { formatTimestamp } from '../utils/formatters';

export default function PublicDisplay() {
  const { queues, fetchQueues } = useQueue();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Digital clock update every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Poll queues if socket is idle
  useEffect(() => {
    const poll = setInterval(() => {
      fetchQueues();
    }, 5000);
    return () => clearInterval(poll);
  }, [fetchQueues]);

  const toggleSound = () => {
    const nextState = !soundEnabled;
    setSoundEnabled(nextState);
    announcer.soundEnabled = nextState;
    announcer.speechEnabled = nextState;
    if (nextState) {
      announcer.announceToken('DEMO-001', 'Counter 1');
    }
  };

  const handleTestChime = () => {
    announcer.announceToken('Q-101', 'Counter 1');
  };

  // Find active serving tokens across all queues
  const activeServing = (queues || []).filter(q => q.current_serving_token);

  return (
    <div className="min-h-[85vh] rounded-3xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl flex flex-col justify-between p-6 sm:p-8 animate-in fade-in duration-300">
      
      {/* Top Kiosk Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-850 border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/30">
            <Tv className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <span>NOW SERVING</span>
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Please proceed to the designated counter when your token is called
            </p>
          </div>
        </div>

        {/* Live Digital Clock & Audio Toggle */}
        <div className="flex items-center gap-4">
          <button
            onClick={toggleSound}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border transition ${
              soundEnabled
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-slate-900 text-slate-400 border-slate-800'
            }`}
            title="Toggle Audio Chime & Announcements"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span>Sound {soundEnabled ? 'ON' : 'OFF'}</span>
          </button>

          <button
            onClick={handleTestChime}
            className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition"
          >
            Test Chime
          </button>

          <div className="text-right pl-3 border-l border-slate-800 hidden sm:block">
            <div className="text-xl font-extrabold font-mono text-white">
              {currentTime.toLocaleTimeString()}
            </div>
            <div className="text-[11px] text-slate-400">
              {currentTime.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
            </div>
          </div>
        </div>
      </div>

      {/* Main Boards: Active Serving vs Upcoming List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 my-8 flex-1 items-stretch">
        
        {/* Left 7 Cols: Massive Current Serving Cards */}
        <div className="lg:col-span-7 flex flex-col gap-4 justify-center">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Currently Called to Counters
            </span>
            <span className="text-xs text-indigo-400 font-semibold">
              Live Counter Screen
            </span>
          </div>

          {activeServing.length === 0 ? (
            <div className="flex-1 min-h-[300px] flex flex-col items-center justify-center p-8 rounded-3xl bg-slate-900/40 border border-slate-850 text-center">
              <div className="w-16 h-16 rounded-3xl bg-slate-800/80 flex items-center justify-center text-slate-500 mb-3">
                <Clock className="w-8 h-8 text-indigo-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-300">No Tokens Currently Being Served</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm">
                Next token will appear here with an audio announcement as soon as the manager calls it.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 flex-1">
              {activeServing.map((q) => (
                <div
                  key={q.id}
                  className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border-2 border-indigo-500/50 p-6 sm:p-8 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-6"
                >
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400"></div>

                  {/* Token Number Display */}
                  <div className="text-center sm:text-left">
                    <span className="text-xs font-bold uppercase tracking-widest text-indigo-400 block mb-1">
                      {q.name}
                    </span>
                    <span className="text-6xl sm:text-7xl font-extrabold font-mono tracking-tighter text-white drop-shadow-md">
                      {q.current_serving_token}
                    </span>
                    <span className="text-sm font-semibold text-slate-300 block mt-1">
                      Customer: {q.current_serving_customer || 'Valued Guest'}
                    </span>
                  </div>

                  {/* Designated Counter */}
                  <div className="text-center sm:text-right shrink-0">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      PROCEED TO
                    </span>
                    <div className="px-6 py-3 rounded-2xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-extrabold text-2xl sm:text-3xl font-mono shadow-inner">
                      {q.counter_name || 'Counter 1'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right 5 Cols: Upcoming Waiting Ticker */}
        <div className="lg:col-span-5 rounded-3xl bg-slate-900/60 border border-slate-800 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-400" />
                <span>Next in Line (Waiting)</span>
              </h3>
              <span className="text-xs text-slate-400">Live Status</span>
            </div>

            <div className="space-y-3">
              {queues.map((q) => (
                <div key={q.id} className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-200 block truncate max-w-[200px]">{q.name}</span>
                    <span className="text-[11px] text-slate-400">{q.counter_name}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono font-bold text-indigo-400 block">
                      {q.waiting_count || 0} waiting
                    </span>
                    <span className="text-[10px] text-slate-500 uppercase font-semibold">
                      Queue Depth
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 p-4 rounded-2xl bg-indigo-950/20 border border-indigo-500/20 text-center">
            <span className="text-xs text-indigo-300 font-medium block">
              Audio Chimes active for all counter summons.
            </span>
            <span className="text-[11px] text-slate-400 mt-0.5 block">
              Hold onto your token slip until your number is announced.
            </span>
          </div>

        </div>

      </div>

      {/* Bottom Ticker Tape */}
      <div className="pt-4 border-t border-slate-850 border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400"></span>
          <span>System Operating Live • Q-Flow Smart Queue Display</span>
        </div>
        <div className="flex items-center gap-4 text-slate-400">
          <span>Average Service: ~7 mins</span>
          <span>•</span>
          <span>Please maintain physical queue space</span>
        </div>
      </div>

    </div>
  );
}
