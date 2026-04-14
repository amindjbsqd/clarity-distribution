'use client';
import { useState, useEffect, useRef } from 'react';
import { DataTable, StatusBadge, KPICard, Modal, Button } from '@/components/ui';
import { CHEQUE_STATUS_COLORS } from '@/types';
import { BookCheck, Eye, Camera, Save } from 'lucide-react';

export default function ChequesPage() {
  const [cheques, setCheques] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editModal, setEditModal] = useState<any>(null);
  const [viewImage, setViewImage] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ reference: '', bank: '', status: '', issue_date: '', arrival_date: '', deposit_date: '', note: '', image_url: '' });
  const [saving, setSaving] = useState(false);
  const imgRef = useRef<HTMLInputElement>(null);

  useEffect(() => { load(); }, []);
  async function load() { setLoading(true); const r = await fetch('/api/cheques'); const d = await r.json(); setCheques(d.cheques || []); setLoading(false); }
  const fmt = (n: number) => new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD', minimumFractionDigits: 0 }).format(n);
  const byS = (s: string) => cheques.filter((c: any) => c.status === s);
  const fmtDate = (d: string | null) => d ? new Date(d).toISOString().split('T')[0] : '';

  function openEdit(c: any) {
    setEditForm({
      reference: c.reference || '', bank: c.bank || '', status: c.status || 'pending',
      issue_date: fmtDate(c.issue_date), arrival_date: fmtDate(c.arrival_date), deposit_date: fmtDate(c.deposit_date),
      note: c.note || '', image_url: c.image_url || '',
    });
    setEditModal(c);
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    const fd = new FormData(); fd.append('file', file);
    const res = await fetch('/api/upload', { method: 'POST', body: fd });
    const d = await res.json();
    if (d.url) setEditForm(f => ({ ...f, image_url: d.url }));
  }

  async function handleSave() {
    if (!editModal) return;
    setSaving(true);
    const res = await fetch('/api/cheques', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: editModal.id, ...editForm }),
    });
    if (res.ok) { setEditModal(null); load(); }
    setSaving(false);
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
        <KPICard icon={BookCheck} label="Pending" value={byS('pending').length} color="amber" />
        <KPICard icon={BookCheck} label="Received" value={byS('received').length} color="blue" />
        <KPICard icon={BookCheck} label="Deposited" value={byS('deposited').length} color="indigo" />
        <KPICard icon={BookCheck} label="Cleared" value={byS('cleared').length} color="green" />
        <KPICard icon={BookCheck} label="Bounced" value={byS('bounced').length} color="red" alert={byS('bounced').length > 0} />
      </div>

      <p className="text-xs text-gray-400">Cheques are automatically created from orders with cheque payment type. Click on a cheque to edit details.</p>

      {loading ? <div className="bg-white rounded-2xl p-12 text-center text-gray-400">Loading...</div> : (
        <DataTable headers={['', 'Reference', 'Order', 'Customer', 'Bank', 'Amount', 'Issue Date', 'Arrival', 'Deposit', 'Status', '']}>
          {cheques.map((c: any) => (
            <tr key={c.id} className="hover:bg-gray-50/50 transition cursor-pointer" onClick={() => openEdit(c)}>
              <td className="px-4 py-3">
                {c.image_url ? (
                  <button onClick={(e) => { e.stopPropagation(); setViewImage(c.image_url); }}>
                    <img src={c.image_url} className="w-10 h-8 rounded-md object-cover border border-gray-200 hover:opacity-80 transition" />
                  </button>
                ) : (
                  <div className="w-10 h-8 rounded-md bg-gray-50 border border-dashed border-gray-300 flex items-center justify-center">
                    <Camera className="w-4 h-4 text-gray-400" />
                  </div>
                )}
              </td>
              <td className="px-4 py-3 text-sm font-bold text-gray-900">{c.reference}</td>
              <td className="px-4 py-3 text-sm text-gray-600">{c.payment?.order?.order_number || c.order_id?.slice(0, 8) || '—'}</td>
              <td className="px-4 py-3 text-sm text-gray-900">{c.customer_name}</td>
              <td className="px-4 py-3 text-sm text-gray-600">{c.bank}</td>
              <td className="px-4 py-3 text-sm font-bold text-gray-900">{fmt(Number(c.amount))}</td>
              <td className="px-4 py-3 text-sm text-gray-500">{new Date(c.issue_date).toLocaleDateString('fr-MA')}</td>
              <td className="px-4 py-3 text-sm text-gray-500">{c.arrival_date ? new Date(c.arrival_date).toLocaleDateString('fr-MA') : '—'}</td>
              <td className="px-4 py-3 text-sm text-gray-500">{c.deposit_date ? new Date(c.deposit_date).toLocaleDateString('fr-MA') : '—'}</td>
              <td className="px-4 py-3"><StatusBadge status={c.status} colorMap={CHEQUE_STATUS_COLORS} /></td>
              <td className="px-4 py-3"><button className="p-1.5 rounded-lg hover:bg-gray-100"><Eye className="w-4 h-4 text-gray-500" /></button></td>
            </tr>
          ))}
          {cheques.length === 0 && <tr><td colSpan={11} className="px-4 py-12 text-center text-gray-400">No cheques yet. Create an order with cheque payment to see them here.</td></tr>}
        </DataTable>
      )}

      {/* Edit Cheque Modal */}
      <Modal open={!!editModal} onClose={() => setEditModal(null)} title={`Edit Cheque — ${editModal?.reference || ''}`} wide>
        {editModal && (
          <div className="space-y-4">
            {/* Cheque Image */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Cheque Photo</label>
              <div className="flex items-center gap-4">
                {editForm.image_url ? (
                  <img src={editForm.image_url} className="w-40 h-24 rounded-xl object-cover border border-gray-200" />
                ) : (
                  <div className="w-40 h-24 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50"><Camera className="w-10 h-10 text-gray-300" /></div>
                )}
                <div>
                  <input ref={imgRef} type="file" accept="image/*" capture="environment" onChange={handleImageUpload} className="hidden" />
                  <Button variant="secondary" onClick={() => imgRef.current?.click()}>
                    <Camera className="w-4 h-4" />{editForm.image_url ? 'Change Photo' : 'Scan / Upload'}
                  </Button>
                  <p className="text-xs text-gray-400 mt-1">Camera or file upload</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Reference</label><input value={editForm.reference} onChange={e => setEditForm({...editForm, reference: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Bank</label><input value={editForm.bank} onChange={e => setEditForm({...editForm, bank: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select value={editForm.status} onChange={e => setEditForm({...editForm, status: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm">
                  {['pending','received','deposited','cleared','bounced'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Issue Date</label><input type="date" value={editForm.issue_date} onChange={e => setEditForm({...editForm, issue_date: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Arrival Date</label><input type="date" value={editForm.arrival_date} onChange={e => setEditForm({...editForm, arrival_date: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Deposit Date</label><input type="date" value={editForm.deposit_date} onChange={e => setEditForm({...editForm, deposit_date: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm" /></div>
              <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Note</label><input value={editForm.note} onChange={e => setEditForm({...editForm, note: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm" /></div>
            </div>

            <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
              <Button variant="secondary" onClick={() => setEditModal(null)}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving}><Save className="w-4 h-4" />{saving ? 'Saving...' : 'Save Changes'}</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* View Image */}
      <Modal open={!!viewImage} onClose={() => setViewImage(null)} title="Cheque Image" wide>
        {viewImage && <div className="flex justify-center"><img src={viewImage} className="max-w-full max-h-[70vh] rounded-xl border border-gray-200" /></div>}
      </Modal>
    </div>
  );
}
