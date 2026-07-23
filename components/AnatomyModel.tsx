'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useGLTF } from '@react-three/drei';
import type { ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { resolveMuscleId, type MuscleId } from '@/lib/muscleRegistry';
import { activationOf, applyMaterial } from '@/lib/materials';
import type { MuscleState } from '@/lib/protocol';
import MuscleTooltip from './MuscleTooltip';

export const ANATOMY_MODEL_PATH = '/models/anatomy.glb';

/** Squared pixel distance below which a pointer down→up pair counts as a tap. */
const TAP_SLOP_SQ = 12 * 12;

type Tagged = { mesh: THREE.Mesh; muscleId: string | null; center: THREE.Vector3 };

/**
 * Loads a standard human anatomy .glb and drives its materials from the active
 * exercise. Mesh node names are run through resolveMuscleId(), so exporter
 * naming ("Deltoid_Posterior_L", "m_infraspinatus.001") still maps onto the
 * canonical vocabulary used by tattooPrehabData.json. When `onSelectMuscle`
 * is provided, a tap (down→up within the slop, distinguishing from an orbit
 * drag) selects the muscle under the pointer.
 */
export default function AnatomyModel({
  muscleState,
  scale = 1.65,
  position = [0, -1.2, 0],
  onSelectMuscle,
}: {
  muscleState: MuscleState;
  scale?: number;
  position?: [number, number, number];
  onSelectMuscle?: (id: MuscleId) => void;
}) {
  const { scene } = useGLTF(ANATOMY_MODEL_PATH);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const tapStart = useRef<{ x: number; y: number; id: MuscleId } | null>(null);

  // Clone so multiple mounts (or HMR) never share mutated materials.
  const model = useMemo(() => scene.clone(true), [scene]);

  const tagged = useMemo<Tagged[]>(() => {
    const out: Tagged[] = [];
    model.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (!mesh.isMesh) return;

      // Give every mesh its own standard material we are free to mutate.
      mesh.material = new THREE.MeshStandardMaterial();
      mesh.castShadow = false;
      mesh.receiveShadow = false;

      mesh.geometry.computeBoundingSphere();
      const center = mesh.geometry.boundingSphere?.center.clone() ?? new THREE.Vector3();
      mesh.localToWorld(center);

      out.push({ mesh, muscleId: resolveMuscleId(mesh.name), center });
    });
    return out;
  }, [model]);

  useEffect(() => {
    for (const { mesh, muscleId } of tagged) {
      const activation = activationOf(muscleId, muscleState, hoveredId === muscleId && !!muscleId);
      applyMaterial(mesh.material as THREE.MeshStandardMaterial, activation);
    }
  }, [tagged, muscleState, hoveredId]);

  // Pointer feedback for mouse / trackpad / Pencil hover.
  useEffect(() => {
    if (!onSelectMuscle || typeof document === 'undefined') return;
    document.body.style.cursor = hoveredId ? 'pointer' : '';
    return () => {
      document.body.style.cursor = '';
    };
  }, [hoveredId, onSelectMuscle]);

  const hovered = useMemo(
    () => (hoveredId ? tagged.find((t) => t.muscleId === hoveredId) : undefined),
    [hoveredId, tagged]
  );

  const handleOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    const id = resolveMuscleId((e.object as THREE.Mesh).name);
    if (id) setHoveredId(id);
  };

  return (
    <group
      scale={scale}
      position={position}
      onPointerOver={handleOver}
      onPointerOut={(e) => {
        e.stopPropagation();
        setHoveredId(null);
      }}
      onPointerDown={
        onSelectMuscle
          ? (e: ThreeEvent<PointerEvent>) => {
              // No stopPropagation: OrbitControls must still see the event.
              const id = resolveMuscleId((e.object as THREE.Mesh).name);
              tapStart.current = id
                ? { x: e.nativeEvent.clientX, y: e.nativeEvent.clientY, id }
                : null;
            }
          : undefined
      }
      onPointerUp={
        onSelectMuscle
          ? (e: ThreeEvent<PointerEvent>) => {
              const start = tapStart.current;
              tapStart.current = null;
              if (!start) return;
              const id = resolveMuscleId((e.object as THREE.Mesh).name);
              if (id !== start.id) return;
              const dx = e.nativeEvent.clientX - start.x;
              const dy = e.nativeEvent.clientY - start.y;
              if (dx * dx + dy * dy > TAP_SLOP_SQ) return; // orbit drag
              e.stopPropagation();
              onSelectMuscle(start.id);
            }
          : undefined
      }
      onPointerMissed={() => setHoveredId(null)}
    >
      <primitive object={model} />
      {hovered?.muscleId && (
        <MuscleTooltip
          muscleId={hovered.muscleId}
          activation={activationOf(hovered.muscleId, muscleState, true)}
          position={[hovered.center.x, hovered.center.y + 0.18, hovered.center.z]}
        />
      )}
    </group>
  );
}
