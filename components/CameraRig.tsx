'use client';

import { useEffect, useRef } from 'react';
import { OrbitControls } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { FOCUS_PRESETS, type FocusKey } from '@/lib/muscleRegistry';

type OrbitLike = { target: THREE.Vector3; update: () => void };

/**
 * OrbitControls plus a declarative focus system. Selecting a hand/wrist exercise
 * flies the camera to the forearm; selecting a spine exercise pulls back to the
 * torso. Any manual drag cancels the flight immediately so the user always wins.
 */
export default function CameraRig({ focus, idle = false }: { focus: FocusKey; idle?: boolean }) {
  const wantPos = useRef(new THREE.Vector3(...FOCUS_PRESETS.full.position));
  const wantTarget = useRef(new THREE.Vector3(...FOCUS_PRESETS.full.target));
  const flying = useRef(false);
  const controls = useThree((s) => s.controls) as unknown as OrbitLike | null;

  useEffect(() => {
    const preset = FOCUS_PRESETS[focus] ?? FOCUS_PRESETS.full;
    wantPos.current.set(...preset.position);
    wantTarget.current.set(...preset.target);
    flying.current = true;
  }, [focus]);

  useFrame((state, delta) => {
    if (!flying.current) return;

    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    // Frame-rate independent easing; 1.0 snaps for reduced-motion users.
    const k = reduce ? 1 : 1 - Math.pow(0.004, delta);

    state.camera.position.lerp(wantPos.current, k);
    if (controls?.target) {
      controls.target.lerp(wantTarget.current, k);
      controls.update();
    }

    if (state.camera.position.distanceTo(wantPos.current) < 0.015) {
      flying.current = false;
    }
  });

  const reduce =
    typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  return (
    <OrbitControls
      makeDefault
      autoRotate={idle && !reduce}
      autoRotateSpeed={0.55}
      enablePan
      enableDamping
      dampingFactor={0.08}
      minDistance={0.8}
      maxDistance={12}
      minPolarAngle={Math.PI * 0.06}
      maxPolarAngle={Math.PI * 0.92}
      onStart={() => {
        flying.current = false;
      }}
    />
  );
}
