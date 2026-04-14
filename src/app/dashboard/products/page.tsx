'use client';
import { useState, useEffect, useRef } from 'react';
import { DataTable, StatusBadge, Modal, Button } from '@/components/ui';
import { Plus, Eye, Edit, Search, AlertTriangle, Upload, Trash2, ImageIcon } from 'lucide-react';

type VariationForm = { name: string; sku: string; image: string; buying_price: string; selling_price: string };

const emptyVariation = (): VariationForm => ({ name: '', sku: '', image: '', buying_price: '', selling_price: '' });

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [brandF, setBrandF] = useState('');
  const [catF, setCatF] = useState('');
  const [lowStock, setLowStock] = useState(false);
  const [modal, setModal] = useState(false);
  const [viewModal, setViewModal] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editProduct, setEditProduct] = useState<any>(null);
  const [form, setForm] = useState({ name: '', brand_id: '', category_id: '', buying_price: '', selling_price: '', image: '' });
  const [variations, setVariations] = useState<VariationForm[]>([]);
  const productImageRef = useRef<HTMLInputElement>(null);

  useEffect(() => { load(); }, []);

  function openEdit(p: any) {
    setEditProduct(p);
    setForm({ name: p.name, brand_id: p.brand_id, category_id: p.category_id, buying_price: String(Number(p.buying_price)), selling_price: String(Number(p.selling_price)), image: p.image || '' });
    setVariations((p.variations || []).map((v: any) => ({ ...v, id: v.id, buying_price: v.buying_price ? String(Number(v.buying_price)) : '', selling_price: v.selling_price ? String(Number(v.selling_price)) : '', image: v.image || '' })));
    setModal(true);
  }

  async function load() {
    setLoading(true);
    const [pRes, bRes, cRes] = await Promise.all([fetch('/api/products'), fetch('/api/brands'), fetch('/api/categories')]);
    const [pData, bData, cData] = await Promise.all([pRes.json(), bRes.json(), cRes.json()]);
    setProducts(pData.products || []);
    setBrands(bData.brands || []);
    setCategories(cData.categories || []);
    setLoading(false);
  }

  const filtered = products.filter((p: any) => {
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (brandF && p.brand_id !== brandF) return false;
    if (catF && p.category_id !== catF) return false;
    if (lowStock && p.stock >= 3) return false;
    return true;
  });

  const fmt = (n: number) => new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD', minimumFractionDigits: 0 }).format(n);

  async function uploadFile(file: File): Promise<string> {
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch('/api/upload', { method: 'POST', body: fd });
    const data = await res.json();
    return data.url || '';
  }

  async function handleProductImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await uploadFile(file);
    setForm(f => ({ ...f, image: url }));
  }

  async function handleVariationImage(idx: number, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await uploadFile(file);
    setVariations(vs => vs.map((v, i) => i === idx ? { ...v, image: url } : v));
  }

  async function handleCreate() {
    setSaving(true);
    const payload: any = {
      ...form,
      buying_price: parseFloat(form.buying_price) || 0,
      selling_price: parseFloat(form.selling_price) || 0,
      variations: variations.filter(v => v.name && v.sku).map(v => ({
        id: (v as any).id || undefined,
        name: v.name, sku: v.sku, image: v.image || null,
        buying_price: parseFloat(v.buying_price) || null,
        selling_price: parseFloat(v.selling_price) || null,
      })),
    };

    let res;
    if (editProduct) {
      payload.id = editProduct.id;
      res = await fetch('/api/products', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    } else {
      res = await fetch('/api/products', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    }
    if (res.ok) {
      setModal(false);
      setForm({ name: '', brand_id: '', category_id: '', buying_price: '', selling_price: '', image: '' });
      setVariations([]);
      setEditProduct(null);
      load();
    }
    setSaving(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative"><Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products..." className="pl-9 pr-4 py-2 w-48 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-400 outline-none" /></div>
          <select value={brandF} onChange={(e) => setBrandF(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white"><option value="">All Brands</option>{brands.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}</select>
          <select value={catF} onChange={(e) => setCatF(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white"><option value="">All Categories</option>{categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
          <button onClick={() => setLowStock(!lowStock)} className={`px-3 py-2 rounded-xl text-xs font-semibold transition ${lowStock ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}><AlertTriangle className="w-3 h-3 inline mr-1" />Stock &lt;3</button>
        </div>
        <Button onClick={() => { setEditProduct(null); setModal(true); }}><Plus className="w-4 h-4" />Add Product</Button>
      </div>
      {loading ? <div className="bg-white rounded-2xl p-12 text-center text-gray-400">Loading...</div> : (
        <DataTable headers={['', 'Product', 'Brand', 'Category', 'Buying', 'Selling', 'Stock', 'Variations', 'Status', 'Actions']}>
          {filtered.map((p: any) => (
            <tr key={p.id} className="hover:bg-gray-50/50 transition">
              <td className="px-4 py-3">
                {p.image ? (
                  <img src={p.image} alt={p.name} className="w-10 h-10 rounded-lg object-cover border border-gray-200" />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center"><ImageIcon className="w-5 h-5 text-gray-300" /></div>
                )}
              </td>
              <td className="px-4 py-3 text-sm font-bold text-gray-900">{p.name}</td>
              <td className="px-4 py-3 text-sm text-gray-600">{p.brand?.name}</td>
              <td className="px-4 py-3 text-sm text-gray-600">{p.category?.name}</td>
              <td className="px-4 py-3 text-sm text-gray-600">{fmt(Number(p.buying_price))}</td>
              <td className="px-4 py-3 text-sm font-semibold text-gray-900">{fmt(Number(p.selling_price))}</td>
              <td className="px-4 py-3"><span className={`px-2 py-1 rounded-lg text-xs font-bold ${p.stock === 0 ? 'bg-red-100 text-red-700' : p.stock < 3 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>{p.stock}</span></td>
              <td className="px-4 py-3 text-sm text-gray-500">{p.variations?.length || '—'}</td>
              <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${p.active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>{p.active ? 'Active' : 'Archived'}</span></td>
              <td className="px-4 py-3"><div className="flex gap-1">
                <button onClick={() => setViewModal(p)} className="p-1.5 rounded-lg hover:bg-gray-100"><Eye className="w-4 h-4 text-gray-500" /></button>
                <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg hover:bg-gray-100"><Edit className="w-4 h-4 text-gray-500" /></button>
              </div></td>
            </tr>
          ))}
          {filtered.length === 0 && <tr><td colSpan={10} className="px-4 py-12 text-center text-gray-400">No products found</td></tr>}
        </DataTable>
      )}

      {/* Add Product Modal */}
      <Modal open={modal} onClose={() => { setModal(false); setEditProduct(null); }} title={editProduct ? 'Edit Product' : 'Add Product'} wide>
        <div className="grid grid-cols-2 gap-4">
          {/* Image Upload */}
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Product Image</label>
            <div className="flex items-center gap-4">
              {form.image ? (
                <img src={form.image} alt="Product" className="w-20 h-20 rounded-xl object-cover border border-gray-200" />
              ) : (
                <div className="w-20 h-20 rounded-xl bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center">
                  <ImageIcon className="w-8 h-8 text-gray-300" />
                </div>
              )}
              <div>
                <input ref={productImageRef} type="file" accept="image/*" onChange={handleProductImage} className="hidden" />
                <Button variant="secondary" onClick={() => productImageRef.current?.click()}>
                  <Upload className="w-4 h-4" />{form.image ? 'Change Image' : 'Upload Image'}
                </Button>
              </div>
            </div>
          </div>

          <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-400 outline-none" placeholder="Galaxy S24 Ultra" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Brand *</label><select value={form.brand_id} onChange={(e) => setForm({ ...form, brand_id: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"><option value="">Select brand...</option>{brands.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}</select></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Category *</label><select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"><option value="">Select category...</option>{categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Buying Price (MAD)</label><input type="number" value={form.buying_price} onChange={(e) => setForm({ ...form, buying_price: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm" placeholder="0" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Selling Price (MAD)</label><input type="number" value={form.selling_price} onChange={(e) => setForm({ ...form, selling_price: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm" placeholder="0" /></div>

          {/* Variations Section */}
          <div className="col-span-2 border-t border-gray-100 pt-4 mt-2">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-gray-900">Product Variations</h3>
              <Button variant="secondary" onClick={() => setVariations([...variations, emptyVariation()])}>
                <Plus className="w-3 h-3" />Add Variation
              </Button>
            </div>
            {variations.length === 0 && (
              <p className="text-xs text-gray-400 text-center py-4 bg-gray-50 rounded-xl">No variations yet. Add variations for different sizes, colors, etc.</p>
            )}
            {variations.map((v, idx) => (
              <div key={idx} className="bg-gray-50 rounded-xl p-4 mb-3 border border-gray-100">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs font-bold text-gray-500">Variation #{idx + 1}</span>
                  <button onClick={() => setVariations(vs => vs.filter((_, i) => i !== idx))} className="text-red-400 hover:text-red-600 transition"><Trash2 className="w-4 h-4" /></button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {/* Variation Image */}
                  <div className="col-span-2 flex items-center gap-3">
                    {v.image ? (
                      <img src={v.image} alt="Variation" className="w-14 h-14 rounded-lg object-cover border border-gray-200" />
                    ) : (
                      <div className="w-14 h-14 rounded-lg bg-white border-2 border-dashed border-gray-200 flex items-center justify-center shrink-0">
                        <ImageIcon className="w-6 h-6 text-gray-300" />
                      </div>
                    )}
                    <div>
                      <input type="file" accept="image/*" onChange={(e) => handleVariationImage(idx, e)} className="hidden" id={`var-img-${idx}`} />
                      <label htmlFor={`var-img-${idx}`} className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:bg-white transition">
                        <Upload className="w-3 h-3" />{v.image ? 'Change' : 'Upload'}
                      </label>
                    </div>
                  </div>
                  <div><label className="block text-xs font-medium text-gray-600 mb-1">Name *</label><input value={v.name} onChange={(e) => setVariations(vs => vs.map((vr, i) => i === idx ? { ...vr, name: e.target.value } : vr))} className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-sm" placeholder="128GB Black" /></div>
                  <div><label className="block text-xs font-medium text-gray-600 mb-1">SKU *</label><input value={v.sku} onChange={(e) => setVariations(vs => vs.map((vr, i) => i === idx ? { ...vr, sku: e.target.value } : vr))} className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-sm" placeholder="SAM-S24-128-BLK" /></div>
                  <div><label className="block text-xs font-medium text-gray-600 mb-1">Buying Price</label><input type="number" value={v.buying_price} onChange={(e) => setVariations(vs => vs.map((vr, i) => i === idx ? { ...vr, buying_price: e.target.value } : vr))} className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-sm" placeholder="0" /></div>
                  <div><label className="block text-xs font-medium text-gray-600 mb-1">Selling Price</label><input type="number" value={v.selling_price} onChange={(e) => setVariations(vs => vs.map((vr, i) => i === idx ? { ...vr, selling_price: e.target.value } : vr))} className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-sm" placeholder="0" /></div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setModal(false)}>Cancel</Button>
          <Button onClick={handleCreate} disabled={saving}>{saving ? 'Saving...' : editProduct ? 'Update Product' : 'Save Product'}</Button>
        </div>
      </Modal>

      {/* View Product Modal */}
      <Modal open={!!viewModal} onClose={() => setViewModal(null)} title={viewModal?.name || 'Product'} wide>
        {viewModal && (
          <div className="space-y-4">
            <div className="flex gap-4">
              {viewModal.image ? (
                <img src={viewModal.image} alt={viewModal.name} className="w-24 h-24 rounded-xl object-cover border border-gray-200" />
              ) : (
                <div className="w-24 h-24 rounded-xl bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center">
                  <ImageIcon className="w-10 h-10 text-gray-300" />
                </div>
              )}
              <div>
                <p className="font-bold text-gray-900 text-lg">{viewModal.name}</p>
                <p className="text-sm text-gray-500">{viewModal.brand?.name} — {viewModal.category?.name}</p>
                <p className="text-sm mt-1"><span className="text-gray-500">Buying:</span> <span className="font-semibold">{fmt(Number(viewModal.buying_price))}</span> | <span className="text-gray-500">Selling:</span> <span className="font-bold text-red-600">{fmt(Number(viewModal.selling_price))}</span></p>
              </div>
            </div>
            {viewModal.variations?.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-2">Variations ({viewModal.variations.length})</h3>
                <div className="bg-gray-50 rounded-xl divide-y divide-gray-100">
                  {viewModal.variations.map((v: any) => (
                    <div key={v.id} className="flex items-center gap-3 p-3">
                      {v.image ? (
                        <img src={v.image} alt={v.name} className="w-10 h-10 rounded-lg object-cover border border-gray-200" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center shrink-0">
                          <ImageIcon className="w-5 h-5 text-gray-300" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900">{v.name}</p>
                        <p className="text-xs text-gray-400">SKU: {v.sku}</p>
                      </div>
                      <div className="text-right text-sm">
                        {v.selling_price && <p className="font-bold text-gray-900">{fmt(Number(v.selling_price))}</p>}
                        {v.buying_price && <p className="text-xs text-gray-400">{fmt(Number(v.buying_price))}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
