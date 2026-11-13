import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { QueueProvider, useQueue } from './context/QueueContext';
import Navbar from './components/Navbar';
import QueueManagerView from './pages/QueueManagerView';
import AnalyticsView from './components/AnalyticsView';
import PublicDisplay from './components/PublicDisplay';
import CreateQueueModal from './components/CreateQueueModal';
import AddTokenModal from './components/AddTokenModal';
import CancelTokenModal from './components/CancelTokenModal';
import TokenSlipModal from './components/TokenSlipModal';
import Toast from './components/Toast';
import Login from './pages/Login';

function MainApp() {
  const { isAuthenticated, loading } = useAuth();
  const { selectedQueueId, queues } = useQueue();

  const [activeTab, setActiveTab] = useState('queues'); // 'queues' | 'analytics' | 'display'
  const [isCreateQueueOpen, setIsCreateQueueOpen] = useState(false);
  const [isAddTokenOpen, setIsAddTokenOpen] = useState(false);
  const [cancelModalToken, setCancelModalToken] = useState(null);
  const [slipModalToken, setSlipModalToken] = useState(null);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-indigo-400">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-semibold text-slate-300">Initializing Q-Flow System...</span>
        </div>
      </div>
    );
  }

  // If not logged in, render the Login/Registration portal
  if (!isAuthenticated) {
    return <Login />;
  }

  const activeQueue = queues.find(q => q.id === selectedQueueId);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Toast Notification Container */}
      <Toast />

      {/* Main Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenCreateQueue={() => setIsCreateQueueOpen(true)}
        onOpenAddToken={() => setIsAddTokenOpen(true)}
      />

      {/* App Workspace Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'queues' && (
          <QueueManagerView
            onOpenCreateQueue={() => setIsCreateQueueOpen(true)}
            onOpenAddToken={() => setIsAddTokenOpen(true)}
            onOpenCancelModal={(token) => setCancelModalToken(token)}
            onOpenSlipModal={(token) => setSlipModalToken(token)}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsView />
        )}

        {activeTab === 'display' && (
          <PublicDisplay />
        )}
      </main>

      {/* Modals */}
      <CreateQueueModal
        isOpen={isCreateQueueOpen}
        onClose={() => setIsCreateQueueOpen(false)}
      />

      <AddTokenModal
        isOpen={isAddTokenOpen}
        onClose={() => setIsAddTokenOpen(false)}
        defaultQueueId={selectedQueueId}
      />

      <CancelTokenModal
        isOpen={!!cancelModalToken}
        onClose={() => setCancelModalToken(null)}
        token={cancelModalToken}
      />

      <TokenSlipModal
        isOpen={!!slipModalToken}
        onClose={() => setSlipModalToken(null)}
        token={slipModalToken}
        queue={activeQueue}
      />

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/90 py-4 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Q-Flow Intelligent Queue Management System • Developed for Rugas Evaluation</span>
          <span className="font-mono text-slate-400">Node v24 • React 18 • SQLite ACID Engine • WebSockets</span>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <QueueProvider>
        <MainApp />
      </QueueProvider>
    </AuthProvider>
  );
}
