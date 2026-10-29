import { test } from "node:test";
import assert from "node:assert/strict";
import { POST } from "../src/app/api/public-profile/route";
test("anonymous public reader is gated explicitly and never requires a Google login", async () => {
  const original = process.env.ENABLE_PUBLIC_HTML_INGESTION;
  try {
    delete process.env.ENABLE_PUBLIC_HTML_INGESTION;
    const res = await POST(
      new Request("https://tracker.test/api/public-profile", {
        method: "POST",
        body: "{}",
      }),
    );
    assert.equal(res.status, 503);
    assert.equal((await res.json()).code, "source_disabled");
  } finally {
    if (original === undefined) delete process.env.ENABLE_PUBLIC_HTML_INGESTION;
    else process.env.ENABLE_PUBLIC_HTML_INGESTION = original;
  }
});
test("public reader rejects malformed, oversized and non-Google inputs before collection", async () => {
  const original = process.env.ENABLE_PUBLIC_HTML_INGESTION;
  process.env.ENABLE_PUBLIC_HTML_INGESTION = "true";
  try {
    for (const [body, status] of [
      ["invalid json", 400],
      ["x".repeat(4097), 413],
      [JSON.stringify({ url: "https://console.cloud.google.com" }), 400],
      [
        JSON.stringify({
          url: "https://www.skills.google/public_profiles/00000000-0000-4000-8000-000000000001",
          force: "yes",
        }),
        400,
      ],
    ] as const) {
      const res = await POST(
        new Request("https://tracker.test/api/public-profile", {
          method: "POST",
          body,
        }),
      );
      assert.equal(res.status, status);
    }
  } finally {
    if (original === undefined) delete process.env.ENABLE_PUBLIC_HTML_INGESTION;
    else process.env.ENABLE_PUBLIC_HTML_INGESTION = original;
  }
});
