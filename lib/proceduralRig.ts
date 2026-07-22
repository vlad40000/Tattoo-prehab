import type { MuscleId } from './muscleRegistry';

/**
 * Fallback anatomy rig.
 *
 * Drop a real anatomy model at /public/models/anatomy.glb and AnatomyCanvas
 * switches to it automatically (see components/AnatomyCanvas.tsx). Until then
 * this primitive rig renders the same named muscle nodes so every exercise in
 * tattooPrehabData.json highlights correctly with zero binary assets — which is
 * what makes the app deployable to Vercel on first push.
 *
 * Local coordinate space: feet at y≈0.1, crown at y≈3.98. The rendering group
 * applies position [0, -1.2, 0] so the model sits around the world origin.
 */

export type Geom = 'box' | 'sphere' | 'cylinder' | 'capsule';

export type RigPart = {
  /** Canonical muscle id, or null for inert structural scaffolding. */
  id: MuscleId | null;
  geom: Geom;
  args: number[];
  pos: [number, number, number];
  rot?: [number, number, number];
  /** Duplicate the part with x negated. */
  mirror?: boolean;
};

const P = (
  id: MuscleId | null,
  geom: Geom,
  args: number[],
  pos: [number, number, number],
  opts: { rot?: [number, number, number]; mirror?: boolean } = {}
): RigPart => ({ id, geom, args, pos, ...opts });

