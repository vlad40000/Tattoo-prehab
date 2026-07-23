import { desc, eq, sql } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { getDb, isPersistenceConfigured } from '@/lib/db';
import { practiceSessions } from '@/lib/db/schema';
import { practiceSessionInputSchema, type ProgressSummary } from '@/lib/progress';
import { getRequestIdentity } from '@/lib/server/identity';
import { participantIdForIdentity } from '@/lib/server/persistence-subject';
import { requestIsSameOrigin } from '@/lib/server/request';

export const runtime = 'nodejs';

function emptyLocalSummary(): ProgressSummary {
  return {
    mode: 'local',
    completedSessions: 0,
    minutesCompleted: 0,
    currentStreak: 0,
    weeklySessions: 0,
    lastTrafficLight: null,
    recentSessions: [],
    exerciseProgress: [],
  };
}

function streakFor(dates: Date[]): number {
  const days = new Set(dates.map((date) => date.toISOString().slice(0, 10)));
  const cursor = new Date();
  cursor.setUTCHours(0, 0, 0, 0);
  const today = cursor.toISOString().slice(0, 10);
  if (!days.has(today)) cursor.setUTCDate(cursor.getUTCDate() - 1);

  let streak = 0;
  while (days.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return streak;
}

export async function GET() {
  const identity = await getRequestIdentity();
  if (!identity) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });

  if (!isPersistenceConfigured()) {
    return NextResponse.json(emptyLocalSummary(), { headers: { 'Cache-Control': 'private, no-store' } });
  }

  const participantId = await participantIdForIdentity(identity);
  const db = getDb();
  const [aggregate, history] = await Promise.all([
    db
      .select({
        completedSessions: sql<number>`count(*)::int`,
        totalSeconds: sql<number>`coalesce(sum(${practiceSessions.durationSeconds}), 0)::int`,
      })
      .from(practiceSessions)
      .where(eq(practiceSessions.participantId, participantId)),
    db
      .select({
        id: practiceSessions.id,
        sourceLabel: practiceSessions.sourceLabel,
        completedAt: practiceSessions.completedAt,
        durationSeconds: practiceSessions.durationSeconds,
        trafficLight: practiceSessions.trafficLight,
        items: practiceSessions.items,
      })
      .from(practiceSessions)
      .where(eq(practiceSessions.participantId, participantId))
      .orderBy(desc(practiceSessions.completedAt))
      .limit(500),
  ]);

  const weekBoundary = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const exerciseMap = new Map<string, ProgressSummary['exerciseProgress'][number]>();

  for (const session of history) {
    for (const item of session.items) {
      const previous = exerciseMap.get(item.exerciseId) ?? {
        exerciseId: item.exerciseId,
        completedSessions: 0,
        completedSets: 0,
        plannedSets: 0,
        lastCompletedAt: session.completedAt.toISOString(),
      };
      previous.plannedSets += item.plannedSets ?? 1;
      previous.completedSets += item.completedSets ?? (item.completed ? item.plannedSets ?? 1 : 0);
      if (item.completed) {
        previous.completedSessions += 1;
        if (session.completedAt.toISOString() > previous.lastCompletedAt) {
          previous.lastCompletedAt = session.completedAt.toISOString();
        }
      }
      exerciseMap.set(item.exerciseId, previous);
    }
  }

  const result: ProgressSummary = {
    mode: 'cloud',
    completedSessions: aggregate[0]?.completedSessions ?? 0,
    minutesCompleted: Math.round((aggregate[0]?.totalSeconds ?? 0) / 60),
    currentStreak: streakFor(history.map((row) => row.completedAt)),
    weeklySessions: history.filter((row) => row.completedAt.getTime() >= weekBoundary).length,
    lastTrafficLight: (history[0]?.trafficLight as ProgressSummary['lastTrafficLight']) ?? null,
    recentSessions: history.slice(0, 30).map((row) => ({
      id: row.id,
      sourceLabel: row.sourceLabel,
      completedAt: row.completedAt.toISOString(),
      durationSeconds: row.durationSeconds,
      trafficLight: row.trafficLight as 'green' | 'yellow' | 'red',
      completedExercises: row.items.filter((item) => item.completed).length,
      totalExercises: row.items.length,
    })),
    exerciseProgress: [...exerciseMap.values()]
      .sort((a, b) => b.lastCompletedAt.localeCompare(a.lastCompletedAt))
      .slice(0, 20),
  };
  return NextResponse.json(result, { headers: { 'Cache-Control': 'private, no-store' } });
}

export async function POST(request: NextRequest) {
  if (!requestIsSameOrigin(request)) return NextResponse.json({ error: 'Invalid request origin.' }, { status: 403 });

  const identity = await getRequestIdentity();
  if (!identity) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  if (!isPersistenceConfigured()) {
    return NextResponse.json({ mode: 'local', persisted: false }, { status: 503 });
  }

  const parsed = practiceSessionInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid session record.', fields: parsed.error.flatten() }, { status: 400 });
  }

  const participantId = await participantIdForIdentity(identity);
  const input = parsed.data;
  const [row] = await getDb()
    .insert(practiceSessions)
    .values({
      participantId,
      idempotencyKey: input.idempotencyKey,
      sourceType: input.sourceType,
      sourceId: input.sourceId,
      sourceLabel: input.sourceLabel,
      startedAt: new Date(input.startedAt),
      completedAt: new Date(input.completedAt),
      durationSeconds: input.durationSeconds,
      trafficLight: input.trafficLight,
      painBefore: input.painBefore ?? null,
      painAfter: input.painAfter ?? null,
      notes: input.notes || null,
      items: input.items,
    })
    .onConflictDoNothing({ target: [practiceSessions.participantId, practiceSessions.idempotencyKey] })
    .returning({ id: practiceSessions.id });

  return NextResponse.json({ mode: 'cloud', persisted: true, id: row?.id ?? null }, { status: row ? 201 : 200 });
}
