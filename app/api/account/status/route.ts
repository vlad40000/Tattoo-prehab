import { NextResponse } from 'next/server';
import { isClerkConfigured } from '@/lib/auth/config';
import { persistenceHealth } from '@/lib/db';
import { getRequestIdentity } from '@/lib/server/identity';

export const runtime = 'nodejs';

export async function GET() {
  const persistence = await persistenceHealth();
  if (!isClerkConfigured()) {
    return NextResponse.json(
      { auth: 'unconfigured', persistence, syncReady: persistence === 'ready' },
      { headers: { 'Cache-Control': 'private, no-store' } },
    );
  }

  const identity = await getRequestIdentity();
  if (!identity || identity.kind !== 'account') {
    return NextResponse.json(
      { auth: 'signed-out', persistence, syncReady: false },
      { status: 401, headers: { 'Cache-Control': 'private, no-store' } },
    );
  }

  return NextResponse.json(
    {
      auth: 'signed-in',
      persistence,
      syncReady: persistence === 'ready',
      accountKey: identity.accountKey,
    },
    { headers: { 'Cache-Control': 'private, no-store' } },
  );
}
