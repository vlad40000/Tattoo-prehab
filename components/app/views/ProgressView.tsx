'use client';

import { ArrowLeft, CalendarDays, CheckCircle2, Clock3, Flame } from 'lucide-react';
import { findExercise } from '@/lib/protocol';
import type { ProgressSummary } from '@/lib/progress';

export function ProgressView({ summary, loading, onBack }: { summary: ProgressSummary; loading: boolean; onBack: () => void }) {
  return (
    <div className="page page--progress">
      <header className="page-header progress-header">
        <div>
          <button type="button" className="text-button" onClick={onBack}><ArrowLeft size={16} aria-hidden /> Today</button>
          <p className="kicker">Account history</p>
          <h1>Your consistency and movement progress.</h1>
          <p className="lede">Training records are organized around completed work, not intensity scores or punishment.</p>
        </div>
        {loading && <span className="loading-label">Loading progress…</span>}
      </header>

      <section className="progress-metrics" aria-label="Progress summary">
        <ProgressMetric icon={<CheckCircle2 size={19} aria-hidden />} value={summary.completedSessions} label="Completed sessions" />
        <ProgressMetric icon={<Clock3 size={19} aria-hidden />} value={summary.minutesCompleted} label="Minutes practiced" />
        <ProgressMetric icon={<Flame size={19} aria-hidden />} value={summary.currentStreak} label="Current streak" />
        <ProgressMetric icon={<CalendarDays size={19} aria-hidden />} value={summary.weeklySessions} label="Sessions this week" />
      </section>

      <section className="progress-layout">
        <article className="progress-panel">
          <div className="section-heading"><div><p className="kicker">Movement history</p><h2>Exercise progression</h2></div></div>
          {summary.exerciseProgress.length ? (
            <div className="exercise-progress-list">
              {summary.exerciseProgress.map((item) => {
                const exercise = findExercise(item.exerciseId);
                const completionRate = item.plannedSets ? Math.round((item.completedSets / item.plannedSets) * 100) : 0;
                return (
                  <div key={item.exerciseId} className="exercise-progress-row">
                    <div>
                      <strong>{exercise?.exercise_name ?? item.exerciseId}</strong>
                      <small>{item.completedSessions} fully completed session{item.completedSessions === 1 ? '' : 's'} · last {new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(item.lastCompletedAt))}</small>
                    </div>
                    <div className="exercise-progress-row__meter" aria-label={`${completionRate}% of planned sets completed`}>
                      <span style={{ width: `${Math.min(100, completionRate)}%` }} />
                    </div>
                    <em>{item.completedSets}/{item.plannedSets} sets</em>
                  </div>
                );
              })}
            </div>
          ) : <p className="empty-copy">Complete a guided routine to begin building exercise history.</p>}
        </article>

        <article className="progress-panel">
          <div className="section-heading"><div><p className="kicker">Session record</p><h2>Recent workouts</h2></div></div>
          {summary.recentSessions.length ? (
            <div className="history-list">
              {summary.recentSessions.map((session) => (
                <div key={session.id} className="history-row">
                  <span className={`status-dot status-dot--${session.trafficLight}`} aria-label={`${session.trafficLight} status`} />
                  <div>
                    <strong>{session.sourceLabel}</strong>
                    <small>{new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(session.completedAt))} · {session.completedExercises}/{session.totalExercises} movements</small>
                  </div>
                  <span>{Math.max(1, Math.round(session.durationSeconds / 60))} min</span>
                </div>
              ))}
            </div>
          ) : <p className="empty-copy">No sessions have been recorded for this account yet.</p>}
        </article>
      </section>
    </div>
  );
}

function ProgressMetric({ icon, value, label }: { icon: React.ReactNode; value: number; label: string }) {
  return <div className="progress-metric"><span>{icon}</span><strong>{value}</strong><small>{label}</small></div>;
}
