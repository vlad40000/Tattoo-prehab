import { NextResponse } from 'next/server';
import { isPersistenceConfigured } from '@/lib/db';

export function GET() {
  return NextResponse.json(
    {
      ok: true,
      service: 'machine-hand',
      persistence: isPersistenceConfigured() ? 'configured' : 'local-only',
    },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
