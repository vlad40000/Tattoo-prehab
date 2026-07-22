import 'server-only';

import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { cookies } from 'next/headers';
import { getDb } from '@/lib/db';
import { participants } from '@/lib/db/schema';

const COOKIE_NAME = 'machine_hand_device';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

function secret(): string {
  const value = process.env.SESSION_SECRET;
  if (!value || value.length < 32) throw new Error('SESSION_SECRET must contain at least 32 characters.');
  return value;
}

function signature(id: string): string {
  return createHmac('sha256', secret()).update(id).digest('base64url');
}

function parseSignedId(value: string | undefined): string | null {
  if (!value) return null;
  const [id, candidate, extra] = value.split('.');
  if (!id || !candidate || extra || !/^[0-9a-f-]{36}$/.test(id)) return null;
  const expected = signature(id);
  const a = Buffer.from(candidate);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b) ? id : null;
}

export async function getOrCreateParticipantId(): Promise<string> {
  const store = await cookies();
  const existing = parseSignedId(store.get(COOKIE_NAME)?.value);
  const participantId = existing ?? randomUUID();

  if (!existing) {
    store.set(COOKIE_NAME, `${participantId}.${signature(participantId)}`, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: COOKIE_MAX_AGE,
      priority: 'high',
    });
  }

  const db = getDb();
  await db
    .insert(participants)
    .values({ id: participantId })
    .onConflictDoUpdate({ target: participants.id, set: { lastSeenAt: new Date() } });
  return participantId;
}

export async function existingParticipantId(): Promise<string | null> {
  const store = await cookies();
  const participantId = parseSignedId(store.get(COOKIE_NAME)?.value);
  if (!participantId) return null;
  const row = await getDb().query.participants.findFirst({ where: eq(participants.id, participantId) });
  return row?.id ?? null;
}
