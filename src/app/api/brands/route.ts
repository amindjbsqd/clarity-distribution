import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const brands = await prisma.brand.findMany({ orderBy: { name: 'asc' }, include: { _count: { select: { products: true } } } });
  return NextResponse.json({ brands });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const { name } = await req.json();
    if (!name) return NextResponse.json({ error: 'Name required' }, { status: 400 });
    const exists = await prisma.brand.findFirst({ where: { name: { equals: name, mode: 'insensitive' } } });
    if (exists) return NextResponse.json({ error: 'Brand already exists' }, { status: 409 });
    const brand = await prisma.brand.create({ data: { name } });
    await prisma.activityLog.create({ data: { user_id: session.userId, action: 'Created', module: 'Brands', description: `Created brand: ${name}` } });
    return NextResponse.json({ brand }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const { id, name, active } = await req.json();
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    const data: any = {};
    if (name !== undefined) data.name = name;
    if (active !== undefined) data.active = active;
    const brand = await prisma.brand.update({ where: { id }, data });
    await prisma.activityLog.create({ data: { user_id: session.userId, action: 'Updated', module: 'Brands', description: `Updated brand: ${brand.name}` } });
    return NextResponse.json({ brand });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    const brand = await prisma.brand.findUnique({ where: { id }, include: { _count: { select: { products: true } } } });
    if (brand && brand._count.products > 0) return NextResponse.json({ error: 'Cannot delete brand with existing products' }, { status: 400 });
    await prisma.brand.delete({ where: { id } });
    await prisma.activityLog.create({ data: { user_id: session.userId, action: 'Deleted', module: 'Brands', description: `Deleted brand: ${brand?.name}` } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
