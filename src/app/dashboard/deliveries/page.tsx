'use client';
import { useState, useEffect } from 'react';
import { DataTable, Modal, Button } from '@/components/ui';
import { Plus, Edit } from 'lucide-react';

export default function DeliveriesPage() {
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [form, setForm] = useState({ name: '', phone: '', email: '' });

  useEffect(() => { load(); }, []);
  async function load() { setLoading(true); const r = await fetch('/api/deliveries'); const d = await r.json(); setCompanies(d.companies || []); setLoading(false); }

  function openCreate() { setEditItem(null); setForm({ name: '', phone: '', email: '' }); setModal(true); }
  function openEdit(item: any) { setEditItem(item); setForm({ name: item.name, phone: item.phone || '', email: item.email || '' }); setModal(true); }

  async function handleSave() {
    if (editItem) {
      const res = await fetch('/api/deliveries', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editItem.id, ...form }) });
      if (res.ok) { setModal(false); load(); }
    } else {
      const res = await fetch('/api/deliveries', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      if (res.ok) { setModal(false); setForm({ name: '', phone: '', email: '' }); load(); }
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end"><Button onClick={openCreate}><Plus className="w-4 h-4" />Add Company</Button></div>
      {loading ? <div className="bg-white rounded-2xl p-12 text-center text-gray-400">Loading...</div> : (
        <DataTable headers={['Name', 'Phone', 'Email', 'Status', 'Actions']}>
          {companies.map((d: any) => (
            <tr key={d.id} className="hover:bg-gray-50/50 transition">
              <td className="px-4 py-3 text-sm font-bold text-gray-900">{d.name}</td>
              <td className="px-4 py-3 text-sm text-gray-600">{d.phone || '—'}</td>
              <td className="px-4 py-3 text-sm text-gray-600">{d.email || '—'}</td>
              <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${d.active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>{d.active ? 'Active' : 'Inactive'}</span></td>
              <td className="px-4 py-3"><button onClick={() => openEdit(d)} className="p-1.5 rounded-lg hover:bg-gray-100"><Edit className="w-4 h-4 text-gray-500" /></button></td>
            </tr>
          ))}
          {companies.length === 0 && <tr><td colSpan={5} className="px-4 py-12 text-center text-gray-400">No delivery companies yet</td></tr>}
        </DataTable>
      )}
      <Modal open={modal} onClose={() => setModal(false)} title={editItem ? 'Edit Delivery Company' : 'Add Delivery Company'}>
        <div className="space-y-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Name *</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm" placeholder="Amana Express" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Phone</label><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm" placeholder="+212..." /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Email</label><input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm" placeholder="contact@..." /></div>
          <div className="flex justify-end gap-3"><Button variant="secondary" onClick={() => setModal(false)}>Cancel</Button><Button onClick={handleSave}>{editItem ? 'Update' : 'Save'}</Button></div>
        </div>
      </Modal>
    </div>
  );
}
