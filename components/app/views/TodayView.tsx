'use client';

import { useState } from 'react';
import { ArrowRight, Check, Cloud, CloudOff, MoonStar, RotateCcw, Sparkles } from 'lucide-react';
import { saveCheckin } from '@/lib/client/progress-store';
import { protocol } from '@/lib/protocol';
import type { ProgressSummary } from '@/lib/progress';
import type { AppView } from '../types';

export function TodayView({
  summary,
  loading,
  onNavigate,
}: {
  summary: ProgressSummary;
  loading: boolean;
  onNavigate: (view: AppView) => void;
}) {
  const [selectedZone, setSelectedZone] = useState<'green' | 'yellow' | 'red' | null>(summary.lastTrafficLight);
  const date = new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date());

  const checkIn = async (zone: 'green' | 'yellow' | 'red') => {
    setSelectedZone(zone);
    await saveCheckin({ idempotencyKey: crypto.randomUUID(), zone, occurredAt: new Date().toISOString() });
  };

  return (
    <div className="page page--today">
      <header className="page-header">
        <div>
          <p className="kicker">{date}</p>
          <h1>Protect the hand that does the work.</h1>
          <p className="lede">Small resets, better positioning, and enough strength to keep precision from becoming strain.</p>
        </div>
        <div className={`sync-pill sync-pill--${summary.mode}`} title={summary.mode === 'cloud' ? 'Progress sync is active' : 'Progress is saved on this device'}>
          {summary.mode === 'cloud' ? <Cloud size={16} aria-hidden /> : <CloudOff size={16} aria-hidden />}
          {summary.mode === 'cloud' ? 'Neon sync' : 'On-device'}
        </div>
      </header>

      <section className="readiness-card" aria-labelledby="readiness-title">
        <div>
          <p className="kicker">Readiness check</p>
          <h2 id="readiness-title">How do you feel before work?</h2>
        </div>
        <div className="traffic-grid">
          {protocol.triage.zones.map((zone) => (
            <button
              key={zone.id}
              type="button"
              className={`traffic-card traffic-card--${zone.id} ${selectedZone === zone.id ? 'is-selected' : ''}`}
              onClick={() => void checkIn(zone.id)}
              aria-pressed={selectedZone === zone.id}
            >
              <span className="traffic-card__top">
                <span className="status-dot" aria-hidden />
                <strong>{zone.label}</strong>
                {selectedZone === zone.id && <Check size={17} aria-hidden />}
              </span>
              <span>{zone.looks_like}</span>
              <small>{zone.action}</small>
            </button>
          ))}
        </div>
      </section>

      <section className="action-grid" aria-label="Workday actions">
        <ActionCard
          tone="lime"
          icon={<Sparkles size={21} aria-hidden />}
          eyebrow="8 minutes"
          title="Prepare"
          copy="Coordinate your neck, shoulder blades, hips, ankles, and hands without creating fatigue."
          action="Start pre-session"
          onClick={() => onNavigate('prepare')}
        />
        <ActionCard
          tone="blue"
          icon={<RotateCcw size={21} aria-hidden />}
          eyebrow="2–4 minutes"
          title="Reset"
          copy="Use a natural stopping point to release grip, change position, and recheck your setup."
          action="Start quick reset"
          onClick={() => onNavigate('reset')}
        />
        <ActionCard
          tone="violet"
          icon={<MoonStar size={21} aria-hidden />}
          eyebrow="10 minutes"
          title="Recover"
          copy="Downshift after the last appointment before settling into another long seated position."
          action="Start post-work"
          onClick={() => onNavigate('recover')}
        />
      </section>

      <section className="progress-section">
        <div className="section-heading">
          <div>
            <p className="kicker">Your capacity</p>
            <h2>Consistency, not exhaustion.</h2>
          </div>
          {loading && <span className="loading-label">Loading progress…</span>}
        </div>
        <div className="metric-grid">
          <Metric value={summary.completedSessions} label="Sessions complete" />
          <Metric value={summary.minutesCompleted} label="Minutes invested" />
          <Metric value={summary.currentStreak} label="Day streak" />
        </div>
        {summary.recentSessions.length > 0 ? (
          <div className="recent-list">
            {summary.recentSessions.slice(0, 3).map((session) => (
              <div key={session.id} className="recent-row">
                <span className={`status-dot status-dot--${session.trafficLight}`} aria-label={`${session.trafficLight} status`} />
                <div>
                  <strong>{session.sourceLabel}</strong>
                  <small>{new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(session.completedAt))}</small>
                </div>
                <span>{Math.max(1, Math.round(session.durationSeconds / 60))} min</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="empty-copy">Your first completed routine will appear here. Nothing is scored by intensity.</p>
        )}
      </section>

      <aside className="principle-card">
        <span>Operating principle</span>
        <p>{protocol.meta.final_operating_principle}</p>
      </aside>
    </div>
  );
}

function ActionCard({
  tone,
  icon,
  eyebrow,
  title,
  copy,
  action,
  onClick,
}: {
  tone: 'lime' | 'blue' | 'violet';
  icon: React.ReactNode;
  eyebrow: string;
  title: string;
  copy: string;
  action: string;
  onClick: () => void;
}) {
  return (
    <article className={`action-card action-card--${tone}`}>
      <div className="action-card__icon">{icon}</div>
      <span>{eyebrow}</span>
      <h2>{title}</h2>
      <p>{copy}</p>
      <button type="button" onClick={onClick}>
        {action} <ArrowRight size={17} aria-hidden />
      </button>
    </article>
  );
}

function Metric({ value, label }: { value: number; label: string }) {
  return (
    <div className="metric">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}
