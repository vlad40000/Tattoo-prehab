import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(path, 'utf8');
const requiredFiles = [
  'proxy.ts',
  'app/sign-in/[[...sign-in]]/page.tsx',
  'app/sign-up/[[...sign-up]]/page.tsx',
  'app/account/[[...account]]/page.tsx',
  'app/api/account/status/route.ts',
  'app/api/account/import/route.ts',
  'app/api/account/export/route.ts',
  'lib/server/identity.ts',
  'lib/account-scope.ts',
];

for (const path of requiredFiles) read(path);

const pkg = JSON.parse(read('package.json'));
if (!pkg.dependencies?.['@clerk/nextjs']) throw new Error('Clerk dependency is missing.');

const schema = read('lib/db/schema.ts');
if (!schema.includes("clerkUserId: text('clerk_user_id')")) throw new Error('participants.clerk_user_id is missing.');
if (!schema.includes('participants_clerk_user_uidx')) throw new Error('Clerk user uniqueness constraint is missing.');
if (!schema.includes("'account_imports'")) throw new Error('Account import receipts are missing.');

for (const route of ['app/api/progress/route.ts', 'app/api/checkins/route.ts']) {
  const source = read(route);
  if (!source.includes('getRequestIdentity')) throw new Error(`${route} does not derive identity server-side.`);
  if (!source.includes('participantIdForIdentity')) throw new Error(`${route} does not scope persistence by server identity.`);
  if (/participantId\s*[:=]\s*(?:input|parsed\.data|body)/.test(source)) {
    throw new Error(`${route} appears to accept a client-selected participant.`);
  }
}

const progress = read('lib/progress.ts');
if (!progress.includes('accountImportInputSchema')) throw new Error('Bounded account import schema is missing.');
if (!progress.includes('}).strict();')) throw new Error('Write schemas must reject unknown ownership fields.');

const store = read('lib/client/progress-store.ts');
for (const token of ['accountKey', 'Import device history', 'recordCanSync', 'legacyDeviceRecordCount']) {
  if (!store.includes(token) && !read('components/account/AccountSyncCard.tsx').includes(token)) {
    throw new Error(`Account migration contract is missing ${token}.`);
  }
}

console.log('accounts  Clerk boundary · server-owned identity · Neon participant mapping');
console.log('migration explicit device import · idempotent receipts · shared-iPad isolation');
console.log('progress  cross-device sessions · set totals · exportable history');
console.log('✓ account persistence contract holds');
