# Source feasibility — verified 22 October 2026

## Officially documented behavior

Google documents that profiles are private by default and a learner can make a profile public. Public fields include name, member year, earned badges and photo. This documents visibility, not a supported data API or permission for unlimited automated requests.

- https://support.google.com/qwiklabs/answer/9222527?hl=en
- https://www.skills.google/catalog
- https://go.cloudskillsboost.google/arcade

No documented unauthenticated Google Skills profile/badge JSON API was identified in this check. Do not confuse Google Business Profile APIs, Developer Program profiles, Credly credentials or internal frontend routes with an official Google Skills ingestion API.

## Live PoC observations

A read-only request to a publicly linked profile on www.skills.google returned HTML. The implemented Node fetch/parser extracted 10 unique credential IDs, 10 earned dates and 10 canonical activity links. The source page contains `.profile-badges`, `.profile-badge`, `a.badge-image`, title/date spans and award-detail dialogs linking to course templates. A league/XP total is also visible but is deliberately ignored for Arcade scoring.

Observed HTML size: 41,739 bytes via curl. This is one sample, not proof of complete history, stable DOM, pagination semantics, universal accessibility or an SLA. No HTML or identifiable live sample is shipped with this project. Unit fixtures use invented learner data.

www.skills.google/robots.txt returned `Disallow: /api/` and restrictions on lab start/resume/stop paths. Public profile paths were not disallowed in the observed file. Robots directives are not an API contract or legal authorization. The adapter avoids internal `/api/` routes, login sessions, lab actions and challenge bypasses. 403/429/challenges are treated as unavailable sources with preserved cache and bounded retries.

The official Arcade landing page returned about 230 KB of HTML with encoded `data-code` embeds. Parsing that public embed identified four named game cards: Base Camp (7499), Adventure (7496), Voyage (7497), Trail (7498). The collector emits unpublished candidates. A separate reviewed seed migration contains these four observed identities and two skill badge identities explicitly described in Google's public award dialogs. It does not assert current enrollment availability or point eligibility.

## Boundaries

API-first remains a selection strategy: use a documented API if one becomes available. Currently the usable adapter is public HTML, explicitly unsupported and feature-gated. It may break without notice. Reassess Google's terms and access behavior before production collection; a robots rule permitting a path does not establish a stable supported integration. Free-tier capacity must be measured at the chosen workload.

OAuth login to this app identifies a Supabase user, not the owner of an arbitrary Google Skills URL. Connecting a public URL establishes an observation subscription only. The community board requires explicit opt-in, shows aliases and badge observations, and excludes profiles with a recent verification failure or snapshots older than seven days. It cannot establish prize eligibility or prevent all impersonation.

## Scheduling references

- Supabase Cron and pg_net/Vault scheduling: https://supabase.com/docs/guides/functions/schedule-functions
- Supabase Cron: https://supabase.com/docs/guides/cron
- Vercel Hobby cron is once per day and not precise to the minute: https://vercel.com/docs/cron-jobs/usage-and-pricing
- Vercel Hobby terms include personal/non-commercial restrictions: https://vercel.com/docs/plans/hobby

Use Supabase Cron as the default scheduler; the optional GitHub workflow has its schedule disabled. No live credentials or hosting account were available in this workspace, so hosted Auth, SMTP, Cron, Vault, Edge deployment and Vercel network behavior have not been verified.
