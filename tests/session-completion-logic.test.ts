import { describe, expect, it } from 'vitest';
import { findExercise } from '@/lib/protocol';
import { isExerciseComplete, plannedSetCount, setKey } from '@/lib/session-completion';

const exercise = findExercise('supported-one-arm-row');
if (!exercise) throw new Error('Fixture exercise is missing.');
const item = { exercise_id: exercise.id, prescription: '2-3 sets of 8-12 per side' };

describe('planned-set completion', () => {
  it('uses the conservative lower bound for planned sets', () => {
    expect(plannedSetCount(item, exercise)).toBe(2);
  });

  it('does not complete an exercise after only one planned set', () => {
    expect(isExerciseComplete(new Set([setKey(0, 0)]), 0, item, exercise)).toBe(false);
  });

  it('completes an exercise only after all planned sets', () => {
    expect(isExerciseComplete(new Set([setKey(0, 0), setKey(0, 1)]), 0, item, exercise)).toBe(true);
  });
});
