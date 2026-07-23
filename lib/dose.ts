/**
 * Turns the manual's dose and tempo prose into tickable set rows for the
 * runner.
 *
 * Two rules make this safe to do at all:
 *
 * 1. Every range resolves to its LOWER bound. "2-3 sets of 8-12" plans two
 *    sets, not three. The manual is explicit about this direction — lowest
 *    effective resistance, four reps in reserve, two sets for most exercises
 *    in Phase 1 — so rounding down is the conservative reading, never the
 *    aggressive one.
 * 2. The verbatim source string is carried through and displayed. The plan is
 *    a convenience for checking off work; the manual's words remain the
 *    prescription. When parsing fails we say so by falling back to a single
 *    untargeted row rather than guessing.
 */

export type SetPlan = {
  /** How many rows the runner shows. */
  sets: number;
  /** What one row asks for, e.g. "8–12 reps" or "5s hold". */
  targetLabel: string;
  /** Seconds for the hold timer; null for repetition work. */
  holdSeconds: number | null;
  /** Work is performed on both sides / directions. */
  perSide: boolean;
  /** The manual's own wording, always shown. */
  source: string;
  /** False when no pattern matched and we fell back to one generic row. */
  parsed: boolean;
};

const EN_DASH = '\u2013';

/** Lower bound of "8" or "8-12". */
function low(value: string): number {
  const first = value.match(/\d+/);
  return first ? Number(first[0]) : 1;
}

/** "8-12" -> "8–12" for display. */
function pretty(range: string): string {
  return range.replace(/\s*-\s*/, EN_DASH);
}

const PER_SIDE = /per side|each direction|each side|per leg|per arm/i;

/**
 * Isometric hold length from a tempo string. Only consulted when the dose
 * itself is measured in holds — otherwise "2-second hold" inside a rep tempo
 * ("3 seconds up; 2-second hold; 3 seconds down") would be mistaken for the
 * whole set.
 */
export function holdSecondsFromTempo(tempo: string): number | null {
  const match = tempo.match(/(\d+)(?:\s*-\s*(\d+))?\s*[-\s]?second[s]?\s+(?:isometric\s+)?hold/i);
  return match ? Number(match[1]) : null;
}

export function planFor(dose: string, tempo: string): SetPlan {
  const perSide = PER_SIDE.test(dose);
  const base = { perSide, source: dose, parsed: true };

  // "5 holds of 5 seconds" — sets and hold both stated.
  const holdsOf = dose.match(/(\d+(?:\s*-\s*\d+)?)\s+holds?\s+of\s+(\d+)\s*second/i);
  if (holdsOf) {
    const seconds = Number(holdsOf[2]);
    return { ...base, sets: low(holdsOf[1]), targetLabel: `${seconds}s hold`, holdSeconds: seconds };
  }

  // "2-3 sets of 8-12 per side"
  const setsOf = dose.match(/(\d+(?:\s*-\s*\d+)?)\s+sets?\s+of\s+(\d+(?:\s*-\s*\d+)?)/i);
  if (setsOf) {
    const unit = /step/i.test(dose) ? 'steps' : 'reps';
    return {
      ...base,
      sets: low(setsOf[1]),
      targetLabel: `${pretty(setsOf[2])} ${unit}`,
      holdSeconds: null,
    };
  }

  // "3-5 holds", "2-3 holds per side" — hold length lives in the tempo.
  const holds = dose.match(/(\d+(?:\s*-\s*\d+)?)\s+holds?/i);
  if (holds) {
    const seconds = holdSecondsFromTempo(tempo);
    return {
      ...base,
      sets: low(holds[1]),
      targetLabel: seconds ? `${seconds}s hold` : 'hold',
      holdSeconds: seconds,
    };
  }

  // "4-6 breaths", "3-5 controlled cycles" — one continuous block.
  const block = dose.match(/(\d+(?:\s*-\s*\d+)?)\s+(?:slow\s+|controlled\s+)?(breaths?|cycles?)/i);
  if (block) {
    return {
      ...base,
      sets: 1,
      targetLabel: `${pretty(block[1])} ${block[2].toLowerCase()}`,
      holdSeconds: null,
    };
  }

  // "8 repetitions", "15 gentle repetitions", "8 steps each direction", "5 nods"
  const reps = dose.match(/(\d+(?:\s*-\s*\d+)?)\s+(?:gentle\s+|controlled\s+|slow\s+)?(repetitions?|reps?|steps?|nods?|times)/i);
  if (reps) {
    const noun = reps[2].toLowerCase().replace(/^rep(etition)?s?$/, 'reps');
    return { ...base, sets: 1, targetLabel: `${pretty(reps[1])} ${noun}`, holdSeconds: null };
  }

  // Unrecognised wording: one row, the manual's text, no invented target.
  return { sets: 1, targetLabel: dose, holdSeconds: null, perSide, source: dose, parsed: false };
}
