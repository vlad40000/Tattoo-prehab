import { describe, expect, it } from 'vitest';
import { EXERCISES_BY_MUSCLE, MUSCLE_FOCUS, exercisesForMuscle, focusForMuscle, isPrimaryFor } from '@/lib/muscleIndex';
import { ALL_MUSCLES, FOCUS_PRESETS, type MuscleId } from '@/lib/muscleRegistry';
import { allExercises } from '@/lib/protocol';

describe('muscle reverse index', () => {
  it('indexes every muscle referenced by the protocol data', () => {
    const referenced = new Set<string>();
    for (const exercise of allExercises) {
      for (const muscle of [...exercise.primary_muscles, ...exercise.secondary_muscles]) {
        referenced.add(muscle);
      }
    }
    for (const muscle of referenced) {
      expect(EXERCISES_BY_MUSCLE.has(muscle as MuscleId), `missing index entry for ${muscle}`).toBe(true);
    }
  });

  it('lists an exercise under each muscle it recruits, without duplicates', () => {
    for (const exercise of allExercises) {
      for (const muscle of [...exercise.primary_muscles, ...exercise.secondary_muscles]) {
        const list = exercisesForMuscle(muscle as MuscleId);
        expect(list.filter((e) => e.id === exercise.id)).toHaveLength(1);
      }
    }
  });

  it('sorts primaries ahead of secondaries', () => {
    for (const muscle of ALL_MUSCLES) {
      const list = exercisesForMuscle(muscle);
      const firstSecondary = list.findIndex((e) => !isPrimaryFor(e, muscle));
      if (firstSecondary === -1) continue;
      for (const exercise of list.slice(firstSecondary)) {
        expect(isPrimaryFor(exercise, muscle), `${exercise.id} listed after secondaries for ${muscle}`).toBe(false);
      }
    }
  });

  it('maps every canonical muscle to a valid camera focus', () => {
    for (const muscle of ALL_MUSCLES) {
      const focus = focusForMuscle(muscle);
      expect(FOCUS_PRESETS[focus], `no preset for focus "${focus}" (${muscle})`).toBeDefined();
    }
    // The map carries no keys outside the registry.
    for (const key of Object.keys(MUSCLE_FOCUS)) {
      expect(ALL_MUSCLES).toContain(key as MuscleId);
    }
  });
});
