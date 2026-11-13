import React from 'react';
import { X, Printer, QrCode, Clock, Users, CheckCircle } from 'lucide-react';
import { formatTimestamp, getPriorityBadge } from '../utils/formatters';

export default function TokenSlipModal({ isOpen, onClose, token, queue }) {
  if (!isOpen || !token) return null;

  const prioBadge = getPriorityBadge(token.priority);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm rounded-2xl glass-panel bg-slate-900 border border-slate-700/80 shadow-2xl p-6 overflow-hidden">
        
        {/* Modal Controls */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Token Ticket Slip
          </span>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Ticket Area */}
        <div id="printable-slip" className="my-4 p-5 rounded-2xl bg-white text-slate-900 shadow-xl border border-slate-200 flex flex-col items-center text-center font-sans">
          
          <div className="text-[11px] font-bold tracking-widest text-indigo-700 uppercase mb-1">
            Q-FLOW SERVICE TICKET
          </div>
          <div className="text-xs text-slate-500 font-medium mb-3">
            {queue?.name || token.queue_name || 'Service Queue'}
          </div>

          {/* Big Token Number */}
          <div className="w-full py-3 my-1 rounded-xl bg-slate-100 border border-slate-200">
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block">YOUR TOKEN NUMBER</span>
            <span className="text-4xl font-extrabold font-mono tracking-tight text-indigo-950">
              {token.token_number}
            </span>
          </div>

          {/* Details Grid */}
          <div className="w-full grid grid-cols-2 gap-2 my-3 text-left text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
            <div>
              <span className="text-[10px] text-slate-500 block uppercase">Customer:</span>
              <span className="font-bold text-slate-800 truncate block">{token.customer_name}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block uppercase">Position:</span>
              <span className="font-bold text-indigo-700">#{token.position || '—'} in line</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block uppercase">Counter:</span>
              <span className="font-semibold text-slate-700">{queue?.counter_name || 'Counter 1'}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block uppercase">Issued:</span>
              <span className="font-semibold text-slate-700">{formatTimestamp(token.created_at)}</span>
            </div>
          </div>

          {/* Barcode Mockup */}
          <div className="w-full flex flex-col items-center justify-center my-2">
            <div className="flex items-center gap-1 h-9 px-4 bg-slate-100 rounded">
              <span className="w-1.5 h-7 bg-slate-900"></span>
              <span className="w-0.5 h-7 bg-slate-900"></span>
              <span className="w-1 h-7 bg-slate-900"></span>
              <span className="w-2 h-7 bg-slate-900"></span>
              <span className="w-0.5 h-7 bg-slate-900"></span>
              <span className="w-1.5 h-7 bg-slate-900"></span>
              <span className="w-2.5 h-7 bg-slate-900"></span>
              <span className="w-1 h-7 bg-slate-900"></span>
              <span className="w-0.5 h-7 bg-slate-900"></span>
              <span className="w-2 h-7 bg-slate-900"></span>
            </div>
            <span className="text-[9px] font-mono tracking-widest text-slate-400 mt-1">
              *{token.token_number}*
            </span>
          </div>

          <div className="text-[10px] text-slate-400 mt-1">
            Please watch the live display monitor for your token call.
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between gap-3 pt-2">
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-xl text-sm font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            Close
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 py-2 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition flex items-center justify-center gap-2"
          >
            <Printer className="w-4 h-4" />
            <span>Print Slip</span>
          </button>
        </div>

      </div>
    </div>
  );
}
