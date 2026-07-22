'use client';

import { useCallback, useEffect, useRef } from 'react';
import { protocol } from '@/lib/protocol';

const { triage, meta } = protocol;

export function SafetyBanner({ onOpen }: { onOpen: () => void }) {
  return (
    <button type="button" className="safety-banner" onClick={onOpen}>
      <span className="safety-banner__pulse" aria-hidden />
      <span className="safety-banner__text">
        Stop for sharp or radiating pain, new numbness, cold or discolored fingers, or declining
        machine precision.
      </span>
      <span className="safety-banner__cta">Stop rules</span>
    </button>
  );
}

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

export function SafetyModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const returnFocusTo = useRef<HTMLElement | null>(null);

  // Trap Tab inside the dialog; Escape closes.
  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== 'Tab' || !dialogRef.current) return;

      const nodes = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (n) => n.offsetParent !== null
      );
      if (!nodes.length) return;

      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      const active = document.activeElement;

      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (!open) return;

    returnFocusTo.current = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      // Return focus to whatever opened the dialog.
      returnFocusTo.current?.focus?.();
    };
  }, [open, onKeyDown]);

  if (!open) return null;

  return (
    <div className="modal-scrim" role="presentation" onClick={onClose}>
      <div
        ref={dialogRef}
        className="modal glass"
        role="dialog"
        aria-modal="true"
        aria-labelledby="safety-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="modal__head">
          <div>
            <p className="eyebrow eyebrow--warn">Traffic-light monitoring</p>
            <h2 id="safety-title" className="modal__title">
              How to read what you are feeling
            </h2>
          </div>
          <button
            ref={closeRef}
            type="button"
            className="icon-btn"
            onClick={onClose}
            aria-label="Close stop rules"
          >
            ×
          </button>
        </header>

        <div className="modal__body">
          <section className="zones">
            {triage.zones.map((zone) => (
              <div key={zone.id} className="zone" style={{ ['--zone' as string]: zone.color }}>
                <div className="zone__head">
                  <span className="zone__dot" aria-hidden />
                  <span className="zone__label">{zone.label}</span>
                  {zone.halts_session && <span className="zone__flag">Stop now</span>}
                </div>
                <p className="zone__looks">{zone.looks_like}</p>
                <p className="zone__action">{zone.action}</p>
              </div>
            ))}
          </section>

          <section>
            <h3 className="section-label">Seek prompt evaluation for</h3>
            <ul className="rule-list rule-list--warn">
              {triage.prompt_evaluation.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </section>

          <section>
            <h3 className="section-label">Referral indicators</h3>
            <ul className="rule-list">
              {triage.referral_indicators.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </section>

          <section>
            <h3 className="section-label">Effort standard</h3>
            <ul className="rule-list rule-list--compact">
              {triage.effort_standard.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </section>

          <section className="note-stack">
            <p className="note">{triage.twenty_four_hour_rule}</p>
            <p className="note">{triage.grip_rule}</p>
            <p className="note">{meta.exercise_is_support}</p>
            <p className="note note--muted">{meta.not_scope}</p>
          </section>
        </div>

        <footer className="modal__foot">
          <button type="button" className="btn-primary" onClick={onClose}>
            Understood
          </button>
        </footer>
      </div>
    </div>
  );
}
