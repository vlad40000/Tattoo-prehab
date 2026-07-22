import raw from '@/data/protocol.v2.json';
import { MUSCLE_LABELS, type MuscleId } from './muscleRegistry';
import { protocolSchema } from './protocol-schema';
export type {
  BestUse,
  Checklist,
  Exercise,
  ExerciseVideo,
  Phase,
  Protocol,
  Region,
  Routine,
  RoutineItem,
  SymptomModification,
} from './protocol-schema';
import type { BestUse, Exercise, Phase, Protocol, Region } from './protocol-schema';

export const BEST_USE_LABELS: Record<BestUse, string> = {
  pre_session: 'Pre-session',
  session_reset: 'Session reset',
  strength: 'Strength day',
  post_work: 'After work',
  recovery: 'Recovery day',
};

export const protocol: Protocol = protocolSchema.parse(raw);
export const regions = protocol.regions;
export const routines = protocol.routines;
export const allExercises: Exercise[] = regions.flatMap((r) => r.exercises);

const index = new Map(allExercises.map((e) => [e.id, e]));

export function findExercise(id: string | null | undefined): Exercise | null {
  return id ? (index.get(id) ?? null) : null;
}

export function regionOf(exerciseId: string): Region | null {
  return regions.find((r) => r.exercises.some((e) => e.id === exerciseId)) ?? null;
}

/** Exercises usable in a given context, honouring the manual's grip rule. */
export function exercisesFor(use: BestUse): Exercise[] {
  return allExercises.filter((e) => e.best_use.includes(use));
}

/** Which phase covers a given program week. */
export function phaseForWeek(week: number): Phase | null {
  return protocol.program.phases.find((p) => week >= p.weeks[0] && week <= p.weeks[1]) ?? null;
}

/** Phase 3 declares no sessions of its own; resolve through the inheritance link. */
export function sessionsForPhase(phase: Phase): Phase['sessions'] {
  if (!phase.inherits_sessions_from) return phase.sessions;
  const parent = protocol.program.phases.find((p) => p.id === phase.inherits_sessions_from);
  return parent ? parent.sessions : [];
}

export type MuscleState = { primary: string[]; secondary: string[] };
export const EMPTY_MUSCLE_STATE: MuscleState = { primary: [], secondary: [] };

export function muscleStateFor(exercise: Exercise | null): MuscleState {
  return exercise
    ? { primary: exercise.primary_muscles, secondary: exercise.secondary_muscles }
    : EMPTY_MUSCLE_STATE;
}

/** Dev-time guard. The full gate is scripts/verify-protocol.mjs. */
export function verifyDataIntegrity(): string[] {
  const problems: string[] = [];
  const known = new Set(Object.keys(MUSCLE_LABELS) as MuscleId[]);
  for (const region of regions) {
    for (const ex of region.exercises) {
      for (const m of [...ex.primary_muscles, ...ex.secondary_muscles]) {
        if (!known.has(m as MuscleId)) problems.push(`${region.id}/${ex.id}: unknown muscle "${m}"`);
      }
      if (ex.hand_fatigue && ex.best_use.includes('pre_session')) {
        problems.push(`${ex.id}: violates the grip rule (hand_fatigue + pre_session)`);
      }
    }
  }
  return problems;
}
