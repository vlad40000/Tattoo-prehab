import { and, eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { getDb, isPersistenceConfigured } from '@/lib/db';
import { accountImports, practiceSessions, symptomCheckins } from '@/lib/db/schema';
import { accountImportInputSchema } from '@/lib/progress';
import { getRequestIdentity } from '@/lib/server/identity';
import { participantIdForIdentity } from '@/lib/server/persistence-subject';
import { requestIsSameOrigin } from '@/lib/server/request';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  if (!requestIsSameOrigin(request)) return NextResponse.json({ error: 'Invalid request origin.' }, { status: 403 });

  const identity = await getRequestIdentity();
  if (!identity || identity.kind !== 'account') {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }
  if (!isPersistenceConfigured()) {
    return NextResponse.json({ error: 'Cloud persistence is not configured.' }, { status: 503 });
  }

  const parsed = accountImportInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid account import.', fields: parsed.error.flatten() }, { status: 400 });
  }

  const participantId = await participantIdForIdentity(identity);
  const existing = await getDb().query.accountImports.findFirst({
    where: and(
      eq(accountImports.participantId, participantId),
      eq(accountImports.importKey, parsed.data.importKey),
    ),
  });
  if (existing) {
    return NextResponse.json({
      imported: true,
      duplicate: true,
      sessionsImported: existing.sessionsImported,
      checkinsImported: existing.checkinsImported,
    });
  }

  const db = getDb();
  let sessionsImported = 0;
  let checkinsImported = 0;

  if (parsed.data.sessions.length) {
    const rows = await db
      .insert(practiceSessions)
      .values(parsed.data.sessions.map((input) => ({
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
      })))
      .onConflictDoNothing({ target: [practiceSessions.participantId, practiceSessions.idempotencyKey] })
      .returning({ id: practiceSessions.id });
    sessionsImported = rows.length;
  }

  if (parsed.data.checkins.length) {
    const rows = await db
      .insert(symptomCheckins)
      .values(parsed.data.checkins.map((input) => ({
        participantId,
        idempotencyKey: input.idempotencyKey,
        zone: input.zone,
        symptomId: input.symptomId ?? null,
        discomfort: input.discomfort ?? null,
        note: input.note || null,
        occurredAt: new Date(input.occurredAt),
      })))
      .onConflictDoNothing({ target: [symptomCheckins.participantId, symptomCheckins.idempotencyKey] })
      .returning({ id: symptomCheckins.id });
    checkinsImported = rows.length;
  }

  await db
    .insert(accountImports)
    .values({
      participantId,
      importKey: parsed.data.importKey,
      sessionsImported,
      checkinsImported,
    })
    .onConflictDoNothing({ target: [accountImports.participantId, accountImports.importKey] });

  return NextResponse.json(
    { imported: true, duplicate: false, sessionsImported, checkinsImported },
    { status: 201 },
  );
}
