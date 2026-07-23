# Tattoo Prehab v5 Merge Notes

This build merges the strongest product decisions from the two prior rebuilds without treating either package as authoritative in full.

## Implemented scope

1. Five-tab primary navigation: Today, Train, Learn, Station, Symptoms.
2. Consolidated Train launcher for Prepare, Reset, Recover, and the 12-week strength program.
3. Full-screen guided runner with dose parsing, set rows, hold countdowns, pause/resume, movement navigation, and inline approved video.
4. All 21 supplied YouTube records remain verified and visible at their approved instruction points.
5. The slow shoulder-blade-circle reset video remains attached to the canonical reset step.
6. Generic YouTube search fallbacks were removed; exercises without an approved video use written instruction only.
7. Tattoo Prehab product identity is preserved in metadata, manifest, package name, health service, UI, and storage keys.
8. Readiness remains action-driving: green recommends Prepare, yellow recommends Reset, and red directs to Symptoms.
9. Learn remains searchable and list-first; anatomy is an optional secondary mode.
10. Anatomy gains a continuous silhouette, visible candidate muscles, non-dead-end tap targets, better ghost context, and single mirrored-muscle tooltips.
11. An exercise is recorded complete only when every planned set is complete.
12. Paused sessions expose explicit Resume, Restart, and Discard actions and preserve elapsed time, set state, and current movement until the user chooses otherwise.

## Canonical authority retained

- 33 manual-aligned exercises.
- Region counts: 7 shoulders/neck, 6 spine/core, 6 hips, 7 knees/ankles, 7 hands/wrists.
- Three workday routines.
- Twelve-week foundational strength progression.
- Symptom modification and stop-rule content.
- Local-first progress with optional Neon synchronization.
- Original professional manual in `docs/reference/`.

## Verification in this package

- `npm run verify` passes the independent protocol parity gate.
- All TypeScript and TSX files pass TypeScript syntax transpilation.
- All local import targets resolve.
- Unit/component and Playwright tests were rewritten around the v5 flow.

Full dependency-backed `npm run verify:ci`, `npm run build`, and `npm run test:e2e` require Node 24 and installed packages. The build environment used for this merge exposed Node 22 and could not complete `npm ci` through its package mirror.
