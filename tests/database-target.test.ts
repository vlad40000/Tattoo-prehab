import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

describe('database command target', () => {
  function resolve(env: Partial<NodeJS.ProcessEnv>) {
    return spawnSync(
      process.execPath,
      [
        '--input-type=module',
        '-e',
        "import('./scripts/database-target.mjs').then(({ resolveDatabaseUrl }) => console.log(resolveDatabaseUrl()))",
      ],
      {
        cwd: process.cwd(),
        env: { ...process.env, DATABASE_URL: '', DATABASE_URL_UNPOOLED: '', ...env },
        encoding: 'utf8',
      },
    );
  }

  it('fails when no target was pulled', () => {
    const result = resolve({});
    expect(result.status).not.toBe(0);
    expect(result.stderr).toMatch(/required/i);
  });

  it('rejects non-Neon targets', () => {
    const result = resolve({ DATABASE_URL: 'postgresql://user:pass@localhost:5432/app' });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toMatch(/not a Neon hostname/i);
  });

  it('prefers the unpooled Neon target', () => {
    const direct = 'postgresql://user:pass@direct.example.neon.tech/app';
    const result = resolve({
      DATABASE_URL: 'postgresql://user:pass@pooled.example.neon.tech/app',
      DATABASE_URL_UNPOOLED: direct,
    });
    expect(result.status).toBe(0);
    expect(result.stdout.trim()).toBe(direct);
  });
});
