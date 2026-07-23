import { URL } from 'node:url';

const ALLOWED_PROTOCOLS = new Set(['postgres:', 'postgresql:']);

export function resolveDatabaseUrl() {
  const value = process.env.DATABASE_URL_UNPOOLED?.trim() || process.env.DATABASE_URL?.trim();
  if (!value) {
    throw new Error('DATABASE_URL_UNPOOLED or DATABASE_URL is required. Pull the intended Vercel environment first.');
  }

  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error('The configured database URL is invalid.');
  }

  if (!ALLOWED_PROTOCOLS.has(url.protocol)) {
    throw new Error('The database URL must use the postgres or postgresql protocol.');
  }
  if (!url.hostname.endsWith('.neon.tech')) {
    throw new Error('Refusing database command: the target is not a Neon hostname.');
  }
  if (/placeholder/i.test(value)) {
    throw new Error('Refusing database command: placeholder credentials are not allowed.');
  }

  return value;
}
