import { NextResponse } from 'next/server';
import { authenticationMode } from '@/lib/auth/config';
import { persistenceHealth } from '@/lib/db';

export const runtime = 'nodejs';

export async function GET() {
  const persistence = await persistenceHealth();
  const ok = persistence !== 'unavailable';

  return NextResponse.json(
    {
      ok,
      service: 'tattoo-prehab',
      authentication: authenticationMode(),
      persistence,
    },
    { status: ok ? 200 : 503, headers: { 'Cache-Control': 'no-store' } },
  );
}
