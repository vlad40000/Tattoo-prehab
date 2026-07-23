'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { RIG_GROUP_OFFSET, RIG_PARTS, RIG_PARTS_EXPANDED, type RigPart } from '@/lib/proceduralRig';
import { activationOf, materialFor, type Activation } from '@/lib/materials';
import { EXERCISES_BY_MUSCLE } from '@/lib/muscleIndex';
import type { MuscleId } from '@/lib/muscleRegistry';
import type { MuscleState } from '@/lib/protocol';
import MuscleTooltip from './MuscleTooltip';

/** Pixel distance (r3f event.delta) below which a pointer down→up pair counts
 *  as a tap rather than an orbit drag. */
const TAP_SLOP = 12;

const reducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

function Geometry({ geom, args }: { geom: RigPart['geom']; args: number[] }) {
  switch (geom) {
    case 'sphere':
      return <sphereGeometry args={args as [number, number, number]} />;
    case 'cylinder':
      return <cylinderGeometry args={args as [number, number, number, number]} />;
    case 'capsule':
      return <capsuleGeometry args={args as [number, number, number, number]} />;
    default:
      return <boxGeometry args={args as [number, number, number]} />;
  }
}

/** Breathing glow on the actively selected muscle. */
function useEmissivePulse(ref: React.MutableRefObject<THREE.MeshStandardMaterial | null>, activation: Activation, base: number) {
  useFrame(({ clock }) => {
    if (!ref.current) return;
    if (activation !== 'primary' || reducedMotion()) {
      ref.current.emissiveIntensity = base;
      return;
    }
    ref.current.emissiveIntensity = base + Math.sin(clock.elapsedTime * 2.4) * 0.45;
  });
}

function RigMesh({
  part,
  muscleState,
  hoveredId,
  onHover,
  onSelect,
}: {
  part: RigPart;
  muscleState: MuscleState;
  hoveredId: string | null;
  onHover: (id: string | null) => void;
  onSelect?: (id: MuscleId) => void;
}) {
  // A node is interactive only if tapping it can lead somewhere. The five
  // decorative-only muscles (Head, SCM, …) render as anatomy but never
  // capture the pointer, so a tap can't dead-end on "no exercises".
  const interactive = part.id !== null && EXERCISES_BY_MUSCLE.has(part.id);
  const isHovered = interactive && hoveredId === part.id;
  const activation = activationOf(part.id, muscleState, isHovered);
  const mat = useMemo(() => materialFor(activation), [activation]);
  const matRef = useRef<THREE.MeshStandardMaterial | null>(null);
  useEmissivePulse(matRef, activation, mat.emissiveIntensity);

  // Structural silhouette: quiet carbon shell, never captures the pointer.
  if (part.id === null) {
    return (
      <mesh position={part.pos} rotation={part.rot} scale={part.scale} raycast={() => null}>
        <Geometry geom={part.geom} args={part.args} />
        <meshStandardMaterial color="#0c151f" roughness={0.5} metalness={0.35} transparent opacity={0.92} />
      </mesh>
    );
  }

  return (
    <mesh
      name={part.id}
      position={part.pos}
      rotation={part.rot}
      scale={part.scale}
      raycast={interactive ? undefined : () => null}
      onPointerOver={
        interactive
          ? (e: ThreeEvent<PointerEvent>) => {
              e.stopPropagation();
              onHover(part.id);
            }
          : undefined
      }
      onPointerOut={
        interactive
          ? (e: ThreeEvent<PointerEvent>) => {
              e.stopPropagation();
              onHover(null);
            }
          : undefined
      }
      onClick={
        interactive && onSelect
          ? (e: ThreeEvent<MouseEvent>) => {
              if (e.delta > TAP_SLOP) return; // it was an orbit drag
              e.stopPropagation();
              onSelect(part.id as MuscleId);
            }
          : undefined
      }
    >
      <Geometry geom={part.geom} args={part.args} />
      <meshStandardMaterial
        ref={matRef}
        color={mat.color}
        emissive={new THREE.Color(mat.emissive)}
        emissiveIntensity={mat.emissiveIntensity}
        transparent={mat.transparent}
        opacity={mat.opacity}
        roughness={mat.roughness}
        metalness={mat.metalness}
        depthWrite={!mat.transparent || mat.opacity > 0.5}
      />
    </mesh>
  );
}

/**
 * Zero-asset anatomy rig. Node names match the canonical muscle vocabulary, so
 * every exercise in the data file highlights identically here and on a real
 * .glb model. When `onSelectMuscle` is provided the rig is tappable: a
 * down→up pair within the tap slop selects the muscle; anything longer is
 * treated as an orbit gesture and ignored.
 */
export default function ProceduralAnatomy({
  muscleState,
  onSelectMuscle,
}: {
  muscleState: MuscleState;
  onSelectMuscle?: (id: MuscleId) => void;
}) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // Mirrored L/R parts share one muscle id, so anchor the single label to
  // the unmirrored source part. Two overlapping tooltips is a defect.
  const labelAnchor = useMemo(() => {
    if (!hoveredId) return null;
    const part = RIG_PARTS.find((p) => p.id === hoveredId);
    if (!part) return null;
    return [part.pos[0], part.pos[1] + 0.3, part.pos[2]] as [number, number, number];
  }, [hoveredId]);

  // Pointer feedback for mouse / trackpad / Pencil hover.
  useEffect(() => {
    if (!onSelectMuscle || typeof document === 'undefined') return;
    document.body.style.cursor = hoveredId ? 'pointer' : '';
    return () => {
      document.body.style.cursor = '';
    };
  }, [hoveredId, onSelectMuscle]);

  return (
    <group position={RIG_GROUP_OFFSET} onPointerMissed={() => setHoveredId(null)}>
      {RIG_PARTS_EXPANDED.map((part, i) => (
        <RigMesh
          key={`${part.id ?? 'struct'}-${i}`}
          part={part}
          muscleState={muscleState}
          hoveredId={hoveredId}
          onHover={setHoveredId}
          onSelect={onSelectMuscle}
        />
      ))}
      {hoveredId && labelAnchor && (
        <MuscleTooltip
          muscleId={hoveredId}
          activation={activationOf(hoveredId, muscleState, true)}
          position={labelAnchor}
        />
      )}
    </group>
  );
}
