'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronLeft, ChevronRight, CircleAlert, Pause, Play, ShieldAlert, Square, X } from 'lucide-react';
import { planFor } from '@/lib/dose';
import type { Exercise, RoutineItem } from '@/lib/protocol';
import { videoForExercise } from '@/lib/videos';
import { VideoPanel } from './VideoPanel';

export type RunnerEntry = { item: RoutineItem; exercise: Exercise };

const mmss = (seconds: number) =>
  `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;

export function SessionRunner({
  entries,
  activeIndex,
  onActiveIndexChange,
  elapsed,
  running,
  onToggleRunning,
  completed,
  onToggleSet,
  onExit,
  onOpenSafety,
  onFinish,
}: {
  entries: RunnerEntry[];
  activeIndex: number;
  onActiveIndexChange: (index: number) => void;
  elapsed: number;
  running: boolean;
  onToggleRunning: () => void;
  /** Keys are `${exerciseIndex}:${setIndex}`. */
  completed: Set<string>;
  onToggleSet: (key: string) => void;
  onExit: () => void;
  onOpenSafety: () => void;
  onFinish: () => void;
}) {
  const [hold, setHold] = useState<{ setIndex: number; remaining: number } | null>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  const index = Math.min(Math.max(activeIndex, 0), Math.max(entries.length - 1, 0));
  const current = entries[index];
  const plan = useMemo(
    () => (current ? planFor(current.item.prescription ?? current.exercise.dose, current.exercise.tempo) : null),
    [current],
  );
  const video = current ? videoForExercise(current.exercise.id) : null;
  const setKey = useCallback((setIndex: number) => `${index}:${setIndex}`, [index]);

  useEffect(() => {
    if (!hold) return;
    if (hold.remaining <= 0) {
      if (!completed.has(setKey(hold.setIndex))) onToggleSet(setKey(hold.setIndex));
      setHold(null);
      return;
    }
    const id = window.setTimeout(() => setHold((currentHold) => currentHold ? { ...currentHold, remaining: currentHold.remaining - 1 } : null), 1000);
    return () => window.clearTimeout(id);
  }, [completed, hold, onToggleSet, setKey]);

  const go = (next: number) => {
    setHold(null);
    onActiveIndexChange(next);
    bodyRef.current?.scrollTo({ top: 0 });
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onExit();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onExit]);

  if (!current || !plan) return null;

  const setsDone = Array.from({ length: plan.sets }, (_, i) => completed.has(setKey(i))).filter(Boolean).length;
  const allDone = setsDone === plan.sets;
  const last = index === entries.length - 1;

  const tapSet = (setIndex: number) => {
    if (completed.has(setKey(setIndex))) {
      onToggleSet(setKey(setIndex));
      return;
    }
    if (plan.holdSeconds) {
      setHold({ setIndex, remaining: plan.holdSeconds });
      return;
    }
    onToggleSet(setKey(setIndex));
  };

  return (
    <div className="runner-screen" role="dialog" aria-modal="true" aria-label={`${current.exercise.exercise_name} — running session`}>
      <header className="runner-bar">
        <button type="button" className="runner-bar__icon" onClick={onExit} aria-label="Pause and leave session">
          <X size={22} aria-hidden />
        </button>
        <button
          type="button"
          className="runner-bar__clock"
          onClick={onToggleRunning}
          aria-label={running ? 'Pause session timer' : 'Resume session timer'}
        >
          {running ? <Pause size={15} fill="currentColor" aria-hidden /> : <Play size={15} fill="currentColor" aria-hidden />}
          <strong>{mmss(elapsed)}</strong>
        </button>
        <button type="button" className="runner-bar__safety" onClick={onOpenSafety} aria-label="Open stop rules">
          <ShieldAlert size={18} aria-hidden />
        </button>
        <button type="button" className="runner-bar__finish" onClick={onFinish}>Finish</button>
      </header>

      <div className="runner-track" aria-hidden>
        {entries.map((entry, i) => (
          <span key={`${entry.item.exercise_id}-${i}`} className={i < index ? 'is-past' : i === index ? 'is-current' : ''} />
        ))}
      </div>

      <div className="runner-body" ref={bodyRef}>
        <p className="runner-step">Movement {index + 1} of {entries.length} <span>§{current.exercise.manual_ref}</span></p>
        <h1 className="runner-title">{current.exercise.exercise_name}</h1>
        <p className="runner-dose">
          {plan.source}
          {plan.perSide && <em>each side</em>}
        </p>

        {current.exercise.hand_fatigue && (
          <p className="runner-flag"><CircleAlert size={16} aria-hidden /> Not immediately before precision work</p>
        )}

        <VideoPanel video={video} exerciseName={current.exercise.exercise_name} />

        <table className="set-table">
          <thead>
            <tr><th scope="col">Set</th><th scope="col">Target</th><th scope="col">Tempo</th><th scope="col"><span className="sr-only">Done</span></th></tr>
          </thead>
          <tbody>
            {Array.from({ length: plan.sets }, (_, setIndex) => {
              const done = completed.has(setKey(setIndex));
              const holding = hold?.setIndex === setIndex;
              return (
                <tr key={setIndex} className={`${done ? 'is-done' : ''} ${holding ? 'is-holding' : ''}`}>
                  <td className="set-table__n">{setIndex + 1}</td>
                  <td className="set-table__target">{plan.targetLabel}</td>
                  <td className="set-table__tempo">{holding ? `${hold.remaining}s remaining` : plan.holdSeconds ? 'hold' : 'controlled'}</td>
                  <td>
                    <button
                      type="button"
                      className={`set-check ${done ? 'is-done' : ''}`}
                      onClick={() => tapSet(setIndex)}
                      aria-pressed={done}
                      aria-label={done ? `Set ${setIndex + 1} complete, undo` : `Complete set ${setIndex + 1}`}
                    >
                      {done ? <Check size={19} strokeWidth={3} aria-hidden /> : holding ? <Square size={15} fill="currentColor" aria-hidden /> : null}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {hold && (
          <div className="hold-bar" role="timer" aria-live="off">
            <span style={{ width: `${(hold.remaining / (plan.holdSeconds || 1)) * 100}%` }} />
            <strong>{hold.remaining}s</strong>
            <button type="button" onClick={() => setHold(null)} aria-label="Cancel hold">Cancel</button>
          </div>
        )}

        <section className="runner-cues">
          <h2>Form cues</h2>
          <ol>{current.exercise.cues.map((cue) => <li key={cue}>{cue}</li>)}</ol>
        </section>

        <details className="runner-more">
          <summary>Setup, tempo, and why it matters</summary>
          <p><strong>Setup.</strong> {current.exercise.setup}</p>
          <p><strong>Tempo.</strong> {current.exercise.tempo}</p>
          <p><strong>Why.</strong> {current.exercise.the_why}</p>
          <p><strong>Easier.</strong> {current.exercise.regression}</p>
          <p><strong>Harder.</strong> {current.exercise.progression}</p>
        </details>
      </div>

      <footer className="runner-foot">
        <button type="button" className="runner-foot__side" disabled={index === 0} onClick={() => go(index - 1)}>
          <ChevronLeft size={20} aria-hidden /> Back
        </button>
        <span className={`runner-foot__count ${allDone ? 'is-done' : ''}`}>{setsDone}/{plan.sets} sets</span>
        {last ? (
          <button type="button" className="runner-foot__next" onClick={onFinish}>Finish <Check size={20} aria-hidden /></button>
        ) : (
          <button type="button" className="runner-foot__next" onClick={() => go(index + 1)}>Next <ChevronRight size={20} aria-hidden /></button>
        )}
      </footer>
    </div>
  );
}
