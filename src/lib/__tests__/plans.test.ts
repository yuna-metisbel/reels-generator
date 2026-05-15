import { describe, it, expect } from 'vitest';
import { PLANS, getPlanLimits, canGenerate, canDownloadVideo } from '../plans';

describe('plans', () => {
  it('free plan has 5 generations per month', () => {
    const limits = getPlanLimits('free');
    expect(limits.maxGenerationsPerMonth).toBe(5);
  });

  it('pro plan has unlimited generations', () => {
    const limits = getPlanLimits('pro');
    expect(limits.maxGenerationsPerMonth).toBe(Infinity);
  });

  it('free user can generate when under limit', () => {
    expect(canGenerate('free', 3)).toBe(true);
  });

  it('free user cannot generate when at limit', () => {
    expect(canGenerate('free', 5)).toBe(false);
  });

  it('pro user can always generate', () => {
    expect(canGenerate('pro', 999)).toBe(true);
  });

  it('free user cannot download video', () => {
    expect(canDownloadVideo('free')).toBe(false);
  });

  it('pro user can download video', () => {
    expect(canDownloadVideo('pro')).toBe(true);
  });
});
