'use client';

import { useEffect, useMemo, useState } from 'react';
import { Check, ChevronLeft, ChevronRight, Circle, Pause, Play, RotateCcw } from 'lucide-react';
import { findExercise } from '@/lib/protocol';
import type { PracticeSessionInput } from '@/lib/progress';
import { ExerciseCard } from './ExerciseCard';
import type { SessionDefinition } from './types';

type Stage = 'overview' | 'active' | 'finish' | 'complete';

export function GuidedSession({ definition, onSave }: { definition: SessionDefinition; onSave: (session: PracticeSessionInput) => Promise<void> }) {
  const [stage, setStage] = useState<Stage>('overview');
  const [activeIndex, setActiveIndex] = useState(0);
  const [completed, setCompleted] = useState<Set<number>>(new Set());
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [startedAt, setStartedAt] = useState<string | null>(null);
  const [zone, setZone] = useState<'green' | 'yellow' | 'red'>('green');
  const [painAfter, setPainAfter] = useState<number | null>(null);
  const [notes, setNotes] = useState('');

  const exercises = useMemo(
    () => definition.items.map((item) => ({ item, exercise: findExercise(item.exercise_id) })).filter((entry) => entry.exercise !== null),
    [definition.items],
  );

  useEffect(() => {
    if (!running || stage !== 'active') return;
    const id = window.setInterval(() => setElapsed((value) => value + 1), 1000);
    return () => window.clearInterval(id);
  }, [running, stage]);

  const start = () => {
    setStartedAt(new Date().toISOString());
    setStage('active');
    setRunning(true);
  };

  const toggleDone = (index: number) => {
    setCompleted((previous) => {
      const next = new Set(previous);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const submit = async () => {
    const now = new Date().toISOString();
    const input: PracticeSessionInput = {
      idempotencyKey: crypto.randomUUID(),
      sourceType: definition.sourceType,
      sourceId: definition.sourceId,
      sourceLabel: definition.label,
      startedAt: startedAt ?? now,
      completedAt: now,
      durationSeconds: elapsed,
      trafficLight: zone,
      painAfter,
      notes: notes || null,
      items: definition.items.map((item, index) => ({
        exerciseId: item.exercise_id,
        prescription: item.prescription,
        completed: completed.has(index),
      })),
    };
    await onSave(input);
    setStage('complete');
  };

  const reset = () => {
    setStage('overview');
    setActiveIndex(0);
    setCompleted(new Set());
    setElapsed(0);
    setRunning(false);
    setStartedAt(null);
    setZone('green');
    setPainAfter(null);
    setNotes('');
  };

  if (stage === 'overview') {
    return (
      <div className="session-overview">
        {definition.leadIn && <p className="lead-in">{definition.leadIn}</p>}
        {definition.warning && <p className="routine-warning">{definition.warning}</p>}
        {definition.steps && (
          <ol className="reset-steps">
            {definition.steps.map((step) => <li key={step}>{step}</li>)}
          </ol>
        )}
        <div className="routine-list">
          {exercises.map(({ item, exercise }, index) => exercise && (
            <ExerciseCard key={`${item.exercise_id}-${index}`} exercise={exercise} prescription={item.prescription} open={activeIndex === index} onToggle={() => setActiveIndex(activeIndex === index ? -1 : index)} />
          ))}
        </div>
        <button type="button" className="primary-action" onClick={start}>
          <Play size={18} fill="currentColor" aria-hidden /> Start guided session
        </button>
      </div>
    );
  }

  if (stage === 'complete') {
    return (
      <div className="completion-card">
        <span className="completion-card__mark"><Check size={32} aria-hidden /></span>
        <p className="kicker">Session recorded</p>
        <h2>Leave with capacity in reserve.</h2>
        <p>The goal is improved coordination and tolerance—not earning fatigue.</p>
        <button type="button" className="secondary-action" onClick={reset}><RotateCcw size={17} aria-hidden /> Run again</button>
      </div>
    );
  }

  if (stage === 'finish') {
    return (
      <div className="finish-card">
        <p className="kicker">24-hour feedback starts now</p>
        <h2>How did the session leave you?</h2>
        <div className="finish-zones" role="radiogroup" aria-label="Post-session status">
          {(['green', 'yellow', 'red'] as const).map((value) => (
            <button key={value} type="button" role="radio" aria-checked={zone === value} className={`finish-zone finish-zone--${value} ${zone === value ? 'is-selected' : ''}`} onClick={() => setZone(value)}>
              <span className="status-dot" aria-hidden /> {value}
            </button>
          ))}
        </div>
        <label className="field-label" htmlFor="pain-after">Discomfort after session <span>{painAfter ?? '—'}/10</span></label>
        <input id="pain-after" type="range" min="0" max="10" value={painAfter ?? 0} onChange={(event) => setPainAfter(Number(event.target.value))} />
        <label className="field-label" htmlFor="session-notes">Optional note</label>
        <textarea id="session-notes" maxLength={1000} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="What felt better, harder, or different?" />
        <div className="button-row">
          <button type="button" className="secondary-action" onClick={() => setStage('active')}>Back</button>
          <button type="button" className="primary-action" onClick={() => void submit()}>Save session</button>
        </div>
      </div>
    );
  }

  const current = exercises[activeIndex];
  if (!current?.exercise) return null;
  return (
    <div className="runner">
      <div className="runner__status">
        <span>Step {activeIndex + 1} of {exercises.length}</span>
        <strong>{formatTime(elapsed)}</strong>
        <button type="button" onClick={() => setRunning((value) => !value)} aria-label={running ? 'Pause timer' : 'Resume timer'}>
          {running ? <Pause size={17} fill="currentColor" aria-hidden /> : <Play size={17} fill="currentColor" aria-hidden />}
        </button>
      </div>
      <div className="runner__progress" aria-hidden><span style={{ width: `${((activeIndex + 1) / exercises.length) * 100}%` }} /></div>
      <ExerciseCard exercise={current.exercise} prescription={current.item.prescription} open onToggle={() => undefined} />
      <button type="button" className={`complete-step ${completed.has(activeIndex) ? 'is-complete' : ''}`} onClick={() => toggleDone(activeIndex)}>
        {completed.has(activeIndex) ? <Check size={20} aria-hidden /> : <Circle size={20} aria-hidden />}
        {completed.has(activeIndex) ? 'Marked complete' : 'Mark this step complete'}
      </button>
      <div className="runner__nav">
        <button type="button" className="secondary-action" disabled={activeIndex === 0} onClick={() => setActiveIndex((value) => value - 1)}><ChevronLeft size={18} aria-hidden /> Previous</button>
        {activeIndex < exercises.length - 1 ? (
          <button type="button" className="primary-action" onClick={() => setActiveIndex((value) => value + 1)}>Next <ChevronRight size={18} aria-hidden /></button>
        ) : (
          <button type="button" className="primary-action" onClick={() => { setRunning(false); setStage('finish'); }}>Finish session</button>
        )}
      </div>
    </div>
  );
}

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, '0');
  return `${minutes}:${(seconds % 60).toString().padStart(2, '0')}`;
}
