'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import type { ThreeEvent } from '@react-three/fiber';
import { RIG_GROUP_OFFSET, RIG_PARTS_EXPANDED, type RigPart } from '@/lib/proceduralRig';
import { activationOf, materialFor } from '@/lib/materials';
import type { MuscleId } from '@/lib/muscleRegistry';
import type { MuscleState } from '@/lib/protocol';
import MuscleTooltip from './MuscleTooltip';

/** Squared pixel distance below which a pointer down→up pair counts as a tap
 *  rather than an orbit drag. */
const TAP_SLOP_SQ = 12 * 12;

type TapStart = { x: number; y: number; id: string };

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

function RigMesh({
  part,
  muscleState,
  hoveredId,
  onHover,
  tapStart,
  onSelect,
}: {
  part: RigPart;
  muscleState: MuscleState;
  hoveredId: string | null;
  onHover: (id: string | null) => void;
  tapStart: React.MutableRefObject<TapStart | null>;
  onSelect?: (id: MuscleId) => void;
}) {
  const interactive = part.id !== null;
  const isHovered = interactive && hoveredId === part.id;
  const activation = activationOf(part.id, muscleState, isHovered);
  const mat = useMemo(() => materialFor(activation), [activation]);

  // Structural scaffolding stays quiet and never captures the pointer.
  if (!interactive) {
    return (
      <mesh position={part.pos} rotation={part.rot} raycast={() => null}>
        <Geometry geom={part.geom} args={part.args} />
        <meshStandardMaterial color="#0a1826" roughness={0.95} metalness={0.05} transparent opacity={0.5} />
      </mesh>
    );
  }

  return (
    <mesh
      name={part.id!}
      position={part.pos}
      rotation={part.rot}
      onPointerOver={(e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation();
        onHover(part.id);
      }}
      onPointerOut={(e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation();
        onHover(null);
      }}
      onPointerDown={
        onSelect
          ? (e: ThreeEvent<PointerEvent>) => {
              // Do not stopPropagation: OrbitControls must still receive the
              // event so a drag that starts on a muscle can orbit the camera.
              tapStart.current = { x: e.nativeEvent.clientX, y: e.nativeEvent.clientY, id: part.id! };
            }
          : undefined
      }
      onPointerUp={
        onSelect
          ? (e: ThreeEvent<PointerEvent>) => {
              const start = tapStart.current;
              tapStart.current = null;
              if (!start || start.id !== part.id) return;
              const dx = e.nativeEvent.clientX - start.x;
              const dy = e.nativeEvent.clientY - start.y;
              if (dx * dx + dy * dy > TAP_SLOP_SQ) return; // it was an orbit drag
              e.stopPropagation();
              onSelect(part.id as MuscleId);
            }
          : undefined
      }
    >
      <Geometry geom={part.geom} args={part.args} />
      <meshStandardMaterial
        color={mat.color}
        emissive={new THREE.Color(mat.emissive)}
        emissiveIntensity={mat.emissiveIntensity}
        transparent={mat.transparent}
        opacity={mat.opacity}
        roughness={mat.roughness}
        metalness={mat.metalness}
        depthWrite={!mat.transparent || mat.opacity > 0.5}
      />
      {isHovered && <MuscleTooltip muscleId={part.id!} activation={activation} />}
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
  const tapStart = useRef<TapStart | null>(null);

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
          tapStart={tapStart}
          onSelect={onSelectMuscle}
        />
      ))}
    </group>
  );
}
