'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import {
  Activity,
  BookOpen,
  CircleGauge,
  Dumbbell,
  Hand,
  HeartPulse,
  RotateCcw,
  ShieldAlert,
  Sparkles,
  Wrench,
} from 'lucide-react';
import { SafetyModal } from '@/components/SafetyModal';
import { useProgress } from '@/lib/client/progress-store';
import { RoutineView } from './views/RoutineView';
import { StrengthView } from './views/StrengthView';
import { SymptomsView } from './views/SymptomsView';
import { TodayView } from './views/TodayView';
import { WorkstationView } from './views/WorkstationView';
import type { AppView } from './types';

// The anatomy view owns the complete Three.js/WebGL dependency tree. Loading it
// with the home screen can make an unsupported WebGL/browser environment take
// down the entire application before the user ever opens Learn.
const LearnView = dynamic(
  () => import('./views/LearnView').then((module) => module.LearnView),
  {
    ssr: false,
    loading: () => (
      <div className="page" role="status" aria-live="polite">
        <p className="loading-label">Loading anatomy…</p>
      </div>
    ),
  },
);

const navigation = [
  { id: 'today', label: 'Today', icon: CircleGauge },
  { id: 'prepare', label: 'Prepare', icon: Sparkles },
  { id: 'reset', label: 'Reset', icon: RotateCcw },
  { id: 'recover', label: 'Recover', icon: HeartPulse },
  { id: 'strength', label: 'Strength', icon: Dumbbell },
  { id: 'workstation', label: 'Workstation', icon: Wrench },
  { id: 'symptoms', label: 'Symptoms', icon: Activity },
  { id: 'learn', label: 'Learn', icon: BookOpen },
] satisfies Array<{ id: AppView; label: string; icon: typeof Hand }>;

export function MachineHandApp() {
  const [view, setView] = useState<AppView>('today');
  const [safetyOpen, setSafetyOpen] = useState(false);
  const progress = useProgress();

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>

      <aside className="app-rail" aria-label="Primary navigation">
        <button className="brand" type="button" onClick={() => setView('today')} aria-label="Machine Hand home">
          <span className="brand__mark" aria-hidden>
            <Hand size={25} strokeWidth={1.8} />
          </span>
          <span className="brand__copy">
            <strong>Machine Hand</strong>
            <small>Artist longevity</small>
          </span>
        </button>

        <nav className="nav-list">
          {navigation.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              className={`nav-item ${view === id ? 'is-active' : ''}`}
              onClick={() => setView(id)}
              aria-current={view === id ? 'page' : undefined}
            >
              <Icon size={19} aria-hidden />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        <button className="stop-button" type="button" onClick={() => setSafetyOpen(true)}>
          <ShieldAlert size={18} aria-hidden />
          <span>Stop rules</span>
        </button>
      </aside>

      <main id="main-content" className="app-main" tabIndex={-1}>
        {view === 'today' && <TodayView summary={progress.summary} loading={progress.loading} onNavigate={setView} />}
        {view === 'prepare' && <RoutineView routineId="pre-session" eyebrow="Before precision work" onSave={progress.saveSession} />}
        {view === 'reset' && <RoutineView routineId="session-reset" eyebrow="Between appointments" onSave={progress.saveSession} />}
        {view === 'recover' && <RoutineView routineId="post-work-downshift" eyebrow="After the last appointment" onSave={progress.saveSession} />}
        {view === 'strength' && <StrengthView onSave={progress.saveSession} />}
        {view === 'workstation' && <WorkstationView />}
        {view === 'symptoms' && <SymptomsView onOpenSafety={() => setSafetyOpen(true)} />}
        {view === 'learn' && <LearnView />}
      </main>

      <nav className="bottom-nav" aria-label="Mobile navigation">
        {navigation.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            className={view === id ? 'is-active' : ''}
            onClick={() => setView(id)}
            aria-label={label}
            aria-current={view === id ? 'page' : undefined}
          >
            <Icon size={20} aria-hidden />
            <span>{label}</span>
          </button>
        ))}
      </nav>

      <SafetyModal open={safetyOpen} onClose={() => setSafetyOpen(false)} />
    </div>
  );
}
