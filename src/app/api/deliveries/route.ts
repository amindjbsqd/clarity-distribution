import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const companies = await prisma.shippingCompany.findMany({ orderBy: { name: 'asc' } });
  return NextResponse.json({ companies });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const { name, phone, email } = await req.json();
    if (!name) return NextResponse.json({ error: 'Name required' }, { status: 400 });
    const company = await prisma.shippingCompany.create({ data: { name, phone, email, created_by: session.userId } });
    await prisma.activityLog.create({ data: { user_id: session.userId, action: 'Created', module: 'Deliveries', description: `Created shipping company: ${name}` } });
    return NextResponse.json({ company }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const { id, name, phone, email, active } = await req.json();
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    const data: any = {};
    if (name !== undefined) data.name = name;
    if (phone !== undefined) data.phone = phone;
    if (email !== undefined) data.email = email;
    if (active !== undefined) data.active = active;
    const company = await prisma.shippingCompany.update({ where: { id }, data });
    await prisma.activityLog.create({ data: { user_id: session.userId, action: 'Updated', module: 'Deliveries', description: `Updated: ${company.name}` } });
    return NextResponse.json({ company });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
