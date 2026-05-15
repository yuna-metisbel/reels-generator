import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getPlanLimits } from '@/lib/plans';

export async function GET() {
  try {
    const user = await requireAuth();
    const limits = getPlanLimits(user.plan);

    const take = limits.maxHistoryItems === Infinity ? undefined : limits.maxHistoryItems;

    const generations = await prisma.generation.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take,
    });

    return NextResponse.json({
      generations,
      usage: {
        current: user.monthlyGenerationCount,
        limit: limits.maxGenerationsPerMonth,
        plan: user.plan,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'ログインが必要です' }, { status: 401 });
    }
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
