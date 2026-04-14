import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const sessions = await prisma.importSession.findMany({ include: { user: { select: { full_name: true } } }, orderBy: { created_at: 'desc' } });
  return NextResponse.json({ sessions });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const body = await req.json();
    const { filename, rows } = body;

    const importSession = await prisma.importSession.create({
      data: {
        filename: filename || 'import.xlsx',
        total_rows: rows?.length || 0,
        user_id: session.userId,
        rows: rows?.length ? { create: rows.map((r: any, i: number) => ({ row_number: i + 1, data: r })) } : undefined,
      },
    });

    return NextResponse.json({ session: importSession }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
