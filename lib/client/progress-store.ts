'use client';

import { useCallback, useEffect, useState } from 'react';
import type { PracticeSessionInput, ProgressSummary, SymptomCheckinInput } from '@/lib/progress';

const SESSION_KEY = 'machine-hand:sessions:v1';
const CHECKIN_KEY = 'machine-hand:checkins:v1';

type StoredSession = PracticeSessionInput & { synced: boolean };

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
    typeof item.synced === 'boolean'
  );
}

function readStoredSessions(): StoredSession[] {
  const parsed = readJson<unknown>(SESSION_KEY, []);
  if (!Array.isArray(parsed)) return [];
  return parsed.filter(isStoredSession);
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

function localSummary(sessions: StoredSession[]): ProgressSummary {
  const ordered = [...sessions].sort((a, b) => b.completedAt.localeCompare(a.completedAt));
  const uniqueDays = new Set(ordered.map((item) => item.completedAt.slice(0, 10)));
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  if (!uniqueDays.has(cursor.toISOString().slice(0, 10))) cursor.setDate(cursor.getDate() - 1);
  let currentStreak = 0;
  while (uniqueDays.has(cursor.toISOString().slice(0, 10))) {
    currentStreak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return {
    mode: 'local',
    completedSessions: ordered.length,
    minutesCompleted: Math.round(ordered.reduce((sum, item) => sum + item.durationSeconds, 0) / 60),
    currentStreak,
    lastTrafficLight: ordered[0]?.trafficLight ?? null,
    recentSessions: ordered.slice(0, 5).map((item) => ({
      id: item.idempotencyKey,
      sourceLabel: item.sourceLabel,
      completedAt: item.completedAt,
      durationSeconds: item.durationSeconds,
      trafficLight: item.trafficLight,
    })),
  };
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
  const [summary, setSummary] = useState<ProgressSummary>({
    mode: 'local',
    completedSessions: 0,
    minutesCompleted: 0,
    currentStreak: 0,
    lastTrafficLight: null,
    recentSessions: [],
  });
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const stored = readStoredSessions();
    const pending = stored.filter((item) => !item.synced);
    if (pending.length) {
      const synced = new Set<string>();
      for (const session of pending) {
        if (await postSession(session)) synced.add(session.idempotencyKey);
      }
      if (synced.size) {
        const updated = stored.map((item) => ({ ...item, synced: item.synced || synced.has(item.idempotencyKey) }));
        writeJson(SESSION_KEY, updated);
      }
    }

    const cloud = await fetchCloudSummary();
    setSummary(cloud?.mode === 'cloud' ? cloud : localSummary(readStoredSessions()));
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const saveSession = useCallback(
    async (input: PracticeSessionInput) => {
      const stored = readStoredSessions();
      if (!stored.some((item) => item.idempotencyKey === input.idempotencyKey)) {
        const updated = [...stored, { ...input, synced: false }];
        writeJson(SESSION_KEY, updated.slice(-200));
        setSummary(localSummary(updated));
      }
      await refresh();
    },
    [refresh],
  );

  return { summary, loading, saveSession, refresh };
}

export async function saveCheckin(input: SymptomCheckinInput) {
  const parsed = readJson<unknown>(CHECKIN_KEY, []);
  const stored = Array.isArray(parsed) ? (parsed as SymptomCheckinInput[]) : [];
  writeJson(CHECKIN_KEY, [...stored, input].slice(-200));
  try {
    await fetch('/api/checkins', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
  } catch {
    // Local record is authoritative until a later network-enabled check-in.
  }
}
