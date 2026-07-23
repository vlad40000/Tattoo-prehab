'use client';

import { useSyncExternalStore } from 'react';

/**
 * True below 1181px — the width where the Learn view switches from the
 * desktop three-column layout to the iPad map-hero layout (full-width canvas,
 * region chips, bottom sheet). Guarded for environments without matchMedia
 * (jsdom); those default to the desktop layout.
 */
const QUERY = '(max-width: 1180px)';

function subscribe(onChange: () => void): () => void {
  if (typeof window === 'undefined' || !window.matchMedia) return () => undefined;
  const mql = window.matchMedia(QUERY);
  mql.addEventListener('change', onChange);
  return () => mql.removeEventListener('change', onChange);
}

function getSnapshot(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia(QUERY).matches;
}

export function useCompactLayout(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
