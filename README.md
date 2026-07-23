# Machine Hand

Machine Hand is an iPad-first workday longevity application for tattoo artists. It turns the Tattoo Artist Physical Longevity Manual into seven usable modes:

- Prepare before precision work.
- Reset between appointments or at natural stopping points.
- Recover after the last appointment.
- Follow a 12-week foundational strength program.
- Audit workstation ergonomics and shop checklists.
- Modify work and exercise when symptoms appear.
- Learn all 33 manual-aligned exercises with an optional anatomy aid.

The written protocol is the authority. The 3D anatomy view and third-party demonstration videos are supplementary.

## Production stack

- Next.js 16 App Router and React 19
- TypeScript with strict checking
- Neon Postgres through `@neondatabase/serverless`
- Drizzle ORM and checked-in SQL migrations
- Zod validation at protocol, API, and video-review boundaries
- Vitest, Testing Library, and Playwright
- Vercel Git deployments

## Local setup

Requirements: Node 24 and npm 11.

```bash
npm ci
cp .env.example .env.local
npm run dev
```

The app runs in local-only mode when `DATABASE_URL` and `SESSION_SECRET` are absent. Progress remains on the current device. To enable Neon persistence, configure both variables and run:

```bash
npm run db:migrate
npm run db:check
```

Generate `SESSION_SECRET` with a cryptographically secure random generator; use at least 32 bytes. Never commit `.env.local`.

Database commands accept `DATABASE_URL_UNPOOLED` first and fall back to `DATABASE_URL`. They refuse placeholder and non-Neon targets. The migration command performs a schema-readiness check after applying checked-in migrations.

## Verification

```bash
npm run verify      # manual/protocol parity
npm run test        # unit and component tests
npm run typecheck
npm run lint
npm run build       # repeats the four gates above before Next.js build
npm run test:e2e    # iPad portrait and landscape flows
```

`npm run build` is intentionally strict. Do not weaken the manual parity fixture or review gates to make a change pass.

## Data authority

1. The source manual controls exercise identity, order, wording, dosage, safety meaning, ergonomics, and program phases.
2. `data/protocol.v2.json` is the canonical application representation.
3. `lib/protocol-schema.ts` validates the complete boundary and cross-references.
4. `scripts/verify-protocol.mjs` independently checks the exact 33-exercise manifest.
5. Video records never override the protocol.

The invariant is 7 shoulders/neck + 6 spine/core + 6 hips + 7 knees/ankles + 7 hands/wrists = 33.

## Video review gate

Twenty exercise candidates and one reset candidate are stored in `lib/videos.ts`. Every record starts as `candidate` and is invisible in the interface. A video appears only after a human reviewer records all required approval evidence and changes it to `verified`.

## Persistence model

The current release uses a signed, HTTP-only anonymous-device identifier. Session data is isolated by participant ID, writes are idempotent, and the browser keeps an offline queue. See `docs/ARCHITECTURE.md` before adding account authentication or cross-device identity.

## Medical scope

This product is educational and organizational. It does not diagnose, treat, or replace individual evaluation. Red-flag symptoms and the 24-hour response rule remain visible through Stop rules and symptom guidance.
