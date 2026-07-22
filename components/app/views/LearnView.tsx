'use client';

import dynamic from 'next/dynamic';
import { useMemo, useState } from 'react';
import { ChevronDown, List, ScanLine } from 'lucide-react';
import { findExercise, muscleStateFor, regions } from '@/lib/protocol';
import { ExerciseCard } from '../ExerciseCard';

const AnatomyCanvas = dynamic(() => import('@/components/AnatomyCanvas'), {
  ssr: false,
  loading: () => <div className="anatomy-loading">Loading anatomy view…</div>,
});

export function LearnView() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [regionId, setRegionId] = useState(regions[0].id);
  const [mode, setMode] = useState<'anatomy' | 'list'>('anatomy');
  const exercise = findExercise(selectedId);
  const region = regions.find((item) => item.id === regionId) ?? regions[0];
  const muscleState = useMemo(() => muscleStateFor(exercise), [exercise]);

  return (
    <div className="page page--learn">
      <header className="page-header page-header--compact">
        <div><p className="kicker">33 manual-aligned exercises</p><h1>Learn the movement and the load.</h1><p className="lede">The anatomy view is a visual aid. Written setup and form cues remain authoritative.</p></div>
        <div className="view-toggle" role="group" aria-label="Learn view">
          <button type="button" className={mode === 'anatomy' ? 'is-active' : ''} onClick={() => setMode('anatomy')}><ScanLine size={17} aria-hidden /> Anatomy</button>
          <button type="button" className={mode === 'list' ? 'is-active' : ''} onClick={() => setMode('list')}><List size={17} aria-hidden /> List</button>
        </div>
      </header>

      <div className={`learn-layout learn-layout--${mode}`}>
        <nav className="region-browser" aria-label="Exercise regions">
          {regions.map((item) => {
            const open = item.id === regionId;
            return (
              <section key={item.id} className={`region-group ${open ? 'is-open' : ''}`} style={{ '--region-accent': item.accent } as React.CSSProperties}>
                <button type="button" onClick={() => { setRegionId(item.id); if (!open) setSelectedId(null); }} aria-expanded={open}>
                  <span><small>§{item.manual_ref}</small><strong>{item.name}</strong></span><em>{item.exercises.length}</em><ChevronDown size={17} aria-hidden />
                </button>
                {open && <div>{item.exercises.map((itemExercise) => (
                  <button key={itemExercise.id} type="button" className={selectedId === itemExercise.id ? 'is-active' : ''} onClick={() => setSelectedId(itemExercise.id)}>
                    <span>§{itemExercise.manual_ref}</span>{itemExercise.exercise_name}
                  </button>
                ))}</div>}
              </section>
            );
          })}
        </nav>

        {mode === 'anatomy' && (
          <section className="anatomy-stage" aria-label="Anatomy visual aid">
            <AnatomyCanvas muscleState={muscleState} focus={exercise?.camera_focus ?? region.camera_focus} contained />
            {!exercise && <div className="anatomy-prompt"><ScanLine size={22} aria-hidden /><span>Select an exercise to highlight its primary and secondary muscles.</span></div>}
          </section>
        )}

        <aside className="learn-detail">
          {exercise ? (
            <ExerciseCard exercise={exercise} open onToggle={() => undefined} />
          ) : (
            <div className="region-intro" style={{ '--region-accent': region.accent } as React.CSSProperties}>
              <span>Manual §{region.manual_ref}</span><h2>{region.name}</h2><p>{region.objective}</p>{region.warning && <small>{region.warning}</small>}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
