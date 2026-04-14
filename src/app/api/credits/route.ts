import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const credits = await prisma.credit.findMany({
    orderBy: { due_date: 'asc' },
    include: { credit_payments: { orderBy: { created_at: 'desc' } } },
  });

  // Auto-update statuses based on dates and balances
  const now = new Date();
  const threeDays = 3 * 86400000;

  for (const c of credits) {
    let newStatus = c.status;
    const remaining = Number(c.remaining_amount);

    if (remaining <= 0) {
      newStatus = 'settled';
    } else if (now > c.due_date) {
      newStatus = 'overdue';
    } else if (c.due_date.getTime() - now.getTime() < threeDays) {
      newStatus = 'due_soon';
    } else {
      newStatus = 'open';
    }

    if (newStatus !== c.status) {
      await prisma.credit.update({ where: { id: c.id }, data: { status: newStatus } });
      (c as any).status = newStatus;
    }
  }

  return NextResponse.json({ credits });
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id, status, due_date, notes } = await req.json();
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    const data: any = {};
    if (status) data.status = status;
    if (due_date) data.due_date = new Date(due_date);
    if (notes !== undefined) data.notes = notes;

    const credit = await prisma.credit.update({ where: { id }, data });
    return NextResponse.json({ credit });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
