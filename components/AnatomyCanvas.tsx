'use client';

import { Component, Suspense, useEffect, useState, type ReactNode } from 'react';
import { Canvas } from '@react-three/fiber';
import { Html, Stars } from '@react-three/drei';
import AnatomyModel, { ANATOMY_MODEL_PATH } from './AnatomyModel';
import ProceduralAnatomy from './ProceduralAnatomy';
import CameraRig from './CameraRig';
import { verifyDataIntegrity, type MuscleState } from '@/lib/protocol';
import type { FocusKey, MuscleId } from '@/lib/muscleRegistry';

/* ------------------------------------------------------------------ */
/* Model source resolution                                             */
/* ------------------------------------------------------------------ */

type ModelSource = 'checking' | 'glb' | 'procedural';

/**
 * Probes for /public/models/anatomy.glb. Present → the real model renders.
 * Absent → the procedural rig renders instead, so a fresh clone runs and
 * deploys with no binary assets committed.
 */
function useModelSource(): ModelSource {
  const [source, setSource] = useState<ModelSource>('checking');

  useEffect(() => {
    let alive = true;
    fetch(ANATOMY_MODEL_PATH, { method: 'HEAD' })
      .then((res) => {
        if (!alive) return;
        const type = res.headers.get('content-type') ?? '';
        // A Next.js 404 returns HTML, so check the type as well as res.ok.
        setSource(res.ok && !type.includes('text/html') ? 'glb' : 'procedural');
      })
      .catch(() => alive && setSource('procedural'));
    return () => {
      alive = false;
    };
  }, []);

  return source;
}

/** Falls back to the procedural rig if the .glb exists but fails to parse. */
class ModelBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: Error) {
    console.warn('[anatomy] falling back to procedural rig:', error.message);
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

/* ------------------------------------------------------------------ */
/* In-canvas loader                                                    */
/* ------------------------------------------------------------------ */

function CanvasLoader() {
  return (
    <Html center>
      <div className="canvas-loader">
        <span className="canvas-loader__ring" />
        <span className="canvas-loader__label">Loading anatomy</span>
      </div>
    </Html>
  );
}

/* ------------------------------------------------------------------ */
/* Scene                                                               */
/* ------------------------------------------------------------------ */

function Scene({
  muscleState,
  focus,
  source,
  onSelectMuscle,
}: {
  muscleState: MuscleState;
  focus: FocusKey;
  source: ModelSource;
  onSelectMuscle?: (id: MuscleId) => void;
}) {
  return (
    <>
      <color attach="background" args={['#02060f']} />
      <fog attach="fog" args={['#02060f', 9, 26]} />

      <ambientLight intensity={0.4} color="#16304f" />
      <directionalLight position={[4, 8, 5]} intensity={1.1} color="#dcecff" />
      <directionalLight position={[-4, 2, -5]} intensity={0.4} color="#3c5da0" />
      <pointLight position={[0, 3.2, 2.4]} intensity={0.9} color="#00c8ff" distance={14} decay={2} />
      <pointLight position={[0, -1.6, 2]} intensity={0.35} color="#7a34c0" distance={10} decay={2} />

      <Stars radius={70} depth={34} count={900} factor={2} saturation={0.25} fade speed={0.35} />

      <mesh position={[0, -1.06, 0]} rotation={[-Math.PI / 2, 0, 0]} raycast={() => null}>
        <circleGeometry args={[3.2, 48]} />
        <meshStandardMaterial color="#040d18" roughness={1} transparent opacity={0.9} />
      </mesh>
      <gridHelper args={[14, 28, '#0b2136', '#061020']} position={[0, -1.05, 0]} />

      <Suspense fallback={<CanvasLoader />}>
        {source === 'glb' ? (
          <ModelBoundary fallback={<ProceduralAnatomy muscleState={muscleState} onSelectMuscle={onSelectMuscle} />}>
            <AnatomyModel muscleState={muscleState} onSelectMuscle={onSelectMuscle} />
          </ModelBoundary>
        ) : (
          <ProceduralAnatomy muscleState={muscleState} onSelectMuscle={onSelectMuscle} />
        )}
      </Suspense>

      <CameraRig focus={focus} />
    </>
  );
}

/* ------------------------------------------------------------------ */

export default function AnatomyCanvas({
  muscleState,
  focus,
  contained = false,
  onSelectMuscle,
}: {
  muscleState: MuscleState;
  focus: FocusKey;
  contained?: boolean;
  /** Enables tap-to-explore. Selection stays a visual shortcut: every muscle
   *  and exercise remains reachable through the text browser, which is why
   *  the canvas keeps aria-hidden. */
  onSelectMuscle?: (id: MuscleId) => void;
}) {
  const source = useModelSource();

  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      const problems = verifyDataIntegrity();
      if (problems.length) console.error('[prehab data]\n' + problems.join('\n'));
    }
  }, []);

  return (
    <div className={`canvas-shell ${contained ? 'canvas-shell--contained' : ''}`}>
      {/* The model is a visual aid. Every muscle it highlights is also listed
          as text in the detail panel, so the canvas is marked decorative
          rather than given fake keyboard semantics. */}
      <div aria-hidden="true" style={{ position: 'absolute', inset: 0 }}>
      <Canvas
        camera={{ position: [0, 1.6, 6.4], fov: 45, near: 0.1, far: 100 }}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
        dpr={[1, 2]}
        shadows={false}
      >
        <Suspense fallback={null}>
          <Scene muscleState={muscleState} focus={focus} source={source} onSelectMuscle={onSelectMuscle} />
        </Suspense>
      </Canvas>
      </div>
      {source === 'procedural' && (
        <p className="canvas-shell__note">
          Procedural rig · drop <code>anatomy.glb</code> into <code>/public/models</code> to swap in a
          scanned model
        </p>
      )}
    </div>
  );
}
