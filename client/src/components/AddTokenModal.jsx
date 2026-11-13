import React, { useState, useEffect } from 'react';
import { useQueue } from '../context/QueueContext';
import { X, UserPlus, Star, Phone, Mail, FileText, Check } from 'lucide-react';

export default function AddTokenModal({ isOpen, onClose, defaultQueueId }) {
  const { queues, addToken } = useQueue();
  const [queueId, setQueueId] = useState(defaultQueueId || '');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [priority, setPriority] = useState('standard');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (defaultQueueId) {
      setQueueId(defaultQueueId);
    } else if (queues && queues.length > 0) {
      setQueueId(queues[0].id);
    }
  }, [defaultQueueId, queues]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!customerName.trim() || !queueId) return;

    setIsSubmitting(true);
    try {
      await addToken({
        queue_id: Number(queueId),
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim(),
        customer_email: customerEmail.trim(),
        priority,
        notes: notes.trim()
      });
      // Clear form
      setCustomerName('');
      setCustomerPhone('');
      setCustomerEmail('');
      setPriority('standard');
      setNotes('');
      onClose();
    } catch (err) {
      // Toast handles error display
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedQueue = queues.find(q => q.id === Number(queueId));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl glass-panel bg-slate-900 border border-slate-700/80 shadow-2xl p-6 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Issue New Token</h3>
              <p className="text-xs text-slate-400">Add a person to the queue and generate a token</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          
          {/* Target Queue */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Select Queue <span className="text-rose-400">*</span>
            </label>
            <select
              value={queueId}
              onChange={(e) => setQueueId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm text-slate-100 outline-none transition"
            >
              {queues.map((q) => (
                <option key={q.id} value={q.id}>
                  {q.name} ({q.prefix}) — {q.waiting_count || 0} waiting
                </option>
              ))}
            </select>
          </div>

          {/* Customer Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Customer / Person Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="e.g., Jonathan Myers"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm text-slate-100 placeholder-slate-500 outline-none transition"
            />
          </div>

          {/* Priority Tier Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Priority Tier
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPriority('standard')}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border text-center transition flex items-center justify-center gap-1.5 ${
                  priority === 'standard'
                    ? 'bg-slate-800 text-white border-indigo-500 shadow-sm'
                    : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:border-slate-700'
                }`}
              >
                <span>Standard</span>
                {priority === 'standard' && <Check className="w-3 h-3 text-indigo-400" />}
              </button>

              <button
                type="button"
                onClick={() => setPriority('priority')}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border text-center transition flex items-center justify-center gap-1.5 ${
                  priority === 'priority'
                    ? 'bg-purple-950/50 text-purple-300 border-purple-500 shadow-sm'
                    : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:border-slate-700'
                }`}
              >
                <span>Priority</span>
                {priority === 'priority' && <Check className="w-3 h-3 text-purple-400" />}
              </button>

              <button
                type="button"
                onClick={() => setPriority('vip')}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border text-center transition flex items-center justify-center gap-1.5 ${
                  priority === 'vip'
                    ? 'bg-amber-950/50 text-amber-300 border-amber-500 shadow-sm'
                    : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:border-slate-700'
                }`}
              >
                <Star className="w-3 h-3 text-amber-400 fill-amber-400/30" />
                <span>VIP</span>
                {priority === 'vip' && <Check className="w-3 h-3 text-amber-400" />}
              </button>
            </div>
          </div>

          {/* Contact Information (Optional) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Phone className="w-3 h-3 text-indigo-400" />
                <span>Phone (Optional)</span>
              </label>
              <input
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="+1 555-0123"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950/80 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm text-slate-100 placeholder-slate-500 outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Mail className="w-3 h-3 text-indigo-400" />
                <span>Email (Optional)</span>
              </label>
              <input
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="customer@domain.com"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950/80 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm text-slate-100 placeholder-slate-500 outline-none transition"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <FileText className="w-3 h-3 text-indigo-400" />
              <span>Service Notes / Reason</span>
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., Billing inquiry, prescription refill #994"
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950/80 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm text-slate-100 placeholder-slate-500 outline-none transition"
            />
          </div>

          {/* Token Generation Preview Card */}
          <div className="p-3 rounded-xl bg-slate-950/90 border border-indigo-500/20 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-slate-400 block">Assigned Queue:</span>
              <span className="text-xs font-semibold text-slate-200">{selectedQueue?.name || 'Selected Queue'}</span>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-indigo-400 block">Token Generated On Save</span>
              <span className="text-xs font-mono font-bold text-white tracking-wider">
                {selectedQueue?.prefix || 'TKN'}-#
              </span>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !customerName.trim()}
              className="px-5 py-2 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white shadow-lg shadow-indigo-600/30 transition active:scale-95 flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              <span>{isSubmitting ? 'Creating Token...' : 'Generate Token'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
