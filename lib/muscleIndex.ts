import { allExercises } from './protocol';
import type { Exercise } from './protocol';
import type { FocusKey, MuscleId } from './muscleRegistry';

/**
 * Reverse index for the tap-to-explore flow: pick a muscle on the model and
 * get every exercise that loads it. Built once at module scope from the same
 * data `verifyDataIntegrity()` guards, so every key is canonical by
 * construction and lookups are synchronous — the detail sheet populates in
 * the same frame as the tap.
 */
const byMuscle = new Map<MuscleId, Exercise[]>();
for (const exercise of allExercises) {
  for (const muscle of [...exercise.primary_muscles, ...exercise.secondary_muscles]) {
    const id = muscle as MuscleId;
    const list = byMuscle.get(id);
    if (list) {
      if (!list.includes(exercise)) list.push(exercise);
    } else {
      byMuscle.set(id, [exercise]);
    }
  }
}

export const EXERCISES_BY_MUSCLE: ReadonlyMap<MuscleId, readonly Exercise[]> = byMuscle;

const EMPTY: readonly Exercise[] = [];

/** Exercises that recruit the muscle, primaries first (stable within group). */
export function exercisesForMuscle(id: MuscleId): readonly Exercise[] {
  const list = EXERCISES_BY_MUSCLE.get(id);
  if (!list) return EMPTY;
  return [...list].sort((a, b) => {
    const aPrimary = a.primary_muscles.includes(id) ? 0 : 1;
    const bPrimary = b.primary_muscles.includes(id) ? 0 : 1;
    return aPrimary - bPrimary;
  });
}

export function isPrimaryFor(exercise: Exercise, id: MuscleId): boolean {
  return exercise.primary_muscles.includes(id);
}

/**
 * Camera flight target for a tapped muscle. `satisfies` keeps this map
 * exhaustive: adding a muscle to the registry without a focus entry is a
 * compile error, not a silently static camera.
 */
export const MUSCLE_FOCUS = {
  // Head & cervical
  Head: 'neck',
  Sternocleidomastoid: 'neck',
  Longus_Colli: 'neck',
  Longus_Capitis: 'neck',
  Deep_Cervical_Stabilizers: 'neck',
  Levator_Scapulae: 'neck',
  Intercostals: 'torso',

  // Scapula & shoulder girdle
  Upper_Trapezius: 'shoulder',
  Middle_Trapezius: 'shoulder',
  Lower_Trapezius: 'shoulder',
  Rhomboids: 'shoulder',
  Serratus_Anterior: 'shoulder',
  Supraspinatus: 'shoulder',
  Infraspinatus: 'shoulder',
  Teres_Minor: 'shoulder',
  Subscapularis: 'shoulder',
  Anterior_Deltoid: 'shoulder',
  Lateral_Deltoid: 'shoulder',
  Posterior_Deltoid: 'shoulder',
  Pectoralis_Major: 'upper',
  Latissimus_Dorsi: 'upper',

  // Arm
  Biceps_Brachii: 'upper',
  Triceps_Brachii: 'upper',
  Brachioradialis: 'forearm',

  // Forearm & hand
  Wrist_Extensors: 'forearm',
  Wrist_Flexors: 'forearm',
  Finger_Extensors: 'forearm',
  Finger_Flexors: 'forearm',
  Pronator_Teres: 'forearm',
  Pronator_Quadratus: 'forearm',
  Supinator: 'forearm',
  Radial_Deviators: 'forearm',
  Ulnar_Deviators: 'forearm',
  Intrinsic_Hand: 'hand',

  // Trunk
  Rectus_Abdominis: 'torso',
  External_Oblique: 'torso',
  Internal_Oblique: 'torso',
  Transverse_Abdominis: 'torso',
  Diaphragm: 'torso',
  Erector_Spinae: 'torso',
  Thoracic_Erector_Spinae: 'torso',
  Multifidus: 'torso',
  Quadratus_Lumborum: 'torso',

  // Hip & pelvis
  Iliopsoas: 'hips',
  Gluteus_Maximus: 'hips',
  Gluteus_Medius: 'hips',
  Gluteus_Minimus: 'hips',
  Deep_Hip_Rotators: 'hips',
  Pelvic_Floor: 'hips',
  Adductors: 'hips',

  // Thigh
  Rectus_Femoris: 'lower',
  Vastus_Group: 'lower',
  Hamstrings: 'lower',

  // Lower leg & foot
  Gastrocnemius: 'ankle',
  Soleus: 'ankle',
  Tibialis_Anterior: 'ankle',
  Toe_Extensors: 'ankle',
  Peroneals: 'ankle',
  Intrinsic_Foot: 'ankle',
} as const satisfies Record<MuscleId, FocusKey>;

export function focusForMuscle(id: MuscleId): FocusKey {
  return MUSCLE_FOCUS[id];
}
