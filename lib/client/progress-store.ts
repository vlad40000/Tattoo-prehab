'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  legacyDeviceRecordCount,
  recordCanSync,
  recordVisibleToCurrentAccount,
  type ClientAccountState,
  type LocalRecordScope,
} from '@/lib/account-scope';
import type { PracticeSessionInput, ProgressSummary, SymptomCheckinInput } from '@/lib/progress';

const SESSION_KEY = 'tattoo-prehab:sessions:v1';
const CHECKIN_KEY = 'tattoo-prehab:checkins:v1';
const LEGACY_SESSION_KEY = 'machine-hand:sessions:v1';
const LEGACY_CHECKIN_KEY = 'machine-hand:checkins:v1';
const IMPORT_KEY_PREFIX = 'tattoo-prehab:account-import:';

type StoredSession = PracticeSessionInput & {
  synced: boolean;
  scope?: LocalRecordScope;
  accountKey?: string;
};

type StoredCheckin = SymptomCheckinInput & {
  synced: boolean;
  scope?: LocalRecordScope;
  accountKey?: string;
};

const initialAccountState: ClientAccountState = {
  auth: 'unconfigured',
  persistence: 'local-only',
  syncReady: false,
};

const emptySummary = (): ProgressSummary => ({
  mode: 'local',
  completedSessions: 0,
  minutesCompleted: 0,
  currentStreak: 0,
  weeklySessions: 0,
  lastTrafficLight: null,
  recentSessions: [],
  exerciseProgress: [],
});

function isStoredSession(value: unknown): value is StoredSession {
  if (!value || typeof value !== 'object') return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.idempotencyKey === 'string' &&
    typeof item.sourceLabel === 'string' &&
    typeof item.completedAt === 'string' &&
    !Number.isNaN(Date.parse(item.completedAt)) &&
    typeof item.durationSeconds === 'number' &&
    Number.isFinite(item.durationSeconds) &&
    (item.trafficLight === 'green' || item.trafficLight === 'yellow' || item.trafficLight === 'red') &&
    typeof item.synced === 'boolean' &&
    (item.scope === undefined || item.scope === 'device' || item.scope === 'account') &&
    (item.accountKey === undefined || typeof item.accountKey === 'string')
  );
}

function isStoredCheckin(value: unknown): value is StoredCheckin {
  if (!value || typeof value !== 'object') return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.idempotencyKey === 'string' &&
    typeof item.occurredAt === 'string' &&
    !Number.isNaN(Date.parse(item.occurredAt)) &&
    (item.zone === 'green' || item.zone === 'yellow' || item.zone === 'red') &&
    typeof item.synced === 'boolean' &&
    (item.scope === undefined || item.scope === 'device' || item.scope === 'account') &&
    (item.accountKey === undefined || typeof item.accountKey === 'string')
  );
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const value = window.localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // The app remains usable when private browsing or storage policy blocks writes.
  }
}

function readStoredSessions(): StoredSession[] {
  const parsed = readJson<unknown>(SESSION_KEY, readJson<unknown>(LEGACY_SESSION_KEY, []));
  if (!Array.isArray(parsed)) return [];
  return parsed.filter(isStoredSession);
}

function readStoredCheckins(): StoredCheckin[] {
  const parsed = readJson<unknown>(CHECKIN_KEY, readJson<unknown>(LEGACY_CHECKIN_KEY, []));
  if (!Array.isArray(parsed)) return [];
  return parsed
    .map((item) => {
      if (!item || typeof item !== 'object') return item;
      const record = item as Record<string, unknown>;
      return typeof record.synced === 'boolean' ? item : { ...record, synced: false };
    })
    .filter(isStoredCheckin);
}

function sessionPayload(session: StoredSession): PracticeSessionInput {
  const input: Partial<StoredSession> = { ...session };
  delete input.synced;
  delete input.scope;
  delete input.accountKey;
  return input as PracticeSessionInput;
}

function checkinPayload(checkin: StoredCheckin): SymptomCheckinInput {
  const input: Partial<StoredCheckin> = { ...checkin };
  delete input.synced;
  delete input.scope;
  delete input.accountKey;
  return input as SymptomCheckinInput;
}

