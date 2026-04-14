'use client';

import { useState, useEffect, useRef } from 'react';
import { DataTable, StatusBadge, Modal, Button } from '@/components/ui';
import { ORDER_STATUS_COLORS, PAYMENT_STATUS_COLORS } from '@/types';
import { Plus, Eye, Trash2, ShoppingCart, ImageIcon, Camera, FileText, Truck, ChevronDown } from 'lucide-react';

type CartItem = {
  product_id: string; product_name: string; product_image?: string;
  variation_id?: string; variation_name?: string;
  quantity: number; unit_price: number;
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [filter, setFilter] = useState('all');
  const [modal, setModal] = useState(false);
  const [detailModal, setDetailModal] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cities, setCities] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [shippingCos, setShippingCos] = useState<any[]>([]);
  const [form, setForm] = useState({ customer_name: '', company_name: '', phone: '', city_id: '', address: '', payment_type: 'cash', notes: '' });

  // Cart
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selProductId, setSelProductId] = useState('');
  const [selVariationId, setSelVariationId] = useState('');
  const [selQty, setSelQty] = useState(1);
  const [selPrice, setSelPrice] = useState('');

  // Credit / cheque fields
  const [creditAdvance, setCreditAdvance] = useState('');
  const [creditDueDate, setCreditDueDate] = useState('');
  const [chequeRef, setChequeRef] = useState('');
  const [chequeBank, setChequeBank] = useState('');
  const [chequeIssueDate, setChequeIssueDate] = useState('');
  const [chequeArrivalDate, setChequeArrivalDate] = useState('');
  const [chequeImage, setChequeImage] = useState('');
  const chequeImgRef = useRef<HTMLInputElement>(null);

  useEffect(() => { fetchAll(); }, [filter]);

  async function fetchAll() {
    setLoading(true);
    const [oRes, cRes, pRes, sRes] = await Promise.all([
      fetch(`/api/orders?status=${filter}`), fetch('/api/cities'),
      fetch('/api/products'), fetch('/api/deliveries'),
    ]);
    const [oD, cD, pD, sD] = await Promise.all([oRes.json(), cRes.json(), pRes.json(), sRes.json()]);
    setOrders(oD.orders || []);
    setCities(cD.cities || []);
    setProducts(pD.products || []);
    setShippingCos(sD.companies || []);
    setLoading(false);
  }

  const fmt = (n: number) => new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD', minimumFractionDigits: 0 }).format(n);
  const statuses = ['all', 'new_order', 'confirmed', 'shipped', 'delivered', 'returned', 'cancelled'];
  const selectedProduct = products.find((p: any) => p.id === selProductId);

  function handleProductChange(id: string) {
    setSelProductId(id);
    setSelVariationId('');
    const p = products.find((pr: any) => pr.id === id);
    if (p) setSelPrice(String(Number(p.selling_price)));
  }

  function handleVariationChange(id: string) {
    setSelVariationId(id);
    const v = selectedProduct?.variations?.find((vr: any) => vr.id === id);
    if (v?.selling_price) setSelPrice(String(Number(v.selling_price)));
  }

  function addToCart() {
    if (!selProductId || !selPrice || selQty < 1) return;
    const p = products.find((pr: any) => pr.id === selProductId);
    const v = selVariationId ? p?.variations?.find((vr: any) => vr.id === selVariationId) : null;
    setCart(c => [...c, {
      product_id: selProductId, product_name: p?.name || '', product_image: p?.image,
      variation_id: selVariationId || undefined, variation_name: v?.name || undefined,
      quantity: selQty, unit_price: parseFloat(selPrice) || 0,
    }]);
    setSelProductId(''); setSelVariationId(''); setSelQty(1); setSelPrice('');
  }

  const cartSubtotal = cart.reduce((s, i) => s + i.quantity * i.unit_price, 0);
  const cartTVA = cartSubtotal * 0.2;
  const cartTotal = cartSubtotal + cartTVA;

  async function handleChequeImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    const fd = new FormData(); fd.append('file', file);
    const res = await fetch('/api/upload', { method: 'POST', body: fd });
    const d = await res.json(); if (d.url) setChequeImage(d.url);
  }

  async function handleCreateOrder() {
    if (!form.customer_name || !form.phone || !form.city_id || cart.length === 0) return;
    setSaving(true);
    const payload: any = {
      ...form,
      items: cart.map(i => ({ product_id: i.product_id, variation_id: i.variation_id || null, quantity: i.quantity, unit_price: i.unit_price })),
    };
    if (form.payment_type === 'credit') {
      payload.credit_advance = creditAdvance;
      payload.credit_due_date = creditDueDate;
    }
    if (form.payment_type === 'cheque') {
      payload.cheque_reference = chequeRef;
      payload.cheque_bank = chequeBank;
      payload.cheque_issue_date = chequeIssueDate;
      payload.cheque_arrival_date = chequeArrivalDate;
      payload.cheque_image_url = chequeImage;
    }
    const res = await fetch('/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if (res.ok) resetForm();
    setSaving(false);
    fetchAll();
  }

  function resetForm() {
    setModal(false);
    setForm({ customer_name: '', company_name: '', phone: '', city_id: '', address: '', payment_type: 'cash', notes: '' });
    setCart([]); setCreditAdvance(''); setCreditDueDate('');
    setChequeRef(''); setChequeBank(''); setChequeIssueDate(''); setChequeArrivalDate(''); setChequeImage('');
  }

  async function changeStatus(orderId: string, newStatus: string) {
    await fetch('/api/orders', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: orderId, status: newStatus }) });
    fetchAll();
    if (detailModal?.id === orderId) {
      const res = await fetch(`/api/orders?status=all`);
      const d = await res.json();
      setDetailModal(d.orders?.find((o: any) => o.id === orderId) || null);
    }
  }

  async function assignShipping(orderId: string, companyId: string) {
    await fetch('/api/orders', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: orderId, shipping_company_id: companyId }) });
    fetchAll();
  }

  async function generateInvoice(orderId: string, type: 'HT' | 'TTC') {
    const res = await fetch('/api/invoices', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ order_id: orderId, type }) });
    if (res.ok) { fetchAll(); alert(`Invoice ${type} generated!`); }
    else { const d = await res.json(); alert(d.error || 'Failed'); }
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          {statuses.map(s => (
            <button key={s} onClick={() => setFilter(s)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${filter === s ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {s === 'all' ? 'All' : s.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
        <Button onClick={() => setModal(true)}><Plus className="w-4 h-4" />New Order</Button>
      </div>

      {/* Orders Table */}
      {loading ? <div className="bg-white rounded-2xl p-12 text-center text-gray-400">Loading...</div> : (
        <DataTable headers={['Order', 'Customer', 'City', 'Status', 'Payment', 'Total TTC', 'Date', 'Actions']}>
          {orders.map((o: any) => (
            <tr key={o.id} className="hover:bg-gray-50/50 transition">
              <td className="px-4 py-3 text-sm font-bold text-gray-900">{o.order_number}</td>
              <td className="px-4 py-3"><p className="text-sm font-semibold text-gray-900">{o.customer_name}</p><p className="text-xs text-gray-500">{o.company_name}</p></td>
              <td className="px-4 py-3 text-sm text-gray-600">{o.city?.name}</td>
              <td className="px-4 py-3">
                <select value={o.status} onChange={(e) => changeStatus(o.id, e.target.value)}
                  className={`px-2 py-1 rounded-lg text-xs font-semibold border-0 cursor-pointer ${ORDER_STATUS_COLORS[o.status] || 'bg-gray-100'}`}>
                  {statuses.filter(s => s !== 'all').map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                </select>
              </td>
              <td className="px-4 py-3"><StatusBadge status={o.payment_status} colorMap={PAYMENT_STATUS_COLORS} /><span className="text-xs text-gray-400 ml-1">{o.payment_type}</span></td>
              <td className="px-4 py-3 text-sm font-bold text-gray-900">{fmt(Number(o.total_ttc))}</td>
              <td className="px-4 py-3 text-sm text-gray-500">{new Date(o.created_at).toLocaleDateString('fr-MA')}</td>
              <td className="px-4 py-3">
                <button onClick={() => setDetailModal(o)} className="p-1.5 rounded-lg hover:bg-gray-100"><Eye className="w-4 h-4 text-gray-500" /></button>
              </td>
            </tr>
          ))}
          {orders.length === 0 && <tr><td colSpan={8} className="px-4 py-12 text-center text-gray-400">No orders found</td></tr>}
        </DataTable>
      )}

      {/* ── NEW ORDER MODAL ── */}
      <Modal open={modal} onClose={resetForm} title="New Order" wide>
        <div className="space-y-5 max-h-[70vh] overflow-y-auto pr-2">
          {/* Customer */}
          <div>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Customer Information</h3>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Customer Name *</label><input value={form.customer_name} onChange={e => setForm({...form, customer_name: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-red-500/20" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Company</label><input value={form.company_name} onChange={e => setForm({...form, company_name: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label><input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">City *</label><select value={form.city_id} onChange={e => setForm({...form, city_id: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"><option value="">Select...</option>{cities.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
              <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Address</label><input value={form.address} onChange={e => setForm({...form, address: e.target.value})} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none" /></div>
            </div>
          </div>

          {/* Product Selector */}
          <div className="border-t border-gray-100 pt-4">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Add Products</h3>
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
              <div className="grid grid-cols-12 gap-3 items-end">
                <div className="col-span-4"><label className="block text-xs font-medium text-gray-600 mb-1">Product *</label><select value={selProductId} onChange={e => handleProductChange(e.target.value)} className="w-full px-2.5 py-2 border border-gray-200 rounded-lg text-sm bg-white"><option value="">Select...</option>{products.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
                <div className="col-span-3"><label className="block text-xs font-medium text-gray-600 mb-1">Variation</label><select value={selVariationId} onChange={e => handleVariationChange(e.target.value)} disabled={!selectedProduct?.variations?.length} className="w-full px-2.5 py-2 border border-gray-200 rounded-lg text-sm bg-white disabled:opacity-50"><option value="">None</option>{selectedProduct?.variations?.map((v: any) => <option key={v.id} value={v.id}>{v.name}</option>)}</select></div>
                <div className="col-span-2"><label className="block text-xs font-medium text-gray-600 mb-1">Qty</label><input type="number" min={1} value={selQty} onChange={e => setSelQty(parseInt(e.target.value)||1)} className="w-full px-2.5 py-2 border border-gray-200 rounded-lg text-sm" /></div>
                <div className="col-span-2"><label className="block text-xs font-medium text-gray-600 mb-1">Price</label><input type="number" value={selPrice} onChange={e => setSelPrice(e.target.value)} className="w-full px-2.5 py-2 border border-gray-200 rounded-lg text-sm" /></div>
                <div className="col-span-1"><Button onClick={addToCart} className="w-full justify-center"><Plus className="w-4 h-4" /></Button></div>
              </div>
            </div>
          </div>

          {/* Cart */}
          <div className="border-t border-gray-100 pt-4">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2"><ShoppingCart className="w-4 h-4" />Cart ({cart.length})</h3>
            {cart.length === 0 ? (
              <div className="bg-gray-50 rounded-xl p-6 text-center"><ShoppingCart className="w-6 h-6 text-gray-300 mx-auto mb-1" /><p className="text-sm text-gray-400">Add products above</p></div>
            ) : (
              <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100">
                {cart.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3">
                    {item.product_image ? <img src={item.product_image} className="w-9 h-9 rounded-lg object-cover border" /> : <div className="w-9 h-9 rounded-lg bg-gray-50 flex items-center justify-center"><ImageIcon className="w-4 h-4 text-gray-300" /></div>}
                    <div className="flex-1 min-w-0"><p className="text-sm font-semibold text-gray-900">{item.product_name}</p>{item.variation_name && <p className="text-xs text-gray-500">{item.variation_name}</p>}</div>
                    <div className="text-right"><p className="text-sm">{item.quantity} × {fmt(item.unit_price)}</p><p className="text-xs font-bold text-red-600">{fmt(item.quantity * item.unit_price)}</p></div>
                    <button onClick={() => setCart(c => c.filter((_,i) => i !== idx))} className="p-1 text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ))}
                <div className="p-3 bg-gray-50 rounded-b-xl">
                  <div className="flex justify-between text-sm text-gray-500"><span>HT</span><span>{fmt(cartSubtotal)}</span></div>
                  <div className="flex justify-between text-sm text-gray-500"><span>TVA 20%</span><span>{fmt(cartTVA)}</span></div>
                  <div className="flex justify-between text-lg font-extrabold text-gray-900 mt-1 pt-1 border-t border-gray-200"><span>Total TTC</span><span>{fmt(cartTotal)}</span></div>
                </div>
              </div>
            )}
          </div>

          {/* Payment */}
          <div className="border-t border-gray-100 pt-4">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Payment</h3>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {['cash','credit','cheque'].map(t => (
                <button key={t} onClick={() => setForm({...form, payment_type: t})} className={`px-4 py-3 rounded-xl text-sm font-semibold transition border-2 ${form.payment_type === t ? 'border-red-500 bg-red-50 text-red-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                  {t === 'cash' ? '💵 Cash' : t === 'credit' ? '💳 Credit' : '📝 Cheque'}
                </button>
              ))}
            </div>

            {form.payment_type === 'cash' && cart.length > 0 && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
                <p className="text-sm text-emerald-700">Amount to collect</p>
                <p className="text-3xl font-extrabold text-emerald-800 mt-1">{fmt(cartTotal)}</p>
              </div>
            )}

            {form.payment_type === 'credit' && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
                <div className="flex justify-between text-sm"><span className="text-amber-700">Total</span><span className="font-bold text-amber-900">{fmt(cartTotal)}</span></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-sm font-medium text-amber-800 mb-1">Advance payment</label><input type="number" value={creditAdvance} onChange={e => setCreditAdvance(e.target.value)} className="w-full px-3 py-2 border border-amber-300 rounded-xl text-sm bg-white" placeholder="0" /></div>
                  <div><label className="block text-sm font-medium text-amber-800 mb-1">Due date</label><input type="date" value={creditDueDate} onChange={e => setCreditDueDate(e.target.value)} className="w-full px-3 py-2 border border-amber-300 rounded-xl text-sm bg-white" /></div>
                </div>
                {creditAdvance && <div className="flex justify-between text-sm font-bold"><span className="text-amber-700">Remaining</span><span className="text-red-600">{fmt(cartTotal - (parseFloat(creditAdvance)||0))}</span></div>}
              </div>
            )}

            {form.payment_type === 'cheque' && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-sm font-medium text-blue-800 mb-1">Reference</label><input value={chequeRef} onChange={e => setChequeRef(e.target.value)} className="w-full px-3 py-2 border border-blue-300 rounded-xl text-sm bg-white" placeholder="CHQ-001" /></div>
                  <div><label className="block text-sm font-medium text-blue-800 mb-1">Bank</label><input value={chequeBank} onChange={e => setChequeBank(e.target.value)} className="w-full px-3 py-2 border border-blue-300 rounded-xl text-sm bg-white" placeholder="Attijariwafa" /></div>
                  <div><label className="block text-sm font-medium text-blue-800 mb-1">Issue Date</label><input type="date" value={chequeIssueDate} onChange={e => setChequeIssueDate(e.target.value)} className="w-full px-3 py-2 border border-blue-300 rounded-xl text-sm bg-white" /></div>
                  <div><label className="block text-sm font-medium text-blue-800 mb-1">Arrival Date</label><input type="date" value={chequeArrivalDate} onChange={e => setChequeArrivalDate(e.target.value)} className="w-full px-3 py-2 border border-blue-300 rounded-xl text-sm bg-white" /></div>
                </div>
                <div className="flex items-center gap-3">
                  {chequeImage ? <img src={chequeImage} className="w-28 h-16 rounded-lg object-cover border border-blue-200" /> : <div className="w-28 h-16 rounded-lg border-2 border-dashed border-blue-300 flex items-center justify-center bg-white"><Camera className="w-6 h-6 text-blue-300" /></div>}
                  <div><input ref={chequeImgRef} type="file" accept="image/*" capture="environment" onChange={handleChequeImage} className="hidden" /><Button variant="secondary" onClick={() => chequeImgRef.current?.click()}><Camera className="w-4 h-4" />{chequeImage ? 'Change' : 'Scan / Upload'}</Button></div>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3 border-t border-gray-100 pt-4">
          <Button variant="secondary" onClick={resetForm}>Cancel</Button>
          <Button onClick={handleCreateOrder} disabled={saving || cart.length === 0}>{saving ? 'Creating...' : `Create Order${cart.length > 0 ? ` — ${fmt(cartTotal)}` : ''}`}</Button>
        </div>
      </Modal>

      {/* ── ORDER DETAIL MODAL ── */}
      <Modal open={!!detailModal} onClose={() => setDetailModal(null)} title={detailModal ? `Order ${detailModal.order_number}` : ''} wide>
        {detailModal && (
          <div className="space-y-5 max-h-[70vh] overflow-y-auto pr-2">
            {/* Customer & Meta */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="text-xs text-gray-500 uppercase font-bold mb-2">Customer</h4>
                <p className="font-bold text-gray-900">{detailModal.customer_name}</p>
                {detailModal.company_name && <p className="text-sm text-gray-600">{detailModal.company_name}</p>}
                <p className="text-sm text-gray-500">{detailModal.phone}</p>
                <p className="text-sm text-gray-500">{detailModal.city?.name} — {detailModal.address}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="text-xs text-gray-500 uppercase font-bold mb-2">Order Info</h4>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm"><span className="text-gray-500">Status</span><StatusBadge status={detailModal.status} colorMap={ORDER_STATUS_COLORS} /></div>
                  <div className="flex justify-between text-sm"><span className="text-gray-500">Payment</span><StatusBadge status={detailModal.payment_status} colorMap={PAYMENT_STATUS_COLORS} /></div>
                  <div className="flex justify-between text-sm"><span className="text-gray-500">Type</span><span className="font-semibold">{detailModal.payment_type}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-gray-500">Date</span><span>{new Date(detailModal.created_at).toLocaleDateString('fr-MA')}</span></div>
                </div>
              </div>
            </div>

            {/* Status Change & Shipping */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Change Status</label>
                <select value={detailModal.status} onChange={e => changeStatus(detailModal.id, e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm font-semibold">
                  {statuses.filter(s => s !== 'all').map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Shipping Company</label>
                <select value={detailModal.shipping_company_id || ''} onChange={e => assignShipping(detailModal.id, e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm">
                  <option value="">Not assigned</option>
                  {shippingCos.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            </div>

            {/* Items */}
            <div>
              <h4 className="text-xs text-gray-500 uppercase font-bold mb-2">Items ({detailModal.items?.length || 0})</h4>
              <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100">
                {detailModal.items?.map((item: any) => (
                  <div key={item.id} className="flex items-center gap-3 p-3">
                    {item.product?.image ? <img src={item.product.image} className="w-10 h-10 rounded-lg object-cover border" /> : <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center"><ImageIcon className="w-5 h-5 text-gray-300" /></div>}
                    <div className="flex-1"><p className="text-sm font-semibold text-gray-900">{item.product?.name}</p>{item.variation && <p className="text-xs text-gray-500">{item.variation.name}</p>}</div>
                    <div className="text-right text-sm"><p>{item.quantity} × {fmt(Number(item.unit_price))}</p><p className="font-bold text-red-600">{fmt(Number(item.line_ttc))}</p></div>
                  </div>
                ))}
              </div>
              <div className="bg-gray-50 rounded-xl p-3 mt-2">
                <div className="flex justify-between text-sm text-gray-500"><span>Subtotal HT</span><span>{fmt(Number(detailModal.subtotal_ht))}</span></div>
                <div className="flex justify-between text-sm text-gray-500"><span>TVA</span><span>{fmt(Number(detailModal.tva_amount))}</span></div>
                <div className="flex justify-between text-lg font-extrabold text-gray-900"><span>Total TTC</span><span>{fmt(Number(detailModal.total_ttc))}</span></div>
              </div>
            </div>

            {/* Invoice Generation */}
            <div className="border-t border-gray-100 pt-4">
              <h4 className="text-xs text-gray-500 uppercase font-bold mb-2">Invoices</h4>
              {detailModal.invoices?.length > 0 && (
                <div className="mb-3 space-y-1">
                  {detailModal.invoices.map((inv: any) => (
                    <div key={inv.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${inv.type === 'HT' ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'}`}>{inv.type}</span>
                      <span className="text-sm font-semibold">{inv.invoice_number}</span>
                      <span className="text-sm text-gray-500">{fmt(Number(inv.amount))}</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => generateInvoice(detailModal.id, 'HT')}>
                  <FileText className="w-4 h-4" />Generate HT Invoice
                </Button>
                <Button variant="secondary" onClick={() => generateInvoice(detailModal.id, 'TTC')}>
                  <FileText className="w-4 h-4" />Generate TTC Invoice
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
