# Architecture

## Product boundary

Machine Hand is a workday companion, not a diagnostic system and not primarily a 3D atlas. Prepare, Reset, Recover, Strength, Workstation, and Symptoms are the core workflow. Learn contains the reference atlas.

## Rendering boundary

`app/page.tsx` is a Server Component. Interactive state begins at `components/app/MachineHandApp.tsx`. The heavy Three.js anatomy view is dynamically loaded only in Learn. The remainder of the protocol is statically bundled and can render without WebGL or a database.

## Protocol boundary

`data/protocol.v2.json` is parsed once by `lib/protocol-schema.ts`. The parser validates full field shapes, manual references, muscle vocabulary, routine references, program inheritance, symptom references, grip-fatigue rules, and overlap errors. The independent verification script holds a hand-transcribed manifest so a bad dataset cannot redefine its own test.

## Persistence boundary

`lib/db/index.ts` lazily creates the Neon client. No database client is initialized at module scope, so `next build` succeeds without secrets.

When Neon is configured:

1. The server creates a random UUID participant ID.
2. The ID is signed with HMAC-SHA256 and stored in an HTTP-only, SameSite cookie.
3. Every read and write is scoped to that participant.
4. Client-generated idempotency keys prevent duplicate session and check-in writes.
5. The browser maintains a local queue and retries unsynced session records.

This is suitable for private anonymous-device progress. It is not an account system. Before exposing sensitive cross-device records or public multi-user features, add an approved authentication provider and map its stable subject to `participants`.

## Database tables

- `participants`: anonymous persistence subjects.
- `practice_sessions`: routine/strength results, traffic-light response, duration, and completed items.
- `symptom_checkins`: lightweight readiness and symptom records.
- `participant_preferences`: current week and accessibility preferences.

The canonical medical protocol is deliberately not stored in Postgres. It is version-controlled, reviewed content and should change through pull requests, schema validation, and parity tests.

## Security boundary

- Server-only secrets have no `NEXT_PUBLIC_` prefix.
- Mutations validate same-origin browser use and bounded Zod payloads.
- Cookies are HTTP-only, SameSite=Lax, Secure in production, and signed.
- Security headers deny framing, sniffing, sensitive browser capabilities, arbitrary media, and arbitrary embeds.
- YouTube embeds are limited to `youtube-nocookie.com` and created only after user interaction for verified records.
- The production environment should add Vercel Firewall rate limits to `/api/progress` and `/api/checkins` before a broad public launch.

## Failure behavior

Missing Neon configuration, temporary network failure, or database downtime does not block the protocol. The interface falls back to device-local progress. Video failure never blocks written instructions. Missing or invalid anatomy GLB falls back to the procedural rig.
