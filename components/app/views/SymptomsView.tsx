'use client';

import { useState } from 'react';
import { ArrowDown, ArrowUp, ChevronRight, ShieldAlert, Wrench } from 'lucide-react';
import { findExercise, protocol } from '@/lib/protocol';

export function SymptomsView({ onOpenSafety }: { onOpenSafety: () => void }) {
  const [selectedId, setSelectedId] = useState(protocol.symptom_modifications[0].id);
  const selected = protocol.symptom_modifications.find((item) => item.id === selectedId) ?? protocol.symptom_modifications[0];

  return (
    <div className="page page--symptoms">
      <header className="page-header">
        <div><p className="kicker">Symptom-guided adjustment</p><h1>Start with the work setup.</h1><p className="lede">Choose what you notice. This is guidance for modifying load—not a diagnosis.</p></div>
        <button type="button" className="stop-inline" onClick={onOpenSafety}><ShieldAlert size={18} aria-hidden /> Review stop rules</button>
      </header>

      <div className="symptom-layout">
        <nav className="symptom-list" aria-label="Symptom options">
          {protocol.symptom_modifications.map((item) => (
            <button key={item.id} type="button" className={selected.id === item.id ? 'is-active' : ''} onClick={() => setSelectedId(item.id)} aria-current={selected.id === item.id ? 'true' : undefined}>
              <span className={`status-dot ${item.severity === 'referral' ? 'status-dot--red' : 'status-dot--yellow'}`} aria-hidden />
              <span><strong>{item.symptom}</strong><small>{item.severity === 'referral' ? 'Clinical evaluation threshold' : 'Modify setup and load'}</small></span>
              <ChevronRight size={18} aria-hidden />
            </button>
          ))}
        </nav>

        <section className="symptom-detail">
          <p className="kicker">Current selection</p>
          <h2>{selected.symptom}</h2>
          {selected.severity === 'referral' && (
            <div className="referral-callout"><ShieldAlert size={21} aria-hidden /><p><strong>Do not train through this.</strong>{selected.emphasize_note}</p></div>
          )}
          <div className="workstation-fix"><Wrench size={20} aria-hidden /><div><span>Workstation change</span><p>{selected.workstation}</p></div></div>
          {selected.emphasize.length > 0 && (
            <div className="symptom-group symptom-group--up"><h3><ArrowUp size={17} aria-hidden /> Emphasize</h3><div>{selected.emphasize.map((id) => <span key={id}>{findExercise(id)?.exercise_name ?? id}</span>)}</div>{selected.emphasize_note && <p>{selected.emphasize_note}</p>}</div>
          )}
          {selected.reduce.length > 0 && (
            <div className="symptom-group symptom-group--down"><h3><ArrowDown size={17} aria-hidden /> Reduce or modify</h3><div>{selected.reduce.map((id) => <span key={id}>{findExercise(id)?.exercise_name ?? id}</span>)}</div>{selected.reduce_note && <p>{selected.reduce_note}</p>}</div>
          )}
          <p className="clinical-note">Persistent, worsening, recurrent, or neurologic symptoms need evaluation by a qualified clinician. The app does not diagnose injury.</p>
        </section>
      </div>
    </div>
  );
}
