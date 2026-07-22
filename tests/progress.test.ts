import { describe, expect, it } from 'vitest';
import { practiceSessionInputSchema } from '@/lib/progress';

describe('progress write boundary', () => {
  const valid = {
    idempotencyKey: '71be6aa6-0c88-4c5c-828f-25c805d032b4',
    sourceType: 'routine',
    sourceId: 'pre-session',
    sourceLabel: 'Eight-minute pre-session routine',
    startedAt: '2026-07-22T14:00:00.000Z',
    completedAt: '2026-07-22T14:08:00.000Z',
    durationSeconds: 480,
    trafficLight: 'green',
    items: [{ exerciseId: 'breathing-90-90', prescription: '4 slow breaths', completed: true }],
  };

  it('accepts a bounded, idempotent session record', () => {
    expect(practiceSessionInputSchema.parse(valid)).toMatchObject(valid);
  });

  it('rejects invalid pain and oversized session duration', () => {
    expect(practiceSessionInputSchema.safeParse({ ...valid, painAfter: 11 }).success).toBe(false);
    expect(practiceSessionInputSchema.safeParse({ ...valid, durationSeconds: 20_000 }).success).toBe(false);
  });
});
