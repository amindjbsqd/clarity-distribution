import prisma from '@/lib/db';
import { getSession } from '@/lib/auth';
import { formatMAD } from '@/lib/utils';
import { KPICard } from '@/components/ui';
import { TrendingUp, ShoppingCart, Warehouse, AlertTriangle, DollarSign, Clock, BookCheck, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) return null;

  const [orders, products, cheques, credits, logs] = await Promise.all([
    prisma.order.findMany({ include: { city: true }, orderBy: { created_at: 'desc' }, take: 50 }),
    prisma.product.findMany({ include: { stock_movements: { select: { quantity: true } }, brand: true } }),
    prisma.cheque.findMany(),
    prisma.credit.findMany(),
    prisma.activityLog.findMany({ include: { user: { select: { full_name: true } } }, orderBy: { created_at: 'desc' }, take: 10 }),
  ]);

  const productsWithStock = products.map((p) => ({
    ...p,
    stock: p.stock_movements.reduce((s, m) => s + m.quantity, 0),
  }));

  const deliveredOrders = orders.filter((o) => o.status === 'delivered');
  const totalRevenue = deliveredOrders.reduce((s, o) => s + Number(o.total_ttc), 0);
  const lowStockProducts = productsWithStock.filter((p) => p.stock < 3);
  const outOfStock = productsWithStock.filter((p) => p.stock <= 0);
  const stockValue = productsWithStock.reduce((s, p) => s + Number(p.buying_price) * p.stock, 0);

  const now = new Date();
  const staleOrders = orders.filter((o) => o.status === 'new_order' && now.getTime() - new Date(o.created_at).getTime() > 48 * 3600000);
  const pendingCheques = cheques.filter((c) => c.status === 'pending');
  const overdueCredits = credits.filter((c) => c.status === 'overdue');
  const bouncedCheques = cheques.filter((c) => c.status === 'bounced');

  const statusColors: Record<string, string> = {
    new_order: 'bg-blue-100 text-blue-800', confirmed: 'bg-amber-100 text-amber-800', shipped: 'bg-indigo-100 text-indigo-800',
    delivered: 'bg-emerald-100 text-emerald-800', returned: 'bg-red-100 text-red-800', cancelled: 'bg-gray-200 text-gray-600',
  };

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard icon={TrendingUp} label="Revenue (Delivered)" value={formatMAD(totalRevenue)} sub="All delivered orders" color="green" />
        <KPICard icon={ShoppingCart} label="Total Orders" value={orders.length} sub={`${staleOrders.length} stale >48h`} color="blue" alert={staleOrders.length > 0} />
        <KPICard icon={AlertTriangle} label="Low Stock Items" value={lowStockProducts.length} sub={`${outOfStock.length} out of stock`} color="amber" alert={lowStockProducts.length > 0} />
        <KPICard icon={DollarSign} label="Stock Value" value={formatMAD(stockValue)} sub="At buying price" color="red" />
      </div>

      {/* Alerts */}
      {(staleOrders.length > 0 || pendingCheques.length > 0 || overdueCredits.length > 0 || bouncedCheques.length > 0) && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <h3 className="font-bold text-red-800">Alerts Requiring Attention</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {staleOrders.length > 0 && (
              <Link href="/dashboard/orders" className="bg-white rounded-xl p-3 border border-red-100 hover:shadow-md transition">
                <p className="text-sm font-semibold text-red-700">{staleOrders.length} orders &gt;48h</p>
                <p className="text-xs text-gray-500 mt-1">Pending without action</p>
              </Link>
            )}
            {pendingCheques.length > 0 && (
              <Link href="/dashboard/cheques" className="bg-white rounded-xl p-3 border border-red-100 hover:shadow-md transition">
                <p className="text-sm font-semibold text-amber-700">{pendingCheques.length} pending cheques</p>
                <p className="text-xs text-gray-500 mt-1">{formatMAD(pendingCheques.reduce((s, c) => s + Number(c.amount), 0))} total</p>
              </Link>
            )}
            {overdueCredits.length > 0 && (
              <Link href="/dashboard/credits" className="bg-white rounded-xl p-3 border border-red-100 hover:shadow-md transition">
                <p className="text-sm font-semibold text-rose-700">{overdueCredits.length} overdue credits</p>
                <p className="text-xs text-gray-500 mt-1">{formatMAD(overdueCredits.reduce((s, c) => s + Number(c.amount), 0))} total</p>
              </Link>
            )}
            {bouncedCheques.length > 0 && (
              <Link href="/dashboard/cheques" className="bg-white rounded-xl p-3 border border-red-100 hover:shadow-md transition">
                <p className="text-sm font-semibold text-red-700">{bouncedCheques.length} bounced cheques</p>
                <p className="text-xs text-gray-500 mt-1">Require follow-up</p>
              </Link>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900">Recent Orders</h3>
            <Link href="/dashboard/orders" className="text-xs text-red-600 font-semibold hover:underline">View All</Link>
          </div>
          <div className="space-y-3">
            {orders.slice(0, 5).map((o) => (
              <div key={o.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{o.order_number}</p>
                  <p className="text-xs text-gray-500">{o.customer_name} · {o.city?.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-900">{formatMAD(Number(o.total_ttc))}</p>
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${statusColors[o.status] || 'bg-gray-100 text-gray-600'}`}>
                    {o.status.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>
            ))}
            {orders.length === 0 && <p className="text-sm text-gray-400">No orders yet</p>}
          </div>
        </div>

        {/* Low Stock */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900">Low Stock Alerts</h3>
            <Link href="/dashboard/stock" className="text-xs text-red-600 font-semibold hover:underline">View All</Link>
          </div>
          <div className="space-y-3">
            {lowStockProducts.length === 0 ? (
              <p className="text-sm text-gray-400">All products well stocked</p>
            ) : lowStockProducts.slice(0, 6).map((p) => (
              <div key={p.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{p.name}</p>
                  <p className="text-xs text-gray-500">{p.brand.name}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${p.stock === 0 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                  {p.stock} left
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h3 className="font-bold text-gray-900 mb-4">Top Products by Value</h3>
          <div className="space-y-3">
            {[...productsWithStock].sort((a, b) => Number(b.selling_price) * b.stock - Number(a.selling_price) * a.stock).slice(0, 5).map((p, i) => (
              <div key={p.id} className="flex items-center gap-3">
                <span className="text-xs font-bold text-gray-400 w-5">{i + 1}</span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900">{p.name}</p>
                  <p className="text-xs text-gray-500">{p.stock} units × {formatMAD(Number(p.selling_price))}</p>
                </div>
                <p className="text-sm font-bold text-gray-900">{formatMAD(Number(p.selling_price) * p.stock)}</p>
              </div>
            ))}
            {products.length === 0 && <p className="text-sm text-gray-400">No products yet</p>}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h3 className="font-bold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {logs.slice(0, 8).map((l) => (
              <div key={l.id} className="flex items-start gap-3 py-2 border-b border-gray-50 last:border-0">
                <div className="w-2 h-2 rounded-full bg-red-500 mt-2 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-gray-900">{l.description}</p>
                  <p className="text-xs text-gray-400">{l.user.full_name} · {new Date(l.created_at).toLocaleString('fr-MA')}</p>
                </div>
              </div>
            ))}
            {logs.length === 0 && <p className="text-sm text-gray-400">No activity yet</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
