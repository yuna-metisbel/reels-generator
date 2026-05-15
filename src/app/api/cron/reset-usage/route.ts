import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const result = await prisma.user.updateMany({
    data: { monthlyGenerationCount: 0 },
  });

  return NextResponse.json({
    reset: true,
    usersAffected: result.count,
  });
}
