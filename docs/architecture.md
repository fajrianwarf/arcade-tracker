# Architecture

The flow below describes the retained real integration. The MVP also has a separate, default dummy mode: fictional fixtures → browser-local state → versioned demo scoring → UI. It makes no requests to this backend or Google. See README for switching modes.

## Ingestion

Authenticated link → validated canonical public URL → private observation subscription → durable queue → worker lease → bounded HTML fetch → fail-closed parse → atomic RPC upsert + evidence hash → cached snapshot → UI poll/status refresh.

Reads return the last successful snapshot and enqueue stale profiles; workers run independently, so revalidation does not rely on a serverless process remaining alive after responding. Six-hour due scan verifies existing observations against fresh public pages. Failed workers retry with exponential delay; expired leases can be reclaimed and old tokens cannot commit.

## Catalog and scoring

Publish reviewed activity records with canonical Google activity URLs; earned awards map by exact URL. Titles are display data, never identity or eligibility. Store immutable published rule versions and date windows; recomputation must identify its version and preserve breakdown. Current MVP stops at observations; no season estimates are fabricated. Review mappings and rule eligibility before integrating scoring.

## Scheduling

Supabase Cron queues six-hour verification and calls the worker hourly. Optional GitHub dispatch is disabled on a schedule. Edge forwarding is optional. Keep each batch at three profiles and one HTTP request per profile, with a 15-second timeout and 2 MB cap; daily traffic and quotas depend on queue size. No pricing assumption makes free usage unlimited.

## Security

Strict HTTPS host/path allowlist and redirect revalidation prevent arbitrary URL fetching. No cookies, OAuth tokens, or Google credentials are requested. Service key exists only in Node server modules. RLS protects private subscriptions and observations. Worker RPCs are service-only. Community data is aggregate and opt-in, with unverified ownership stated. Users can select someone else's public URL: do not turn this into verified identity or reward eligibility. Add account deletion, signup throttling/CAPTCHA, and operational monitoring before public launch.
