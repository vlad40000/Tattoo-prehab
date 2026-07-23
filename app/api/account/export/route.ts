import { desc, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { getDb, isPersistenceConfigured } from '@/lib/db';
import { participantPreferences, practiceSessions, symptomCheckins } from '@/lib/db/schema';
import { getRequestIdentity } from '@/lib/server/identity';
import { participantIdForIdentity } from '@/lib/server/persistence-subject';

export const runtime = 'nodejs';

export async function GET() {
  const identity = await getRequestIdentity();
  if (!identity || identity.kind !== 'account') {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }
  if (!isPersistenceConfigured()) {
    return NextResponse.json({ error: 'Cloud persistence is not configured.' }, { status: 503 });
  }

  const participantId = await participantIdForIdentity(identity);
  const db = getDb();
  const [sessions, checkins, preferences] = await Promise.all([
    db.select().from(practiceSessions).where(eq(practiceSessions.participantId, participantId)).orderBy(desc(practiceSessions.completedAt)),
    db.select().from(symptomCheckins).where(eq(symptomCheckins.participantId, participantId)).orderBy(desc(symptomCheckins.occurredAt)),
    db.query.participantPreferences.findFirst({ where: eq(participantPreferences.participantId, participantId) }),
  ]);

  return NextResponse.json(
    {
      exportedAt: new Date().toISOString(),
      sessions,
      checkins,
      preferences: preferences ?? null,
    },
    {
      headers: {
        'Cache-Control': 'private, no-store',
        'Content-Disposition': `attachment; filename="tattoo-prehab-history-${new Date().toISOString().slice(0, 10)}.json"`,
      },
    },
  );
}
