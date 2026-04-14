'use client';
import { useState, useEffect } from 'react';
import { DataTable, StatusBadge, KPICard, Modal, Button } from '@/components/ui';
import { MOVEMENT_TYPE_COLORS } from '@/types';
import { Warehouse, AlertTriangle, Package, Plus, Search } from 'lucide-react';

export default function StockPage() {
  const [movements, setMovements] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ product_id: '', type: 'manual_add', quantity: '', note: '' });
  const [brandFilter, setBrandFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [searchFilter, setSearchFilter] = useState('');

  useEffect(() => { load(); }, []);
  async function load() {
    setLoading(true);
    const [mRes, pRes, bRes, cRes] = await Promise.all([
      fetch('/api/stock'), fetch('/api/products'), fetch('/api/brands'), fetch('/api/categories')
    ]);
    const [mData, pData, bData, cData] = await Promise.all([mRes.json(), pRes.json(), bRes.json(), cRes.json()]);
    setMovements(mData.movements || []);
    setProducts(pData.products || []);
    setBrands(bData.brands || []);
    setCategories(cData.categories || []);
    setLoading(false);
  }

  // Filter movements by brand/category of their product
  const filteredMovements = movements.filter((m: any) => {
    const product = m.product;
    if (!product) return true;
    if (brandFilter && product.brand_id !== brandFilter) return false;
    if (categoryFilter && product.category_id !== categoryFilter) return false;
    if (searchFilter && !product.name?.toLowerCase().includes(searchFilter.toLowerCase())) return false;
    return true;
  });

  const filteredProducts = products.filter((p: any) => {
    if (brandFilter && p.brand_id !== brandFilter) return false;
    if (categoryFilter && p.category_id !== categoryFilter) return false;
    return true;
  });

  const lowStock = filteredProducts.filter((p: any) => p.stock < 3);
  const outOfStock = filteredProducts.filter((p: any) => p.stock <= 0);

  async function handleAdd() {
    const res = await fetch('/api/stock', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    if (res.ok) { setModal(false); setForm({ product_id: '', type: 'manual_add', quantity: '', note: '' }); load(); }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KPICard icon={Warehouse} label="Total Products" value={filteredProducts.length} color="blue" />
        <KPICard icon={AlertTriangle} label="Low Stock (<3)" value={lowStock.length} color="amber" alert={lowStock.length > 0} />
        <KPICard icon={Package} label="Out of Stock" value={outOfStock.length} color="red" alert={outOfStock.length > 0} />
      </div>

      {/* Filters */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={searchFilter} onChange={(e) => setSearchFilter(e.target.value)} placeholder="Search product..." className="pl-9 pr-4 py-2 w-48 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-400 outline-none" />
          </div>
          <select value={brandFilter} onChange={(e) => setBrandFilter(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white">
            <option value="">All Brands</option>
            {brands.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white">
            <option value="">All Categories</option>
            {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          {(brandFilter || categoryFilter || searchFilter) && (
            <button onClick={() => { setBrandFilter(''); setCategoryFilter(''); setSearchFilter(''); }} className="px-3 py-2 rounded-xl text-xs font-semibold bg-red-100 text-red-600 hover:bg-red-200 transition">
              Clear Filters
            </button>
          )}
        </div>
        <Button onClick={() => setModal(true)}><Plus className="w-4 h-4" />Add Movement</Button>
      </div>

      {loading ? <div className="bg-white rounded-2xl p-12 text-center text-gray-400">Loading...</div> : (
        <DataTable headers={['Product', 'Variation', 'Type', 'Quantity', 'User', 'Date', 'Note']}>
          {filteredMovements.map((m: any) => (
            <tr key={m.id} className="hover:bg-gray-50/50 transition">
              <td className="px-4 py-3 text-sm font-semibold text-gray-900">{m.product?.name}</td>
              <td className="px-4 py-3 text-sm text-gray-500">{m.variation?.name || '—'}</td>
              <td className="px-4 py-3"><StatusBadge status={m.type} colorMap={MOVEMENT_TYPE_COLORS} /></td>
              <td className="px-4 py-3"><span className={`text-sm font-bold ${m.quantity > 0 ? 'text-emerald-600' : 'text-red-600'}`}>{m.quantity > 0 ? '+' : ''}{m.quantity}</span></td>
              <td className="px-4 py-3 text-sm text-gray-600">{m.user?.full_name}</td>
              <td className="px-4 py-3 text-sm text-gray-500">{new Date(m.created_at).toLocaleString('fr-MA')}</td>
              <td className="px-4 py-3 text-sm text-gray-500">{m.note || '—'}</td>
            </tr>
          ))}
          {filteredMovements.length === 0 && <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-400">No movements found</td></tr>}
        </DataTable>
      )}
      <Modal open={modal} onClose={() => setModal(false)} title="Add Stock Movement">
        <div className="space-y-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Product *</label><select value={form.product_id} onChange={(e) => setForm({ ...form, product_id: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"><option value="">Select...</option>{products.map((p: any) => <option key={p.id} value={p.id}>{p.name} (Stock: {p.stock})</option>)}</select></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Type *</label><select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"><option value="manual_add">Manual Add</option><option value="manual_remove">Manual Remove</option><option value="correction">Correction</option><option value="initial_stock">Initial Stock</option></select></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label><input type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm" placeholder="e.g. 50 or -10" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Note</label><input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm" placeholder="Reason..." /></div>
          <div className="flex justify-end gap-3 pt-2"><Button variant="secondary" onClick={() => setModal(false)}>Cancel</Button><Button onClick={handleAdd}>Save</Button></div>
        </div>
      </Modal>
    </div>
  );
}
