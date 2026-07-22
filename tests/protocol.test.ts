import { describe, expect, it } from 'vitest';
import raw from '@/data/protocol.v2.json';
import { allExercises, protocol, regions } from '@/lib/protocol';
import { protocolSchema } from '@/lib/protocol-schema';

const expected = [
  ['5.1', 'deep-neck-flexor-chin-nod'], ['5.2', 'thoracic-extension-over-chair'], ['5.3', 'band-external-rotation'],
  ['5.4', 'serratus-wall-slide'], ['5.5', 'supported-one-arm-row'], ['5.6', 'face-pull-external-rotation'], ['5.7', 'incline-push-up-plus'],
  ['6.1', 'breathing-90-90'], ['6.2', 'dead-bug-full-exhale'], ['6.3', 'bird-dog'], ['6.4', 'side-plank'],
  ['6.5', 'half-kneeling-pallof-press'], ['6.6', 'hip-hinge-pattern-drill'], ['7.1', 'banded-glute-bridge'],
  ['7.2', 'banded-lateral-walk'], ['7.3', 'supported-split-squat'], ['7.4', 'supported-single-leg-rdl'],
  ['7.5', 'half-kneeling-hip-flexor-mobilization'], ['7.6', 'adductor-rock-back'], ['8.1', 'controlled-sit-to-stand'],
  ['8.2', 'banded-spanish-squat-isometric'], ['8.3', 'controlled-step-down'], ['8.4', 'straight-knee-calf-raise'],
  ['8.5', 'bent-knee-soleus-raise'], ['8.6', 'wall-tibialis-raise'], ['8.7', 'knee-to-wall-ankle-mobilization'],
  ['9.1', 'finger-extension-band-opens'], ['9.2', 'tendon-glide-sequence'], ['9.3', 'eccentric-wrist-extension'],
  ['9.4', 'eccentric-wrist-flexion'], ['9.5', 'dumbbell-pronation-supination'], ['9.6', 'radial-ulnar-deviation-control'],
  ['9.7', 'neutral-wrist-dumbbell-hold'],
];

describe('canonical protocol', () => {
  it('passes the full runtime schema', () => {
    expect(() => protocolSchema.parse(raw)).not.toThrow();
    expect(protocol.schema_version).toBe('2.0.0');
  });

  it('preserves the exact 33-exercise manual manifest and region counts', () => {
    expect(regions.map((region) => region.exercises.length)).toEqual([7, 6, 6, 7, 7]);
    expect(allExercises.map((exercise) => [exercise.manual_ref, exercise.id])).toEqual(expected);
    expect(new Set(allExercises.map((exercise) => exercise.id)).size).toBe(33);
  });

  it('rejects an unknown routine owner', () => {
    const mutated = structuredClone(raw);
    mutated.routines[0].items[0].exercise_id = 'missing-exercise';
    expect(protocolSchema.safeParse(mutated).success).toBe(false);
  });
});
