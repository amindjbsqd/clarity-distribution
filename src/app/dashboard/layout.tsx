import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import Sidebar from '@/components/layout/Sidebar';
import TopBar from '@/components/layout/TopBar';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect('/auth/login');

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Sidebar />
      <TopBar user={{ full_name: user.full_name, email: user.email, role: user.role }} />
      <main className="ml-64 pt-20 pb-8 px-6">
        {children}
      </main>
    </div>
  );
}
