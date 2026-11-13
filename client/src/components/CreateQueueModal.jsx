import React, { useState } from 'react';
import { useQueue } from '../context/QueueContext';
import { X, Layers, Hash, Monitor, AlignLeft } from 'lucide-react';

export default function CreateQueueModal({ isOpen, onClose }) {
  const { createQueue } = useQueue();
  const [name, setName] = useState('');
  const [prefix, setPrefix] = useState('');
  const [counterName, setCounterName] = useState('Counter 1');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  // Auto-generate prefix recommendation when typing name
  const handleNameChange = (e) => {
    const val = e.target.value;
    setName(val);
    if (!prefix || prefix.length <= 4) {
      const words = val.trim().split(/\s+/);
      if (words.length >= 2 && words[0] && words[1]) {
        setPrefix((words[0].slice(0, 2) + words[1].slice(0, 2)).toUpperCase());
      } else if (words[0] && words[0].length >= 3) {
        setPrefix(words[0].slice(0, 4).toUpperCase());
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      await createQueue({
        name: name.trim(),
        prefix: prefix.trim().toUpperCase(),
        counter_name: counterName.trim(),
        description: description.trim()
      });
      setName('');
      setPrefix('');
      setCounterName('Counter 1');
      setDescription('');
      onClose();
    } catch (err) {
      // Toast handles error display
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl glass-panel bg-slate-900 border border-slate-700/80 shadow-2xl p-6 overflow-hidden">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Create New Queue</h3>
              <p className="text-xs text-slate-400">Configure a dedicated service queue and counter</p>
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
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Queue Name <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={name}
                onChange={handleNameChange}
                placeholder="e.g., Pharmacy Consultation, Express Checkout"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm text-slate-100 placeholder-slate-500 outline-none transition"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-indigo-400" />
                <span>Token Prefix</span>
              </label>
              <input
                type="text"
                maxLength={6}
                value={prefix}
                onChange={(e) => setPrefix(e.target.value.toUpperCase())}
                placeholder="e.g., PHRM, BILL"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm font-mono text-slate-100 uppercase placeholder-slate-500 outline-none transition"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Format: <span className="text-indigo-400 font-mono">{prefix || 'XXX'}-001</span>
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Monitor className="w-3.5 h-3.5 text-indigo-400" />
                <span>Counter / Desk Name</span>
              </label>
              <input
                type="text"
                value={counterName}
                onChange={(e) => setCounterName(e.target.value)}
                placeholder="e.g., Counter 1, Desk B"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm text-slate-100 placeholder-slate-500 outline-none transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <AlignLeft className="w-3.5 h-3.5 text-indigo-400" />
              <span>Description / Purpose (Optional)</span>
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., General patient checkups and prescription pickups"
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950/80 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm text-slate-100 placeholder-slate-500 outline-none resize-none transition"
            />
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
              disabled={isSubmitting || !name.trim()}
              className="px-5 py-2 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white shadow-lg shadow-indigo-600/30 transition active:scale-95"
            >
              {isSubmitting ? 'Creating...' : 'Create Queue'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
