'use client';

import dynamic from 'next/dynamic';
import { useMemo, useState } from 'react';
import { ChevronDown, List, ScanLine } from 'lucide-react';
import { focusForMuscle } from '@/lib/muscleIndex';
import type { MuscleId } from '@/lib/muscleRegistry';
import { useCompactLayout } from '@/lib/client/useCompactLayout';
import {
  EMPTY_MUSCLE_STATE,
  allExercises,
  findExercise,
  muscleStateFor,
  regionOf,
  regions,
} from '@/lib/protocol';
import { labelFor } from '@/lib/muscleRegistry';
import { DetailSheet } from '../DetailSheet';
import { ExerciseCard } from '../ExerciseCard';
import { MusclePanel } from '../MusclePanel';

const AnatomyCanvas = dynamic(() => import('@/components/AnatomyCanvas'), {
  ssr: false,
  loading: () => <div className="anatomy-loading">Loading anatomy view…</div>,
});

/**
 * Learn works in both directions. Pick an exercise from the browser and the
 * model lights its activation map; tap a muscle on the model and the panel
 * lists every exercise that recruits it. On compact layouts (iPad portrait,
 * phone) the model is the hero and the detail rides in a bottom sheet, so the
 * whole flow is tap → read → tap, no navigation. The text browser remains the
 * accessible, keyboard-reachable path to everything the model can show.
 */
export function LearnView() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedMuscle, setSelectedMuscle] = useState<MuscleId | null>(null);
  const [regionId, setRegionId] = useState(regions[0].id);
  const [mode, setMode] = useState<'anatomy' | 'list'>('anatomy');
  const compact = useCompactLayout();

  const exercise = findExercise(selectedId);
  const region = regions.find((item) => item.id === regionId) ?? regions[0];

  const muscleState = useMemo(() => {
    if (exercise) return muscleStateFor(exercise);
    if (selectedMuscle) return { primary: [selectedMuscle], secondary: [] };
    return EMPTY_MUSCLE_STATE;
  }, [exercise, selectedMuscle]);

  const focus =
    exercise?.camera_focus ?? (selectedMuscle ? focusForMuscle(selectedMuscle) : region.camera_focus);

  const pickExercise = (id: string | null) => {
    setSelectedId(id);
    setSelectedMuscle(null);
    if (id) {
      const home = regionOf(id);
      if (home) setRegionId(home.id);
    }
  };

  const pickMuscle = (id: MuscleId) => {
    setSelectedMuscle(id);
    setSelectedId(null);
  };

  const clearSelection = () => {
    setSelectedId(null);
    setSelectedMuscle(null);
  };

  const detail = exercise ? (
    <ExerciseCard exercise={exercise} open onToggle={() => undefined} />
  ) : selectedMuscle ? (
    <MusclePanel muscleId={selectedMuscle} onPickExercise={pickExercise} onClear={clearSelection} />
  ) : (
    <div className="region-intro" style={{ '--region-accent': region.accent } as React.CSSProperties}>
      <span>Manual §{region.manual_ref}</span><h2>{region.name}</h2><p>{region.objective}</p>{region.warning && <small>{region.warning}</small>}
    </div>
  );

  const sheetOpen = compact && mode === 'anatomy' && (Boolean(exercise) || Boolean(selectedMuscle));
  const heroLayout = compact && mode === 'anatomy';

  const browser = (
    <nav className="region-browser" aria-label="Exercise regions">
      {regions.map((item) => {
        const open = item.id === regionId;
        return (
          <section key={item.id} className={`region-group ${open ? 'is-open' : ''}`} style={{ '--region-accent': item.accent } as React.CSSProperties}>
            <button type="button" onClick={() => { setRegionId(item.id); if (!open) clearSelection(); }} aria-expanded={open}>
              <span><small>§{item.manual_ref}</small><strong>{item.name}</strong></span><em>{item.exercises.length}</em><ChevronDown size={17} aria-hidden />
            </button>
            {open && <div>{item.exercises.map((itemExercise) => (
              <button key={itemExercise.id} type="button" className={selectedId === itemExercise.id ? 'is-active' : ''} onClick={() => pickExercise(itemExercise.id)}>
                <span>§{itemExercise.manual_ref}</span>{itemExercise.exercise_name}
              </button>
            ))}</div>}
          </section>
        );
      })}
    </nav>
  );

  return (
    <div className="page page--learn">
      <header className="page-header page-header--compact">
        <div><p className="kicker">{allExercises.length} manual-aligned exercises</p><h1>Learn the movement and the load.</h1><p className="lede">Tap any muscle on the model to see what trains it. Written setup and form cues remain authoritative.</p></div>
        <div className="view-toggle" role="group" aria-label="Learn view">
          <button type="button" className={mode === 'anatomy' ? 'is-active' : ''} onClick={() => setMode('anatomy')}><ScanLine size={17} aria-hidden /> Anatomy</button>
          <button type="button" className={mode === 'list' ? 'is-active' : ''} onClick={() => setMode('list')}><List size={17} aria-hidden /> List</button>
        </div>
      </header>

      {heroLayout && (
        <div className="region-chips" role="group" aria-label="Focus a region">
          {regions.map((item) => (
            <button
              key={item.id}
              type="button"
              className={item.id === regionId && !exercise && !selectedMuscle ? 'is-active' : ''}
              style={{ '--region-accent': item.accent } as React.CSSProperties}
              onClick={() => { setRegionId(item.id); clearSelection(); }}
            >
              <small>§{item.manual_ref}</small>
              {item.name}
            </button>
          ))}
        </div>
      )}

      <div className={`learn-layout learn-layout--${mode} ${heroLayout ? 'learn-layout--hero' : ''}`}>
        {!heroLayout && browser}

        {mode === 'anatomy' && (
          <section className="anatomy-stage" aria-label="Anatomy visual aid">
            <AnatomyCanvas muscleState={muscleState} focus={focus} contained onSelectMuscle={pickMuscle} />
            {!exercise && !selectedMuscle && (
              <div className="anatomy-prompt"><ScanLine size={22} aria-hidden /><span>Tap any muscle to see the exercises that load it, or pick from the list.</span></div>
            )}
            {selectedMuscle && !exercise && (
              <div className="anatomy-badge" aria-hidden>{labelFor(selectedMuscle)}</div>
            )}
          </section>
        )}

        {!heroLayout && <aside className="learn-detail">{detail}</aside>}
      </div>

      {compact && mode === 'anatomy' && (
        <DetailSheet
          open={sheetOpen}
          onClose={clearSelection}
          label={exercise ? exercise.exercise_name : selectedMuscle ? labelFor(selectedMuscle) : 'Details'}
        >
          {detail}
        </DetailSheet>
      )}
    </div>
  );
}
