import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { sql } from 'drizzle-orm';
import * as schema from './schema';

type Database = ReturnType<typeof createDb>;
let database: Database | null = null;

function createDb() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not configured.');
  return drizzle(neon(url), { schema });
}

export function getDb(): Database {
  if (!database) database = createDb();
  return database;
}

export function isPersistenceConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL && process.env.SESSION_SECRET && process.env.SESSION_SECRET.length >= 32);
}

export type PersistenceHealth = 'local-only' | 'ready' | 'unavailable';

export async function persistenceHealth(): Promise<PersistenceHealth> {
  if (!isPersistenceConfigured()) return 'local-only';

  try {
    const result = await getDb().execute(sql<{
      participants: string | null;
      practiceSessions: string | null;
      symptomCheckins: string | null;
      participantPreferences: string | null;
      accountImports: string | null;
    }>`
      select
        to_regclass('public.participants')::text as "participants",
        to_regclass('public.practice_sessions')::text as "practiceSessions",
        to_regclass('public.symptom_checkins')::text as "symptomCheckins",
        to_regclass('public.participant_preferences')::text as "participantPreferences",
        to_regclass('public.account_imports')::text as "accountImports"
    `);
    const row = result.rows[0];
    return row && Object.values(row).every(Boolean) ? 'ready' : 'unavailable';
  } catch {
    return 'unavailable';
  }
}
