# Tattoo Prehab v5

Tattoo Prehab is an iPad-first workday longevity application for tattoo artists. It combines a low-friction workout runner with a guided readiness flow, while preserving the Tattoo Artist Physical Longevity Manual as the written authority.

## Core experience

- **Today:** readiness check that changes the recommended action.
- **Train:** Prepare, Reset, Recover, and the 12-week strength program in one launcher.
- **Learn:** searchable list of all 33 exercises, approved video indicators, and optional interactive anatomy.
- **Station:** ergonomics and shop-setup checklists.
- **Symptoms:** modification guidance and stop rules.

Guided sessions include set-by-set completion, conservative dose parsing, hold timers, inline approved YouTube instruction, pause/resume, and explicit restart/discard controls.

## Verified instruction inventory

`lib/videos.ts` contains 20 exercise demonstrations and one reset-step demonstration. All 21 supplied records are approved and visible at their mapped instruction points. Exercises without an approved record do not link to generic YouTube search results.

## Canonical protocol

`data/protocol.v2.json` contains exactly 33 exercises:

- 7 shoulders and neck
- 6 spine and core
- 6 hips
- 7 knees and ankles
- 7 hands and wrists

Run the independent parity check:

```bash
npm run verify
```

## Local development

Use Node 24, matching `package.json`:

```bash
npm ci
npm run dev
```

## Verification

```bash
npm run verify:ci
npm run build
npm run test:e2e
```

`npm run build` runs protocol verification, unit/component tests, type checking, and lint before the Next.js production build.

## Persistence

The app remains usable without environment variables and stores progress locally. Configure Neon and a session secret for cloud synchronization. Database clients are initialized lazily and no database client is created at module scope.

See `V5_MERGE_NOTES.md` for the exact merge scope and known environment limitation.
