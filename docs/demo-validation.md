# Dummy MVP validation — 29 October 2026

The application defaults to a browser-local dummy mode without credentials or external data requests. Live mode requires explicit selection and retains the original backend code.

Final result: **24 tests passed**, TypeScript checks passed, and the Next.js production build passed.

## Checks

- State/model tests: deterministic fixture scoring and date window, duplicate prevention, bounded repeated synchronization, stale detection, failure cache preservation/recovery, guest restrictions, community visibility, profile relinking, saved activities, corrupt storage recovery.
- Component workflow in isolated JSDOM: hydrate rendered HTML, navigate catalog, search, open details, simulate a skill badge, join/leave community, simulate a private source, sync successfully, unmount/remount to verify persistence, sign out/in, reset, reject a non-Google URL and relink a valid sample profile.
- The component test replaces `fetch` with a failing stub and asserts zero requests through the workflow.
- Original HTML parser, exact activity scoring, catalog extraction and embedded PostgreSQL/RLS/lease tests are retained.
- TypeScript and Next.js production build checked after changes.

## Browser and hosting limits

The managed preview rendered the desktop dashboard. The initial development preview did not complete client interactivity. Its startup script now translates preview flags for Next.js and uses webpack development mode. A cloud-browser URL-policy rejection blocked the reload, so that repair and final visual/mobile behavior could not be verified in the cloud browser. Do not describe the browser end-to-end test as passed.

Local DOM hydration and interactions are tested independently of the cloud browser. Real Supabase/Vercel/Google integration is not exercised by dummy mode. No live credentials are included and no official Arcade points are asserted.
