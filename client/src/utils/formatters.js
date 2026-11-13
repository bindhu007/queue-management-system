export function formatWaitTime(minutes) {
  if (minutes === undefined || minutes === null) return '0 min';
  if (minutes < 1) return '< 1 min';
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours}h ${mins}m`;
  }
  return `${Math.round(minutes * 10) / 10} min`;
}

export function formatTimestamp(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function getPriorityBadge(priority) {
  const p = (priority || 'standard').toLowerCase();
  switch (p) {
    case 'vip':
      return {
        label: 'VIP',
        bg: 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
      };
    case 'priority':
      return {
        label: 'Priority',
        bg: 'bg-purple-500/10 text-purple-400 border border-purple-500/30'
      };
    default:
      return {
        label: 'Standard',
        bg: 'bg-slate-800 text-slate-300 border border-slate-700'
      };
  }
}

export function getStatusBadge(status) {
  switch (status) {
    case 'WAITING':
      return { label: 'Waiting', bg: 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30' };
    case 'IN_SERVICE':
      return { label: 'In Service', bg: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 animate-pulse' };
    case 'COMPLETED':
      return { label: 'Completed', bg: 'bg-teal-500/10 text-teal-400 border border-teal-500/30' };
    case 'CANCELLED':
      return { label: 'Cancelled', bg: 'bg-rose-500/10 text-rose-400 border border-rose-500/30' };
    default:
      return { label: status, bg: 'bg-slate-800 text-slate-400 border border-slate-700' };
  }
}
