'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, ShoppingCart, Package, Warehouse, FileText, CreditCard,
  BookCheck, AlertCircle, Truck, MapPin, Tag, FolderOpen, Users, Activity,
  Upload, PanelLeftClose, PanelLeft, BarChart3, Layers,
} from 'lucide-react';
import { useState } from 'react';

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/orders', label: 'Orders', icon: ShoppingCart },
  { href: '/dashboard/products', label: 'Products', icon: Package },
  { href: '/dashboard/stock', label: 'Stock', icon: Warehouse },
  { href: '/dashboard/invoices', label: 'Invoices', icon: FileText },
  { href: '/dashboard/payments', label: 'Payments', icon: CreditCard },
  { href: '/dashboard/cheques', label: 'Cheques', icon: BookCheck },
  { href: '/dashboard/credits', label: 'Credits', icon: AlertCircle },
  { href: '/dashboard/reports', label: 'Reports', icon: BarChart3 },
  { href: '/dashboard/deliveries', label: 'Delivery Cos.', icon: Truck },
  { href: '/dashboard/cities', label: 'Cities', icon: MapPin },
  { href: '/dashboard/brands', label: 'Brands', icon: Tag },
  { href: '/dashboard/categories', label: 'Categories', icon: FolderOpen },
  { href: '/dashboard/users', label: 'Users', icon: Users },
  { href: '/dashboard/logs', label: 'Activity Logs', icon: Activity },
  { href: '/dashboard/import', label: 'Excel Import', icon: Upload },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside className={`fixed left-0 top-0 h-full bg-white border-r border-gray-200 z-40 transition-all duration-300 flex flex-col shadow-sm ${collapsed ? 'w-[68px]' : 'w-64'}`}>
      <div className={`flex items-center gap-3 px-4 h-16 border-b border-gray-100 shrink-0 ${collapsed ? 'justify-center' : ''}`}>
        <Image src="/logo.png" alt="Clarity" width={36} height={36} className="rounded-xl shrink-0" />
        {!collapsed && (
          <div>
            <p className="font-extrabold text-sm tracking-wide text-gray-900">CLARITY</p>
            <p className="text-[10px] text-red-500 font-semibold tracking-widest">DISTRIBUTION</p>
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5 scrollbar-thin">
        {NAV.map((item) => {
          const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                ${active ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}>
              <item.icon className="w-5 h-5 shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-gray-100 shrink-0">
        <button onClick={() => setCollapsed(!collapsed)} className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition">
          {collapsed ? <PanelLeft className="w-4 h-4" /> : <><PanelLeftClose className="w-4 h-4" /><span>Collapse</span></>}
        </button>
      </div>
    </aside>
  );
}
