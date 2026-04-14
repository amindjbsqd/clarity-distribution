'use client';
import { useState, useEffect } from 'react';
import { DataTable, KPICard, Button } from '@/components/ui';
import { FileText, Download } from 'lucide-react';

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetch('/api/invoices').then(r => r.json()).then(d => { setInvoices(d.invoices || []); setLoading(false); }); }, []);
  const fmt = (n: number) => new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD', minimumFractionDigits: 0 }).format(n);
  const htCount = invoices.filter((i: any) => i.type === 'HT').length;
  const ttcCount = invoices.filter((i: any) => i.type === 'TTC').length;

  function printInvoice(inv: any) {
    const snap = inv.snapshot_data || {};
    const items = snap.items || inv.order?.items || [];
    const isHT = inv.type === 'HT';

    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(`<!DOCTYPE html><html><head><title>Invoice ${inv.invoice_number}</title>
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { font-family: 'Segoe UI', system-ui, sans-serif; padding: 40px; color: #1f2937; max-width: 800px; margin: 0 auto; }
      .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; padding-bottom: 24px; border-bottom: 3px solid #dc2626; }
      .company { font-size: 28px; font-weight: 800; color: #dc2626; }
      .company-sub { font-size: 12px; color: #6b7280; letter-spacing: 3px; }
      .inv-info { text-align: right; }
      .inv-num { font-size: 20px; font-weight: 700; }
      .inv-type { display: inline-block; padding: 4px 12px; border-radius: 6px; font-size: 12px; font-weight: 700; ${isHT ? 'background: #dbeafe; color: #1e40af;' : 'background: #d1fae5; color: #065f46;'} }
      .section { margin-bottom: 24px; }
      .section-title { font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #9ca3af; margin-bottom: 8px; font-weight: 700; }
      .customer-box { background: #f9fafb; padding: 16px; border-radius: 12px; }
      table { width: 100%; border-collapse: collapse; }
      th { text-align: left; font-size: 11px; text-transform: uppercase; color: #6b7280; padding: 10px 12px; border-bottom: 2px solid #e5e7eb; }
      td { padding: 12px; border-bottom: 1px solid #f3f4f6; font-size: 13px; }
      .right { text-align: right; }
      .bold { font-weight: 700; }
      .totals { margin-top: 16px; display: flex; justify-content: flex-end; }
      .totals-box { width: 280px; background: #f9fafb; border-radius: 12px; padding: 16px; }
      .totals-row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 14px; }
      .totals-row.main { font-size: 20px; font-weight: 800; padding-top: 8px; margin-top: 8px; border-top: 2px solid #e5e7eb; }
      .footer { margin-top: 48px; text-align: center; font-size: 11px; color: #9ca3af; }
      @media print { body { padding: 20px; } }
    </style></head><body>
      <div class="header">
        <div><div class="company">CLARITY</div><div class="company-sub">DISTRIBUTION</div></div>
        <div class="inv-info">
          <div class="inv-num">${inv.invoice_number}</div>
          <div class="inv-type">${inv.type}</div>
          <div style="font-size:13px;color:#6b7280;margin-top:8px">${new Date(inv.created_at).toLocaleDateString('fr-MA')}</div>
        </div>
      </div>
      <div class="section">
        <div class="section-title">Bill To</div>
        <div class="customer-box">
          <div class="bold" style="font-size:16px">${inv.customer_name}</div>
          ${inv.company_name ? `<div style="color:#6b7280">${inv.company_name}</div>` : ''}
          ${snap.phone ? `<div style="color:#6b7280">${snap.phone}</div>` : ''}
          ${snap.city ? `<div style="color:#6b7280">${snap.city}${snap.address ? ' — ' + snap.address : ''}</div>` : ''}
        </div>
      </div>
      <div class="section">
        <div class="section-title">Items</div>
        <table><thead><tr><th>Product</th><th>Variation</th><th class="right">Qty</th><th class="right">Unit Price</th><th class="right">${isHT ? 'HT' : 'TTC'}</th></tr></thead><tbody>
        ${items.map((it: any) => `<tr>
          <td class="bold">${it.product_name || it.product?.name || ''}</td>
          <td>${it.variation_name || it.variation?.name || '—'}</td>
          <td class="right">${it.quantity}</td>
          <td class="right">${fmt(Number(it.unit_price))}</td>
          <td class="right bold">${fmt(Number(isHT ? it.line_ht : it.line_ttc))}</td>
        </tr>`).join('')}
        </tbody></table>
      </div>
      <div class="totals"><div class="totals-box">
        <div class="totals-row"><span>Subtotal HT</span><span>${fmt(Number(snap.subtotal_ht || inv.order?.subtotal_ht || 0))}</span></div>
        <div class="totals-row"><span>TVA (20%)</span><span>${fmt(Number(snap.tva_amount || inv.order?.tva_amount || 0))}</span></div>
        <div class="totals-row main"><span>Total ${isHT ? 'HT' : 'TTC'}</span><span>${fmt(Number(inv.amount))}</span></div>
      </div></div>
      <div class="footer"><p>Clarity Distribution — Invoice generated on ${new Date().toLocaleDateString('fr-MA')}</p></div>
    </body></html>`);
    w.document.close();
    setTimeout(() => w.print(), 500);
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <KPICard icon={FileText} label="HT Invoices" value={htCount} color="blue" />
        <KPICard icon={FileText} label="TTC Invoices" value={ttcCount} color="green" />
      </div>

      <p className="text-xs text-gray-400">Generate invoices from the order detail view. Click PDF to print/download.</p>

      {loading ? <div className="bg-white rounded-2xl p-12 text-center text-gray-400">Loading...</div> : (
        <DataTable headers={['Invoice #', 'Type', 'Order', 'Customer', 'Amount', 'Date', 'Actions']}>
          {invoices.map((inv: any) => (
            <tr key={inv.id} className="hover:bg-gray-50/50 transition">
              <td className="px-4 py-3 text-sm font-bold text-gray-900">{inv.invoice_number}</td>
              <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-bold ${inv.type === 'HT' ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'}`}>{inv.type}</span></td>
              <td className="px-4 py-3 text-sm text-gray-600">{inv.order?.order_number}</td>
              <td className="px-4 py-3 text-sm text-gray-900">{inv.customer_name}</td>
              <td className="px-4 py-3 text-sm font-bold text-gray-900">{fmt(Number(inv.amount))}</td>
              <td className="px-4 py-3 text-sm text-gray-500">{new Date(inv.created_at).toLocaleDateString('fr-MA')}</td>
              <td className="px-4 py-3">
                <button onClick={() => printInvoice(inv)} className="flex items-center gap-1.5 text-xs text-red-600 font-semibold hover:underline">
                  <Download className="w-3.5 h-3.5" />Print PDF
                </button>
              </td>
            </tr>
          ))}
          {invoices.length === 0 && <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-400">No invoices yet. Generate them from the orders page.</td></tr>}
        </DataTable>
      )}
    </div>
  );
}
