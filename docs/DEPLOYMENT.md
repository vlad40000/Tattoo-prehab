# GitHub and Vercel deployment

## Recommended order

1. Create an empty private GitHub repository.
2. Push this verified source to `main`.
3. Import that repository from Vercel's New Project flow.
4. Provision Neon through the Vercel Marketplace for the project.
5. Add `SESSION_SECRET` and `NEXT_PUBLIC_APP_URL` to Production, Preview, and Development with appropriate values.
6. Pull development variables locally with `vercel env pull .env.local --yes`.
7. Run the initial migration against the intended Neon branch.
8. Deploy a preview, execute browser acceptance checks, then promote the exact verified deployment.

Do not connect Preview deployments to the Production database. Use a Neon development/preview branch.

## Required variables

| Variable | Exposure | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | Server only | Neon pooled runtime connection string |
| `DATABASE_URL_UNPOOLED` | Server only | Direct Neon connection preferred for migrations and schema tools |
| `SESSION_SECRET` | Server only | Signs anonymous participant cookies; at least 32 characters |
| `NEXT_PUBLIC_APP_URL` | Public | Canonical URL used in application metadata |

## Migration sequence

For a fresh database:

```bash
vercel env pull .env.local --yes
npm run db:migrate
npm run db:check
npm run build
```

Run additive/backward-compatible migrations before promoting code that requires them. Destructive migrations require a backup, an explicit rollback plan, and a separately reviewed change.

## Vercel settings

- Framework preset: Next.js
- Root directory: repository root
- Production branch: `main`
- Node.js major: 24
- Build command: `npm run build`
- Install command: `npm ci`
- Output directory: leave unset

## Release acceptance

- GitHub Actions is green.
- Vercel preview build is green.
- `npm run db:check` confirms all four required tables.
- `/api/health` reports `persistence: ready` in the target environment; `configured` is not accepted because it does not prove connectivity or schema readiness.
- Neon migrations match the checked-in journal.
- The five primary tabs—Today, Train, Learn, Station, and Symptoms—pass at 1024×1366 and 1366×1024.
- Train launches Prepare, Reset, Recover, and the 12-week strength program without adding more primary navigation items.
- Learn defaults to the searchable 33-exercise list and exposes anatomy as an optional secondary mode.
- The guided runner preserves set state, elapsed time, and current movement across Pause/Resume; Restart and Discard explicitly clear that state.
- Exercise completion is persisted only after every planned set is complete.
- All 21 approved video records expose a button, while iframes remain unmounted until the user opens a video.
- Stop rules are keyboard operable and return focus to the trigger.
