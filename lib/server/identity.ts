import 'server-only';

import { createHmac } from 'node:crypto';
import { auth } from '@clerk/nextjs/server';
import { isClerkConfigured } from '@/lib/auth/config';

export type RequestIdentity =
  | { kind: 'account'; userId: string; accountKey: string }
  | { kind: 'device' };

function accountScopeSecret(): string {
  const value = process.env.SESSION_SECRET ?? process.env.CLERK_SECRET_KEY;
  if (!value || value.length < 32) {
    throw new Error('An account scope secret of at least 32 characters is required.');
  }
  return value;
}

export function accountKeyForUser(userId: string): string {
  return createHmac('sha256', accountScopeSecret())
    .update(`tattoo-prehab-account:${userId}`)
    .digest('base64url')
    .slice(0, 32);
}

export async function getRequestIdentity(): Promise<RequestIdentity | null> {
  if (!isClerkConfigured()) return { kind: 'device' };

  const { isAuthenticated, userId } = await auth();
  if (!isAuthenticated || !userId) return null;

  return {
    kind: 'account',
    userId,
    accountKey: accountKeyForUser(userId),
  };
}
