import { spawnSync } from 'node:child_process';
import { resolveDatabaseUrl } from './database-target.mjs';

const databaseUrl = resolveDatabaseUrl();
const env = {
  ...process.env,
  DATABASE_URL: databaseUrl,
  DATABASE_URL_UNPOOLED: databaseUrl,
};

const migrate = spawnSync('drizzle-kit', ['migrate'], {
  env,
  shell: process.platform === 'win32',
  stdio: 'inherit',
});

if (migrate.error) throw migrate.error;
if (migrate.status !== 0) process.exit(migrate.status ?? 1);

const check = spawnSync(process.execPath, ['scripts/check-database.mjs'], {
  env,
  stdio: 'inherit',
});

if (check.error) throw check.error;
process.exit(check.status ?? 1);
