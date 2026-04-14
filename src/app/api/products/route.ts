import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const brand = searchParams.get('brand');
  const category = searchParams.get('category');
  const search = searchParams.get('search');
  const lowStock = searchParams.get('lowStock');

  const products = await prisma.product.findMany({
    where: {
      ...(brand ? { brand_id: brand } : {}),
      ...(category ? { category_id: category } : {}),
      ...(search ? { name: { contains: search, mode: 'insensitive' } } : {}),
    },
    include: {
      brand: true, category: true, variations: true,
      stock_movements: { select: { quantity: true } },
    },
    orderBy: { created_at: 'desc' },
  });

  const result = products.map((p) => {
    const stock = p.stock_movements.reduce((s, m) => s + m.quantity, 0);
    return { ...p, stock, stock_movements: undefined };
  });

  const filtered = lowStock === 'true' ? result.filter((p) => p.stock < 3) : result;
  return NextResponse.json({ products: filtered });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const body = await req.json();
    const { name, image, brand_id, category_id, buying_price, selling_price, variations } = body;
    if (!name || !brand_id || !category_id) return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });

    const product = await prisma.product.create({
      data: {
        name, image: image || null, brand_id, category_id,
        buying_price: buying_price || 0, selling_price: selling_price || 0,
        created_by: session.userId,
        variations: variations?.length
          ? { create: variations.map((v: any) => ({ name: v.name, sku: v.sku, image: v.image || null, buying_price: v.buying_price || null, selling_price: v.selling_price || null })) }
          : undefined,
      },
      include: { brand: true, category: true, variations: true },
    });
    await prisma.activityLog.create({ data: { user_id: session.userId, action: 'Created', module: 'Products', description: `Created product: ${name}` } });
    return NextResponse.json({ product }, { status: 201 });
  } catch (error: any) {
    console.error('Create product error:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const body = await req.json();
    const { id, name, image, brand_id, category_id, buying_price, selling_price, active, variations } = body;
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    const data: any = {};
    if (name !== undefined) data.name = name;
    if (image !== undefined) data.image = image || null;
    if (brand_id !== undefined) data.brand_id = brand_id;
    if (category_id !== undefined) data.category_id = category_id;
    if (buying_price !== undefined) data.buying_price = buying_price;
    if (selling_price !== undefined) data.selling_price = selling_price;
    if (active !== undefined) data.active = active;

    const product = await prisma.product.update({
      where: { id }, data,
      include: { brand: true, category: true, variations: true },
    });

    // Handle variation updates if provided
    if (variations && Array.isArray(variations)) {
      // Delete removed variations
      const existingIds = variations.filter((v: any) => v.id).map((v: any) => v.id);
      await prisma.productVariation.deleteMany({
        where: { product_id: id, id: { notIn: existingIds } },
      });

      // Upsert variations
      for (const v of variations) {
        if (v.id) {
          await prisma.productVariation.update({
            where: { id: v.id },
            data: { name: v.name, sku: v.sku, image: v.image || null, buying_price: v.buying_price || null, selling_price: v.selling_price || null },
          });
        } else if (v.name && v.sku) {
          await prisma.productVariation.create({
            data: { product_id: id, name: v.name, sku: v.sku, image: v.image || null, buying_price: v.buying_price || null, selling_price: v.selling_price || null },
          });
        }
      }
    }

    await prisma.activityLog.create({ data: { user_id: session.userId, action: 'Updated', module: 'Products', description: `Updated product: ${product.name}` } });

    const updated = await prisma.product.findUnique({ where: { id }, include: { brand: true, category: true, variations: true } });
    return NextResponse.json({ product: updated });
  } catch (error: any) {
    console.error('Update product error:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
