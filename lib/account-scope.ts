export type LocalRecordScope = 'device' | 'account';

export type ScopedLocalRecord = {
  scope?: LocalRecordScope;
  accountKey?: string;
  synced: boolean;
};

export type ClientAccountState =
  | { auth: 'unconfigured'; persistence: 'local-only' | 'ready' | 'unavailable'; syncReady: boolean }
  | { auth: 'signed-out'; persistence: 'local-only' | 'ready' | 'unavailable'; syncReady: false }
  | {
      auth: 'signed-in';
      persistence: 'local-only' | 'ready' | 'unavailable';
      syncReady: boolean;
      accountKey: string;
    };

export function normalizedScope(record: Pick<ScopedLocalRecord, 'scope'>): LocalRecordScope {
  return record.scope === 'account' ? 'account' : 'device';
}

export function recordVisibleToCurrentAccount(
  record: Pick<ScopedLocalRecord, 'scope' | 'accountKey'>,
  state: ClientAccountState,
): boolean {
  const scope = normalizedScope(record);
  if (state.auth === 'signed-in') {
    return scope === 'account' && record.accountKey === state.accountKey;
  }
  return scope === 'device';
}

export function recordCanSync(
  record: Pick<ScopedLocalRecord, 'scope' | 'accountKey' | 'synced'>,
  state: ClientAccountState,
): boolean {
  if (record.synced || !state.syncReady) return false;
  if (state.auth === 'signed-in') {
    return normalizedScope(record) === 'account' && record.accountKey === state.accountKey;
  }
  if (state.auth === 'unconfigured') {
    return normalizedScope(record) === 'device';
  }
  return false;
}

export function legacyDeviceRecordCount(
  records: Array<Pick<ScopedLocalRecord, 'scope'>>,
  state: ClientAccountState,
): number {
  if (state.auth !== 'signed-in') return 0;
  return records.filter((record) => normalizedScope(record) === 'device').length;
}
