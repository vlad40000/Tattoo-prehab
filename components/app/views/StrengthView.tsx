'use client';

import { useState } from 'react';
import { ArrowLeft, CalendarDays, ChevronRight, ShieldCheck } from 'lucide-react';
import { protocol, sessionsForPhase } from '@/lib/protocol';
import type { PracticeSessionInput } from '@/lib/progress';
import { GuidedSession } from '../GuidedSession';
import type { SessionDefinition } from '../types';

export function StrengthView({ onSave }: { onSave: (session: PracticeSessionInput) => Promise<void> }) {
  const [week, setWeek] = useState(1);
  const [selected, setSelected] = useState<SessionDefinition | null>(null);
  const phase = protocol.program.phases.find((item) => week >= item.weeks[0] && week <= item.weeks[1]) ?? protocol.program.phases[0];
  const sessions = sessionsForPhase(phase);

  if (selected) {
    return (
      <div className="page page--routine">
        <button type="button" className="back-link" onClick={() => setSelected(null)}><ArrowLeft size={17} aria-hidden /> Back to program</button>
        <header className="page-header page-header--compact">
          <div><p className="kicker">Week {week} · {phase.name}</p><h1>{selected.label}</h1><p className="lede">Strength should support the next tattoo day, not compete with it.</p></div>
        </header>
        <GuidedSession definition={selected} onSave={onSave} />
      </div>
    );
  }

  return (
    <div className="page page--strength">
      <header className="page-header">
        <div><p className="kicker">12-week foundation</p><h1>Build capacity without borrowing precision.</h1><p className="lede">Two or three low-fatigue sessions each week. Progress one variable at a time.</p></div>
        <span className="duration-pill"><CalendarDays size={17} aria-hidden /> Week {week}</span>
      </header>

      <section className="week-picker" aria-labelledby="week-title">
        <div className="section-heading"><div><p className="kicker">Program position</p><h2 id="week-title">Choose your current week</h2></div><strong>{phase.name}</strong></div>
        <input aria-label="Current program week" type="range" min="1" max="12" value={week} onChange={(event) => setWeek(Number(event.target.value))} />
        <div className="week-scale"><span>1</span><span>4</span><span>8</span><span>12</span></div>
      </section>

      <section className="phase-card">
        <div className="phase-card__header"><span>Weeks {phase.weeks[0]}–{phase.weeks[1]}</span><h2>{phase.name}</h2></div>
        <ul className="rule-list">{phase.rules.map((rule) => <li key={rule}><ShieldCheck size={17} aria-hidden />{rule}</li>)}</ul>
        {phase.inherit_note && <p className="routine-warning">{phase.inherit_note}</p>}
      </section>

      <section className="session-grid" aria-label="Strength sessions">
        {sessions.map((session) => (
          <button
            key={session.id}
            type="button"
            className="strength-session"
            onClick={() => setSelected({
              sourceType: 'strength',
              sourceId: `${phase.id}:${session.id}`,
              label: session.label,
              durationMinutes: 20,
              items: session.items,
            })}
          >
            <span className="strength-session__index">{session.label.slice(0, 1)}</span>
            <span><small>{session.optional ? 'Optional session' : 'Foundation session'}</small><strong>{session.label}</strong><em>{session.items.length} exercises</em></span>
            <ChevronRight size={20} aria-hidden />
          </button>
        ))}
      </section>

      <section className="minimum-card">
        <div><p className="kicker">Busy week?</p><h2>{protocol.program.minimum_effective_session.name}</h2><p>{protocol.program.minimum_effective_session.duration_min} minutes. Enough to maintain the pattern without skipping the week.</p></div>
        <button type="button" className="secondary-action" onClick={() => setSelected({
          sourceType: 'minimum',
          sourceId: protocol.program.minimum_effective_session.name.toLowerCase().replace(/\s+/g, '-'),
          label: protocol.program.minimum_effective_session.name,
          durationMinutes: protocol.program.minimum_effective_session.duration_min,
          items: protocol.program.minimum_effective_session.items,
        })}>Start minimum session <ChevronRight size={17} aria-hidden /></button>
      </section>
    </div>
  );
}
