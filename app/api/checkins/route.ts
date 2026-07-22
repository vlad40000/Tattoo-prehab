import { NextRequest, NextResponse } from 'next/server';
import { getDb, isPersistenceConfigured } from '@/lib/db';
import { symptomCheckins } from '@/lib/db/schema';
import { symptomCheckinInputSchema } from '@/lib/progress';
import { getOrCreateParticipantId } from '@/lib/server/participant';
import { requestIsSameOrigin } from '@/lib/server/request';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  if (!requestIsSameOrigin(request)) return NextResponse.json({ error: 'Invalid request origin.' }, { status: 403 });
  if (!isPersistenceConfigured()) return NextResponse.json({ mode: 'local', persisted: false }, { status: 503 });

  const parsed = symptomCheckinInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid symptom check-in.', fields: parsed.error.flatten() }, { status: 400 });
  }

  const participantId = await getOrCreateParticipantId();
  const input = parsed.data;
  const [row] = await getDb()
    .insert(symptomCheckins)
    .values({
      participantId,
      idempotencyKey: input.idempotencyKey,
      zone: input.zone,
      symptomId: input.symptomId ?? null,
      discomfort: input.discomfort ?? null,
      note: input.note || null,
      occurredAt: new Date(input.occurredAt),
    })
    .onConflictDoNothing({ target: [symptomCheckins.participantId, symptomCheckins.idempotencyKey] })
    .returning({ id: symptomCheckins.id });

  return NextResponse.json({ mode: 'cloud', persisted: true, id: row?.id ?? null }, { status: row ? 201 : 200 });
}
