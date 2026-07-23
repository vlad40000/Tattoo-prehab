'use client';

import { ChevronRight, Clock3, Dumbbell, HeartPulse, RotateCcw, Sparkles } from 'lucide-react';
import { protocol } from '@/lib/protocol';
import type { AppView } from '../types';

const ROUTINE_ROUTES: Array<{ id: string; view: AppView; icon: typeof Sparkles; when: string }> = [
  { id: 'pre-session', view: 'prepare', icon: Sparkles, when: 'Before the first long appointment' },
  { id: 'session-reset', view: 'reset', icon: RotateCcw, when: 'At a natural stopping point' },
  { id: 'post-work-downshift', view: 'recover', icon: HeartPulse, when: 'After the last appointment' },
];

/**
 * The launcher. One obvious primary action, then the rest of the day's
 * options as a flat list — no hierarchy to decode while standing up.
 */
export function TrainView({ onNavigate }: { onNavigate: (view: AppView) => void }) {
  const routines = ROUTINE_ROUTES.map((route) => ({
    ...route,
    routine: protocol.routines.find((item) => item.id === route.id),
  })).filter((entry) => entry.routine);

  const primary = routines[0];

  return (
    <div className="screen">
      <h1 className="screen__title">Train</h1>

      {primary?.routine && (
        <section className="quick-start">
          <p className="quick-start__label">Quick start</p>
          <button type="button" className="start-button" onClick={() => onNavigate(primary.view)}>
            <span>
              <strong>{primary.routine.name}</strong>
              <small>{primary.routine.duration_min} min · {primary.routine.items.length} movements</small>
            </span>
            <ChevronRight size={22} aria-hidden />
          </button>
        </section>
      )}

      <p className="list-label">Workday routines</p>
      <div className="card-list">
        {routines.map(({ id, view, icon: Icon, when, routine }) => routine && (
          <button key={id} type="button" className="row-card" onClick={() => onNavigate(view)}>
            <span className="row-card__icon" aria-hidden><Icon size={19} /></span>
            <span className="row-card__copy">
              <strong>{routine.name}</strong>
              <small>{when}</small>
            </span>
            <span className="row-card__meta"><Clock3 size={14} aria-hidden /> {routine.duration_min}m</span>
            <ChevronRight size={18} aria-hidden className="row-card__chevron" />
          </button>
        ))}
      </div>

      <p className="list-label">Weekly capacity</p>
      <div className="card-list">
        <button type="button" className="row-card" onClick={() => onNavigate('strength')}>
          <span className="row-card__icon" aria-hidden><Dumbbell size={19} /></span>
          <span className="row-card__copy">
            <strong>Foundational strength</strong>
            <small>Two or three low-fatigue sessions each week</small>
          </span>
          <span className="row-card__meta">12 wk</span>
          <ChevronRight size={18} aria-hidden className="row-card__chevron" />
        </button>
      </div>
    </div>
  );
}
