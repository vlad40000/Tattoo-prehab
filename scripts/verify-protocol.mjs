#!/usr/bin/env node
/**
 * Protocol integrity + manual parity gate.
 *
 * Divergence between the manual and the app is the highest-risk failure mode in
 * this project: it produces an app that confidently prescribes a dose no
 * clinician wrote. This script is the thing that makes that divergence loud.
 *
 * Run: node scripts/verify-protocol.mjs
 * Exit 0 = parity holds. Exit 1 = divergence, with every fault listed.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const protocol = JSON.parse(fs.readFileSync(path.join(root, 'data/protocol.v2.json'), 'utf8'));
const registrySrc = fs.readFileSync(path.join(root, 'lib/muscleRegistry.ts'), 'utf8');
const rigSrc = fs.readFileSync(path.join(root, 'lib/proceduralRig.ts'), 'utf8');

const faults = [];
const fail = (msg) => faults.push(msg);

/* ---------------------------------------------------------------- */
/* Expected manual contents — transcribed from the PDF, not derived  */
/* from the dataset. If these two disagree, that IS the bug.         */
/* ---------------------------------------------------------------- */

const MANUAL = {
  exerciseCount: 33,
  regionCounts: {
    'shoulders-neck-scapular': 7,
    'spine-deep-core': 6,
    'hips-pelvic-control': 6,
    'knees-ankles': 7,
    'hands-wrists-forearms': 7,
  },
  // §5.1 … §9.7 — every numbered exercise heading in the manual.
  manualRefs: [
    '5.1', '5.2', '5.3', '5.4', '5.5', '5.6', '5.7',
    '6.1', '6.2', '6.3', '6.4', '6.5', '6.6',
    '7.1', '7.2', '7.3', '7.4', '7.5', '7.6',
    '8.1', '8.2', '8.3', '8.4', '8.5', '8.6', '8.7',
    '9.1', '9.2', '9.3', '9.4', '9.5', '9.6', '9.7',
  ],
  phaseWeeks: [[1, 4], [5, 8], [9, 12]],
  strengthSessionsPerWeek: '2-3',
  preSessionMinutes: 8,
  preSessionFirstItem: 'breathing-90-90',
  preSessionItemCount: 8,
  workstationChecklistCount: 10,
  monthlyAuditCount: 10,
  triageZones: ['green', 'yellow', 'red'],
  referenceCount: 12,
  symptomModificationCount: 8,
};

const REQUIRED_EXERCISE_FIELDS = [
  'id', 'manual_ref', 'exercise_name', 'type', 'equipment', 'setup',
  'primary_muscles', 'secondary_muscles', 'cues', 'tempo', 'dose',
  'best_use', 'regression', 'progression', 'the_why', 'camera_focus',
  'hand_fatigue',
];

const VALID_BEST_USE = ['pre_session', 'session_reset', 'strength', 'post_work', 'recovery'];
const VALID_TYPES = ['strength', 'mobility', 'breathing'];
const VALID_FOCUS = ['full', 'neck', 'shoulder', 'upper', 'torso', 'hips', 'lower', 'ankle', 'forearm', 'hand'];

/* ---------------------------------------------------------------- */
/* 1. Muscle vocabulary                                              */
/* ---------------------------------------------------------------- */

