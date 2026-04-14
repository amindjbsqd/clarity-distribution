import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

// ─── STATUS BADGE ───
export function StatusBadge({ status, colorMap }: { status: string; colorMap: Record<string, string> }) {
  const color = colorMap[status] || 'bg-gray-100 text-gray-700';
  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide uppercase', color)}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}

// ─── KPI CARD ───
export function KPICard({ icon: Icon, label, value, sub, color = 'red', alert }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string; value: string | number; sub?: string;
  color?: 'red' | 'green' | 'blue' | 'amber';
  alert?: boolean;
}) {
  const colors = { red: 'bg-red-50 text-red-600', green: 'bg-emerald-50 text-emerald-600', blue: 'bg-blue-50 text-blue-600', amber: 'bg-amber-50 text-amber-600' };
  return (
    <div className={cn('relative bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300', alert && 'ring-2 ring-red-300')}>
      {alert && <span className="absolute top-3 right-3 flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" /><span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" /></span>}
      <div className="flex items-start gap-4">
        <div className={cn('p-3 rounded-xl', colors[color])}><Icon className="w-6 h-6" /></div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-500 tracking-wide">{label}</p>
          <p className="text-2xl font-extrabold text-gray-900 mt-1 tracking-tight">{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
        </div>
      </div>
    </div>
  );
}

// ─── TABLE ───
export function DataTable({ headers, children }: { headers: string[]; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              {headers.map((h, i) => <th key={i} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">{children}</tbody>
        </table>
      </div>
    </div>
  );
}

// ─── MODAL ───
export function Modal({ open, onClose, title, children, wide }: {
  open: boolean; onClose: () => void; title: string;
  children: React.ReactNode; wide?: boolean;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}>
      <div className={cn('bg-white rounded-2xl shadow-2xl max-h-[90vh] flex flex-col', wide ? 'w-full max-w-3xl' : 'w-full max-w-lg')}
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 transition"><X className="w-5 h-5 text-gray-500" /></button>
        </div>
        <div className="px-6 py-4 overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  );
}

// ─── BUTTON ───
export function Button({ children, variant = 'primary', className, ...props }: {
  children: React.ReactNode; variant?: 'primary' | 'secondary' | 'danger';
  className?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const styles = {
    primary: 'bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-600/20',
    secondary: 'border border-gray-200 text-gray-600 hover:bg-gray-50',
    danger: 'bg-red-100 text-red-700 hover:bg-red-200',
  };
  return (
    <button className={cn('flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition', styles[variant], className)} {...props}>
      {children}
    </button>
  );
}
