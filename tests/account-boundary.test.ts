import { describe, expect, it } from 'vitest';
import { accountImportInputSchema, practiceSessionInputSchema } from '@/lib/progress';

const session = {
  idempotencyKey: '71be6aa6-0c88-4c5c-828f-25c805d032b4',
  sourceType: 'routine',
  sourceId: 'pre-session',
  sourceLabel: 'Eight-minute pre-session routine',
  startedAt: '2026-07-22T14:00:00.000Z',
  completedAt: '2026-07-22T14:08:00.000Z',
  durationSeconds: 480,
  trafficLight: 'green',
  items: [{
    exerciseId: 'breathing-90-90',
    prescription: '4 slow breaths',
    completed: true,
    plannedSets: 1,
    completedSets: 1,
    targetLabel: '4 breaths',
  }],
};

describe('account ownership boundary', () => {
  it('rejects client-selected participant and user identifiers', () => {
    expect(practiceSessionInputSchema.safeParse({ ...session, participantId: crypto.randomUUID() }).success).toBe(false);
    expect(practiceSessionInputSchema.safeParse({ ...session, userId: 'user_other' }).success).toBe(false);
  });

  it('accepts an idempotent bounded device-history import', () => {
    expect(accountImportInputSchema.safeParse({
      importKey: 'd2457780-454b-4b9e-b6f6-9c6858349c88',
      sessions: [session],
      checkins: [],
    }).success).toBe(true);
  });
});
