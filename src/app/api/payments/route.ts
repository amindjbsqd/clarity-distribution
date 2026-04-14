import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const payments = await prisma.payment.findMany({ include: { order: { select: { order_number: true, customer_name: true } } }, orderBy: { created_at: 'desc' } });
  return NextResponse.json({ payments });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const body = await req.json();
    const { order_id, amount, payment_type, reference, note } = body;
    if (!order_id || !amount || !payment_type) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    const payment = await prisma.payment.create({ data: { order_id, amount, payment_type, reference, note, created_by: session.userId } });
    await prisma.activityLog.create({ data: { user_id: session.userId, action: 'Created', module: 'Payments', description: `Payment of ${amount} MAD added` } });
    return NextResponse.json({ payment }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
