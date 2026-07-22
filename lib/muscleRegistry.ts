/**
 * Canonical muscle-node vocabulary.
 *
 * Every `primary_muscles` / `secondary_muscles` string in tattooPrehabData.json
 * MUST resolve to a key in MUSCLE_LABELS. `verifyDataIntegrity()` enforces that
 * at build/dev time so a typo in the data file fails loudly instead of silently
 * lighting up nothing on the model.
 *
 * ALIASES maps loose mesh names found in third-party anatomy .glb exports onto
 * the canonical key, so the same data drives both the procedural rig and a real
 * scanned model without editing the JSON.
 */

export type MuscleId = keyof typeof MUSCLE_LABELS;

export const MUSCLE_LABELS = {
  // --- Head & cervical ---
  Head: 'Head',
  Sternocleidomastoid: 'Sternocleidomastoid',
  Longus_Colli: 'Longus Colli',
  Longus_Capitis: 'Longus Capitis',
  Deep_Cervical_Stabilizers: 'Deep Cervical Stabilizers',
  Levator_Scapulae: 'Levator Scapulae',
  Intercostals: 'Intercostals',

  // --- Scapula & shoulder girdle ---
  Upper_Trapezius: 'Upper Trapezius',
  Middle_Trapezius: 'Middle Trapezius',
  Lower_Trapezius: 'Lower Trapezius',
  Rhomboids: 'Rhomboids',
  Serratus_Anterior: 'Serratus Anterior',
  Supraspinatus: 'Supraspinatus',
  Infraspinatus: 'Infraspinatus',
  Teres_Minor: 'Teres Minor',
  Subscapularis: 'Subscapularis',
  Anterior_Deltoid: 'Anterior Deltoid',
  Lateral_Deltoid: 'Lateral Deltoid',
  Posterior_Deltoid: 'Posterior Deltoid',
  Pectoralis_Major: 'Pectoralis Major',
  Latissimus_Dorsi: 'Latissimus Dorsi',

  // --- Arm ---
  Biceps_Brachii: 'Biceps Brachii',
  Triceps_Brachii: 'Triceps Brachii',
  Brachioradialis: 'Brachioradialis',

  // --- Forearm & hand ---
  Wrist_Extensors: 'Wrist Extensors',
  Wrist_Flexors: 'Wrist Flexors',
  Finger_Extensors: 'Finger Extensors',
  Finger_Flexors: 'Finger Flexors',
  Pronator_Teres: 'Pronator Teres',
  Pronator_Quadratus: 'Pronator Quadratus',
  Supinator: 'Supinator',
  Radial_Deviators: 'Radial Wrist Deviators',
  Ulnar_Deviators: 'Ulnar Wrist Deviators',
  Intrinsic_Hand: 'Intrinsic Hand Muscles',

  // --- Trunk ---
  Rectus_Abdominis: 'Rectus Abdominis',
  External_Oblique: 'External Oblique',
  Internal_Oblique: 'Internal Oblique',
  Transverse_Abdominis: 'Transverse Abdominis',
  Diaphragm: 'Diaphragm',
  Erector_Spinae: 'Erector Spinae',
  Thoracic_Erector_Spinae: 'Thoracic Erector Spinae',
  Multifidus: 'Multifidus',
  Quadratus_Lumborum: 'Quadratus Lumborum',

  // --- Hip & pelvis ---
  Iliopsoas: 'Iliopsoas',
  Gluteus_Maximus: 'Gluteus Maximus',
  Gluteus_Medius: 'Gluteus Medius',
  Gluteus_Minimus: 'Gluteus Minimus',
  Deep_Hip_Rotators: 'Deep Hip Rotators',
  Pelvic_Floor: 'Pelvic Floor',
  Adductors: 'Adductor Group',

  // --- Thigh ---
  Rectus_Femoris: 'Rectus Femoris',
  Vastus_Group: 'Vastus Group',
  Hamstrings: 'Hamstrings',

  // --- Lower leg & foot ---
  Gastrocnemius: 'Gastrocnemius',
  Soleus: 'Soleus',
  Tibialis_Anterior: 'Tibialis Anterior',
  Toe_Extensors: 'Toe Extensors',
  Peroneals: 'Peroneals',
  Intrinsic_Foot: 'Intrinsic Foot Muscles',
} as const;

