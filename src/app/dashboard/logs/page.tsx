'use client';
import { useState, useEffect } from 'react';
import { DataTable } from '@/components/ui';
import { Search } from 'lucide-react';

export default function LogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [moduleF, setModuleF] = useState('all');

  useEffect(() => { load(); }, [moduleF]);
  async function load() { setLoading(true); const r = await fetch(`/api/logs?module=${moduleF}`); const d = await r.json(); setLogs(d.logs || []); setLoading(false); }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <select value={moduleF} onChange={(e) => setModuleF(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white">
          <option value="all">All Modules</option>
          {['Products', 'Orders', 'Stock', 'Payments', 'Users', 'Invoices', 'Cheques', 'Credits', 'Brands', 'Categories', 'Deliveries', 'Auth'].map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>
      {loading ? <div className="bg-white rounded-2xl p-12 text-center text-gray-400">Loading...</div> : (
        <DataTable headers={['User', 'Action', 'Module', 'Description', 'Timestamp']}>
          {logs.map((l: any) => (
            <tr key={l.id} className="hover:bg-gray-50/50 transition">
              <td className="px-4 py-3"><div className="flex items-center gap-2"><div className="w-7 h-7 rounded-lg bg-red-100 flex items-center justify-center text-red-700 font-bold text-[10px]">{l.user?.full_name?.split(' ').map((n: string) => n[0]).join('') || '?'}</div><span className="text-sm text-gray-900">{l.user?.full_name}</span></div></td>
              <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">{l.action}</span></td>
              <td className="px-4 py-3 text-sm text-gray-600">{l.module}</td>
              <td className="px-4 py-3 text-sm text-gray-900">{l.description}</td>
              <td className="px-4 py-3 text-sm text-gray-500">{new Date(l.created_at).toLocaleString('fr-MA')}</td>
            </tr>
          ))}
          {logs.length === 0 && <tr><td colSpan={5} className="px-4 py-12 text-center text-gray-400">No activity yet</td></tr>}
        </DataTable>
      )}
    </div>
  );
}
