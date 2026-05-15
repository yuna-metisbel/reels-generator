import { NextResponse } from 'next/server';
import { generateScript } from '@/lib/ai/client';
import { requireAuth } from '@/lib/auth';
import { canGenerate } from '@/lib/plans';
import { prisma } from '@/lib/db';
import type { UserInput } from '@/types';

export async function POST(request: Request) {
  try {
    const user = await requireAuth();

    if (!canGenerate(user.plan, user.monthlyGenerationCount)) {
      return NextResponse.json(
        { error: '今月の生成回数上限に達しました。Proプランにアップグレードしてください。' },
        { status: 403 }
      );
    }

    const body: UserInput = await request.json();
    const result = await generateScript(body);

    await prisma.$transaction([
      prisma.generation.create({
        data: {
          userId: user.id,
          input: body as object,
          result: result as object,
        },
      }),
      prisma.user.update({
        where: { id: user.id },
        data: { monthlyGenerationCount: { increment: 1 } },
      }),
    ]);

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'ログインが必要です' }, { status: 401 });
    }
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
