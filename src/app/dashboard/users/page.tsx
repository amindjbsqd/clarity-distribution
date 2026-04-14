'use client';
import { useState, useEffect } from 'react';
import { DataTable, StatusBadge, Modal, Button } from '@/components/ui';
import { ROLE_COLORS } from '@/types';
import { Plus, Edit } from 'lucide-react';

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [modal, setModal] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', password: '', role: 'commercial' });
  const [error, setError] = useState('');

  useEffect(() => { load(); }, []);
  async function load() { setLoading(true); const r = await fetch('/api/users'); const d = await r.json(); setUsers(d.users || []); setLoading(false); }

  function openCreate() { setEditItem(null); setForm({ full_name: '', email: '', phone: '', password: '', role: 'commercial' }); setError(''); setModal(true); }
  function openEdit(u: any) { setEditItem(u); setForm({ full_name: u.full_name, email: u.email, phone: u.phone || '', password: '', role: u.role }); setError(''); setModal(true); }

  async function handleSave() {
    setError('');
    if (editItem) {
      const payload: any = { id: editItem.id, full_name: form.full_name, phone: form.phone, role: form.role };
      if (form.password) payload.password = form.password;
      const res = await fetch('/api/users', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
    } else {
      const res = await fetch('/api/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
    }
    setModal(false); setForm({ full_name: '', email: '', phone: '', password: '', role: 'commercial' }); setEditItem(null); load();
  }

  async function toggleActive(u: any) {
    await fetch('/api/users', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: u.id, active: !u.active }) });
    load();
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end"><Button onClick={openCreate}><Plus className="w-4 h-4" />Create User</Button></div>
      {loading ? <div className="bg-white rounded-2xl p-12 text-center text-gray-400">Loading...</div> : (
        <DataTable headers={['Name', 'Email', 'Phone', 'Role', 'Status', 'Last Login', 'Actions']}>
          {users.map((u: any) => (
            <tr key={u.id} className="hover:bg-gray-50/50 transition">
              <td className="px-4 py-3"><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-xl bg-red-100 flex items-center justify-center text-red-700 font-bold text-xs">{u.full_name.split(' ').map((n: string) => n[0]).join('')}</div><span className="text-sm font-bold text-gray-900">{u.full_name}</span></div></td>
              <td className="px-4 py-3 text-sm text-gray-600">{u.email}</td>
              <td className="px-4 py-3 text-sm text-gray-600">{u.phone || '—'}</td>
              <td className="px-4 py-3"><StatusBadge status={u.role} colorMap={ROLE_COLORS} /></td>
              <td className="px-4 py-3">
                <button onClick={() => toggleActive(u)} className={`px-2 py-0.5 rounded-full text-xs font-semibold cursor-pointer hover:opacity-80 ${u.active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                  {u.active ? 'Active' : 'Inactive'}
                </button>
              </td>
              <td className="px-4 py-3 text-sm text-gray-500">{u.last_login ? new Date(u.last_login).toLocaleString('fr-MA') : 'Never'}</td>
              <td className="px-4 py-3"><button onClick={() => openEdit(u)} className="p-1.5 rounded-lg hover:bg-gray-100"><Edit className="w-4 h-4 text-gray-500" /></button></td>
            </tr>
          ))}
        </DataTable>
      )}
      <Modal open={modal} onClose={() => setModal(false)} title={editItem ? 'Edit User' : 'Create User'} wide>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label><input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-red-500/20 outline-none" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Email *</label><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} disabled={!!editItem} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm disabled:opacity-50" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Phone</label><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">{editItem ? 'New Password (leave empty to keep)' : 'Password * (min 8)'}</label><input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Role</label><select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"><option value="admin">Admin</option><option value="commercial">Commercial</option><option value="stock_manager">Stock Manager</option><option value="accountant">Accountant</option><option value="supervisor">Supervisor</option></select></div>
        </div>
        {error && <p className="text-sm text-red-500 mt-3">{error}</p>}
        <div className="mt-6 flex justify-end gap-3"><Button variant="secondary" onClick={() => setModal(false)}>Cancel</Button><Button onClick={handleSave}>{editItem ? 'Update User' : 'Create User'}</Button></div>
      </Modal>
    </div>
  );
}
