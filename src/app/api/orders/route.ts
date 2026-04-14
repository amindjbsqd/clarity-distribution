import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSession } from '@/lib/auth';
import { generateOrderNumber } from '@/lib/utils';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');

  const orders = await prisma.order.findMany({
    where: status && status !== 'all' ? { status: status as any } : {},
    include: {
      city: true,
      shipping_company: true,
      items: { include: { product: true, variation: true } },
      user: { select: { full_name: true } },
      payments: true,
      invoices: true,
    },
    orderBy: { created_at: 'desc' },
  });

  return NextResponse.json({ orders });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const {
      customer_name, company_name, phone, city_id, address,
      payment_type, notes, items,
      // Credit fields
      credit_due_date, credit_advance,
      // Cheque fields
      cheque_reference, cheque_bank, cheque_issue_date, cheque_arrival_date, cheque_image_url,
    } = body;

    if (!customer_name || !phone || !city_id || !items?.length) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Stock validation — check availability before creating order
    for (const item of items) {
      const stockMoves = await prisma.stockMovement.findMany({
        where: { product_id: item.product_id, ...(item.variation_id ? { variation_id: item.variation_id } : {}) },
        select: { quantity: true },
      });
      const currentStock = stockMoves.reduce((s: number, m: any) => s + m.quantity, 0);
      if (currentStock < item.quantity) {
        const product = await prisma.product.findUnique({ where: { id: item.product_id }, select: { name: true } });
        const pName = product?.name || 'Unknown';
        if (currentStock <= 0) {
          return NextResponse.json({ error: `"${pName}" is out of stock. Cannot create order.` }, { status: 400 });
        } else {
          return NextResponse.json({ error: `"${pName}" only has ${currentStock} units in stock (requested: ${item.quantity}).` }, { status: 400 });
        }
      }
    }

    let subtotal_ht = 0;
    const orderItems = items.map((item: any) => {
      const line_ht = item.quantity * item.unit_price * (1 - (item.discount_pct || 0) / 100);
      const line_tva = line_ht * 0.2;
      const line_ttc = line_ht + line_tva;
      subtotal_ht += line_ht;
      return {
        product_id: item.product_id,
        variation_id: item.variation_id || null,
        quantity: item.quantity,
        unit_price: item.unit_price,
        discount_pct: item.discount_pct || 0,
        line_ht, line_tva, line_ttc,
      };
    });

    const tva_amount = subtotal_ht * 0.2;
    const total_ttc = subtotal_ht + tva_amount;

    const order = await prisma.order.create({
      data: {
        order_number: generateOrderNumber(),
        customer_name, company_name, phone, city_id, address,
        payment_type: payment_type || 'cash',
        subtotal_ht, tva_amount, total_ttc, notes,
        created_by: session.userId,
        items: { create: orderItems },
        status_history: { create: { new_status: 'new_order', changed_by: session.userId, note: 'Order created' } },
      },
      include: { city: true, items: true },
    });

    // Auto-create Payment record
    const payment = await prisma.payment.create({
      data: {
        order_id: order.id,
        amount: total_ttc,
        payment_type: payment_type || 'cash',
        status: payment_type === 'cash' ? 'paid' : 'pending',
        created_by: session.userId,
      },
    });

    // If cheque → auto-create Cheque record
    if (payment_type === 'cheque') {
      await prisma.cheque.create({
        data: {
          reference: cheque_reference || `CHQ-${order.order_number}`,
          amount: total_ttc,
          issue_date: cheque_issue_date ? new Date(cheque_issue_date) : new Date(),
          arrival_date: cheque_arrival_date ? new Date(cheque_arrival_date) : null,
          bank: cheque_bank || 'À préciser',
          customer_name,
          order_id: order.id,
          payment_id: payment.id,
          image_url: cheque_image_url || null,
          created_by: session.userId,
        },
      });

      await prisma.order.update({
        where: { id: order.id },
        data: { payment_status: 'pending' },
      });
    }

    // If credit → auto-create Credit record
    if (payment_type === 'credit') {
      const advance = parseFloat(credit_advance) || 0;
      const remaining = total_ttc - advance;

      await prisma.credit.create({
        data: {
          customer_name,
          amount: total_ttc,
          remaining_amount: remaining,
          due_date: credit_due_date ? new Date(credit_due_date) : new Date(Date.now() + 30 * 86400000),
          order_id: order.id,
          created_by: session.userId,
        },
      });

      // If advance paid, record partial payment
      if (advance > 0) {
        await prisma.payment.update({
          where: { id: payment.id },
          data: { amount: advance, status: 'partial' },
        });
      }

      await prisma.order.update({
        where: { id: order.id },
        data: { payment_status: advance > 0 ? 'partial' : 'unpaid' },
      });
    }

    // Cash → mark as paid
    if (payment_type === 'cash') {
      await prisma.order.update({
        where: { id: order.id },
        data: { payment_status: 'paid' },
      });
    }

    await prisma.activityLog.create({
      data: { user_id: session.userId, action: 'Created', module: 'Orders', description: `Order ${order.order_number} created (${payment_type})` },
    });

    return NextResponse.json({ order }, { status: 201 });
  } catch (error: any) {
    console.error('Create order error:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const { id, status, shipping_company_id } = body;

    if (!id) return NextResponse.json({ error: 'Missing order id' }, { status: 400 });

    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

    const updates: any = {};

    // Status change
    if (status && status !== order.status) {
      updates.status = status;

      // Record status history
      await prisma.orderStatusHistory.create({
        data: {
          order_id: id,
          old_status: order.status,
          new_status: status,
          changed_by: session.userId,
        },
      });

      // Stock movements on shipped
      if (status === 'shipped') {
        for (const item of order.items) {
          await prisma.stockMovement.create({
            data: {
              product_id: item.product_id,
              variation_id: item.variation_id,
              type: 'shipped_order',
              quantity: -item.quantity,
              reference: order.order_number,
              note: `Shipped: Order ${order.order_number}`,
              user_id: session.userId,
            },
          });
        }
      }

      // Stock return on returned/cancelled
      if ((status === 'returned' || status === 'cancelled') && (order.status === 'shipped' || order.status === 'delivered')) {
        for (const item of order.items) {
          await prisma.stockMovement.create({
            data: {
              product_id: item.product_id,
              variation_id: item.variation_id,
              type: 'returned_order',
              quantity: item.quantity,
              reference: order.order_number,
              note: `${status}: Order ${order.order_number}`,
              user_id: session.userId,
            },
          });
        }
      }

      await prisma.activityLog.create({
        data: {
          user_id: session.userId, action: 'Status Change', module: 'Orders',
          description: `Order ${order.order_number}: ${order.status} → ${status}`,
        },
      });
    }

    // Shipping company assignment
    if (shipping_company_id !== undefined) {
      updates.shipping_company_id = shipping_company_id || null;
    }

    const updated = await prisma.order.update({
      where: { id },
      data: updates,
      include: { city: true, shipping_company: true, items: { include: { product: true, variation: true } }, payments: true, invoices: true },
    });

    return NextResponse.json({ order: updated });
  } catch (error: any) {
    console.error('Update order error:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
