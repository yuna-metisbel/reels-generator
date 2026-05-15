import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { createCheckoutSession } from '@/lib/stripe';
import { prisma } from '@/lib/db';

export async function POST() {
  try {
    const user = await requireAuth();

    if (user.plan === 'pro') {
      return NextResponse.json(
        { error: 'すでにProプランです' },
        { status: 400 }
      );
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
    });

    const url = await createCheckoutSession(
      user.id,
      user.email,
      dbUser?.stripeCustomerId ?? null
    );

    return NextResponse.json({ url });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'ログインが必要です' }, { status: 401 });
    }
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
