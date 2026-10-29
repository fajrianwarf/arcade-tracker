# Arcade Atlas — Google Skills Arcade Tracker MVP

A runnable **Next.js + TypeScript MVP with a complete dummy-data mode**. Start without a Supabase account, API keys, Google login, or email setup.

## Run the demo

Requires Node.js 22.13+ (Node 24 recommended).

```sh
npm ci
npm run dev
```

Open the local URL printed in the terminal (normally `http://localhost:3000`). No `.env` file is required. The default mode is `demo`; `.env.example` documents that choice if you prefer an explicit setting.

Production build:

```sh
npm run build
npm start
```

Checks:

```sh
npm test
npm run typecheck
```

## What works now

| Area | Dummy implementation |
| --- | --- |
| Catalog | Reference-inspired badge catalog at `/catalog`; type counts, search, completion/target filters, grid/list views, sample access codes, and activity details; no GitHub links |
| Personal progress | Public Google Skills profile URL is the only required tracking input; seeded learner, badges, point breakdown, and empty states |
| Synchronization | Queued → reading → saving; adds the next sample badge; cached progress stays visible |
| Failure handling | Simulate private profile or HTTP 429, preserve cached awards, recover with a successful sync |
| Community | Fictional leaderboard, rank by points/badges, opt in, update alias, leave board |
| Sessions | Demo sign-in/sign-out without credentials; guest completion/sync controls are disabled |
| Persistence | Browser localStorage, validated versioned data, cross-tab updates, reset demo, graceful storage failure |

Use **Demo controls** in the top strip to simulate sync outcomes, sign out, or reset the data. Click **Try stale data** on the profile card to mark its cache stale, then **Sync profile** to refresh. In a catalog details dialog, **Simulate earning badge** updates progress immediately. Repeated completion does not duplicate awards.

All identities, activities, dates, availability, community rows, and point rules displayed in demo mode are fixtures. Entering a real-looking public profile URL does not fetch Google or verify its owner. Linking a different URL clears that demo profile's awards and community opt-in. Your changes remain in this browser and are not shared with other users.

The demonstration rules (`demo-2026-v1`) award 1 point per sample game, 1 per pair of sample skill badges, and 0 for courses. They are **not verified official Arcade rules**. Sample award dates stay inside the fixture season so the demo remains usable later.

## Switch to real Supabase integration later

The original integration, schema, ingestion scripts, and schedules are retained. Select it explicitly:

```dotenv
NEXT_PUBLIC_DATA_MODE=supabase
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR-ANON-KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR-SERVER-ONLY-SERVICE-KEY
CRON_SECRET=YOUR-RANDOM-SERVER-SECRET
ENABLE_PUBLIC_HTML_INGESTION=false
```

1. Apply both files under `supabase/migrations/` in filename order.
2. The public profile reader needs only a public Google Skills URL, with no account login. Supabase Auth configuration is needed only for the retained account-backed backend APIs, not for looking up badges.
3. Add the variables to `.env.local` for local work and Vercel environment settings for deployment. Keep the service-role key and cron secret server-side. Restart/rebuild after changing the data mode.
4. Review source access constraints in `docs/source-feasibility.md` before opting into unsupported public HTML ingestion with `ENABLE_PUBLIC_HTML_INGESTION=true`.
5. Set up Supabase Cron, pg_net and Vault using `supabase/cron.sql`. Optional `supabase/functions/sync-dispatch` forwards to the Vercel worker; optional GitHub dispatch schedule is disabled by default. Use one scheduler.

Selecting `supabase` never silently substitutes dummy data when configuration fails. Browser demo state is isolated under `arcade-atlas.demo.v1`; it is not uploaded or used as real scoring evidence. Backend routes and CLI collectors remain real integration paths and need their documented configuration; the demo UI does not call them. The URL-first live UI uses `/api/public-profile`; its Google HTML adapter remains gated by `ENABLE_PUBLIC_HTML_INGESTION=true`. Its bounded six-hour cache, request budget, and coalescing are per server instance, not a distributed quota. Browser cache preserves the last successful snapshot on failure. The live community view displays the existing opt-in board; account enrollment is not part of the public lookup flow. Use a shared rate limiter before enabling unrestricted public collection at scale.

## Real backend API contracts

| Route | Access | Result |
| --- | --- | --- |
| POST `/api/public-profile` `{url,force?}` | Public; ingestion feature flag | Read visible Google Skills badges without login |
| POST `/api/profiles` `{url}` | Supabase Bearer token | Optional account-backed observation link + persistent sync job |
| GET `/api/profiles` | Supabase Bearer token | Cached snapshot + stale flag; enqueue revalidation |
| GET `/api/catalog` | Public | Reviewed published catalog |
| GET `/api/leaderboard` | Public | Opt-in observed-badge board |
| POST `/api/leaderboard` `{visible,alias}` | Supabase Bearer token | Update own preferences |
| POST `/api/cron/sync` | Server cron secret | Process at most 3 leased jobs |

Real-mode Arcade point totals stay disabled until official season rules and exact activity eligibility mappings are verified. The demo's points ranking is illustrative; the retained real leaderboard ranks observed badges only.

## Live ingestion proof of concept (optional, explicitly makes Google requests)

```sh
npm run ingest -- https://www.skills.google/public_profiles/YOUR-PROFILE-UUID
npm run collect:catalog
```

The profile CLI is read-only unless integrated into the configured worker. `--fixture FILE` can parse saved HTML instead. No documented unauthenticated Google Skills badge API was confirmed in the 22 October source check; the current adapter reads unsupported public HTML. It preserves original date labels and identifies awards by credential ID/canonical activity URL. Public page coverage does not prove full history.

Catalog collection emits unpublished review candidates. Seed migrations contain six observed real activity identities; the dummy UI uses a separate fictional catalog. Do not mix fixture rules or awards with real data.

## Layout

```text
src/app/page.tsx                 Explicit demo / Supabase mode selection
src/components/DemoApp.tsx       Interactive dummy MVP
src/components/CatalogPanel.tsx  Shared catalog, safe Google links and progress filters
src/components/ProfileUrlForm.tsx URL-only tracking entry
src/lib/public-profile.ts        Bounded public reader; cache and request coalescing
src/components/LiveApp.tsx       Retained real integration UI
src/lib/demo/model.ts            Fictional catalog and pure state/scoring operations
src/lib/demo/useDemoTracker.ts   Persistence and simulated asynchronous worker
src/lib/profile.ts               Public HTML ingestion adapter
src/lib/points.ts                Versioned grouped-points engine
src/lib/sync.ts                  Real server-side batch worker
supabase/                       RLS schema, queue RPCs, Cron and Edge gateway
```

## Verification and current limits

`npm test` covers the demo state model, client hydration and component workflow in an isolated DOM, and embedded PostgreSQL migration/RLS/queue behavior. The component flow exercises search, earning badges, sync failure/recovery, community membership, guest sessions, reload persistence, invalid profile URLs and relinking without network requests.

Live Supabase Auth/RLS/SMTP, Cron/Vault/pg_net, Edge deployment and Vercel remain unverified without resources. Browser visual review reached the rendered dashboard; further browser interaction checks were blocked by the cloud browser's URL policy. The isolated DOM tests do not replace a full browser/mobile layout check. See `docs/demo-validation.md`.

