'use client';

import { Bell, Search, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function TopBar({ user }: { user: { full_name: string; email: string; role: string } }) {
  const router = useRouter();

  async function handleLogout() {
    await fetch('/api/auth/me', { method: 'DELETE' });
    router.push('/auth/login');
    router.refresh();
  }

  const initials = user.full_name.split(' ').map((n) => n[0]).join('').slice(0, 2);

  return (
    <header className="fixed top-0 right-0 left-64 h-16 bg-white/80 backdrop-blur-xl border-b border-gray-100 z-30 flex items-center justify-between px-6 transition-all duration-300">
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input placeholder="Search..." className="pl-9 pr-4 py-2 w-56 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400 transition" />
      </div>
      <div className="flex items-center gap-4">
        <button className="relative p-2 rounded-xl hover:bg-gray-50 transition">
          <Bell className="w-5 h-5 text-gray-600" />
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
        </button>
        <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
          <div className="w-8 h-8 rounded-xl bg-red-600 flex items-center justify-center text-white font-bold text-xs">{initials}</div>
          <div className="hidden sm:block">
            <p className="text-sm font-semibold text-gray-900">{user.full_name}</p>
            <p className="text-xs text-gray-400">{user.role}</p>
          </div>
          <button onClick={handleLogout} className="p-2 rounded-xl hover:bg-red-50 transition" title="Logout">
            <LogOut className="w-4 h-4 text-red-500" />
          </button>
        </div>
      </div>
    </header>
  );
}
