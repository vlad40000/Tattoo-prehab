import { NextResponse } from 'next/server';
import { persistenceHealth } from '@/lib/db';

export const runtime = 'nodejs';

export async function GET() {
  const persistence = await persistenceHealth();
  const ok = persistence !== 'unavailable';

  return NextResponse.json(
    {
      ok,
      service: 'machine-hand',
      persistence,
    },
    { status: ok ? 200 : 503, headers: { 'Cache-Control': 'no-store' } },
  );
}
