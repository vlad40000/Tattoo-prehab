'use client';

import dynamic from 'next/dynamic';
import { useMemo, useState } from 'react';
import { ChevronDown, Library, PlayCircle, ScanLine, Search } from 'lucide-react';
import { focusForMuscle, musclesForRegion } from '@/lib/muscleIndex';
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
import { videoForExercise, videoLibrary } from '@/lib/videos';
import { DetailSheet } from '../DetailSheet';
import { ExerciseCard } from '../ExerciseCard';
import { MusclePanel } from '../MusclePanel';

const AnatomyCanvas = dynamic(() => import('@/components/AnatomyCanvas'), {
  ssr: false,
  loading: () => (
    <div className="anatomy-loading">
      <div className="canvas-loader"><div className="canvas-loader__ring" /><p className="canvas-loader__label">Preparing anatomy</p></div>
    </div>
  ),
});

export function LearnView() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedMuscle, setSelectedMuscle] = useState<MuscleId | null>(null);
  const [regionId, setRegionId] = useState(regions[0].id);
  const [mode, setMode] = useState<'anatomy' | 'list'>('list');
  const [query, setQuery] = useState('');
  const compact = useCompactLayout();

  const exercise = findExercise(selectedId);
  const region = regions.find((item) => item.id === regionId) ?? regions[0];
  const normalizedQuery = query.trim().toLowerCase();

  const visibleRegions = useMemo(() => regions
    .map((item) => ({
      ...item,
      exercises: normalizedQuery
        ? item.exercises.filter((candidate) =>
            `${candidate.exercise_name} ${candidate.manual_ref} ${candidate.the_why}`.toLowerCase().includes(normalizedQuery))
        : item.exercises,
    }))
    .filter((item) => item.exercises.length > 0), [normalizedQuery]);

  const muscleState = useMemo(() => {
    if (exercise) return muscleStateFor(exercise);
    if (selectedMuscle) return { primary: [selectedMuscle], secondary: [] };
    return { ...EMPTY_MUSCLE_STATE, candidate: musclesForRegion(region) };
  }, [exercise, selectedMuscle, region]);

  const focus = exercise?.camera_focus ?? (selectedMuscle ? focusForMuscle(selectedMuscle) : region.camera_focus);

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
      <span>Manual §{region.manual_ref}</span>
      <h2>{region.name}</h2>
      <p>{region.objective}</p>
      {region.warning && <small>{region.warning}</small>}
    </div>
  );

  const sheetOpen = compact && mode === 'anatomy' && (Boolean(exercise) || Boolean(selectedMuscle));
  const heroLayout = compact && mode === 'anatomy';

  const browser = (
    <nav className="region-browser" aria-label="Exercise regions">
      {visibleRegions.length === 0 && <p className="library-empty">No exercise matches “{query}”.</p>}
      {visibleRegions.map((item) => {
        const open = normalizedQuery.length > 0 || item.id === regionId;
        return (
          <section key={item.id} className={`region-group ${open ? 'is-open' : ''}`} style={{ '--region-accent': item.accent } as React.CSSProperties}>
            <button type="button" onClick={() => { setRegionId(item.id); if (!open) clearSelection(); }} aria-expanded={open}>
              <span><small>§{item.manual_ref}</small><strong>{item.short_name}</strong></span>
              <em>{item.exercises.length}</em>
              <ChevronDown size={17} aria-hidden />
            </button>
            {open && <div>{item.exercises.map((itemExercise) => (
              <button key={itemExercise.id} type="button" className={selectedId === itemExercise.id ? 'is-active' : ''} onClick={() => pickExercise(itemExercise.id)}>
                <span>§{itemExercise.manual_ref}</span>
                <strong>{itemExercise.exercise_name}</strong>
                {videoForExercise(itemExercise.id) && <PlayCircle size={15} aria-label="Video available" />}
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
        <div>
          <p className="kicker">{allExercises.length} exercises · {videoLibrary.length} video guides</p>
          <h1>Exercise library</h1>
          <p className="lede">Search the full tattoo-prehab manual, open an exercise, and use its written cues and video instruction together.</p>
        </div>
        <div className="view-toggle" role="group" aria-label="Exercise library view">
          <button type="button" className={mode === 'list' ? 'is-active' : ''} onClick={() => setMode('list')}><Library size={17} aria-hidden /> Library</button>
          <button type="button" className={mode === 'anatomy' ? 'is-active' : ''} onClick={() => setMode('anatomy')}><ScanLine size={17} aria-hidden /> Anatomy</button>
        </div>
      </header>

      <div className="library-toolbar">
        <label className="library-search" htmlFor="exercise-search">
          <Search size={18} aria-hidden />
          <input id="exercise-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search exercise, body region, or purpose" />
        </label>
        <span>{normalizedQuery ? visibleRegions.reduce((total, item) => total + item.exercises.length, 0) : allExercises.length} results</span>
      </div>

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
              {item.short_name}
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
              <div className="anatomy-prompt"><ScanLine size={22} aria-hidden /><span>Highlighted muscles belong to {region.short_name.toLowerCase()} — tap one to see what trains it.</span></div>
            )}
            {selectedMuscle && !exercise && <div className="anatomy-badge" aria-hidden>{labelFor(selectedMuscle)}</div>}
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
