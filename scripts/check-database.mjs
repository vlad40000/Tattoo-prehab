import { neon } from '@neondatabase/serverless';
import { resolveDatabaseUrl } from './database-target.mjs';

const sql = neon(resolveDatabaseUrl());
const [row] = await sql`
  select
    current_database() as database_name,
    to_regclass('public.participants')::text as participants,
    to_regclass('public.practice_sessions')::text as practice_sessions,
    to_regclass('public.symptom_checkins')::text as symptom_checkins,
    to_regclass('public.participant_preferences')::text as participant_preferences,
    to_regclass('public.account_imports')::text as account_imports
`;

const required = ['participants', 'practice_sessions', 'symptom_checkins', 'participant_preferences', 'account_imports'];
const missing = required.filter((name) => !row?.[name]);

if (missing.length) {
  throw new Error(`Database is reachable but missing required tables: ${missing.join(', ')}. Run npm run db:migrate.`);
}

console.log(`Database schema is ready (${row.database_name}; ${required.length} required tables).`);
