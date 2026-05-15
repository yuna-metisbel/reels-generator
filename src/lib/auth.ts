import { auth } from '@clerk/nextjs/server';
import { prisma } from './db';
import type { Plan } from './plans';

export interface AuthUser {
  id: string;
  clerkId: string;
  email: string;
  plan: Plan;
  monthlyGenerationCount: number;
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const { userId } = await auth();
  if (!userId) return null;

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
  });

  if (!user) return null;

  return {
    id: user.id,
    clerkId: user.clerkId,
    email: user.email,
    plan: user.plan as Plan,
    monthlyGenerationCount: user.monthlyGenerationCount,
  };
}

export async function requireAuth(): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('Unauthorized');
  }
  return user;
}
