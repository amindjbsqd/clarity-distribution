import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const module = searchParams.get('module');

  const logs = await prisma.activityLog.findMany({
    where: module && module !== 'all' ? { module } : {},
    include: { user: { select: { full_name: true } } },
    orderBy: { created_at: 'desc' },
    take: 200,
  });

  return NextResponse.json({ logs });
}
