import { spawnSync } from 'node:child_process';
import { resolveDatabaseUrl } from './database-target.mjs';

const databaseUrl = resolveDatabaseUrl();
const result = spawnSync('drizzle-kit', ['studio'], {
  env: {
    ...process.env,
    DATABASE_URL: databaseUrl,
    DATABASE_URL_UNPOOLED: databaseUrl,
  },
  shell: process.platform === 'win32',
  stdio: 'inherit',
});

if (result.error) throw result.error;
process.exit(result.status ?? 1);
