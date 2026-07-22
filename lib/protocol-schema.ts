import { z } from 'zod';
import { MUSCLE_LABELS } from './muscleRegistry';

const nonEmpty = z.string().trim().min(1);
const stringList = z.array(nonEmpty);
const id = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const refs = z.array(z.number().int().positive());

export const focusKeySchema = z.enum([
  'full',
  'neck',
  'shoulder',
  'upper',
  'torso',
  'hips',
  'lower',
  'ankle',
  'forearm',
  'hand',
]);

export const bestUseSchema = z.enum(['pre_session', 'session_reset', 'strength', 'post_work', 'recovery']);

export const exerciseVideoSchema = z
  .object({
    provider: z.literal('youtube'),
    videoId: z.string().regex(/^[A-Za-z0-9_-]{11}$/),
    reviewStatus: z.enum(['candidate', 'verified', 'rejected']),
    sourceTitle: nonEmpty.optional(),
    sourceChannel: nonEmpty.optional(),
    reviewedBy: nonEmpty.optional(),
    reviewedAt: z.iso.date().optional(),
    variationVerified: z.boolean().optional(),
    captionsVerified: z.boolean().optional(),
    embeddable: z.boolean().optional(),
    startSeconds: z.number().int().nonnegative().optional(),
    reviewerNotes: nonEmpty.optional(),
  })
  .superRefine((video, ctx) => {
    if (video.reviewStatus !== 'verified') return;
    const complete =
      video.reviewedBy &&
      video.reviewedAt &&
      video.variationVerified === true &&
      video.captionsVerified === true &&
      video.embeddable === true;
    if (!complete) {
      ctx.addIssue({
        code: 'custom',
        message: 'Verified videos require reviewer, review date, exact-variation, captions, and embed approval.',
      });
    }
  });

export const exerciseSchema = z.object({
  id,
  manual_ref: z.string().regex(/^[5-9]\.[1-7]$/),
  exercise_name: nonEmpty,
  type: z.enum(['strength', 'mobility', 'breathing']),
  equipment: stringList,
  setup: nonEmpty,
  primary_muscles: stringList,
  secondary_muscles: stringList,
  cues: stringList.min(1),
  tempo: nonEmpty,
  dose: nonEmpty,
  best_use: z.array(bestUseSchema).min(1),
  pre_session_note: nonEmpty.optional(),
  regression: nonEmpty,
  progression: nonEmpty,
  the_why: nonEmpty,
  camera_focus: focusKeySchema,
  hand_fatigue: z.boolean(),
  demonstration_video: exerciseVideoSchema.optional(),
});

export const regionSchema = z.object({
  id,
  index: z.number().int().min(1).max(5),
  manual_ref: z.string().regex(/^[5-9]$/),
  name: nonEmpty,
  short_name: nonEmpty,
  accent: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  camera_focus: focusKeySchema,
  objective: nonEmpty,
  refs,
  warning: nonEmpty.optional(),
  exercises: z.array(exerciseSchema).min(1),
});

export const routineItemSchema = z.object({
  exercise_id: id,
  prescription: nonEmpty,
  alternatives: stringList.optional(),
});

export const routineSchema = z.object({
  id,
  name: nonEmpty,
  duration_min: z.number().int().positive(),
  when: nonEmpty,
  warning: nonEmpty.optional(),
  lead_in: nonEmpty.optional(),
  steps: stringList.optional(),
  items: z.array(routineItemSchema).min(1),
});

const phaseSchema = z.object({
  id,
  name: nonEmpty,
  weeks: z.tuple([z.number().int().positive(), z.number().int().positive()]),
  rules: stringList,
  inherits_sessions_from: id.optional(),
  inherit_note: nonEmpty.optional(),
  sessions: z.array(
    z.object({
      id,
      label: nonEmpty,
      optional: z.boolean().optional(),
      items: z.array(routineItemSchema).min(1),
    }),
  ),
});

const symptomSchema = z.object({
  id,
  symptom: nonEmpty,
  region_id: id.nullable(),
  severity: z.literal('referral').optional(),
  workstation: nonEmpty,
  emphasize: z.array(id),
  emphasize_note: nonEmpty.nullable(),
  reduce: z.array(id),
  reduce_note: nonEmpty.nullable(),
});

const checklistSchema = z.object({
  id,
  name: nonEmpty,
  cadence: nonEmpty,
  type: z.literal('questions').optional(),
  items: stringList.min(1),
});

