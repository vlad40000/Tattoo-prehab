'use client';

import { useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  Check,
  Cloud,
  CloudOff,
  MoonStar,
  RotateCcw,
  Sparkles,
  Wrench,
} from 'lucide-react';
import { AccountSyncCard } from '@/components/account/AccountSyncCard';
import type { ClientAccountState } from '@/lib/account-scope';
import { protocol } from '@/lib/protocol';
import type { ProgressSummary, SymptomCheckinInput } from '@/lib/progress';
import type { AppView } from '../types';

export function TodayView({
  summary,
  accountState,
  legacyRecords,
  importing,
  importMessage,
  loading,
  onImportLegacy,
  onSaveCheckin,
  onNavigate,
}: {
  summary: ProgressSummary;
  accountState: ClientAccountState;
  legacyRecords: { sessions: number; checkins: number };
  importing: boolean;
  importMessage: string | null;
  loading: boolean;
  onImportLegacy: () => void;
  onSaveCheckin: (input: SymptomCheckinInput) => Promise<void>;
  onNavigate: (view: AppView) => void;
}) {
  const [selectedZone, setSelectedZone] = useState<'green' | 'yellow' | 'red' | null>(summary.lastTrafficLight);
  const date = new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date());

  const checkIn = async (zone: 'green' | 'yellow' | 'red') => {
    setSelectedZone(zone);
    await onSaveCheckin({ idempotencyKey: crypto.randomUUID(), zone, occurredAt: new Date().toISOString() });
  };

  const recommendation = selectedZone === 'red'
    ? {
        eyebrow: 'Stop and reassess',
        title: 'Review symptoms before training.',
        copy: 'Sharp, radiating, neurologic, or escalating symptoms are not a routine-through-it situation.',
        action: 'Open symptom guidance',
        target: 'symptoms' as const,
      }
    : selectedZone === 'yellow'
      ? {
          eyebrow: 'Reduce the dose',
          title: 'Use the short reset first.',
          copy: 'Change position, release the grip, and reassess before adding more load.',
          action: 'Start quick reset',
          target: 'reset' as const,
        }
      : {
          eyebrow: 'Recommended next',
          title: 'Prepare for precision work.',
          copy: 'Eight minutes to coordinate the neck, shoulder blades, hips, ankles, and hands without creating fatigue.',
          action: 'Start pre-session',
          target: 'prepare' as const,
        };

  return (
    <div className="page page--today">
      <header className="page-header today-header">
        <div>
          <p className="kicker" suppressHydrationWarning>{date}</p>
          <h1>Keep tattooing without wearing yourself down.</h1>
          <p className="lede">A practical before, during, and after-work system for staying steady, mobile, and strong behind the machine.</p>
        </div>
        <div className={`sync-pill sync-pill--${summary.mode}`} title={summary.mode === 'cloud' ? 'Progress sync is active' : 'Progress is saved on this device'}>
          {summary.mode === 'cloud' ? <Cloud size={16} aria-hidden /> : <CloudOff size={16} aria-hidden />}
          {summary.mode === 'cloud' ? 'Neon sync' : 'On-device'}
        </div>
      </header>

      <AccountSyncCard
        state={accountState}
        legacyRecords={legacyRecords}
        importing={importing}
        message={importMessage}
        onImport={onImportLegacy}
      />

      <section className="today-dashboard" aria-label="Daily readiness and recommendation">
        <div className="readiness-card" aria-labelledby="readiness-title">
          <div className="card-step"><span>1</span><p>Check in</p></div>
          <div className="readiness-card__head">
            <p className="kicker">Before the next appointment</p>
            <h2 id="readiness-title">How does your body feel right now?</h2>
            <p>Choose the closest match. This changes the recommendation, not your score.</p>
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
              </button>
            ))}
          </div>
        </div>

        <aside className={`recommendation-card recommendation-card--${selectedZone ?? 'green'}`}>
          <div className="card-step"><span>2</span><p>Take action</p></div>
          <div className="recommendation-card__icon" aria-hidden>
            {selectedZone === 'yellow' ? <RotateCcw size={24} /> : selectedZone === 'red' ? <Wrench size={24} /> : <Sparkles size={24} />}
          </div>
          <p className="kicker">{recommendation.eyebrow}</p>
          <h2>{recommendation.title}</h2>
          <p>{recommendation.copy}</p>
          <button type="button" className="primary-action" onClick={() => onNavigate(recommendation.target)}>
            {recommendation.action} <ArrowRight size={17} aria-hidden />
          </button>
        </aside>
      </section>

      <section className="workday-section" aria-labelledby="workday-title">
        <div className="section-heading">
          <div>
            <p className="kicker">Your workday flow</p>
            <h2 id="workday-title">Before. During. After.</h2>
          </div>
          <span>Three routines. No guesswork.</span>
        </div>
        <div className="action-grid" aria-label="Workday actions">
          <ActionCard
            step="Before"
            tone="lime"
            icon={<Sparkles size={21} aria-hidden />}
            eyebrow="8 minutes"
            title="Prepare"
            copy="Prime posture, breathing, shoulder control, hips, ankles, and hands without draining grip." 
            action="Start pre-session"
            onClick={() => onNavigate('prepare')}
          />
          <ActionCard
            step="During"
            tone="blue"
            icon={<RotateCcw size={21} aria-hidden />}
            eyebrow="2–4 minutes"
            title="Reset"
            copy="Release grip, change position, restore motion, and correct the workstation before strain stacks up."
            action="Start quick reset"
            onClick={() => onNavigate('reset')}
          />
          <ActionCard
            step="After"
            tone="violet"
            icon={<MoonStar size={21} aria-hidden />}
            eyebrow="10 minutes"
            title="Recover"
            copy="Downshift after the last appointment and restore positions you held for hours."
            action="Start post-work"
            onClick={() => onNavigate('recover')}
          />
        </div>
      </section>

      <section className="today-lower-grid">
        <div className="progress-section">
          <div className="section-heading">
            <div>
              <p className="kicker">Your capacity</p>
              <h2>Consistency, not exhaustion.</h2>
            </div>
            <div className="section-heading__actions">
              {loading && <span className="loading-label">Loading progress…</span>}
              <button type="button" className="text-button" onClick={() => onNavigate('progress')}>View all progress <ArrowRight size={15} aria-hidden /></button>
            </div>
          </div>
          <div className="metric-grid metric-grid--four">
            <Metric value={summary.completedSessions} label="Sessions" />
            <Metric value={summary.minutesCompleted} label="Minutes" />
            <Metric value={summary.currentStreak} label="Day streak" />
            <Metric value={summary.weeklySessions} label="This week" />
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
            <p className="empty-copy">Your completed routines will appear here. Intensity is not scored.</p>
          )}
        </div>

        <div className="quick-links" aria-label="Quick links">
          <button type="button" onClick={() => onNavigate('learn')}>
            <span className="quick-links__icon"><BookOpen size={20} aria-hidden /></span>
            <span><small>33 movements · 21 videos</small><strong>Exercise library</strong><em>Browse setup, cues, progressions, and video instruction.</em></span>
            <ArrowRight size={18} aria-hidden />
          </button>
          <button type="button" onClick={() => onNavigate('workstation')}>
            <span className="quick-links__icon"><Wrench size={20} aria-hidden /></span>
            <span><small>Shop ergonomics</small><strong>Fix the station first</strong><em>Client position, stool, lighting, reach, grip, and cable setup.</em></span>
            <ArrowRight size={18} aria-hidden />
          </button>
        </div>
      </section>

      <aside className="principle-card">
        <span>Operating principle</span>
        <p>{protocol.meta.final_operating_principle}</p>
      </aside>
    </div>
  );
}

function ActionCard({
  step,
  tone,
  icon,
  eyebrow,
  title,
  copy,
  action,
  onClick,
}: {
  step: string;
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
      <div className="action-card__top">
        <span>{step}</span>
        <div className="action-card__icon">{icon}</div>
      </div>
      <small>{eyebrow}</small>
      <h3>{title}</h3>
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
