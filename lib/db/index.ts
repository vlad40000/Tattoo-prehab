import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
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
