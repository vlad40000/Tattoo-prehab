import { z } from 'zod';

const isoDateTime = z.iso.datetime({ offset: true });

export const sessionItemResultSchema = z.object({
  exerciseId: z.string().min(1).max(100),
  prescription: z.string().min(1).max(300),
  completed: z.boolean(),
});

export const practiceSessionInputSchema = z.object({
  idempotencyKey: z.uuid(),
  sourceType: z.enum(['routine', 'strength', 'minimum']),
  sourceId: z.string().min(1).max(100),
  sourceLabel: z.string().min(1).max(160),
  startedAt: isoDateTime,
  completedAt: isoDateTime,
  durationSeconds: z.number().int().min(0).max(60 * 60 * 4),
  trafficLight: z.enum(['green', 'yellow', 'red']),
  painBefore: z.number().int().min(0).max(10).nullable().optional(),
  painAfter: z.number().int().min(0).max(10).nullable().optional(),
  notes: z.string().trim().max(1000).nullable().optional(),
  items: z.array(sessionItemResultSchema).min(1).max(40),
});

export const symptomCheckinInputSchema = z.object({
  idempotencyKey: z.uuid(),
  zone: z.enum(['green', 'yellow', 'red']),
  symptomId: z.string().min(1).max(100).nullable().optional(),
  discomfort: z.number().int().min(0).max(10).nullable().optional(),
  note: z.string().trim().max(500).nullable().optional(),
  occurredAt: isoDateTime,
});

export type PracticeSessionInput = z.infer<typeof practiceSessionInputSchema>;
export type SymptomCheckinInput = z.infer<typeof symptomCheckinInputSchema>;

export type ProgressSummary = {
  mode: 'cloud' | 'local';
  completedSessions: number;
  minutesCompleted: number;
  currentStreak: number;
  lastTrafficLight: 'green' | 'yellow' | 'red' | null;
  recentSessions: Array<{
    id: string;
    sourceLabel: string;
    completedAt: string;
    durationSeconds: number;
    trafficLight: 'green' | 'yellow' | 'red';
  }>;
};
