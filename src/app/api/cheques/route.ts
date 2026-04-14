import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const cheques = await prisma.cheque.findMany({
    orderBy: { created_at: 'desc' },
    include: {
      payment: { include: { order: { select: { order_number: true, customer_name: true, total_ttc: true } } } },
    },
  });

  return NextResponse.json({ cheques });
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const { id, reference, bank, status, issue_date, arrival_date, deposit_date, image_url, note } = body;

    if (!id) return NextResponse.json({ error: 'Missing cheque id' }, { status: 400 });

    const data: any = {};
    if (reference !== undefined) data.reference = reference;
    if (bank !== undefined) data.bank = bank;
    if (status !== undefined) data.status = status;
    if (issue_date !== undefined) data.issue_date = new Date(issue_date);
    if (arrival_date !== undefined) data.arrival_date = arrival_date ? new Date(arrival_date) : null;
    if (deposit_date !== undefined) data.deposit_date = deposit_date ? new Date(deposit_date) : null;
    if (image_url !== undefined) data.image_url = image_url;
    if (note !== undefined) data.note = note;

    const cheque = await prisma.cheque.update({ where: { id }, data });

    await prisma.activityLog.create({
      data: { user_id: session.userId, action: 'Updated', module: 'Cheques', description: `Updated cheque ${cheque.reference}` },
    });

    return NextResponse.json({ cheque });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
