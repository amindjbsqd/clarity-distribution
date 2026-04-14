import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { credit_id, amount, note } = await req.json();
    if (!credit_id || !amount) return NextResponse.json({ error: 'Missing credit_id or amount' }, { status: 400 });

    const credit = await prisma.credit.findUnique({ where: { id: credit_id } });
    if (!credit) return NextResponse.json({ error: 'Credit not found' }, { status: 404 });

    const paymentAmount = parseFloat(amount);
    if (paymentAmount <= 0) return NextResponse.json({ error: 'Amount must be positive' }, { status: 400 });

    // Create payment record
    await prisma.creditPayment.create({
      data: { credit_id, amount: paymentAmount, note, created_by: session.userId },
    });

    // Update remaining amount
    const newRemaining = Math.max(0, Number(credit.remaining_amount) - paymentAmount);
    const newStatus = newRemaining <= 0 ? 'settled' : credit.status;

    await prisma.credit.update({
      where: { id: credit_id },
      data: { remaining_amount: newRemaining, status: newStatus as any },
    });

    await prisma.activityLog.create({
      data: {
        user_id: session.userId, action: 'Payment', module: 'Credits',
        description: `Payment of ${paymentAmount} MAD for ${credit.customer_name}. Remaining: ${newRemaining} MAD`,
      },
    });

    return NextResponse.json({ success: true, remaining: newRemaining }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
