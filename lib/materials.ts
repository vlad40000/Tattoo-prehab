import * as THREE from 'three';
import type { MuscleState } from './protocol';

export const ACTIVATION_COLORS = {
  primary: '#00e5ff',
  secondary: '#b347ff',
  hover: '#7fd4ff',
  base: '#1a3a5c',
  ghost: '#0d1f33',
} as const;

export type Activation = 'primary' | 'secondary' | 'hover' | 'candidate' | 'idle' | 'ghost';

export function activationOf(
  muscleId: string | null,
  state: MuscleState,
  hovered: boolean
): Activation {
  if (muscleId && state.primary.includes(muscleId)) return 'primary';
  if (muscleId && state.secondary.includes(muscleId)) return 'secondary';
  if (hovered && muscleId) return 'hover';
  const hasSelection = state.primary.length > 0 || state.secondary.length > 0;
  if (hasSelection) return 'ghost';
  if (muscleId && state.candidate?.includes(muscleId)) return 'candidate';
  return 'idle';
}

export type MatProps = {
  color: string;
  emissive: string;
  emissiveIntensity: number;
  transparent: boolean;
  opacity: number;
  roughness: number;
  metalness: number;
};

const TABLE: Record<Activation, MatProps> = {
  primary: {
    color: '#062f3d',
    emissive: ACTIVATION_COLORS.primary,
    emissiveIntensity: 2.2,
    transparent: false,
    opacity: 1,
    roughness: 0.2,
    metalness: 0.1,
  },
  secondary: {
    color: '#240a44',
    emissive: ACTIVATION_COLORS.secondary,
    emissiveIntensity: 0.95,
    transparent: false,
    opacity: 1,
    roughness: 0.3,
    metalness: 0.1,
  },
  hover: {
    color: '#22506f',
    emissive: ACTIVATION_COLORS.hover,
    emissiveIntensity: 0.7,
    transparent: true,
    opacity: 0.95,
    roughness: 0.3,
    metalness: 0.15,
  },
  // Available to tap in the current region: lifted and warm-lit so the
  // tappable set is visible at rest, which matters most on touch where
  // there is no hover to discover it.
  candidate: {
    color: '#2f6f94',
    emissive: '#1d9fc4',
    emissiveIntensity: 0.62,
    transparent: false,
    opacity: 1,
    roughness: 0.34,
    metalness: 0.22,
  },
  idle: {
    color: '#1e3f60',
    emissive: '#0d2842',
    emissiveIntensity: 0.4,
    transparent: false,
    opacity: 1,
    roughness: 0.42,
    metalness: 0.2,
  },
  // A selection exists elsewhere: recede but stay readable. Losing the
  // silhouette (the old 0.16 opacity) destroyed all spatial context.
  ghost: {
    color: '#16324a',
    emissive: '#08192b',
    emissiveIntensity: 0.22,
    transparent: true,
    opacity: 0.55,
    roughness: 0.6,
    metalness: 0.12,
  },
};

export function materialFor(activation: Activation): MatProps {
  return TABLE[activation];
}

/** Mutates an existing material in place — used for .glb meshes we do not clone per frame. */
export function applyMaterial(material: THREE.MeshStandardMaterial, activation: Activation) {
  const m = TABLE[activation];
  material.color.set(m.color);
  material.emissive.set(m.emissive);
  material.emissiveIntensity = m.emissiveIntensity;
  material.transparent = m.transparent;
  material.opacity = m.opacity;
  material.roughness = m.roughness;
  material.metalness = m.metalness;
  material.depthWrite = !m.transparent || m.opacity > 0.5;
  material.needsUpdate = true;
}
