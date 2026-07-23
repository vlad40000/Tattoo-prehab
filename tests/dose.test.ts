import { describe, expect, it } from 'vitest';
import { holdSecondsFromTempo, planFor } from '@/lib/dose';
import { allExercises, protocol } from '@/lib/protocol';

describe('dose planning', () => {
  it('resolves every range to its lower bound', () => {
    expect(planFor('2-3 sets of 8-12', 'x').sets).toBe(2);
    expect(planFor('3-5 holds', '20-45 second isometric hold').sets).toBe(3);
    expect(planFor('1-2 sets of 6-10 repetitions', 'x').sets).toBe(1);
  });

  it('reads sets-of-reps, holds-of-seconds, and bare holds', () => {
    expect(planFor('2-3 sets of 8-12 per side', 'x')).toMatchObject({
      sets: 2,
      targetLabel: '8\u201312 reps',
      holdSeconds: null,
      perSide: true,
    });
    expect(planFor('5 holds of 5 seconds', 'x')).toMatchObject({
      sets: 5,
      targetLabel: '5s hold',
      holdSeconds: 5,
    });
    expect(planFor('2-3 holds per side', '15-40 second isometric hold with quiet breathing')).toMatchObject({
      sets: 2,
      targetLabel: '15s hold',
      holdSeconds: 15,
      perSide: true,
    });
  });

  it('does not mistake a per-repetition tempo pause for an isometric set', () => {
    // The hold here belongs to each rep, not to the set.
    expect(holdSecondsFromTempo('3 seconds upward; 2-second hold; 3 seconds downward')).toBe(2);
    expect(planFor('2-3 sets of 8-12', '3 seconds upward; 2-second hold; 3 seconds downward').holdSeconds).toBeNull();
  });

  it('handles breaths, cycles, steps, and bare repetitions', () => {
    expect(planFor('4-6 breaths', 'x')).toMatchObject({ sets: 1, targetLabel: '4\u20136 breaths' });
    expect(planFor('3-5 controlled cycles', 'x')).toMatchObject({ sets: 1, targetLabel: '3\u20135 cycles' });
    expect(planFor('8 steps each direction', 'x')).toMatchObject({ sets: 1, perSide: true });
    expect(planFor('15 gentle repetitions', 'x')).toMatchObject({ sets: 1, targetLabel: '15 reps' });
    expect(planFor('2-3 sets of 8-12 steps each direction', 'x').targetLabel).toBe('8\u201312 steps');
  });

  it('falls back to a single untargeted row instead of guessing', () => {
    const plan = planFor('Open the hands gently', 'x');
    expect(plan.parsed).toBe(false);
    expect(plan.sets).toBe(1);
    expect(plan.targetLabel).toBe('Open the hands gently');
  });

  it('parses every dose in the protocol into a sane plan', () => {
    const unparsed: string[] = [];
    for (const exercise of allExercises) {
      const plan = planFor(exercise.dose, exercise.tempo);
      if (!plan.parsed) unparsed.push(`${exercise.id}: ${exercise.dose}`);
      expect(plan.sets, exercise.id).toBeGreaterThanOrEqual(1);
      expect(plan.sets, exercise.id).toBeLessThanOrEqual(8);
      expect(plan.source).toBe(exercise.dose);
    }
    expect(unparsed).toEqual([]);
  });

  it('parses every routine prescription', () => {
    const unparsed: string[] = [];
    for (const routine of protocol.routines) {
      for (const item of routine.items) {
        if (!item.prescription) continue;
        const plan = planFor(item.prescription, '');
        if (!plan.parsed) unparsed.push(`${routine.id}: ${item.prescription}`);
      }
    }
    // Free-text prescriptions are allowed to fall back, but we want to know
    // which ones do rather than discover it in the UI.
    expect(unparsed.length).toBeLessThanOrEqual(1);
  });
});
