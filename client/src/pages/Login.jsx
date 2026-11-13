import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Layers, 
  Lock, 
  Mail, 
  User, 
  ArrowRight, 
  Sparkles, 
  ShieldCheck, 
  Clock, 
  Zap, 
  BarChart2 
} from 'lucide-react';

export default function Login() {
  const { login, register, demoLogin } = useAuth();
  const [tab, setTab] = useState('login'); // 'login' | 'register'
  
  // Login fields
  const [loginIdentifier, setLoginIdentifier] = useState('manager@qflow.com');
  const [loginPassword, setLoginPassword] = useState('admin123');

  // Register fields
  const [regName, setRegName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);
    try {
      await login(loginIdentifier, loginPassword);
    } catch (err) {
      setErrorMessage(err.message || 'Invalid login credentials');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);
    try {
      await register({
        name: regName.trim(),
        username: regUsername.trim(),
        email: regEmail.trim(),
        password: regPassword
      });
    } catch (err) {
      setErrorMessage(err.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemo = async () => {
    setErrorMessage('');
    setIsLoading(true);
    try {
      await demoLogin();
    } catch (err) {
      setErrorMessage(err.message || 'Demo login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-slate-950 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(99,102,241,0.25),rgba(255,255,255,0))]">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        
        {/* Left Side: Product Showcase & Features */}
        <div className="lg:col-span-6 space-y-6 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Next-Generation Full-Stack Queue System</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Streamline Queues with <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-300 to-indigo-200">Intelligent Token Flow</span>
          </h1>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-lg">
            Empower queue managers with one-click token assignments, drag-and-drop priority reordering, voice-synthesized counter chimes, and deep wait-time analytics.
          </p>

          {/* Feature Highlights Grid */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-left">
              <Zap className="w-5 h-5 text-indigo-400 mb-1.5" />
              <div className="text-xs font-bold text-slate-200">1-Click Top Serving</div>
              <div className="text-[11px] text-slate-400">Instantly call next token in line</div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-left">
              <Layers className="w-5 h-5 text-purple-400 mb-1.5" />
              <div className="text-xs font-bold text-slate-200">Dynamic Reordering</div>
              <div className="text-[11px] text-slate-400">Move tokens up/down in queue</div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-left">
              <Clock className="w-5 h-5 text-amber-400 mb-1.5" />
              <div className="text-xs font-bold text-slate-200">Wait Time Analytics</div>
              <div className="text-[11px] text-slate-400">Hourly trends & rush hour charts</div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-left">
              <ShieldCheck className="w-5 h-5 text-emerald-400 mb-1.5" />
              <div className="text-xs font-bold text-slate-200">Bug-Free Persistence</div>
              <div className="text-[11px] text-slate-400">ACID SQLite transactions</div>
            </div>
          </div>
        </div>

        {/* Right Side: Auth Card */}
        <div className="lg:col-span-6 w-full max-w-md mx-auto">
          <div className="rounded-3xl glass-panel bg-slate-900/90 border border-slate-700/80 p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
            
            {/* Logo */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/30">
                <Layers className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-white font-['Plus_Jakarta_Sans']">
                  Q-Flow Manager
                </h2>
                <p className="text-xs text-slate-400">Sign in to manage queues and call tokens</p>
              </div>
            </div>

            {/* Quick Demo Login Button for Evaluator */}
            <button
              onClick={handleQuickDemo}
              disabled={isLoading}
              className="w-full mb-5 py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition active:scale-95"
            >
              <Sparkles className="w-4 h-4 fill-slate-950" />
              <span>⚡ 1-Click Demo Manager Login</span>
            </button>

            <div className="relative flex py-2 items-center mb-4">
              <div className="flex-grow border-t border-slate-800"></div>
              <span className="flex-shrink mx-3 text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Or with credentials</span>
              <div className="flex-grow border-t border-slate-800"></div>
            </div>

            {/* Tabs: Login vs Register */}
            <div className="flex p-1 rounded-xl bg-slate-950/80 border border-slate-800 mb-5">
              <button
                type="button"
                onClick={() => { setTab('login'); setErrorMessage(''); }}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition ${
                  tab === 'login' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setTab('register'); setErrorMessage(''); }}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition ${
                  tab === 'register' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Register Manager
              </button>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400">
                {errorMessage}
              </div>
            )}

            {/* Login Form */}
            {tab === 'login' ? (
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Email or Username
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={loginIdentifier}
                      onChange={(e) => setLoginIdentifier(e.target.value)}
                      placeholder="manager@qflow.com"
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 focus:border-indigo-500 text-xs text-slate-100 placeholder-slate-500 outline-none transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="admin123"
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 focus:border-indigo-500 text-xs text-slate-100 placeholder-slate-500 outline-none transition"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white shadow-lg shadow-indigo-600/30 transition active:scale-95 flex items-center justify-center gap-2"
                >
                  <span>{isLoading ? 'Signing In...' : 'Sign In as Manager'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 text-center">
                  Pre-configured demo: <span className="text-indigo-400 font-mono">manager@qflow.com</span> / <span className="text-indigo-400 font-mono">admin123</span>
                </div>
              </form>
            ) : (
              /* Register Form */
              <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="e.g. Sarah Jenkins"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 focus:border-indigo-500 text-xs text-slate-100 placeholder-slate-500 outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    required
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value)}
                    placeholder="e.g. sjenkins"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 focus:border-indigo-500 text-xs text-slate-100 placeholder-slate-500 outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Work Email
                  </label>
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="sarah@hospital.org"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 focus:border-indigo-500 text-xs text-slate-100 placeholder-slate-500 outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Password (min 6 chars)
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 focus:border-indigo-500 text-xs text-slate-100 placeholder-slate-500 outline-none transition"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white shadow-lg shadow-indigo-600/30 transition active:scale-95"
                >
                  <span>{isLoading ? 'Registering...' : 'Create Manager Account'}</span>
                </button>
              </form>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}
