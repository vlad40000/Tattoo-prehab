'use client';

import { ChevronRight, CircleAlert, X } from 'lucide-react';
import { exercisesForMuscle, isPrimaryFor } from '@/lib/muscleIndex';
import { labelFor, type MuscleId } from '@/lib/muscleRegistry';
import { regionOf } from '@/lib/protocol';

/**
 * The answer to a tap on the model: every exercise in the manual that
 * recruits the selected muscle, primaries first. Picking one hands off to the
 * full exercise card and lights the complete activation map.
 */
export function MusclePanel({
  muscleId,
  onPickExercise,
  onClear,
}: {
  muscleId: MuscleId;
  onPickExercise: (exerciseId: string) => void;
  onClear: () => void;
}) {
  const exercises = exercisesForMuscle(muscleId);

  return (
    <section className="muscle-panel" aria-label={`Exercises for ${labelFor(muscleId)}`}>
      <header className="muscle-panel__head">
        <div>
          <p className="kicker">Selected muscle</p>
          <h2>{labelFor(muscleId)}</h2>
          <p className="muscle-panel__count">
            {exercises.length === 0
              ? 'No exercise in the manual targets this muscle directly.'
              : `${exercises.length} exercise${exercises.length === 1 ? '' : 's'} recruit${exercises.length === 1 ? 's' : ''} it — tap one to see setup and cues.`}
          </p>
        </div>
        <button type="button" className="icon-btn" onClick={onClear} aria-label="Clear muscle selection">
          <X size={18} aria-hidden />
        </button>
      </header>

      <div className="muscle-panel__list">
        {exercises.map((exercise) => {
          const primary = isPrimaryFor(exercise, muscleId);
          const region = regionOf(exercise.id);
          return (
            <button
              key={exercise.id}
              type="button"
              className={`muscle-panel__row ${primary ? 'is-primary' : ''}`}
              onClick={() => onPickExercise(exercise.id)}
            >
              <span className="muscle-panel__ref">§{exercise.manual_ref}</span>
              <span className="muscle-panel__copy">
                <strong>{exercise.exercise_name}</strong>
                <small>
                  {primary ? 'Primary' : 'Secondary'}
                  {region ? ` · ${region.name}` : ''} · {exercise.dose}
                </small>
              </span>
              {exercise.hand_fatigue && (
                <CircleAlert size={15} aria-label="Not before precision work" className="muscle-panel__flag" />
              )}
              <ChevronRight size={17} aria-hidden className="muscle-panel__chevron" />
            </button>
          );
        })}
      </div>
    </section>
  );
}
