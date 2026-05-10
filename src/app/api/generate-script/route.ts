import { NextResponse } from 'next/server';
import { generateScript } from '@/lib/ai/client';
import type { UserInput } from '@/types';

export async function POST(request: Request) {
  try {
    const body: UserInput = await request.json();
    const result = await generateScript(body);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
