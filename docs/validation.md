# Validation — 22 October 2026

Passed:

- Live Node public-profile fetch + parser: 10 unique visible awards, all with earned dates and canonical activity links.
- Official Arcade page fetched via curl; catalog parser identified four game candidates in its encoded embed.
- `npm test`: 12 tests passed. Includes embedded PostgreSQL applying both SQL migrations and exercising persistence, idempotency, RLS for two Auth identities and anon, opt-in leaderboard, lease recovery, stale worker rejection and failure backoff.
- `npm run typecheck`: passed.
- `npm run build`: passed; Next.js production routes generated.
- Production server HTTP smoke checks: homepage 200; missing Supabase catalog config 503; unauthenticated profile GET/POST 401; cron without secret 401.

Not verified:

- Real Supabase Auth email delivery/session round trip, Supabase-specific default grants, hosted RLS, Vault, pg_net, Cron and Edge Function deployment.
- Vercel deployment, production service quotas, upstream latency/access from Vercel or long-running collection.
- Browser visual and interactive QA. HTTP rendering checks are not a browser test.
- Complete profile history, pagination, ownership, current game availability, or season point eligibility.

No live credentials were supplied. The source package contains no secrets or identifiable live profile fixture. Apply setup and hosted acceptance steps in README before relying on this for community operation.
