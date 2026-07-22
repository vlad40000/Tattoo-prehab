'use client';

import { useState } from 'react';
import { Check, ChevronDown, ClipboardCheck, Lightbulb } from 'lucide-react';
import { protocol } from '@/lib/protocol';

export function WorkstationView() {
  const [openSection, setOpenSection] = useState(protocol.ergonomics.sections[0].id);
  const [activeChecklist, setActiveChecklist] = useState(protocol.checklists[0].id);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const checklist = protocol.checklists.find((item) => item.id === activeChecklist) ?? protocol.checklists[0];

  const toggle = (key: string) => setChecked((current) => {
    const next = new Set(current);
    if (next.has(key)) next.delete(key); else next.add(key);
    return next;
  });

  return (
    <div className="page page--workstation">
      <header className="page-header">
        <div><p className="kicker">Change the work before blaming the body</p><h1>Make the station adapt to you.</h1><p className="lede">{protocol.ergonomics.principle}</p></div>
      </header>

      <aside className="audit-question"><Lightbulb size={22} aria-hidden /><div><span>Ask this first</span><p>{protocol.ergonomics.audit_question}</p></div></aside>

      <div className="workstation-grid">
        <section>
          <div className="section-heading"><div><p className="kicker">Six leverage points</p><h2>Workstation setup</h2></div></div>
          <div className="accordion-list">
            {protocol.ergonomics.sections.map((section) => {
              const open = openSection === section.id;
              return (
                <article key={section.id} className={`accordion ${open ? 'is-open' : ''}`}>
                  <button type="button" onClick={() => setOpenSection(open ? '' : section.id)} aria-expanded={open}>
                    <span><small>§{section.ref}</small><strong>{section.name}</strong></span><ChevronDown size={19} aria-hidden />
                  </button>
                  {open && <ul>{section.points.map((point) => <li key={point}>{point}</li>)}</ul>}
                </article>
              );
            })}
          </div>
        </section>

        <section className="checklist-panel">
          <div className="section-heading"><div><p className="kicker">Repeatable checks</p><h2>Shop checklist</h2></div><ClipboardCheck size={22} aria-hidden /></div>
          <div className="select-wrap">
            <label htmlFor="checklist">Checklist</label>
            <select id="checklist" value={activeChecklist} onChange={(event) => { setActiveChecklist(event.target.value); setChecked(new Set()); }}>
              {protocol.checklists.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </div>
          <p className="checklist-cadence">Cadence: {checklist.cadence}</p>
          <div className="checklist-items">
            {checklist.items.map((item, index) => {
              const key = `${checklist.id}:${index}`;
              return (
                <button key={key} type="button" className={checked.has(key) ? 'is-checked' : ''} onClick={() => toggle(key)} aria-pressed={checked.has(key)}>
                  <span>{checked.has(key) && <Check size={16} aria-hidden />}</span>{item}
                </button>
              );
            })}
          </div>
          <div className="checklist-progress"><span style={{ width: `${(checked.size / checklist.items.length) * 100}%` }} /></div>
          <small>{checked.size} of {checklist.items.length} reviewed</small>
        </section>
      </div>
    </div>
  );
}