export const ALL_MUSCLES = Object.keys(MUSCLE_LABELS) as MuscleId[];

/**
 * Loose mesh names commonly emitted by anatomy .glb exporters.
 * Keys are lowercased, punctuation-stripped fragments; matching is substring-based.
 */
const ALIASES: Record<string, MuscleId> = {
  infraspinatus: 'Infraspinatus',
  teresminor: 'Teres_Minor',
  teresmajor: 'Latissimus_Dorsi',
  supraspinatus: 'Supraspinatus',
  subscapularis: 'Subscapularis',
  serratusanterior: 'Serratus_Anterior',
  serratus: 'Serratus_Anterior',
  rhomboidmajor: 'Rhomboids',
  rhomboidminor: 'Rhomboids',
  rhomboid: 'Rhomboids',
  trapeziusupper: 'Upper_Trapezius',
  trapeziusmiddle: 'Middle_Trapezius',
  trapeziuslower: 'Lower_Trapezius',
  uppertrap: 'Upper_Trapezius',
  midtrap: 'Middle_Trapezius',
  lowertrap: 'Lower_Trapezius',
  levatorscapulae: 'Levator_Scapulae',
  deltoidanterior: 'Anterior_Deltoid',
  deltoidlateral: 'Lateral_Deltoid',
  deltoidmiddle: 'Lateral_Deltoid',
  deltoidposterior: 'Posterior_Deltoid',
  pectoralismajor: 'Pectoralis_Major',
  pectoralisminor: 'Pectoralis_Major',
  latissimusdorsi: 'Latissimus_Dorsi',
  bicepsbrachii: 'Biceps_Brachii',
  brachialis: 'Biceps_Brachii',
  tricepsbrachii: 'Triceps_Brachii',
  brachioradialis: 'Brachioradialis',
  extensorcarpiradialis: 'Wrist_Extensors',
  extensorcarpiulnaris: 'Wrist_Extensors',
  flexorcarpiradialis: 'Wrist_Flexors',
  flexorcarpiulnaris: 'Wrist_Flexors',
  extensordigitorum: 'Finger_Extensors',
  flexordigitorum: 'Finger_Flexors',
  pronatorteres: 'Pronator_Teres',
  pronatorquadratus: 'Pronator_Quadratus',
  supinator: 'Supinator',
  lumbrical: 'Intrinsic_Hand',
  interossei: 'Intrinsic_Hand',
  rectusabdominis: 'Rectus_Abdominis',
  obliqueexternal: 'External_Oblique',
  obliqueinternal: 'Internal_Oblique',
  externaloblique: 'External_Oblique',
  internaloblique: 'Internal_Oblique',
  transversusabdominis: 'Transverse_Abdominis',
  transverseabdominis: 'Transverse_Abdominis',
  diaphragm: 'Diaphragm',
  erectorspinae: 'Erector_Spinae',
  spinalis: 'Thoracic_Erector_Spinae',
  thoracicextensors: 'Thoracic_Erector_Spinae',
  intercostal: 'Intercostals',
  levatorani: 'Pelvic_Floor',
  pelvicfloor: 'Pelvic_Floor',
  coccygeus: 'Pelvic_Floor',
  abductorpollicislongus: 'Radial_Deviators',
  extensorcarpiradialislongus: 'Radial_Deviators',
  longissimus: 'Erector_Spinae',
  iliocostalis: 'Erector_Spinae',
  multifidus: 'Multifidus',
  quadratuslumborum: 'Quadratus_Lumborum',
  psoasmajor: 'Iliopsoas',
  iliacus: 'Iliopsoas',
  iliopsoas: 'Iliopsoas',
  gluteusmaximus: 'Gluteus_Maximus',
  gluteusmedius: 'Gluteus_Medius',
  gluteusminimus: 'Gluteus_Minimus',
  piriformis: 'Deep_Hip_Rotators',
  obturator: 'Deep_Hip_Rotators',
  adductormagnus: 'Adductors',
  adductorlongus: 'Adductors',
  rectusfemoris: 'Rectus_Femoris',
  vastuslateralis: 'Vastus_Group',
  vastusmedialis: 'Vastus_Group',
  vastusintermedius: 'Vastus_Group',
  bicepsfemoris: 'Hamstrings',
  semitendinosus: 'Hamstrings',
  semimembranosus: 'Hamstrings',
  gastrocnemius: 'Gastrocnemius',
  soleus: 'Soleus',
  tibialisanterior: 'Tibialis_Anterior',
  extensorhallucis: 'Toe_Extensors',
  peroneus: 'Peroneals',
  fibularis: 'Peroneals',
  sternocleidomastoid: 'Sternocleidomastoid',
  longuscolli: 'Longus_Colli',
  longuscapitis: 'Longus_Capitis',
};

