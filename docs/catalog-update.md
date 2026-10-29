# Catalog and public profile entry — 29 October 2026

The catalog takes the reference browsing structure from https://arcadehub-id.vercel.app/catalog: a compact beginner guide, public-profile prompt, type counts, search, completion/target filters, grid/list views, and badge cards. It retains Arcade Atlas styling and supports direct navigation to `/catalog`.

Only canonical HTTPS Google Skills activity URLs can become catalog links. GitHub, community solution searches, credential-bearing URLs, other hosts, and internal Google API paths are rejected. Demo activities remain fictional; their access codes and points are explicitly samples. No reference site code, solution links, or claims about current season scoring were copied.

Public profile tracking now starts with a public Google Skills URL. Cloud Console URLs are rejected. Names come from the collected public profile; no Google password, Cloud Console access, or app login is required for lookup. The separate account-backed storage/RLS/queue endpoints remain available for future optional membership workflows.

`POST /api/public-profile` is disabled by default behind the existing HTML-ingestion flag. Its read-only adapter is unsupported by Google. It uses a six-hour, 100-entry per-instance cache, per-caller request budget, two-source-request concurrency cap, in-flight request coalescing, redirect validation, and bounded body sizes/timeouts. It is not a distributed quota or a durable scheduler. Failed refreshes invalidate server cache; the browser keeps its previous observed snapshot with an error. Supabase queue/Cron infrastructure is retained separately.

Reference screenshots were inspected in the browser. Local preview verification was blocked by environment connectivity and URL-policy errors. Component tests and production builds cover the implementation; final visual/mobile behavior requires deployment review.
