import 'server-only';

import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import { and, eq, isNull } from 'drizzle-orm';
import { cookies } from 'next/headers';
import { getDb } from '@/lib/db';
import { participants } from '@/lib/db/schema';

const COOKIE_NAME = 'tattoo_prehab_device';
const LEGACY_COOKIE_NAME = 'machine_hand_device';
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

async function signedDeviceParticipantId(): Promise<string | null> {
  const store = await cookies();
  return parseSignedId(store.get(COOKIE_NAME)?.value) ?? parseSignedId(store.get(LEGACY_COOKIE_NAME)?.value);
}

export async function getOrCreateParticipantId(): Promise<string> {
  const store = await cookies();
  const current = parseSignedId(store.get(COOKIE_NAME)?.value);
  const legacy = parseSignedId(store.get(LEGACY_COOKIE_NAME)?.value);
  const participantId = current ?? legacy ?? randomUUID();

  if (!current) {
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
  const participantId = await signedDeviceParticipantId();
  if (!participantId) return null;
  const row = await getDb().query.participants.findFirst({ where: eq(participants.id, participantId) });
  return row?.id ?? null;
}

/**
 * Resolves one stable database participant for a Clerk account. If the signed-in
 * browser already owns a valid anonymous participant, the account claims that
 * row so any previously cloud-synced device history stays attached.
 */
export async function getOrCreateAuthenticatedParticipantId(clerkUserId: string): Promise<string> {
  const db = getDb();
  const existing = await db.query.participants.findFirst({
    where: eq(participants.clerkUserId, clerkUserId),
  });

  if (existing) {
    await db.update(participants).set({ lastSeenAt: new Date() }).where(eq(participants.id, existing.id));
    return existing.id;
  }

  const deviceId = await signedDeviceParticipantId();
  if (deviceId) {
    const [claimed] = await db
      .update(participants)
      .set({ clerkUserId, claimedAt: new Date(), lastSeenAt: new Date() })
      .where(and(eq(participants.id, deviceId), isNull(participants.clerkUserId)))
      .returning({ id: participants.id });

    if (claimed) return claimed.id;
  }

  const participantId = randomUUID();
  await db
    .insert(participants)
    .values({
      id: participantId,
      clerkUserId,
      claimedAt: new Date(),
    })
    .onConflictDoNothing({ target: participants.clerkUserId });

  const accountParticipant = await db.query.participants.findFirst({
    where: eq(participants.clerkUserId, clerkUserId),
  });
  if (!accountParticipant) throw new Error('Unable to create account participant.');
  return accountParticipant.id;
}
