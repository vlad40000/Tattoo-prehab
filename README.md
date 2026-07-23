# Tattoo Prehab v6

Tattoo Prehab is an iPad-first workday longevity application for tattoo artists. It combines a low-friction workout runner, guided readiness branching, approved video instruction, account-based history, and progress tracking while preserving the Tattoo Artist Physical Longevity Manual as the written authority.

## Core experience

- **Today:** readiness check, immediate recommendation, sync status, and recent capacity metrics.
- **Train:** Prepare, Reset, Recover, and the 12-week strength program in one launcher.
- **Learn:** searchable list of all 33 exercises, approved video indicators, and optional interactive anatomy.
- **Station:** ergonomics and shop-setup checklists.
- **Symptoms:** modification guidance and stop rules.
- **Progress:** session history, weekly consistency, streaks, and planned-versus-completed exercise sets.

Guided sessions include set-by-set completion, conservative dose parsing, hold timers, inline approved YouTube instruction, pause/resume, and explicit restart/discard controls.

## Accounts and persistence

Clerk provides sign-in, sign-up, password recovery, social login configuration, account management, and server-side identity. Neon stores account-owned sessions and check-ins.

When Clerk keys are absent, the app deliberately retains its existing private on-device mode instead of failing to build. Once Clerk is provisioned, the root application requires sign-in and every protected API derives ownership from the server session.

Existing device history is imported only after the signed-in user selects **Import device history**. Imports are bounded and idempotent, and account-scoped local queues prevent shared-iPad cross-account mixing.

See `docs/ACCOUNT_PERSISTENCE.md`.

## Verified instruction inventory

`lib/videos.ts` contains 20 exercise demonstrations and one reset-step demonstration. All 21 supplied records are approved and visible at their mapped instruction points. Exercises without an approved record do not link to generic YouTube search results.

## Canonical protocol

`data/protocol.v2.json` contains exactly 33 exercises:

- 7 shoulders and neck
- 6 spine and core
- 6 hips
- 7 knees and ankles
- 7 hands and wrists

## Local development

Use Node 24:

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

`verify:ci` runs protocol parity, v5 interaction contracts, v6 account contracts, unit/component tests, semantic TypeScript checking, and ESLint before the Next.js production build.
