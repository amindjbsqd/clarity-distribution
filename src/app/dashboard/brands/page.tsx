'use client';
import { useState, useEffect } from 'react';
import { Modal, Button } from '@/components/ui';
import { Plus, Edit, Trash, Tag } from 'lucide-react';

export default function Page() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  useEffect(() => { load(); }, []);
  async function load() { setLoading(true); const r = await fetch('/api/brands'); const d = await r.json(); setItems(d.brands || []); setLoading(false); }

  function openCreate() { setEditItem(null); setName(''); setError(''); setModal(true); }
  function openEdit(item: any) { setEditItem(item); setName(item.name); setError(''); setModal(true); }

  async function handleSave() {
    setError('');
    if (editItem) {
      const res = await fetch('/api/brands', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editItem.id, name }) });
      if (!res.ok) { const d = await res.json(); setError(d.error); return; }
    } else {
      const res = await fetch('/api/brands', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) });
      if (!res.ok) { const d = await res.json(); setError(d.error); return; }
    }
    setModal(false); setName(''); setEditItem(null); load();
  }

  async function handleDelete(item: any) {
    if (!confirm(`Delete brand "${item.name}"?`)) return;
    const res = await fetch('/api/brands', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: item.id }) });
    if (!res.ok) { const d = await res.json(); alert(d.error || 'Cannot delete'); return; }
    load();
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end"><Button onClick={openCreate}><Plus className="w-4 h-4" />Add Brand</Button></div>
      {loading ? <div className="bg-white rounded-2xl p-12 text-center text-gray-400">Loading...</div> : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {items.map((item: any) => (
            <div key={item.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center justify-between hover:shadow-md transition">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center"><Tag className="w-5 h-5 text-red-600" /></div>
                <div><span className="font-semibold text-gray-900 text-sm">{item.name}</span>{item._count?.products !== undefined && <p className="text-xs text-gray-400">{item._count.products} products</p>}</div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => openEdit(item)} className="p-1.5 rounded-lg hover:bg-gray-100"><Edit className="w-4 h-4 text-gray-400" /></button>
                <button onClick={() => handleDelete(item)} className="p-1.5 rounded-lg hover:bg-red-50"><Trash className="w-4 h-4 text-red-400" /></button>
              </div>
            </div>
          ))}
          {items.length === 0 && <div className="col-span-3 bg-white rounded-2xl p-12 text-center text-gray-400">No brands yet</div>}
        </div>
      )}
      <Modal open={modal} onClose={() => setModal(false)} title={editItem ? 'Edit Brand' : 'Add Brand'}>
        <div className="space-y-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Name *</label><input value={name} onChange={(e) => setName(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-red-500/20 outline-none" placeholder="Enter name..." /></div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <div className="flex justify-end gap-3"><Button variant="secondary" onClick={() => setModal(false)}>Cancel</Button><Button onClick={handleSave}>{editItem ? 'Update' : 'Save'}</Button></div>
        </div>
      </Modal>
    </div>
  );
}
