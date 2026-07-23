'use client';

import { useEffect, useMemo, useState } from 'react';
import { Check, PauseCircle, Play, RotateCcw, Trash2 } from 'lucide-react';
import { findExercise } from '@/lib/protocol';
import type { PracticeSessionInput } from '@/lib/progress';
import { isExerciseComplete } from '@/lib/session-completion';
import { videoForResetStep } from '@/lib/videos';
import { ExerciseCard } from './ExerciseCard';
import { ExerciseVideoButton } from './ExerciseVideoButton';
import { SessionRunner, type RunnerEntry } from './SessionRunner';
import type { SessionDefinition } from './types';

type Stage = 'overview' | 'active' | 'finish' | 'complete';

export function GuidedSession({ definition, onSave, onOpenSafety }: { definition: SessionDefinition; onSave: (session: PracticeSessionInput) => Promise<void>; onOpenSafety: () => void }) {
  const [stage, setStage] = useState<Stage>('overview');
  const [previewIndex, setPreviewIndex] = useState(0);
  const [runnerIndex, setRunnerIndex] = useState(0);
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [startedAt, setStartedAt] = useState<string | null>(null);
  const [zone, setZone] = useState<'green' | 'yellow' | 'red'>('green');
  const [painAfter, setPainAfter] = useState<number | null>(null);
  const [notes, setNotes] = useState('');

  const exercises = useMemo(
    () => definition.items
      .map((item) => ({ item, exercise: findExercise(item.exercise_id) }))
      .filter((entry): entry is RunnerEntry => entry.exercise !== null),
    [definition.items],
  );

  useEffect(() => {
    if (!running || stage !== 'active') return;
    const id = window.setInterval(() => setElapsed((value) => value + 1), 1000);
    return () => window.clearInterval(id);
  }, [running, stage]);

  const clearDraft = () => {
    setStage('overview');
    setPreviewIndex(0);
    setRunnerIndex(0);
    setCompleted(new Set());
    setElapsed(0);
    setRunning(false);
    setStartedAt(null);
    setZone('green');
    setPainAfter(null);
    setNotes('');
  };

  const startFresh = () => {
    setRunnerIndex(0);
    setCompleted(new Set());
    setElapsed(0);
    setZone('green');
    setPainAfter(null);
    setNotes('');
    setStartedAt(new Date().toISOString());
    setStage('active');
    setRunning(true);
  };

  const resume = () => {
    if (!startedAt) {
      startFresh();
      return;
    }
    setStage('active');
    setRunning(true);
  };

  const toggleSet = (key: string) => {
    setCompleted((previous) => {
      const next = new Set(previous);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const exerciseDone = (index: number) => {
    const entry = exercises[index];
    return entry ? isExerciseComplete(completed, index, entry.item, entry.exercise) : false;
  };

  const completedExerciseCount = exercises.filter((_, index) => exerciseDone(index)).length;

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
      items: exercises.map((entry, index) => ({
        exerciseId: entry.item.exercise_id,
        prescription: entry.item.prescription,
        completed: exerciseDone(index),
      })),
    };
    await onSave(input);
    setStage('complete');
  };

  if (stage === 'overview') {
    const hasDraft = startedAt !== null;
    return (
      <div className="session-overview">
        {definition.leadIn && <p className="lead-in">{definition.leadIn}</p>}
        {definition.warning && <p className="routine-warning">{definition.warning}</p>}
        {definition.steps && (
          <ol className="reset-steps">
            {definition.steps.map((step) => (
              <li key={step}>
                <span>{step}</span>
                <ExerciseVideoButton video={videoForResetStep(step)} exerciseName="Slow shoulder-blade circles" compact />
              </li>
            ))}
          </ol>
        )}

        {hasDraft && (
          <section className="session-draft" aria-label="Paused session">
            <div>
              <PauseCircle size={21} aria-hidden />
              <span><strong>Session paused</strong><small>{completedExerciseCount}/{exercises.length} movements fully completed · {Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, '0')}</small></span>
            </div>
            <div className="session-draft__actions">
              <button type="button" className="primary-action" onClick={resume}><Play size={17} fill="currentColor" aria-hidden /> Resume</button>
              <button type="button" className="secondary-action" onClick={startFresh}><RotateCcw size={17} aria-hidden /> Restart</button>
              <button type="button" className="danger-action" onClick={clearDraft}><Trash2 size={17} aria-hidden /> Discard</button>
            </div>
          </section>
        )}

        <div className="routine-list">
          {exercises.map(({ item, exercise }, index) => (
            <ExerciseCard
              key={`${item.exercise_id}-${index}`}
              exercise={exercise}
              prescription={item.prescription}
              index={index + 1}
              open={previewIndex === index}
              onToggle={() => setPreviewIndex(previewIndex === index ? -1 : index)}
            />
          ))}
        </div>

        {!hasDraft && (
          <div className="session-start-bar">
            <div><strong>Ready when you are.</strong><span>The timer starts only after you begin.</span></div>
            <button type="button" className="primary-action" onClick={startFresh}>
              <Play size={18} fill="currentColor" aria-hidden /> Start guided session
            </button>
          </div>
        )}
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
        <button type="button" className="secondary-action" onClick={clearDraft}><RotateCcw size={17} aria-hidden /> Run again</button>
      </div>
    );
  }

  if (stage === 'finish') {
    return (
      <div className="finish-card">
        <p className="kicker">24-hour feedback starts now</p>
        <h2>How did the session leave you?</h2>
        <p className="finish-card__intro">{completedExerciseCount} of {exercises.length} movements were fully completed. Partial work remains recorded as incomplete.</p>
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
          <button type="button" className="secondary-action" onClick={() => { setStage('active'); setRunning(true); }}>Back</button>
          <button type="button" className="primary-action" onClick={() => void submit()}>Save session</button>
        </div>
      </div>
    );
  }

  return (
    <SessionRunner
      entries={exercises}
      activeIndex={runnerIndex}
      onActiveIndexChange={setRunnerIndex}
      elapsed={elapsed}
      running={running}
      onToggleRunning={() => setRunning((value) => !value)}
      completed={completed}
      onToggleSet={toggleSet}
      onExit={() => { setRunning(false); setStage('overview'); }}
      onOpenSafety={onOpenSafety}
      onFinish={() => { setRunning(false); setStage('finish'); }}
    />
  );
}