const normalize = (s: string) => s.toLowerCase().replace(/[^a-z]/g, '');

/**
 * Resolve an arbitrary 3D mesh node name to a canonical muscle id.
 * Tries exact canonical match first, then alias substring match.
 */
export function resolveMuscleId(nodeName: string): MuscleId | null {
  if (nodeName in MUSCLE_LABELS) return nodeName as MuscleId;

  const n = normalize(nodeName);
  if (!n) return null;

  for (const id of ALL_MUSCLES) {
    if (n === normalize(id)) return id;
  }
  // Longest alias wins so "extensorcarpiradialis" beats a shorter partial.
  let best: MuscleId | null = null;
  let bestLen = 0;
  for (const [alias, id] of Object.entries(ALIASES)) {
    if (n.includes(alias) && alias.length > bestLen) {
      best = id;
      bestLen = alias.length;
    }
  }
  return best;
}

export function labelFor(id: string): string {
  return (MUSCLE_LABELS as Record<string, string>)[id] ?? id.replace(/_/g, ' ');
}

/* ------------------------------------------------------------------ */
/* Camera focus presets                                                */
/* ------------------------------------------------------------------ */

export type FocusKey =
  | 'full'
  | 'neck'
  | 'shoulder'
  | 'upper'
  | 'torso'
  | 'hips'
  | 'lower'
  | 'ankle'
  | 'forearm'
  | 'hand';

export type FocusPreset = {
  /** OrbitControls target, world space */
  target: [number, number, number];
  /** Desired camera position, world space */
  position: [number, number, number];
};

export const FOCUS_PRESETS: Record<FocusKey, FocusPreset> = {
  full: { target: [0, 1.0, 0], position: [0, 1.6, 6.4] },
  neck: { target: [0, 2.05, 0], position: [0.5, 2.35, 2.6] },
  shoulder: { target: [0.2, 1.55, 0], position: [1.9, 1.95, 2.7] },
  upper: { target: [0, 1.42, 0], position: [0.6, 1.9, 3.9] },
  torso: { target: [0, 0.92, 0], position: [0.4, 1.35, 3.7] },
  hips: { target: [0, 0.3, 0], position: [0.6, 0.85, 3.5] },
  lower: { target: [0, -0.25, 0], position: [0.5, 0.35, 3.4] },
  ankle: { target: [0, -0.85, 0], position: [0.4, -0.45, 2.4] },
  forearm: { target: [0.7, 0.62, 0], position: [2.3, 1.0, 2.0] },
  hand: { target: [0.72, 0.34, 0], position: [2.0, 0.75, 1.5] },
};