export const RIG_PARTS: RigPart[] = [
  /* ---------------- Structural scaffolding (never highlights) ------------- */
  P(null, 'cylinder', [0.05, 0.05, 1.0, 8], [0, 2.4, -0.06]), // spine column
  P(null, 'box', [0.42, 0.22, 0.26], [0, 1.62, 0]), // pelvis
  P(null, 'capsule', [0.06, 0.42, 6, 10], [0.17, 0.86, 0], { mirror: true }), // knee/shank core
  P(null, 'box', [0.13, 0.08, 0.3], [0.17, 0.12, 0.06], { mirror: true }), // foot plate

  /* ---------------- Head & cervical --------------------------------------- */
  P('Head', 'sphere', [0.28, 20, 20], [0, 3.7, 0]),
  P('Sternocleidomastoid', 'capsule', [0.035, 0.2, 6, 10], [0.08, 3.3, 0.07], {
    rot: [0.25, 0, 0.18],
    mirror: true,
  }),
  P('Longus_Capitis', 'capsule', [0.03, 0.14, 6, 8], [0, 3.44, 0.0]),
  P('Longus_Colli', 'capsule', [0.035, 0.24, 6, 8], [0, 3.24, -0.01]),
  P('Deep_Cervical_Stabilizers', 'capsule', [0.045, 0.24, 6, 8], [0, 3.26, -0.08]),
  P('Levator_Scapulae', 'capsule', [0.035, 0.2, 6, 8], [0.14, 3.06, -0.12], {
    rot: [0, 0, 0.2],
    mirror: true,
  }),
  P('Intercostals', 'box', [0.06, 0.3, 0.2], [0.23, 2.52, 0.08], {
    rot: [0, 0, 0.12],
    mirror: true,
  }),

  /* ---------------- Scapular & shoulder girdle ---------------------------- */
  P('Upper_Trapezius', 'box', [0.66, 0.16, 0.24], [0, 2.95, -0.06]),
  P('Middle_Trapezius', 'box', [0.6, 0.24, 0.13], [0, 2.72, -0.15]),
  P('Lower_Trapezius', 'box', [0.34, 0.36, 0.11], [0, 2.42, -0.16]),
  P('Rhomboids', 'box', [0.18, 0.26, 0.08], [0.16, 2.66, -0.12], { mirror: true }),
  P('Serratus_Anterior', 'box', [0.1, 0.34, 0.26], [0.29, 2.42, 0.02], { mirror: true }),
  P('Supraspinatus', 'capsule', [0.04, 0.14, 6, 8], [0.28, 2.87, -0.09], {
    rot: [0, 0, 1.5708],
    mirror: true,
  }),
  P('Infraspinatus', 'box', [0.22, 0.2, 0.07], [0.28, 2.68, -0.17], { mirror: true }),
  P('Teres_Minor', 'capsule', [0.042, 0.14, 6, 8], [0.33, 2.55, -0.15], {
    rot: [0, 0, 1.1],
    mirror: true,
  }),
  P('Subscapularis', 'box', [0.18, 0.18, 0.06], [0.26, 2.66, -0.03], { mirror: true }),
  P('Anterior_Deltoid', 'sphere', [0.125, 14, 14], [0.5, 2.74, 0.11], { mirror: true }),
  P('Lateral_Deltoid', 'sphere', [0.14, 14, 14], [0.57, 2.74, 0], { mirror: true }),
  P('Posterior_Deltoid', 'sphere', [0.125, 14, 14], [0.5, 2.74, -0.11], { mirror: true }),
  P('Pectoralis_Major', 'box', [0.36, 0.32, 0.16], [0.2, 2.56, 0.17], { mirror: true }),
  P('Latissimus_Dorsi', 'box', [0.24, 0.52, 0.2], [0.3, 2.3, -0.09], { mirror: true }),

  /* ---------------- Arm ---------------------------------------------------- */
  P('Biceps_Brachii', 'capsule', [0.1, 0.3, 6, 12], [0.66, 2.3, 0.06], { mirror: true }),
  P('Triceps_Brachii', 'capsule', [0.095, 0.32, 6, 12], [0.68, 2.3, -0.1], { mirror: true }),

  /* ---------------- Forearm & hand ---------------------------------------- */
  P('Brachioradialis', 'capsule', [0.055, 0.24, 6, 10], [0.67, 1.96, 0.07], { mirror: true }),
  P('Pronator_Teres', 'capsule', [0.045, 0.12, 6, 8], [0.65, 2.03, 0.02], {
    rot: [0, 0, 0.6],
    mirror: true,
  }),
  P('Supinator', 'capsule', [0.045, 0.1, 6, 8], [0.73, 2.0, -0.03], {
    rot: [0, 0, 0.4],
    mirror: true,
  }),
  P('Wrist_Extensors', 'capsule', [0.058, 0.26, 6, 10], [0.73, 1.84, -0.05], { mirror: true }),
  P('Wrist_Flexors', 'capsule', [0.058, 0.26, 6, 10], [0.65, 1.84, 0.06], { mirror: true }),
  P('Finger_Extensors', 'capsule', [0.038, 0.24, 6, 8], [0.75, 1.78, -0.01], { mirror: true }),
  P('Finger_Flexors', 'capsule', [0.038, 0.24, 6, 8], [0.63, 1.78, 0.03], { mirror: true }),
  P('Radial_Deviators', 'capsule', [0.032, 0.2, 6, 8], [0.78, 1.8, 0.02], { mirror: true }),
  P('Ulnar_Deviators', 'capsule', [0.032, 0.2, 6, 8], [0.6, 1.8, -0.02], { mirror: true }),
  P('Pronator_Quadratus', 'box', [0.09, 0.06, 0.09], [0.69, 1.62, 0], { mirror: true }),
  P('Intrinsic_Hand', 'box', [0.11, 0.16, 0.06], [0.69, 1.46, 0], { mirror: true }),

  /* ---------------- Trunk -------------------------------------------------- */
  P('Rectus_Abdominis', 'box', [0.3, 0.15, 0.12], [0, 2.26, 0.15]),
  P('Rectus_Abdominis', 'box', [0.3, 0.15, 0.12], [0, 2.08, 0.15]),
  P('Rectus_Abdominis', 'box', [0.3, 0.15, 0.12], [0, 1.9, 0.15]),
  P('External_Oblique', 'box', [0.12, 0.42, 0.15], [0.25, 2.08, 0.08], { mirror: true }),
  P('Internal_Oblique', 'box', [0.09, 0.34, 0.11], [0.22, 2.02, 0.05], { mirror: true }),
  P('Transverse_Abdominis', 'box', [0.44, 0.42, 0.24], [0, 2.05, 0.02]),
  P('Diaphragm', 'cylinder', [0.22, 0.2, 0.06, 16], [0, 2.4, 0.02]),
  P('Thoracic_Erector_Spinae', 'capsule', [0.055, 0.34, 6, 10], [0.09, 2.62, -0.15], { mirror: true }),
  P('Erector_Spinae', 'capsule', [0.065, 0.44, 6, 10], [0.09, 2.14, -0.14], { mirror: true }),
  P('Multifidus', 'capsule', [0.038, 0.56, 6, 8], [0.05, 2.18, -0.11], { mirror: true }),
  P('Quadratus_Lumborum', 'box', [0.1, 0.24, 0.1], [0.16, 1.9, -0.09], { mirror: true }),

  /* ---------------- Hip & pelvis ------------------------------------------ */
  P('Iliopsoas', 'capsule', [0.065, 0.32, 6, 10], [0.13, 1.82, 0.06], { mirror: true }),
  P('Gluteus_Maximus', 'sphere', [0.19, 14, 14], [0.18, 1.5, -0.15], { mirror: true }),
  P('Gluteus_Medius', 'box', [0.13, 0.18, 0.16], [0.26, 1.68, -0.04], { mirror: true }),
  P('Gluteus_Minimus', 'box', [0.09, 0.12, 0.12], [0.24, 1.62, -0.01], { mirror: true }),
  P('Deep_Hip_Rotators', 'capsule', [0.045, 0.12, 6, 8], [0.19, 1.54, -0.11], {
    rot: [0, 0, 1.5708],
    mirror: true,
  }),
  P('Pelvic_Floor', 'box', [0.24, 0.05, 0.2], [0, 1.5, -0.02]),
  P('Adductors', 'capsule', [0.085, 0.34, 6, 10], [0.09, 1.2, 0.02], { mirror: true }),

  /* ---------------- Thigh -------------------------------------------------- */
  P('Rectus_Femoris', 'capsule', [0.075, 0.42, 6, 10], [0.17, 1.18, 0.15], { mirror: true }),
  P('Vastus_Group', 'capsule', [0.135, 0.44, 6, 12], [0.17, 1.16, 0.05], { mirror: true }),
  P('Hamstrings', 'capsule', [0.12, 0.44, 6, 12], [0.17, 1.16, -0.13], { mirror: true }),

  /* ---------------- Lower leg & foot -------------------------------------- */
  P('Gastrocnemius', 'capsule', [0.105, 0.28, 6, 12], [0.17, 0.6, -0.1], { mirror: true }),
  P('Soleus', 'capsule', [0.085, 0.3, 6, 12], [0.17, 0.42, -0.07], { mirror: true }),
  P('Tibialis_Anterior', 'capsule', [0.065, 0.34, 6, 10], [0.15, 0.52, 0.1], { mirror: true }),
  P('Toe_Extensors', 'capsule', [0.035, 0.2, 6, 8], [0.16, 0.32, 0.12], { mirror: true }),
  P('Peroneals', 'capsule', [0.045, 0.28, 6, 10], [0.25, 0.5, 0.0], { mirror: true }),
  P('Intrinsic_Foot', 'box', [0.13, 0.05, 0.28], [0.17, 0.17, 0.07], { mirror: true }),
];

/** Flattened parts with mirroring already applied. */
export const RIG_PARTS_EXPANDED: RigPart[] = RIG_PARTS.flatMap((p) =>
  p.mirror
    ? [
        p,
        {
          ...p,
          pos: [-p.pos[0], p.pos[1], p.pos[2]] as [number, number, number],
          rot: p.rot ? ([p.rot[0], -p.rot[1], -p.rot[2]] as [number, number, number]) : undefined,
        },
      ]
    : [p]
);

export const RIG_GROUP_OFFSET: [number, number, number] = [0, -1.2, 0];
