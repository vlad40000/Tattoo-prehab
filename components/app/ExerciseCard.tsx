'use client';

import { ChevronDown, CircleAlert, RotateCcw, TrendingUp } from 'lucide-react';
import { labelFor } from '@/lib/muscleRegistry';
import { BEST_USE_LABELS, type Exercise } from '@/lib/protocol';
import { videoForExercise } from '@/lib/videos';
import { ExerciseVideoButton } from './ExerciseVideoButton';

export function ExerciseCard({ exercise, prescription, open, onToggle }: { exercise: Exercise; prescription?: string; open: boolean; onToggle: () => void }) {
  return (
    <article className={`exercise-card ${open ? 'is-open' : ''}`}>
      <button type="button" className="exercise-card__toggle" onClick={onToggle} aria-expanded={open}>
        <span>
          <small>§{exercise.manual_ref}</small>
          <strong>{exercise.exercise_name}</strong>
          <em>{prescription ?? exercise.dose}</em>
        </span>
        <ChevronDown size={19} aria-hidden />
      </button>
      {open && (
        <div className="exercise-card__body">
          {exercise.hand_fatigue && (
            <p className="inline-warning">
              <CircleAlert size={16} aria-hidden /> Not before precision work
            </p>
          )}
          <div className="exercise-stat-row">
            <span><small>Tempo</small>{exercise.tempo}</span>
            <span><small>Dose</small>{exercise.dose}</span>
          </div>
          <div className="detail-section">
            <h3>Setup</h3>
            <p>{exercise.setup}</p>
          </div>
          <div className="detail-section">
            <h3>Form cues</h3>
            <ul>{exercise.cues.map((cue) => <li key={cue}>{cue}</li>)}</ul>
          </div>
          <div className="muscle-tags">
            {exercise.primary_muscles.map((muscle) => <span key={muscle} className="is-primary">{labelFor(muscle)}</span>)}
            {exercise.secondary_muscles.map((muscle) => <span key={muscle}>{labelFor(muscle)}</span>)}
          </div>
          <div className="variation-grid">
            <div><RotateCcw size={16} aria-hidden /><span><small>Regression</small>{exercise.regression}</span></div>
            <div><TrendingUp size={16} aria-hidden /><span><small>Progression</small>{exercise.progression}</span></div>
          </div>
          <div className="detail-section detail-section--why">
            <h3>Why it matters for tattooing</h3>
            <p>{exercise.the_why}</p>
          </div>
          <div className="use-row">
            {exercise.best_use.map((use) => <span key={use}>{BEST_USE_LABELS[use]}</span>)}
          </div>
          <ExerciseVideoButton video={videoForExercise(exercise.id)} exerciseName={exercise.exercise_name} />
        </div>
      )}
    </article>
  );
}
