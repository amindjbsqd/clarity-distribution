import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const from = searchParams.get('from');
  const to = searchParams.get('to');

  const where: any = {};
  if (from) where.created_at = { ...(where.created_at || {}), gte: new Date(from) };
  if (to) {
    const toDate = new Date(to);
    toDate.setHours(23, 59, 59, 999);
    where.created_at = { ...(where.created_at || {}), lte: toDate };
  }

  const orders = await prisma.order.findMany({
    where,
    include: {
      city: true,
      items: {
        include: {
          product: { include: { brand: true, category: true } },
          variation: true,
        },
      },
    },
    orderBy: { created_at: 'desc' },
  });

  // Aggregate sold products
  const productMap = new Map<string, any>();

  for (const order of orders) {
    for (const item of order.items) {
      const key = item.variation_id ? `${item.product_id}-${item.variation_id}` : item.product_id;
      if (!productMap.has(key)) {
        productMap.set(key, {
          product_id: item.product_id,
          product_name: item.product.name,
          product_image: item.product.image,
          brand: item.product.brand?.name || '',
          category: item.product.category?.name || '',
          variation_id: item.variation_id,
          variation_name: item.variation?.name || null,
          variation_image: item.variation?.image || null,
          total_quantity: 0,
          total_revenue: 0,
          order_count: 0,
        });
      }
      const entry = productMap.get(key)!;
      entry.total_quantity += item.quantity;
      entry.total_revenue += Number(item.line_ttc);
      entry.order_count += 1;
    }
  }

  const soldProducts = Array.from(productMap.values()).sort((a, b) => b.total_revenue - a.total_revenue);

  return NextResponse.json({
    summary: {
      total_orders: orders.length,
      total_revenue: orders.reduce((s, o) => s + Number(o.total_ttc), 0),
      total_items_sold: soldProducts.reduce((s, p) => s + p.total_quantity, 0),
    },
    soldProducts,
  });
}
