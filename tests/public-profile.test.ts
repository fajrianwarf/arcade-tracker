import { test } from "node:test";
import assert from "node:assert/strict";
import { PublicProfileReader } from "../src/lib/public-profile";
import type { ProfileSnapshot } from "../src/lib/profile";
const url =
  "https://www.skills.google/public_profiles/00000000-0000-4000-8000-000000000001";
const snapshot: ProfileSnapshot = {
  url,
  display_name: "Sample learner",
  awards: [],
  fetched_at: "2026-10-29T00:00:00Z",
  adapter_version: "test",
  coverage: "visible_page_only",
  warnings: [],
};
test("public lookup needs only a URL, canonicalizes it and caches a successful result", async () => {
  let calls = 0;
  const reader = new PublicProfileReader(async () => {
    calls++;
    return snapshot;
  });
  assert.equal(
    (
      await reader.read(
        url.replace("www.skills.google", "www.cloudskillsboost.google"),
        "test",
      )
    ).cached,
    false,
  );
  assert.equal((await reader.read(url, "test")).cached, true);
  assert.equal(calls, 1);
});
test("expired snapshots and explicit refresh recheck the source", async () => {
  let calls = 0,
    now = 0;
  const reader = new PublicProfileReader(
    async () => {
      calls++;
      return snapshot;
    },
    () => now,
  );
  await reader.read(url, "test");
  await reader.read(url, "test", true);
  now = 7 * 3600_000;
  await reader.read(url, "test");
  assert.equal(calls, 3);
});
test("invalid or Cloud Console URLs never reach the collector", async () => {
  let calls = 0;
  const reader = new PublicProfileReader(async () => {
    calls++;
    return snapshot;
  });
  await assert.rejects(
    reader.read("https://console.cloud.google.com/", "test"),
    /Google Skills/,
  );
  assert.equal(calls, 0);
});
test("a failed forced refresh invalidates server cache while the client can retain its snapshot", async () => {
  let calls = 0;
  const reader = new PublicProfileReader(async () => {
    if (++calls > 1) throw new Error("private");
    return snapshot;
  });
  await reader.read(url, "test");
  await assert.rejects(reader.read(url, "test", true), /private/);
  await assert.rejects(reader.read(url, "test"), /private/);
  assert.equal(calls, 3);
});
test("duplicate in-flight lookups are coalesced", async () => {
  let finish!: (s: ProfileSnapshot) => void,
    calls = 0;
  const reader = new PublicProfileReader(() => {
    calls++;
    return new Promise((resolve) => (finish = resolve));
  });
  const a = reader.read(url, "a"),
    b = reader.read(url, "b");
  finish(snapshot);
  await Promise.all([a, b]);
  assert.equal(calls, 1);
});
test("per-instance request budget refuses excessive checks and resets after a minute", async () => {
  let now = 0;
  const reader = new PublicProfileReader(
    async () => snapshot,
    () => now,
  );
  for (let i = 0; i < 20; i++) await reader.read(url, "same");
  await assert.rejects(reader.read(url, "same"), /wait a minute/);
  now = 61000;
  assert.ok(await reader.read(url, "same"));
});