function localSummary(sessions: StoredSession[], state: ClientAccountState): ProgressSummary {
  const ordered = sessions
    .filter((item) => recordVisibleToCurrentAccount(item, state))
    .sort((a, b) => b.completedAt.localeCompare(a.completedAt));
  const uniqueDays = new Set(ordered.map((item) => item.completedAt.slice(0, 10)));
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  if (!uniqueDays.has(cursor.toISOString().slice(0, 10))) cursor.setDate(cursor.getDate() - 1);
  let currentStreak = 0;
  while (uniqueDays.has(cursor.toISOString().slice(0, 10))) {
    currentStreak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  const weekBoundary = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const progress = new Map<string, ProgressSummary['exerciseProgress'][number]>();
  for (const session of ordered) {
    for (const item of session.items) {
      const previous = progress.get(item.exerciseId) ?? {
        exerciseId: item.exerciseId,
        completedSessions: 0,
        completedSets: 0,
        plannedSets: 0,
        lastCompletedAt: session.completedAt,
      };
      previous.plannedSets += item.plannedSets ?? 1;
      previous.completedSets += item.completedSets ?? (item.completed ? item.plannedSets ?? 1 : 0);
      if (item.completed) {
        previous.completedSessions += 1;
        if (session.completedAt > previous.lastCompletedAt) previous.lastCompletedAt = session.completedAt;
      }
      progress.set(item.exerciseId, previous);
    }
  }

  return {
    mode: 'local',
    completedSessions: ordered.length,
    minutesCompleted: Math.round(ordered.reduce((sum, item) => sum + item.durationSeconds, 0) / 60),
    currentStreak,
    weeklySessions: ordered.filter((item) => Date.parse(item.completedAt) >= weekBoundary).length,
    lastTrafficLight: ordered[0]?.trafficLight ?? null,
    recentSessions: ordered.slice(0, 30).map((item) => ({
      id: item.idempotencyKey,
      sourceLabel: item.sourceLabel,
      completedAt: item.completedAt,
      durationSeconds: item.durationSeconds,
      trafficLight: item.trafficLight,
      completedExercises: item.items.filter((exercise) => exercise.completed).length,
      totalExercises: item.items.length,
    })),
    exerciseProgress: [...progress.values()]
      .sort((a, b) => b.lastCompletedAt.localeCompare(a.lastCompletedAt))
      .slice(0, 20),
  };
}

async function fetchAccountState(): Promise<ClientAccountState> {
  try {
    const response = await fetch('/api/account/status', { cache: 'no-store' });
    const body = (await response.json()) as ClientAccountState;
    if (body.auth === 'signed-in' && typeof body.accountKey === 'string') return body;
    if (body.auth === 'signed-out' || body.auth === 'unconfigured') return body;
  } catch {
    // Keep the device usable if the account endpoint is unavailable.
  }
  return initialAccountState;
}

async function postSession(input: PracticeSessionInput): Promise<boolean> {
  try {
    const response = await fetch('/api/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    return response.ok;
  } catch {
    return false;
  }
}

async function postCheckin(input: SymptomCheckinInput): Promise<boolean> {
  try {
    const response = await fetch('/api/checkins', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    return response.ok;
  } catch {
    return false;
  }
}

async function fetchCloudSummary(): Promise<ProgressSummary | null> {
  try {
    const response = await fetch('/api/progress', { cache: 'no-store' });
    if (!response.ok) return null;
    return (await response.json()) as ProgressSummary;
  } catch {
    return null;
  }
}

export function useProgress() {
  const [summary, setSummary] = useState<ProgressSummary>(emptySummary);
  const [accountState, setAccountState] = useState<ClientAccountState>(initialAccountState);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const [legacyRecords, setLegacyRecords] = useState({ sessions: 0, checkins: 0 });

  const refresh = useCallback(async () => {
    const state = await fetchAccountState();
    setAccountState(state);

    let sessions = readStoredSessions();
    let checkins = readStoredCheckins();

    const sessionIds = new Set<string>();
    for (const session of sessions.filter((item) => recordCanSync(item, state))) {
      if (await postSession(sessionPayload(session))) sessionIds.add(session.idempotencyKey);
    }
    if (sessionIds.size) {
      sessions = sessions.map((item) => ({
        ...item,
        synced: item.synced || sessionIds.has(item.idempotencyKey),
      }));
      writeJson(SESSION_KEY, sessions);
    }

    const checkinIds = new Set<string>();
    for (const checkin of checkins.filter((item) => recordCanSync(item, state))) {
      if (await postCheckin(checkinPayload(checkin))) checkinIds.add(checkin.idempotencyKey);
    }
    if (checkinIds.size) {
      checkins = checkins.map((item) => ({
        ...item,
        synced: item.synced || checkinIds.has(item.idempotencyKey),
      }));
      writeJson(CHECKIN_KEY, checkins);
    }

    setLegacyRecords({
      sessions: legacyDeviceRecordCount(sessions, state),
      checkins: legacyDeviceRecordCount(checkins, state),
    });

    const cloud = state.syncReady ? await fetchCloudSummary() : null;
    setSummary(cloud?.mode === 'cloud' ? cloud : localSummary(sessions, state));
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const saveSession = useCallback(
    async (input: PracticeSessionInput) => {
      const stored = readStoredSessions();
      const scope: LocalRecordScope = accountState.auth === 'signed-in' ? 'account' : 'device';
      const accountKey = accountState.auth === 'signed-in' ? accountState.accountKey : undefined;
      if (!stored.some((item) => item.idempotencyKey === input.idempotencyKey)) {
        const updated = [...stored, { ...input, synced: false, scope, accountKey }];
        writeJson(SESSION_KEY, updated.slice(-200));
        setSummary(localSummary(updated, accountState));
      }
      await refresh();
    },
    [accountState, refresh],
  );

  const saveCheckin = useCallback(
    async (input: SymptomCheckinInput) => {
      const stored = readStoredCheckins();
      const scope: LocalRecordScope = accountState.auth === 'signed-in' ? 'account' : 'device';
      const accountKey = accountState.auth === 'signed-in' ? accountState.accountKey : undefined;
      if (!stored.some((item) => item.idempotencyKey === input.idempotencyKey)) {
        writeJson(CHECKIN_KEY, [...stored, { ...input, synced: false, scope, accountKey }].slice(-200));
      }
      await refresh();
    },
    [accountState, refresh],
  );

  const importLegacy = useCallback(async () => {
    if (accountState.auth !== 'signed-in' || !accountState.syncReady) return;
    setImporting(true);
    setImportMessage(null);

    const sessions = readStoredSessions();
    const checkins = readStoredCheckins();
    const legacySessions = sessions.filter((item) => item.scope !== 'account');
    const legacyCheckins = checkins.filter((item) => item.scope !== 'account');
    const importStorageKey = `${IMPORT_KEY_PREFIX}${accountState.accountKey}`;
    const importKey = readJson<string | null>(importStorageKey, null) ?? crypto.randomUUID();
    writeJson(importStorageKey, importKey);

    try {
      const response = await fetch('/api/account/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          importKey,
          sessions: legacySessions.map(sessionPayload),
          checkins: legacyCheckins.map(checkinPayload),
        }),
      });
      if (!response.ok) throw new Error('Import failed.');

      writeJson(SESSION_KEY, sessions.map((item) => item.scope === 'account' ? item : {
        ...item,
        scope: 'account',
        accountKey: accountState.accountKey,
        synced: true,
      }));
      writeJson(CHECKIN_KEY, checkins.map((item) => item.scope === 'account' ? item : {
        ...item,
        scope: 'account',
        accountKey: accountState.accountKey,
        synced: true,
      }));
      setImportMessage(`Imported ${legacySessions.length} session${legacySessions.length === 1 ? '' : 's'} and ${legacyCheckins.length} check-in${legacyCheckins.length === 1 ? '' : 's'}.`);
      await refresh();
    } catch {
      setImportMessage('Import did not complete. Your device records are unchanged and can be retried.');
    } finally {
      setImporting(false);
    }
  }, [accountState, refresh]);

  const legacyTotal = useMemo(() => legacyRecords.sessions + legacyRecords.checkins, [legacyRecords]);

  return {
    summary,
    accountState,
    legacyRecords,
    legacyTotal,
    loading,
    importing,
    importMessage,
    saveSession,
    saveCheckin,
    importLegacy,
    refresh,
  };
}
