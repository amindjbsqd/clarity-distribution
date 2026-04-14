import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const movements = await prisma.stockMovement.findMany({
    include: { product: { select: { name: true, brand_id: true, category_id: true } }, variation: { select: { name: true } }, user: { select: { full_name: true } } },
    orderBy: { created_at: 'desc' },
    take: 100,
  });

  return NextResponse.json({ movements });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const { product_id, variation_id, type, quantity, note } = body;

    if (!product_id || !type || quantity === undefined) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const movement = await prisma.stockMovement.create({
      data: { product_id, variation_id: variation_id || null, type, quantity: parseInt(quantity), note, user_id: session.userId },
      include: { product: { select: { name: true } } },
    });

    await prisma.activityLog.create({
      data: { user_id: session.userId, action: 'Stock Change', module: 'Stock', description: `${type}: ${quantity} units - ${movement.product.name}` },
    });

    return NextResponse.json({ movement }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
