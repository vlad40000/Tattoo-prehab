'use client';

import { useMemo, useState } from 'react';
import * as THREE from 'three';
import type { ThreeEvent } from '@react-three/fiber';
import { RIG_GROUP_OFFSET, RIG_PARTS_EXPANDED, type RigPart } from '@/lib/proceduralRig';
import { activationOf, materialFor } from '@/lib/materials';
import type { MuscleState } from '@/lib/protocol';
import MuscleTooltip from './MuscleTooltip';

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
}: {
  part: RigPart;
  muscleState: MuscleState;
  hoveredId: string | null;
  onHover: (id: string | null) => void;
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
 * .glb model.
 */
export default function ProceduralAnatomy({ muscleState }: { muscleState: MuscleState }) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <group position={RIG_GROUP_OFFSET} onPointerMissed={() => setHoveredId(null)}>
      {RIG_PARTS_EXPANDED.map((part, i) => (
        <RigMesh
          key={`${part.id ?? 'struct'}-${i}`}
          part={part}
          muscleState={muscleState}
          hoveredId={hoveredId}
          onHover={setHoveredId}
        />
      ))}
    </group>
  );
}
