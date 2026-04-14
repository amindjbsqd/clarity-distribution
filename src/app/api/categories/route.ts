import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const categories = await prisma.category.findMany({ orderBy: { name: 'asc' }, include: { _count: { select: { products: true } } } });
  return NextResponse.json({ categories });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const { name } = await req.json();
    if (!name) return NextResponse.json({ error: 'Name required' }, { status: 400 });
    const exists = await prisma.category.findFirst({ where: { name: { equals: name, mode: 'insensitive' } } });
    if (exists) return NextResponse.json({ error: 'Category already exists' }, { status: 409 });
    const category = await prisma.category.create({ data: { name } });
    await prisma.activityLog.create({ data: { user_id: session.userId, action: 'Created', module: 'Categories', description: `Created category: ${name}` } });
    return NextResponse.json({ category }, { status: 201 });
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
    const category = await prisma.category.update({ where: { id }, data });
    await prisma.activityLog.create({ data: { user_id: session.userId, action: 'Updated', module: 'Categories', description: `Updated category: ${category.name}` } });
    return NextResponse.json({ category });
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
    const cat = await prisma.category.findUnique({ where: { id }, include: { _count: { select: { products: true } } } });
    if (cat && cat._count.products > 0) return NextResponse.json({ error: 'Cannot delete category with existing products' }, { status: 400 });
    await prisma.category.delete({ where: { id } });
    await prisma.activityLog.create({ data: { user_id: session.userId, action: 'Deleted', module: 'Categories', description: `Deleted category: ${cat?.name}` } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
