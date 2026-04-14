import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const invoices = await prisma.invoice.findMany({
    include: {
      order: {
        select: {
          order_number: true, customer_name: true, company_name: true, phone: true,
          address: true, subtotal_ht: true, tva_amount: true, total_ttc: true,
          city: { select: { name: true } },
          items: { include: { product: true, variation: true } },
        },
      },
    },
    orderBy: { created_at: 'desc' },
  });

  return NextResponse.json({ invoices });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const { order_id, type } = await req.json();
    if (!order_id || !type) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

    const order = await prisma.order.findUnique({
      where: { id: order_id },
      include: { items: { include: { product: true, variation: true } }, city: true },
    });
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

    const seq = await prisma.invoiceSequence.upsert({
      where: { type }, create: { type, last_number: 1 }, update: { last_number: { increment: 1 } },
    });

    const invoice_number = `${type}-${String(seq.last_number).padStart(3, '0')}`;
    const amount = type === 'HT' ? order.subtotal_ht : order.total_ttc;

    const snapshot = {
      order_number: order.order_number,
      customer_name: order.customer_name,
      company_name: order.company_name,
      phone: order.phone,
      address: order.address,
      city: order.city?.name,
      subtotal_ht: order.subtotal_ht,
      tva_amount: order.tva_amount,
      total_ttc: order.total_ttc,
      items: order.items.map(i => ({
        product_name: i.product.name,
        product_image: i.product.image,
        variation_name: i.variation?.name,
        quantity: i.quantity,
        unit_price: i.unit_price,
        line_ht: i.line_ht,
        line_tva: i.line_tva,
        line_ttc: i.line_ttc,
      })),
    };

    const invoice = await prisma.invoice.create({
      data: { invoice_number, type, order_id, customer_name: order.customer_name, company_name: order.company_name, amount, snapshot_data: snapshot, created_by: session.userId },
    });

    await prisma.activityLog.create({ data: { user_id: session.userId, action: 'Generated', module: 'Invoices', description: `Invoice ${invoice_number} for ${order.order_number}` } });
    return NextResponse.json({ invoice }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
