'use client';

import { Clock3 } from 'lucide-react';
import { protocol } from '@/lib/protocol';
import type { PracticeSessionInput } from '@/lib/progress';
import { GuidedSession } from '../GuidedSession';

export function RoutineView({ routineId, eyebrow, onSave }: { routineId: string; eyebrow: string; onSave: (session: PracticeSessionInput) => Promise<void> }) {
  const routine = protocol.routines.find((item) => item.id === routineId);
  if (!routine) return null;

  return (
    <div className="page page--routine">
      <header className="page-header page-header--compact">
        <div>
          <p className="kicker">{eyebrow}</p>
          <h1>{routine.name}</h1>
          <p className="lede">{routine.when}</p>
        </div>
        <span className="duration-pill"><Clock3 size={17} aria-hidden /> {routine.duration_min} min</span>
      </header>
      <GuidedSession
        definition={{
          sourceType: 'routine',
          sourceId: routine.id,
          label: routine.name,
          durationMinutes: routine.duration_min,
          when: routine.when,
          warning: routine.warning,
          leadIn: routine.lead_in,
          steps: routine.steps,
          items: routine.items,
        }}
        onSave={onSave}
      />
    </div>
  );
}
