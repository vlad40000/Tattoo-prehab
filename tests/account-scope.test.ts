import { describe, expect, it } from 'vitest';
import {
  legacyDeviceRecordCount,
  recordCanSync,
  recordVisibleToCurrentAccount,
  type ClientAccountState,
} from '@/lib/account-scope';

const accountA: ClientAccountState = {
  auth: 'signed-in',
  persistence: 'ready',
  syncReady: true,
  accountKey: 'account-a',
};

const accountB: ClientAccountState = {
  auth: 'signed-in',
  persistence: 'ready',
  syncReady: true,
  accountKey: 'account-b',
};

describe('shared-device account scoping', () => {
  it('never exposes or syncs another account’s local queue', () => {
    const record = { scope: 'account' as const, accountKey: 'account-a', synced: false };
    expect(recordVisibleToCurrentAccount(record, accountA)).toBe(true);
    expect(recordCanSync(record, accountA)).toBe(true);
    expect(recordVisibleToCurrentAccount(record, accountB)).toBe(false);
    expect(recordCanSync(record, accountB)).toBe(false);
  });

  it('treats pre-account records as explicit legacy imports', () => {
    const records = [
      { synced: false },
      { scope: 'device' as const, synced: true },
      { scope: 'account' as const, accountKey: 'account-a', synced: false },
    ];
    expect(legacyDeviceRecordCount(records, accountA)).toBe(2);
    expect(recordCanSync(records[0], accountA)).toBe(false);
  });
});
