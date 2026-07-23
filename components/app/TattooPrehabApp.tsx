'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import {
  Activity,
  BookOpen,
  CircleGauge,
  Dumbbell,
  Hand,
  ShieldAlert,
  Wrench,
} from 'lucide-react';
import { SafetyModal } from '@/components/SafetyModal';
import { useProgress } from '@/lib/client/progress-store';
import { RoutineView } from './views/RoutineView';
import { TrainView } from './views/TrainView';
import { StrengthView } from './views/StrengthView';
import { SymptomsView } from './views/SymptomsView';
import { TodayView } from './views/TodayView';
import { WorkstationView } from './views/WorkstationView';
import type { AppView } from './types';

const LearnView = dynamic(
  () => import('./views/LearnView').then((module) => module.LearnView),
  {
    ssr: false,
    loading: () => (
      <div className="page" role="status" aria-live="polite">
        <p className="loading-label">Loading exercise library…</p>
      </div>
    ),
  },
);

const navigation = [
  { id: 'today', label: 'Today', icon: CircleGauge },
  { id: 'train', label: 'Train', icon: Dumbbell },
  { id: 'learn', label: 'Learn', icon: BookOpen },
  { id: 'workstation', label: 'Station', icon: Wrench },
  { id: 'symptoms', label: 'Symptoms', icon: Activity },
] satisfies Array<{ id: AppView; label: string; icon: typeof Hand }>;

const TRAIN_VIEWS = new Set<AppView>(['prepare', 'reset', 'recover', 'strength']);

export function TattooPrehabApp() {
  const [view, setView] = useState<AppView>('today');
  const [safetyOpen, setSafetyOpen] = useState(false);
  const progress = useProgress();

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">Skip to content</a>

      <header className="app-top">
        <button className="brand" type="button" onClick={() => setView('today')} aria-label="Tattoo Prehab home">
          <span className="brand__mark" aria-hidden><Hand size={20} strokeWidth={1.9} /></span>
          <span className="brand__copy app-brand-copy">
            <strong>Tattoo Prehab</strong>
            <small>Artist longevity</small>
          </span>
        </button>
        <div className="app-top__meta" aria-label="Protocol coverage">33 exercises · 21 videos</div>
        <button className="stop-chip" type="button" onClick={() => setSafetyOpen(true)}>
          <ShieldAlert size={16} aria-hidden />
          <span>Stop rules</span>
        </button>
      </header>

      <main id="main-content" className="app-main" tabIndex={-1}>
        {view === 'today' && <TodayView summary={progress.summary} loading={progress.loading} onNavigate={setView} />}
        {view === 'train' && <TrainView onNavigate={setView} />}
        {view === 'prepare' && <RoutineView routineId="pre-session" eyebrow="Before precision work" onSave={progress.saveSession} onOpenSafety={() => setSafetyOpen(true)} />}
        {view === 'reset' && <RoutineView routineId="session-reset" eyebrow="During long appointments" onSave={progress.saveSession} onOpenSafety={() => setSafetyOpen(true)} />}
        {view === 'recover' && <RoutineView routineId="post-work-downshift" eyebrow="After the last appointment" onSave={progress.saveSession} onOpenSafety={() => setSafetyOpen(true)} />}
        {view === 'strength' && <StrengthView onSave={progress.saveSession} onOpenSafety={() => setSafetyOpen(true)} />}
        {view === 'workstation' && <WorkstationView />}
        {view === 'symptoms' && <SymptomsView onOpenSafety={() => setSafetyOpen(true)} />}
        {view === 'learn' && <LearnView />}
      </main>

      <nav className="tab-bar" aria-label="Primary navigation">
        {navigation.map(({ id, label, icon: Icon }) => {
          const active = view === id || (id === 'train' && TRAIN_VIEWS.has(view));
          return (
            <button
              key={id}
              type="button"
              className={active ? 'is-active' : ''}
              onClick={() => setView(id)}
              aria-current={active ? 'page' : undefined}
            >
              <Icon size={21} aria-hidden />
              <span>{label}</span>
            </button>
          );
        })}
      </nav>

      <SafetyModal open={safetyOpen} onClose={() => setSafetyOpen(false)} />
    </div>
  );
}
