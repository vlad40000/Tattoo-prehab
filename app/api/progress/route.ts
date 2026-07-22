import { desc, eq, sql } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { getDb, isPersistenceConfigured } from '@/lib/db';
import { practiceSessions } from '@/lib/db/schema';
import { practiceSessionInputSchema, type ProgressSummary } from '@/lib/progress';
import { getOrCreateParticipantId } from '@/lib/server/participant';
import { requestIsSameOrigin } from '@/lib/server/request';

export const runtime = 'nodejs';

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
  if (!isPersistenceConfigured()) {
    const local: ProgressSummary = {
      mode: 'local',
      completedSessions: 0,
      minutesCompleted: 0,
      currentStreak: 0,
      lastTrafficLight: null,
      recentSessions: [],
    };
    return NextResponse.json(local, { headers: { 'Cache-Control': 'private, no-store' } });
  }

  const participantId = await getOrCreateParticipantId();
  const db = getDb();
  const [aggregate, recent, completedDates] = await Promise.all([
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
      })
      .from(practiceSessions)
      .where(eq(practiceSessions.participantId, participantId))
      .orderBy(desc(practiceSessions.completedAt))
      .limit(5),
    db
      .select({ completedAt: practiceSessions.completedAt })
      .from(practiceSessions)
      .where(eq(practiceSessions.participantId, participantId))
      .orderBy(desc(practiceSessions.completedAt))
      .limit(90),
  ]);

  const result: ProgressSummary = {
    mode: 'cloud',
    completedSessions: aggregate[0]?.completedSessions ?? 0,
    minutesCompleted: Math.round((aggregate[0]?.totalSeconds ?? 0) / 60),
    currentStreak: streakFor(completedDates.map((row) => row.completedAt)),
    lastTrafficLight: (recent[0]?.trafficLight as ProgressSummary['lastTrafficLight']) ?? null,
    recentSessions: recent.map((row) => ({
      ...row,
      completedAt: row.completedAt.toISOString(),
      trafficLight: row.trafficLight as 'green' | 'yellow' | 'red',
    })),
  };
  return NextResponse.json(result, { headers: { 'Cache-Control': 'private, no-store' } });
}

export async function POST(request: NextRequest) {
  if (!requestIsSameOrigin(request)) return NextResponse.json({ error: 'Invalid request origin.' }, { status: 403 });
  if (!isPersistenceConfigured()) {
    return NextResponse.json({ mode: 'local', persisted: false }, { status: 503 });
  }

  const parsed = practiceSessionInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid session record.', fields: parsed.error.flatten() }, { status: 400 });
  }

  const participantId = await getOrCreateParticipantId();
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
