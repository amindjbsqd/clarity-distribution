import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSession, hashPassword } from '@/lib/auth';

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const users = await prisma.user.findMany({
    select: { id: true, full_name: true, email: true, phone: true, role: true, active: true, must_change_password: true, last_login: true, created_at: true },
    orderBy: { created_at: 'desc' },
  });
  return NextResponse.json({ users });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  try {
    const body = await req.json();
    const { full_name, email, phone, password, role } = body;
    if (!full_name || !email || !password) return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    if (password.length < 8) return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) return NextResponse.json({ error: 'Email already exists' }, { status: 409 });
    const password_hash = await hashPassword(password);
    const user = await prisma.user.create({
      data: { full_name, email, phone, password_hash, role: role || 'commercial', must_change_password: true, created_by: session.userId },
      select: { id: true, full_name: true, email: true, role: true, active: true },
    });
    await prisma.activityLog.create({ data: { user_id: session.userId, action: 'Created', module: 'Users', description: `Created user: ${full_name} (${role})` } });
    return NextResponse.json({ user }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  try {
    const { id, full_name, phone, role, active, password } = await req.json();
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    const data: any = {};
    if (full_name !== undefined) data.full_name = full_name;
    if (phone !== undefined) data.phone = phone;
    if (role !== undefined) data.role = role;
    if (active !== undefined) data.active = active;
    if (password && password.length >= 8) data.password_hash = await hashPassword(password);
    const user = await prisma.user.update({
      where: { id }, data,
      select: { id: true, full_name: true, email: true, role: true, active: true },
    });
    await prisma.activityLog.create({ data: { user_id: session.userId, action: 'Updated', module: 'Users', description: `Updated user: ${user.full_name}` } });
    return NextResponse.json({ user });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