export const protocolSchema = z.object({
  schema_version: z.literal('2.0.0'),
  source: z.object({
    document: nonEmpty,
    document_version: nonEmpty,
    prepared: nonEmpty,
    authority: nonEmpty,
    supersedes: nonEmpty,
  }),
  meta: z.object({
    title: nonEmpty,
    subtitle: nonEmpty,
    scope: nonEmpty,
    not_scope: nonEmpty,
    controlling_principle: nonEmpty,
    exercise_is_support: nonEmpty,
    final_operating_principle: nonEmpty,
    how_to_use: stringList,
    equipment: stringList,
  }),
  occupational_demands: z.object({
    summary: nonEmpty,
    five_load_model: z.array(z.object({ id, name: nonEmpty, detail: nonEmpty })).min(1),
    research_findings: z.array(z.object({ claim: nonEmpty, refs })).min(1),
  }),
  triage: z.object({
    name: nonEmpty,
    zones: z.array(
      z.object({
        id: z.enum(['green', 'yellow', 'red']),
        label: nonEmpty,
        color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
        looks_like: nonEmpty,
        action: nonEmpty,
        blocks_progression: z.boolean(),
        halts_session: z.boolean().optional(),
      }),
    ).length(3),
    effort_standard: stringList,
    twenty_four_hour_rule: nonEmpty,
    progression_hierarchy: stringList,
    immediate_stop: stringList,
    prompt_evaluation: stringList,
    referral_indicators: stringList,
    load_rule: nonEmpty,
    grip_rule: nonEmpty,
  }),
  ergonomics: z.object({
    principle: nonEmpty,
    refs,
    audit_question: nonEmpty,
    sections: z.array(z.object({ id, ref: nonEmpty, name: nonEmpty, points: stringList })).min(1),
    workstation_checklist: stringList,
  }),
  routines: z.array(routineSchema).min(1),
  regions: z.array(regionSchema).length(5),
  program: z.object({
    name: nonEmpty,
    note: nonEmpty,
    refs,
    weekly_template: z.array(z.object({ day: nonEmpty, plan: nonEmpty, emphasis: nonEmpty })).min(1),
    phases: z.array(phaseSchema).length(3),
    maintenance: z.object({ name: nonEmpty, rules: stringList }),
    minimum_effective_session: z.object({ name: nonEmpty, duration_min: z.number().int().positive(), items: z.array(routineItemSchema).min(1) }),
    reduce_volume_when: stringList,
  }),
  symptom_modifications: z.array(symptomSchema).min(1),
  checklists: z.array(checklistSchema).min(1),
  log_schema: z.object({
    id,
    name: nonEmpty,
    cadence: nonEmpty,
    fields: z.array(z.object({ key: z.string().regex(/^[a-z][a-z0-9_]*$/), label: nonEmpty, type: nonEmpty, min: z.number().optional(), max: z.number().optional() })).min(1),
  }),
  evidence: z.object({
    statement: nonEmpty,
    notes: stringList,
    references: z.array(z.object({ n: z.number().int().positive(), citation: nonEmpty })).min(1),
  }),
}).superRefine((value, ctx) => {
  const exercises = value.regions.flatMap((region) => region.exercises);
  const exerciseIds = new Set<string>();
  const names = new Set<string>();
  const manualRefs = new Set<string>();
  const knownMuscles = new Set(Object.keys(MUSCLE_LABELS));

  for (const exercise of exercises) {
    const path = ['regions', exercise.manual_ref, exercise.id];
    if (exerciseIds.has(exercise.id)) ctx.addIssue({ code: 'custom', path, message: `Duplicate exercise ID: ${exercise.id}` });
    if (names.has(exercise.exercise_name)) ctx.addIssue({ code: 'custom', path, message: `Duplicate exercise name: ${exercise.exercise_name}` });
    if (manualRefs.has(exercise.manual_ref)) ctx.addIssue({ code: 'custom', path, message: `Duplicate manual reference: ${exercise.manual_ref}` });
    exerciseIds.add(exercise.id);
    names.add(exercise.exercise_name);
    manualRefs.add(exercise.manual_ref);

    const primary = new Set(exercise.primary_muscles);
    for (const muscle of [...exercise.primary_muscles, ...exercise.secondary_muscles]) {
      if (!knownMuscles.has(muscle)) ctx.addIssue({ code: 'custom', path, message: `Unknown muscle ID: ${muscle}` });
    }
    for (const muscle of exercise.secondary_muscles) {
      if (primary.has(muscle)) ctx.addIssue({ code: 'custom', path, message: `Muscle appears as primary and secondary: ${muscle}` });
    }
    if (exercise.hand_fatigue && exercise.best_use.includes('pre_session')) {
      ctx.addIssue({ code: 'custom', path, message: 'Hand-fatiguing exercises cannot be prescribed before precision work.' });
    }
  }

  const referencedItems = [
    ...value.routines.flatMap((routine) => routine.items),
    ...value.program.phases.flatMap((phase) => phase.sessions.flatMap((session) => session.items)),
    ...value.program.minimum_effective_session.items,
  ];
  for (const item of referencedItems) {
    if (!exerciseIds.has(item.exercise_id)) ctx.addIssue({ code: 'custom', path: ['routines'], message: `Unknown exercise reference: ${item.exercise_id}` });
  }

  for (const modification of value.symptom_modifications) {
    for (const exerciseId of [...modification.emphasize, ...modification.reduce]) {
      if (!exerciseIds.has(exerciseId)) ctx.addIssue({ code: 'custom', path: ['symptom_modifications', modification.id], message: `Unknown exercise reference: ${exerciseId}` });
    }
    const overlap = modification.emphasize.find((exerciseId) => modification.reduce.includes(exerciseId));
    if (overlap) ctx.addIssue({ code: 'custom', path: ['symptom_modifications', modification.id], message: `Exercise cannot be both emphasized and reduced: ${overlap}` });
  }

  const phaseIds = new Set(value.program.phases.map((phase) => phase.id));
  for (const phase of value.program.phases) {
    if (phase.inherits_sessions_from && !phaseIds.has(phase.inherits_sessions_from)) {
      ctx.addIssue({ code: 'custom', path: ['program', 'phases', phase.id], message: `Unknown inherited phase: ${phase.inherits_sessions_from}` });
    }
  }
});

export type ExerciseVideo = z.infer<typeof exerciseVideoSchema>;
export type BestUse = z.infer<typeof bestUseSchema>;
export type Exercise = z.infer<typeof exerciseSchema>;
export type Region = z.infer<typeof regionSchema>;
export type RoutineItem = z.infer<typeof routineItemSchema>;
export type Routine = z.infer<typeof routineSchema>;
export type Phase = z.infer<typeof phaseSchema>;
export type SymptomModification = z.infer<typeof symptomSchema>;
export type Checklist = z.infer<typeof checklistSchema>;
export type Protocol = z.infer<typeof protocolSchema>;
