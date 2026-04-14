import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const cities = await prisma.city.findMany({ orderBy: { name: 'asc' } });
  return NextResponse.json({ cities });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const { name, region } = await req.json();
    if (!name) return NextResponse.json({ error: 'Name required' }, { status: 400 });
    const exists = await prisma.city.findFirst({ where: { name: { equals: name, mode: 'insensitive' } } });
    if (exists) return NextResponse.json({ error: 'City already exists' }, { status: 409 });
    const city = await prisma.city.create({ data: { name, region } });
    return NextResponse.json({ city }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
