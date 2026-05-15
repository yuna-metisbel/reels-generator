export type Plan = 'free' | 'pro';

export interface PlanLimits {
  maxGenerationsPerMonth: number;
  canDownloadVideo: boolean;
  maxHistoryItems: number;
  price: number;
}

export const PLANS: Record<Plan, PlanLimits> = {
  free: {
    maxGenerationsPerMonth: 5,
    canDownloadVideo: false,
    maxHistoryItems: 5,
    price: 0,
  },
  pro: {
    maxGenerationsPerMonth: Infinity,
    canDownloadVideo: true,
    maxHistoryItems: Infinity,
    price: 980,
  },
};

export function getPlanLimits(plan: Plan): PlanLimits {
  return PLANS[plan];
}

export function canGenerate(plan: Plan, currentCount: number): boolean {
  const limits = getPlanLimits(plan);
  return currentCount < limits.maxGenerationsPerMonth;
}

export function canDownloadVideo(plan: Plan): boolean {
  return getPlanLimits(plan).canDownloadVideo;
}
