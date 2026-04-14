'use client';
import { useState, useEffect } from 'react';
import { DataTable, StatusBadge, KPICard, Modal, Button } from '@/components/ui';
import { CREDIT_STATUS_COLORS } from '@/types';
import { AlertCircle, DollarSign, Eye } from 'lucide-react';

export default function CreditsPage() {
  const [credits, setCredits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [payModal, setPayModal] = useState<any>(null);
  const [detailModal, setDetailModal] = useState<any>(null);
  const [payAmount, setPayAmount] = useState('');
  const [payNote, setPayNote] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, []);
  async function load() { setLoading(true); const r = await fetch('/api/credits'); const d = await r.json(); setCredits(d.credits || []); setLoading(false); }
  const fmt = (n: number) => new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD', minimumFractionDigits: 0 }).format(n);
  const byS = (s: string) => credits.filter((c: any) => c.status === s);

  const totalRemaining = credits.reduce((s: number, c: any) => s + Number(c.remaining_amount || 0), 0);
  const totalAmount = credits.reduce((s: number, c: any) => s + Number(c.amount), 0);
  const totalPaid = totalAmount - totalRemaining;

  async function handleRecordPayment() {
    if (!payModal || !payAmount) return;
    setSaving(true);
    const res = await fetch('/api/credits/payments', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credit_id: payModal.id, amount: parseFloat(payAmount), note: payNote }),
    });
    if (res.ok) { setPayModal(null); setPayAmount(''); setPayNote(''); load(); }
    setSaving(false);
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <KPICard icon={DollarSign} label="Total Credits" value={fmt(totalAmount)} color="blue" />
        <KPICard icon={DollarSign} label="Paid So Far" value={fmt(totalPaid)} color="green" />
        <KPICard icon={AlertCircle} label="Remaining" value={fmt(totalRemaining)} color="red" alert={totalRemaining > 0} />
        <KPICard icon={AlertCircle} label="Overdue" value={byS('overdue').length} color="amber" alert={byS('overdue').length > 0} />
      </div>

      <p className="text-xs text-gray-400">Credits are automatically created from orders with credit payment type. Record daily payments to reduce the balance.</p>

      {loading ? <div className="bg-white rounded-2xl p-12 text-center text-gray-400">Loading...</div> : (
        <DataTable headers={['Customer', 'Total', 'Paid', 'Remaining', 'Due Date', 'Status', 'Payments', 'Actions']}>
          {credits.map((c: any) => {
            const paid = Number(c.amount) - Number(c.remaining_amount || 0);
            const pct = Number(c.amount) > 0 ? (paid / Number(c.amount)) * 100 : 0;
            return (
              <tr key={c.id} className="hover:bg-gray-50/50 transition">
                <td className="px-4 py-3 text-sm font-bold text-gray-900">{c.customer_name}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{fmt(Number(c.amount))}</td>
                <td className="px-4 py-3 text-sm text-emerald-700 font-semibold">{fmt(paid)}</td>
                <td className="px-4 py-3">
                  <div>
                    <span className="text-sm font-bold text-red-600">{fmt(Number(c.remaining_amount || 0))}</span>
                    <div className="w-full h-1.5 bg-gray-200 rounded-full mt-1"><div className="h-1.5 bg-emerald-500 rounded-full transition-all" style={{ width: `${Math.min(100, pct)}%` }} /></div>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">{new Date(c.due_date).toLocaleDateString('fr-MA')}</td>
                <td className="px-4 py-3"><StatusBadge status={c.status} colorMap={CREDIT_STATUS_COLORS} /></td>
                <td className="px-4 py-3 text-sm text-gray-500">{c.credit_payments?.length || 0}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <button onClick={() => setDetailModal(c)} className="p-1.5 rounded-lg hover:bg-gray-100"><Eye className="w-4 h-4 text-gray-500" /></button>
                    {c.status !== 'settled' && (
                      <Button onClick={() => setPayModal(c)} className="text-xs py-1 px-2">
                        <DollarSign className="w-3 h-3" />Pay
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
          {credits.length === 0 && <tr><td colSpan={8} className="px-4 py-12 text-center text-gray-400">No credits yet. Create an order with credit payment to see them here.</td></tr>}
        </DataTable>
      )}

      {/* Record Payment Modal */}
      <Modal open={!!payModal} onClose={() => setPayModal(null)} title={`Record Payment — ${payModal?.customer_name || ''}`}>
        {payModal && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-xl p-4 grid grid-cols-3 gap-4 text-center">
              <div><p className="text-xs text-gray-500">Total</p><p className="font-bold text-gray-900">{fmt(Number(payModal.amount))}</p></div>
              <div><p className="text-xs text-gray-500">Paid</p><p className="font-bold text-emerald-700">{fmt(Number(payModal.amount) - Number(payModal.remaining_amount || 0))}</p></div>
              <div><p className="text-xs text-gray-500">Remaining</p><p className="font-bold text-red-600">{fmt(Number(payModal.remaining_amount || 0))}</p></div>
            </div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Payment Amount (MAD) *</label><input type="number" value={payAmount} onChange={e => setPayAmount(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm" placeholder="0" max={Number(payModal.remaining_amount || 0)} /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Note</label><input value={payNote} onChange={e => setPayNote(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm" placeholder="Cash payment..." /></div>
            {payAmount && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-center">
                <p className="text-sm text-emerald-700">New remaining after payment</p>
                <p className="text-2xl font-extrabold text-emerald-800">{fmt(Math.max(0, Number(payModal.remaining_amount || 0) - (parseFloat(payAmount) || 0)))}</p>
              </div>
            )}
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setPayModal(null)}>Cancel</Button>
              <Button onClick={handleRecordPayment} disabled={saving || !payAmount}>{saving ? 'Saving...' : 'Record Payment'}</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Payment History Detail */}
      <Modal open={!!detailModal} onClose={() => setDetailModal(null)} title={`Credit History — ${detailModal?.customer_name || ''}`} wide>
        {detailModal && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-xl p-4 grid grid-cols-4 gap-4 text-center">
              <div><p className="text-xs text-gray-500">Total</p><p className="font-bold">{fmt(Number(detailModal.amount))}</p></div>
              <div><p className="text-xs text-gray-500">Paid</p><p className="font-bold text-emerald-700">{fmt(Number(detailModal.amount) - Number(detailModal.remaining_amount || 0))}</p></div>
              <div><p className="text-xs text-gray-500">Remaining</p><p className="font-bold text-red-600">{fmt(Number(detailModal.remaining_amount || 0))}</p></div>
              <div><p className="text-xs text-gray-500">Due</p><p className="font-bold">{new Date(detailModal.due_date).toLocaleDateString('fr-MA')}</p></div>
            </div>

            <h4 className="text-xs font-bold text-gray-500 uppercase">Payment History ({detailModal.credit_payments?.length || 0})</h4>
            {detailModal.credit_payments?.length > 0 ? (
              <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100">
                {detailModal.credit_payments.map((p: any) => (
                  <div key={p.id} className="flex items-center justify-between p-3">
                    <div>
                      <p className="text-sm font-semibold text-emerald-700">+{fmt(Number(p.amount))}</p>
                      {p.note && <p className="text-xs text-gray-500">{p.note}</p>}
                    </div>
                    <p className="text-xs text-gray-400">{new Date(p.created_at).toLocaleString('fr-MA')}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 text-center py-6 bg-gray-50 rounded-xl">No payments recorded yet</p>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
