import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useQueue } from '../context/QueueContext';
import { 
  Layers, 
  BarChart3, 
  Tv, 
  PlusCircle, 
  UserPlus, 
  Sparkles, 
  LogOut, 
  Radio, 
  ShieldCheck 
} from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, onOpenCreateQueue, onOpenAddToken }) {
  const { manager, logout } = useAuth();
  const { socketConnected, reseedDemo } = useQueue();

  return (
    <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl tracking-tight text-white font-['Plus_Jakarta_Sans']">
                  Q<span className="text-indigo-400">-Flow</span>
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  Manager Portal
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <span className={`inline-block w-2 h-2 rounded-full ${socketConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                <span>{socketConnected ? 'Realtime Connected' : 'Syncing...'}</span>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center p-1 rounded-xl bg-slate-900/90 border border-slate-800">
            <button
              onClick={() => setActiveTab('queues')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition ${
                activeTab === 'queues'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Queues & Tokens</span>
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition ${
                activeTab === 'analytics'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Analytics</span>
            </button>

            <button
              onClick={() => setActiveTab('display')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition ${
                activeTab === 'display'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Tv className="w-4 h-4" />
              <span>Live TV Kiosk</span>
            </button>
          </nav>

          {/* Quick Actions & Manager Profile */}
          <div className="flex items-center gap-2.5">
            {/* Quick Action: New Queue */}
            <button
              onClick={onOpenCreateQueue}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
              title="Create a new Queue"
            >
              <PlusCircle className="w-3.5 h-3.5 text-indigo-400" />
              <span>New Queue</span>
            </button>

            {/* Quick Action: Add Token */}
            <button
              onClick={onOpenAddToken}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/25 transition active:scale-95"
              title="Issue a new token"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Issue Token</span>
            </button>

            {/* Demo Reseed Helper */}
            <button
              onClick={reseedDemo}
              className="p-2 rounded-lg text-xs font-medium text-amber-400/90 hover:text-amber-300 hover:bg-amber-400/10 border border-amber-500/20 transition"
              title="Reset Demo Data (for testing)"
            >
              <Sparkles className="w-4 h-4" />
            </button>

            {/* Manager Avatar & Logout */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white uppercase shadow">
                  {manager?.name ? manager.name.charAt(0) : 'M'}
                </div>
                <div className="hidden lg:block text-left">
                  <div className="text-xs font-semibold text-slate-200 leading-tight">
                    {manager?.name || 'Manager'}
                  </div>
                  <div className="text-[10px] text-slate-400 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    <span>{manager?.role || 'Admin'}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={logout}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>

          </div>

        </div>
      </div>

      {/* Mobile Tab bar */}
      <div className="md:hidden flex border-t border-slate-800 bg-slate-900/60 p-1">
        <button
          onClick={() => setActiveTab('queues')}
          className={`flex-1 flex justify-center items-center gap-1.5 py-2 text-xs font-medium rounded-lg ${
            activeTab === 'queues' ? 'bg-indigo-600 text-white' : 'text-slate-400'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Queues</span>
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex-1 flex justify-center items-center gap-1.5 py-2 text-xs font-medium rounded-lg ${
            activeTab === 'analytics' ? 'bg-indigo-600 text-white' : 'text-slate-400'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>Analytics</span>
        </button>
        <button
          onClick={() => setActiveTab('display')}
          className={`flex-1 flex justify-center items-center gap-1.5 py-2 text-xs font-medium rounded-lg ${
            activeTab === 'display' ? 'bg-indigo-600 text-white' : 'text-slate-400'
          }`}
        >
          <Tv className="w-3.5 h-3.5" />
          <span>TV Kiosk</span>
        </button>
      </div>
    </header>
  );
}