const labelBlock = registrySrc.split('export const MUSCLE_LABELS = {')[1]?.split('} as const;')[0] ?? '';
const knownMuscles = new Set([...labelBlock.matchAll(/^\s{2}([A-Za-z_]+):/gm)].map((m) => m[1]));
const riggedMuscles = new Set([...rigSrc.matchAll(/P\('([A-Za-z_]+)'/g)].map((m) => m[1]));

/* ---------------------------------------------------------------- */
/* 2. Walk exercises                                                 */
/* ---------------------------------------------------------------- */

const exercises = protocol.regions.flatMap((r) => r.exercises.map((e) => ({ ...e, _region: r.id })));
const byId = new Map(exercises.map((e) => [e.id, e]));
const usedMuscles = new Set();

if (exercises.length !== MANUAL.exerciseCount) {
  fail(`exercise count: dataset has ${exercises.length}, manual has ${MANUAL.exerciseCount}`);
}

for (const [regionId, expected] of Object.entries(MANUAL.regionCounts)) {
  const region = protocol.regions.find((r) => r.id === regionId);
  if (!region) {
    fail(`missing region "${regionId}"`);
    continue;
  }
  if (region.exercises.length !== expected) {
    fail(`region ${regionId}: ${region.exercises.length} exercises, manual has ${expected}`);
  }
}

const seenRefs = new Set();
for (const ex of exercises) {
  for (const field of REQUIRED_EXERCISE_FIELDS) {
    if (ex[field] === undefined || ex[field] === null || ex[field] === '') {
      fail(`${ex.id}: missing required field "${field}"`);
    }
  }
  if (!Array.isArray(ex.cues) || ex.cues.length < 3) {
    fail(`${ex.id}: expected at least 3 form cues, got ${ex.cues?.length ?? 0}`);
  }
  if (!VALID_TYPES.includes(ex.type)) fail(`${ex.id}: invalid type "${ex.type}"`);
  if (!VALID_FOCUS.includes(ex.camera_focus)) fail(`${ex.id}: invalid camera_focus "${ex.camera_focus}"`);
  if (typeof ex.hand_fatigue !== 'boolean') fail(`${ex.id}: hand_fatigue must be boolean`);

  for (const use of ex.best_use ?? []) {
    if (!VALID_BEST_USE.includes(use)) fail(`${ex.id}: invalid best_use "${use}"`);
  }
  if (!ex.best_use?.length) fail(`${ex.id}: best_use is empty`);

  if (seenRefs.has(ex.manual_ref)) fail(`duplicate manual_ref "${ex.manual_ref}"`);
  seenRefs.add(ex.manual_ref);

  for (const m of [...ex.primary_muscles, ...ex.secondary_muscles]) {
    usedMuscles.add(m);
    if (!knownMuscles.has(m)) fail(`${ex.id}: muscle "${m}" is not in MUSCLE_LABELS`);
    else if (!riggedMuscles.has(m)) fail(`${ex.id}: muscle "${m}" has no geometry in proceduralRig`);
  }
  if (!ex.primary_muscles.length) fail(`${ex.id}: no primary muscles`);
}

for (const ref of MANUAL.manualRefs) {
  if (!seenRefs.has(ref)) fail(`manual section §${ref} has no corresponding exercise`);
}
for (const ref of seenRefs) {
  if (!MANUAL.manualRefs.includes(ref)) fail(`exercise claims manual_ref §${ref}, which the manual does not contain`);
}

/* ---------------------------------------------------------------- */
/* 3. The grip rule, made machine-enforceable                        */
/* ---------------------------------------------------------------- */
/* Manual: "Do not train the hands to exhaustion immediately before a
   long tattoo appointment." An exercise flagged hand_fatigue must never
   appear in the pre-session routine or claim pre_session best_use.     */

const preSession = protocol.routines.find((r) => r.id === 'pre-session');
for (const item of preSession?.items ?? []) {
  const ex = byId.get(item.exercise_id);
  if (!ex) fail(`pre-session routine references unknown exercise "${item.exercise_id}"`);
  else if (ex.hand_fatigue) fail(`GRIP RULE: hand-fatiguing "${ex.id}" is in the pre-session routine`);
}
for (const ex of exercises) {
  if (ex.hand_fatigue && ex.best_use.includes('pre_session')) {
    fail(`GRIP RULE: "${ex.id}" is hand-fatiguing but claims pre_session best_use`);
  }
}

/* ---------------------------------------------------------------- */
/* 4. Routines and program references resolve                        */
/* ---------------------------------------------------------------- */

for (const routine of protocol.routines) {
  for (const item of routine.items ?? []) {
    if (!byId.has(item.exercise_id)) fail(`routine ${routine.id}: unknown exercise_id "${item.exercise_id}"`);
    if (!item.prescription) fail(`routine ${routine.id}/${item.exercise_id}: missing prescription`);
  }
}

if (preSession?.items.length !== MANUAL.preSessionItemCount) {
  fail(`pre-session routine has ${preSession?.items.length} items, manual has ${MANUAL.preSessionItemCount}`);
}
if (preSession?.items[0]?.exercise_id !== MANUAL.preSessionFirstItem) {
  fail(`pre-session routine starts with "${preSession?.items[0]?.exercise_id}", manual starts with "${MANUAL.preSessionFirstItem}"`);
}
if (preSession?.duration_min !== MANUAL.preSessionMinutes) {
  fail(`pre-session duration is ${preSession?.duration_min} min, manual says ${MANUAL.preSessionMinutes}`);
}

const phases = protocol.program.phases;
MANUAL.phaseWeeks.forEach(([from, to], i) => {
  const p = phases[i];
  if (!p) return fail(`missing phase ${i + 1}`);
  if (p.weeks[0] !== from || p.weeks[1] !== to) {
    fail(`${p.id}: weeks ${p.weeks[0]}-${p.weeks[1]}, manual says ${from}-${to}`);
  }
});

for (const phase of phases) {
  if (phase.inherits_sessions_from) {
    if (!phases.some((p) => p.id === phase.inherits_sessions_from)) {
      fail(`${phase.id}: inherits from unknown phase "${phase.inherits_sessions_from}"`);
    }
    if (phase.sessions.length) fail(`${phase.id}: inherits sessions but also declares its own`);
    continue;
  }
  if (!phase.sessions.length) fail(`${phase.id}: no sessions and no inheritance`);
  for (const session of phase.sessions) {
    for (const item of session.items) {
      if (!byId.has(item.exercise_id)) fail(`${session.id}: unknown exercise_id "${item.exercise_id}"`);
      if (!item.prescription) fail(`${session.id}/${item.exercise_id}: missing prescription`);
    }
  }
}

for (const item of protocol.program.minimum_effective_session.items) {
  if (!byId.has(item.exercise_id)) fail(`minimum-effective session: unknown "${item.exercise_id}"`);
  for (const alt of item.alternatives ?? []) {
    if (!byId.has(alt)) fail(`minimum-effective session: unknown alternative "${alt}"`);
  }
}

/* ---------------------------------------------------------------- */
/* 5. Symptom modifications                                          */
/* ---------------------------------------------------------------- */

if (protocol.symptom_modifications.length !== MANUAL.symptomModificationCount) {
  fail(`symptom modifications: ${protocol.symptom_modifications.length}, manual has ${MANUAL.symptomModificationCount}`);
}
for (const mod of protocol.symptom_modifications) {
  for (const id of [...mod.emphasize, ...mod.reduce]) {
    if (!byId.has(id)) fail(`symptom "${mod.id}": unknown exercise "${id}"`);
  }
  if (mod.region_id && !protocol.regions.some((r) => r.id === mod.region_id)) {
    fail(`symptom "${mod.id}": unknown region "${mod.region_id}"`);
  }
  const overlap = mod.emphasize.filter((e) => mod.reduce.includes(e));
  if (overlap.length) fail(`symptom "${mod.id}": ${overlap.join(', ')} both emphasized and reduced`);
}

/* ---------------------------------------------------------------- */
/* 6. Checklists, triage, references                                 */
/* ---------------------------------------------------------------- */

const checklistLen = (id) => protocol.checklists.find((c) => c.id === id)?.items.length ?? 0;
if (protocol.ergonomics.workstation_checklist.length !== MANUAL.workstationChecklistCount) {
  fail(`workstation checklist has ${protocol.ergonomics.workstation_checklist.length} points, manual has ${MANUAL.workstationChecklistCount}`);
}
if (checklistLen('monthly-workstation-audit') !== MANUAL.monthlyAuditCount) {
  fail(`monthly audit has ${checklistLen('monthly-workstation-audit')} items, manual has ${MANUAL.monthlyAuditCount}`);
}

const zoneIds = protocol.triage.zones.map((z) => z.id);
if (JSON.stringify(zoneIds) !== JSON.stringify(MANUAL.triageZones)) {
  fail(`triage zones are [${zoneIds}], manual has [${MANUAL.triageZones}]`);
}

const refs = protocol.evidence.references;
if (refs.length !== MANUAL.referenceCount) {
  fail(`references: ${refs.length}, manual has ${MANUAL.referenceCount}`);
}
refs.forEach((r, i) => {
  if (r.n !== i + 1) fail(`reference ${i + 1} is numbered ${r.n}`);
});

const citedRefs = new Set();
const collectRefs = (node) => {
  if (Array.isArray(node)) return node.forEach(collectRefs);
  if (node && typeof node === 'object') {
    for (const [k, v] of Object.entries(node)) {
      if (k === 'refs' && Array.isArray(v)) v.forEach((n) => citedRefs.add(n));
      else collectRefs(v);
    }
  }
};
collectRefs(protocol);
for (const n of citedRefs) {
  if (!refs.some((r) => r.n === n)) fail(`citation [${n}] has no matching reference entry`);
}

/* ---------------------------------------------------------------- */
/* Report                                                            */
/* ---------------------------------------------------------------- */

const orphanMuscles = [...knownMuscles].filter((m) => !usedMuscles.has(m));

console.log(`protocol  v${protocol.schema_version}  ←  ${protocol.source.document} v${protocol.source.document_version}`);
console.log(`exercises ${exercises.length}/${MANUAL.exerciseCount}   regions ${protocol.regions.length}   phases ${phases.length}`);
console.log(`muscles   ${knownMuscles.size} defined · ${riggedMuscles.size} rigged · ${usedMuscles.size} referenced by an exercise`);
console.log(`routines  ${protocol.routines.length}   symptom mods ${protocol.symptom_modifications.length}   checklists ${protocol.checklists.length}   refs ${refs.length}`);
console.log(`decorative-only muscle nodes (rendered, never highlighted): ${orphanMuscles.length}`);

if (faults.length) {
  console.error(`\n✗ PARITY BROKEN — ${faults.length} fault(s):\n`);
  for (const f of faults) console.error(`  · ${f}`);
  process.exit(1);
}

console.log('\n✓ parity holds — dataset matches the manual on every checked invariant');
