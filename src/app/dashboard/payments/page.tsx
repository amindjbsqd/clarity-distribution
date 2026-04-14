'use client';
import { useState, useEffect } from 'react';
import { DataTable, StatusBadge, KPICard } from '@/components/ui';
import { PAYMENT_STATUS_COLORS } from '@/types';
import { CreditCard } from 'lucide-react';

export default function PaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { fetch('/api/payments').then(r => r.json()).then(d => { setPayments(d.payments || []); setLoading(false); }); }, []);
  const fmt = (n: number) => new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD', minimumFractionDigits: 0 }).format(n);
  const paid = payments.filter((p: any) => p.status === 'paid').reduce((s: number, p: any) => s + Number(p.amount), 0);
  const pending = payments.filter((p: any) => p.status === 'pending').reduce((s: number, p: any) => s + Number(p.amount), 0);
  const unpaid = payments.filter((p: any) => p.status === 'unpaid').reduce((s: number, p: any) => s + Number(p.amount), 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KPICard icon={CreditCard} label="Total Collected" value={fmt(paid)} color="green" />
        <KPICard icon={CreditCard} label="Pending" value={fmt(pending)} color="amber" />
        <KPICard icon={CreditCard} label="Unpaid" value={fmt(unpaid)} color="red" />
      </div>
      {loading ? <div className="bg-white rounded-2xl p-12 text-center text-gray-400">Loading...</div> : (
        <DataTable headers={['Order', 'Customer', 'Type', 'Amount', 'Status', 'Date']}>
          {payments.map((p: any) => (
            <tr key={p.id} className="hover:bg-gray-50/50 transition">
              <td className="px-4 py-3 text-sm font-bold text-gray-900">{p.order?.order_number}</td>
              <td className="px-4 py-3 text-sm text-gray-900">{p.order?.customer_name}</td>
              <td className="px-4 py-3 text-sm text-gray-600">{p.payment_type}</td>
              <td className="px-4 py-3 text-sm font-bold text-gray-900">{fmt(Number(p.amount))}</td>
              <td className="px-4 py-3"><StatusBadge status={p.status} colorMap={PAYMENT_STATUS_COLORS} /></td>
              <td className="px-4 py-3 text-sm text-gray-500">{new Date(p.created_at).toLocaleDateString('fr-MA')}</td>
            </tr>
          ))}
          {payments.length === 0 && <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-400">No payments yet</td></tr>}
        </DataTable>
      )}
    </div>
  );
}
