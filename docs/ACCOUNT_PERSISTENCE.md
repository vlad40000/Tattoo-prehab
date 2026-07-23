# Account authentication and progress persistence

## Product behavior

Tattoo Prehab supports two explicit operating modes:

1. **Device mode** — used when Clerk is not provisioned. Sessions and check-ins remain private to the browser, with the existing anonymous-device Neon path retained for backwards compatibility.
2. **Account mode** — enabled when Clerk publishable and secret keys are present. The application requires sign-in, exposes sign-up and account management, and derives all record ownership from Clerk's server-side session.

The browser never sends a participant ID or Clerk user ID in a session, check-in, or import payload.

## Identity model

`participants.id` remains the internal UUID foreign-key target. `participants.clerk_user_id` is nullable and unique:

- anonymous/device participants have `clerk_user_id = null`;
- signed-in participants have one stable Clerk subject;
- if a signed-in browser already owns a valid signed device participant, that row is claimed instead of abandoning previously synced anonymous history.

Every query still scopes through `participant_id`, but the participant is resolved server-side from the current authenticated Clerk subject.

## Shared-device isolation

Local records carry one of two scopes:

- `device` — pre-account or signed-out history;
- `account` — history created for a specific opaque account key.

The account key is an HMAC-derived, non-reversible browser scope. Records for one account are not displayed or synchronized when another account signs in on the same iPad.

## Legacy import

After the first sign-in, device-scoped records are not uploaded silently. The Today screen offers **Import device history**. The import:

- accepts at most 200 sessions and 200 check-ins;
- rejects client ownership fields through strict Zod schemas;
- uses per-record idempotency keys;
- stores an account-level import receipt;
- leaves local records untouched if the server operation fails;
- marks records account-scoped only after the server confirms the import.

## Progress records

Session items retain:

- planned set count;
- completed set count;
- target label;
- full-exercise completion state.

The Progress view reports session count, total minutes, current streak, weekly frequency, recent workout records, and movement-level planned-versus-completed sets.

## Protected routes

The following resources resolve Clerk identity independently at the point of access:

- `/api/progress`
- `/api/checkins`
- `/api/account/status`
- `/api/account/import`
- `/api/account/export`

Client-side Clerk state is only a UX affordance. It is never the authorization boundary.
