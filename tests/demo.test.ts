import { test } from "node:test";
import assert from "node:assert/strict";
import {
  DEMO_CATALOG,
  DEMO_RULE,
  completeDemoSync,
  createDemoState,
  demoLeaderboard,
  demoScore,
  earnDemoAward,
  isDemoStale,
  linkDemoProfile,
  restoreDemoState,
  toggleSaved,
} from "../src/lib/demo/model";
import { resolveDataMode } from "../src/lib/data-mode";

test("demo is the default; real mode must be explicit and invalid modes fail", () => {
  assert.equal(resolveDataMode(undefined), "demo");
  assert.equal(resolveDataMode(""), "demo");
  assert.equal(resolveDataMode("supabase"), "supabase");
  assert.throws(() => resolveDataMode("live"));
});
test("seeded sample profile has reproducible versioned points", () => {
  const state = createDemoState();
  assert.equal(state.awards.length, 6);
  const score = demoScore(state);
  assert.equal(score.points, 3);
  assert.equal(score.rule_version, DEMO_RULE.id);
  assert.equal(score.remaining_skill_badges, 1);
});
test("earned badges are idempotent and paired skill points carry forward", () => {
  const state = createDemoState();
  const next = earnDemoAward(state, "skill-ai");
  assert.equal(demoScore(next).points, 4);
  assert.equal(next.awards.length, 7);
  assert.deepEqual(earnDemoAward(next, "skill-ai"), next);
  assert.deepEqual(earnDemoAward(next, "unknown"), next);
});
test("successful sync adds exactly one new badge and eventually stops without duplicates", () => {
  let state = createDemoState();
  for (let i = 0; i < 20; i++) state = completeDemoSync(state, "success");
  assert.equal(state.awards.length, DEMO_CATALOG.length);
  assert.equal(
    new Set(state.awards.map((a) => a.activity_id)).size,
    DEMO_CATALOG.length,
  );
  assert.equal(demoScore(state).points, 8);
});
test("private and rate-limited sync preserve cache; recovery clears error", () => {
  const seed = createDemoState();
  for (const outcome of ["private", "rate_limit"] as const) {
    const failed = completeDemoSync(seed, outcome);
    assert.deepEqual(failed.awards, seed.awards);
    assert.equal(failed.lastSuccessAt, seed.lastSuccessAt);
    assert.ok(failed.lastError);
    assert.equal(completeDemoSync(failed, "success").lastError, null);
  }
});
test("opt-in and failed verification control community exposure", () => {
  const state = createDemoState();
  assert.ok(!demoLeaderboard(state).some((r) => r.you));
  const joined = { ...state, community: { visible: true, alias: "My alias" } };
  assert.equal(demoLeaderboard(joined).find((r) => r.you)?.alias, "My alias");
  assert.ok(
    !demoLeaderboard(completeDemoSync(joined, "private")).some((r) => r.you),
  );
  assert.ok(
    demoLeaderboard(completeDemoSync(joined, "success")).some((r) => r.you),
  );
});
test("guest cannot change observed awards or appear on community board", () => {
  const state = {
    ...createDemoState(),
    signedIn: false,
    community: { visible: true, alias: "Guest" },
  };
  assert.deepEqual(earnDemoAward(state, "skill-ai"), state);
  assert.deepEqual(completeDemoSync(state, "success"), state);
  assert.ok(!demoLeaderboard(state).some((r) => r.you));
});
test("relink resets observations and community opt-in, preserves shortlist", () => {
  const state = {
    ...createDemoState(),
    community: { visible: true, alias: "Alias" },
  };
  const next = linkDemoProfile(
    state,
    "New name",
    "https://www.skills.google/public_profiles/00000000-0000-4000-8000-000000000002",
  );
  assert.equal(next.awards.length, 0);
  assert.equal(next.community.visible, false);
  assert.equal(next.profile.name, "New name");
  assert.deepEqual(next.saved, state.saved);
});
test("shortlist toggles known IDs and rejects unknown fixture IDs", () => {
  const seed = createDemoState();
  const next = toggleSaved(seed, "game-ai");
  assert.ok(next.saved.includes("game-ai"));
  assert.deepEqual(toggleSaved(next, "game-ai"), seed);
  assert.deepEqual(toggleSaved(seed, "unknown"), seed);
});
test("storage round trip restores state; corrupt and incompatible data reset safely", () => {
  const seed = createDemoState();
  assert.deepEqual(restoreDemoState(JSON.stringify(seed)), seed);
  for (const raw of [
    null,
    "{bad",
    "{}",
    JSON.stringify({ ...seed, version: 2 }),
    JSON.stringify({
      ...seed,
      awards: [{ activity_id: "unknown", earned_on: "2026-10-29" }],
    }),
    JSON.stringify({ ...seed, lastSuccessAt: "bad" }),
    JSON.stringify({ ...seed, goalPoints: 0 }),
  ])
    assert.equal(restoreDemoState(raw), null);
  const duplicate = { ...seed, awards: [...seed.awards, seed.awards[0]] };
  assert.equal(
    restoreDemoState(JSON.stringify(duplicate))?.awards.length,
    seed.awards.length,
  );
});
test("stale threshold is six hours, preserving the last successful snapshot", () => {
  const now = Date.parse("2026-10-29T08:00:00Z");
  const state = createDemoState(new Date(now).toISOString());
  assert.equal(isDemoStale(state, now + 5 * 3600_000), false);
  assert.equal(isDemoStale(state, now + 7 * 3600_000), true);
});
