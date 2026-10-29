# Manual tracking fix and focused MVP scope

The reported error was emitted before URL validation or a Google request: the manual profile endpoint incorrectly required `ENABLE_PUBLIC_HTML_INGESTION=true`. This inherited the background-collection opt-in and blocked all manual lookups when left false or unset.

Manual tracking now reads public profiles by default. It retains URL validation, request/body limits, bounded concurrency, timeout, cache and coalescing. Scheduled workers still require their original opt-in. A separate emergency pause, `DISABLE_PUBLIC_PROFILE_READING=true`, disables manual reads only when explicitly requested. No new Vercel environment variable is required for this fix.

The app now exposes only Progress and Catalog. Community navigation, both board interfaces, fixture leaderboard records, membership controls, and `/api/leaderboard` have been removed. Existing SQL schema/data is retained for possible future work. Old local demo data keeps its progress and targets while its retired membership fields are ignored.

Regression tests cover a valid manual read with background ingestion false and unset, the independent pause, malformed/oversized/invalid inputs, and the two-item navigation. A live read through the route is also checked using a previously public test profile. The Google HTML adapter remains unsupported; visible awards do not prove full history or account ownership.
