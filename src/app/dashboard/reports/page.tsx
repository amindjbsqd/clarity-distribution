'use client';
import { useState } from 'react';
import { DataTable, KPICard, Button } from '@/components/ui';
import { BarChart3, ShoppingCart, DollarSign, Package, FileDown, Search, ImageIcon } from 'lucide-react';

export default function ReportsPage() {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fmt = (n: number) => new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD', minimumFractionDigits: 0 }).format(n);

  async function fetchReport() {
    setLoading(true);
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    const res = await fetch(`/api/reports?${params.toString()}`);
    const d = await res.json();
    setData(d);
    setLoading(false);
  }

  function exportPDF() {
    // Use browser print with print-specific styles
    const printContent = document.getElementById('report-content');
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Sales Report - Clarity Distribution</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: 'Segoe UI', system-ui, sans-serif; padding: 40px; color: #1f2937; }
          h1 { font-size: 24px; margin-bottom: 8px; }
          .subtitle { color: #6b7280; font-size: 14px; margin-bottom: 24px; }
          .kpis { display: flex; gap: 16px; margin-bottom: 24px; }
          .kpi { flex: 1; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; }
          .kpi-label { font-size: 12px; color: #6b7280; text-transform: uppercase; }
          .kpi-value { font-size: 24px; font-weight: 800; margin-top: 4px; }
          table { width: 100%; border-collapse: collapse; margin-top: 16px; }
          th { text-align: left; font-size: 11px; text-transform: uppercase; color: #6b7280; padding: 8px 12px; border-bottom: 2px solid #e5e7eb; }
          td { padding: 10px 12px; border-bottom: 1px solid #f3f4f6; font-size: 13px; }
          .img-cell { width: 40px; height: 40px; border-radius: 8px; object-fit: cover; }
          .text-right { text-align: right; }
          .bold { font-weight: 700; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <h1>📊 Sales Report — Clarity Distribution</h1>
        <p class="subtitle">Period: ${from || 'All time'} ${to ? ' to ' + to : ''} | Generated: ${new Date().toLocaleDateString('fr-MA')}</p>
        <div class="kpis">
          <div class="kpi"><div class="kpi-label">Total Orders</div><div class="kpi-value">${data?.summary?.total_orders || 0}</div></div>
          <div class="kpi"><div class="kpi-label">Revenue</div><div class="kpi-value">${fmt(data?.summary?.total_revenue || 0)}</div></div>
          <div class="kpi"><div class="kpi-label">Items Sold</div><div class="kpi-value">${data?.summary?.total_items_sold || 0}</div></div>
        </div>
        <table>
          <thead><tr><th>Image</th><th>Product</th><th>Variation</th><th>Brand</th><th>Category</th><th class="text-right">Qty Sold</th><th class="text-right">Revenue</th><th class="text-right">Orders</th></tr></thead>
          <tbody>
            ${(data?.soldProducts || []).map((p: any) => `
              <tr>
                <td>${p.product_image ? `<img src="${window.location.origin}${p.product_image}" class="img-cell" />` : '—'}</td>
                <td class="bold">${p.product_name}</td>
                <td>${p.variation_name || '—'}</td>
                <td>${p.brand}</td>
                <td>${p.category}</td>
                <td class="text-right bold">${p.total_quantity}</td>
                <td class="text-right bold">${fmt(p.total_revenue)}</td>
                <td class="text-right">${p.order_count}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 500);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2"><BarChart3 className="w-6 h-6 text-red-600" />Sales Report</h1>
      </div>

      {/* Date Filter */}
      <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
        <div className="flex items-end gap-4 flex-wrap">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-400 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-400 outline-none" />
          </div>
          <Button onClick={fetchReport} disabled={loading}>
            <Search className="w-4 h-4" />{loading ? 'Loading...' : 'Generate Report'}
          </Button>
          {data && (
            <Button variant="secondary" onClick={exportPDF}>
              <FileDown className="w-4 h-4" />Export PDF
            </Button>
          )}
        </div>
      </div>

      {/* Results */}
      {data && (
        <div id="report-content" className="space-y-4">
          {/* KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <KPICard icon={ShoppingCart} label="Total Orders" value={data.summary.total_orders} color="blue" />
            <KPICard icon={DollarSign} label="Total Revenue" value={fmt(data.summary.total_revenue)} color="green" />
            <KPICard icon={Package} label="Items Sold" value={data.summary.total_items_sold} color="amber" />
          </div>

          {/* Products Table */}
          <DataTable headers={['', 'Product', 'Variation', 'Brand', 'Category', 'Qty Sold', 'Revenue', 'Orders']}>
            {data.soldProducts.map((p: any, idx: number) => (
              <tr key={idx} className="hover:bg-gray-50/50 transition">
                <td className="px-4 py-3">
                  {(p.variation_image || p.product_image) ? (
                    <img src={p.variation_image || p.product_image} alt="" className="w-10 h-10 rounded-lg object-cover border border-gray-200" />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center"><ImageIcon className="w-5 h-5 text-gray-300" /></div>
                  )}
                </td>
                <td className="px-4 py-3 text-sm font-bold text-gray-900">{p.product_name}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{p.variation_name || '—'}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{p.brand}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{p.category}</td>
                <td className="px-4 py-3 text-sm font-bold text-gray-900">{p.total_quantity}</td>
                <td className="px-4 py-3 text-sm font-bold text-emerald-700">{fmt(p.total_revenue)}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{p.order_count}</td>
              </tr>
            ))}
            {data.soldProducts.length === 0 && <tr><td colSpan={8} className="px-4 py-12 text-center text-gray-400">No sales found for this period</td></tr>}
          </DataTable>
        </div>
      )}

      {!data && !loading && (
        <div className="bg-white rounded-2xl p-16 text-center border border-gray-200">
          <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">Select a date range and click "Generate Report" to see sales data</p>
        </div>
      )}
    </div>
  );
}
