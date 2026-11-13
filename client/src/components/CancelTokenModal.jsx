import React, { useState } from 'react';
import { useQueue } from '../context/QueueContext';
import { X, AlertTriangle, UserX } from 'lucide-react';

export default function CancelTokenModal({ isOpen, onClose, token }) {
  const { cancelToken } = useQueue();
  const [reason, setReason] = useState('Customer No-Show');
  const [customReason, setCustomReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !token) return null;

  const handleCancelSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const finalReason = reason === 'Other' ? (customReason.trim() || 'Other') : reason;

    try {
      await cancelToken(token.id, finalReason);
      onClose();
    } catch (err) {
      // Toast handles error display
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-2xl glass-panel bg-slate-900 border border-slate-700/80 shadow-2xl p-6 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center border border-rose-500/20">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Cancel Token</h3>
              <p className="text-xs text-slate-400">Remove token from queue & log cancellation</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Token Details Info Box */}
        <div className="mt-4 p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-400 block">Target Token:</span>
            <span className="text-base font-mono font-bold text-indigo-400">{token.token_number}</span>
          </div>
          <div className="text-right">
            <span className="text-[11px] text-slate-400 block">Customer Name:</span>
            <span className="text-sm font-semibold text-slate-200">{token.customer_name}</span>
          </div>
        </div>

        <form onSubmit={handleCancelSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Reason for Cancellation <span className="text-rose-400">*</span>
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 text-sm text-slate-100 outline-none transition"
            >
              <option value="Customer No-Show">Customer No-Show (Unresponsive)</option>
              <option value="Customer Request">Customer Departed / Requested Cancellation</option>
              <option value="Duplicate Token">Duplicate Token Issued</option>
              <option value="Wrong Queue">Wrong Service Queue / Re-routing</option>
              <option value="Other">Other Reason (Specify below)</option>
            </select>
          </div>

          {reason === 'Other' && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Custom Reason Details
              </label>
              <input
                type="text"
                required
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Specify reason..."
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950/80 border border-slate-800 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 text-sm text-slate-100 placeholder-slate-500 outline-none transition"
              />
            </div>
          )}

          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 leading-relaxed">
            Note: Cancelling will remove this token from the active queue and automatically adjust positions of all subsequent waiting tokens.
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl text-sm font-semibold bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white shadow-lg shadow-rose-600/30 transition active:scale-95 flex items-center gap-2"
            >
              <UserX className="w-4 h-4" />
              <span>{isSubmitting ? 'Cancelling...' : 'Confirm Cancellation'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
