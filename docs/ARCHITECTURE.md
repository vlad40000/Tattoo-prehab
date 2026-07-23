# Architecture

## Product boundary

Tattoo Prehab is a workday companion for tattoo artists, not a diagnostic system and not primarily a 3D atlas. The core journey is organized around the actual workday: Prepare before precision work, Reset during long appointments, Recover after the last appointment, then build capacity with Strength. Workstation and Symptoms support safer decisions, while the Exercise Library contains the complete 33-exercise reference system.

The interaction model deliberately combines two patterns:

- fast workout logging and one-movement-at-a-time execution;
- guided questions, clear choices, visible progress, and immediate recommendations.

## Rendering boundary

`app/page.tsx` is a Server Component. Interactive state begins at `components/app/TattooPrehabApp.tsx`. The heavy Three.js anatomy view is dynamically loaded only when the Anatomy tab is opened. The rest of the protocol, exercise library, routines, videos, workstation guidance, and symptom guidance can render without WebGL or a database.

## Protocol boundary

`data/protocol.v2.json` is parsed once by `lib/protocol-schema.ts`. The parser validates full field shapes, manual references, muscle vocabulary, routine references, program inheritance, symptom references, grip-fatigue rules, and overlap errors. The independent verification script holds a hand-transcribed manifest so a bad dataset cannot redefine its own test.

## Video boundary

`lib/videos.ts` contains 21 approved instructional records: 20 exercise videos and one reset-step video. Video buttons are visible in exercise rows and beside the matching reset instruction. Privacy-enhanced YouTube iframes are created only after user interaction, and every modal also exposes a direct YouTube link. Video failure never blocks the written protocol.

## Persistence and account boundary

`lib/db/index.ts` lazily creates the Neon client. No database client is initialized at module scope, so `next build` succeeds without database secrets.

Clerk is also provisioned as an environment-gated integration. When Clerk keys are absent, the application remains in private device mode. When they are present:

1. `proxy.ts` establishes Clerk request context on Next.js 16.
2. The root page requires an authenticated session.
3. Each protected route independently resolves the current Clerk subject server-side.
4. `participants.clerk_user_id` maps that subject to the internal UUID foreign-key model.
5. A valid signed anonymous participant on the same browser may be claimed, preserving previously cloud-synced device history.
6. Client payloads cannot provide `participant_id` or `user_id`; strict schemas reject unknown ownership fields.

Local queues distinguish device records from account records. Account records carry an opaque HMAC-derived account key, preventing a second account on the same shared iPad from displaying or synchronizing the first account's unsynced history.

Existing device sessions and check-ins require an explicit one-time import. Import receipts plus per-record idempotency keys make retries safe, and local records are not re-scoped until the server confirms success.

## Database tables

- `participants`: internal persistence subjects with an optional unique Clerk user mapping.
- `practice_sessions`: routine/strength results, traffic-light response, duration, completed exercises, and set totals.
- `symptom_checkins`: lightweight readiness and symptom records.
- `participant_preferences`: current week and accessibility preferences.
- `account_imports`: bounded, idempotent device-history import receipts.

The canonical medical protocol is deliberately not stored in Postgres. It remains version-controlled, reviewed content and changes through pull requests, schema validation, and parity tests.

## Security boundary

- Server-only secrets have no `NEXT_PUBLIC_` prefix.
- Mutations validate same-origin browser use and bounded Zod payloads.
- Cookies are HTTP-only, SameSite=Lax, Secure in production, and signed.
- Security headers deny framing, sniffing, sensitive browser capabilities, arbitrary media, and arbitrary embeds.
- YouTube embeds are limited to `youtube-nocookie.com` and created only after user interaction.
- The production environment should add Vercel Firewall rate limits to `/api/progress` and `/api/checkins` before a broad public launch.

## Failure behavior

Missing Neon configuration, temporary network failure, or database downtime does not block the protocol. The interface falls back to device-local progress. Video failure never blocks written instructions. Missing or invalid anatomy GLB falls back to the procedural rig.
