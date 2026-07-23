'use client';

import { useEffect, useRef, useState, type PointerEvent, type ReactNode } from 'react';

/** Drag distance past which release dismisses instead of snapping back. */
const DISMISS_THRESHOLD = 96;

/**
 * Non-modal bottom sheet for the compact (iPad/phone) Learn layout. The
 * canvas above it stays live, so tapping another muscle swaps the sheet's
 * content without any navigation. Dismiss by dragging the handle down past
 * the threshold, the close affordances inside the content, or Escape.
 * Intentionally dependency-free: one translateY, one transition.
 */
export function DetailSheet({
  open,
  onClose,
  label,
  children,
}: {
  open: boolean;
  onClose: () => void;
  label: string;
  children: ReactNode;
}) {
  const [dragY, setDragY] = useState(0);
  const drag = useRef<{ startY: number; pointerId: number } | null>(null);
  const sheetRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // Reset any in-progress drag when content closes underneath us.
  useEffect(() => {
    if (!open) {
      drag.current = null;
      setDragY(0);
    }
  }, [open]);

  const onHandleDown = (e: PointerEvent<HTMLButtonElement>) => {
    drag.current = { startY: e.clientY, pointerId: e.pointerId };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onHandleMove = (e: PointerEvent<HTMLButtonElement>) => {
    if (!drag.current || drag.current.pointerId !== e.pointerId) return;
    setDragY(Math.max(0, e.clientY - drag.current.startY));
  };

  const onHandleUp = (e: PointerEvent<HTMLButtonElement>) => {
    if (!drag.current || drag.current.pointerId !== e.pointerId) return;
    const travelled = Math.max(0, e.clientY - drag.current.startY);
    drag.current = null;
    setDragY(0);
    if (travelled > DISMISS_THRESHOLD) onClose();
  };

  return (
    <div
      ref={sheetRef}
      role="region"
      aria-label={label}
      className={`detail-sheet ${open ? 'is-open' : ''} ${drag.current ? 'is-dragging' : ''}`}
      style={dragY > 0 ? { transform: `translateY(${dragY}px)` } : undefined}
    >
      <button
        type="button"
        className="detail-sheet__handle"
        aria-label="Dismiss panel"
        onClick={onClose}
        onPointerDown={onHandleDown}
        onPointerMove={onHandleMove}
        onPointerUp={onHandleUp}
        onPointerCancel={onHandleUp}
      >
        <span aria-hidden />
      </button>
      <div className="detail-sheet__body">{children}</div>
    </div>
  );
}
