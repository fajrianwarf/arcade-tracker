import { test } from "node:test";
import assert from "node:assert/strict";
import { POST } from "../src/app/api/public-profile/route";

const url =
  "https://www.skills.google/public_profiles/00000000-0000-4000-8000-000000000001";
const html = `<main><h1>Test Learner</h1><div class="profile-badges"><div class="profile-badge"><a class="badge-image" href="${url}/badges/123"></a><span class="ql-title-medium">A public badge</span><span class="ql-body-medium">Earned Oct 29, 2026 UTC</span></div></div></main>`;
function restore(name: string, value: string | undefined) {
  if (value === undefined) delete process.env[name];
  else process.env[name] = value;
}

test("valid manual tracking works with background ingestion false or unset, without authentication", async () => {
  const previousBackground = process.env.ENABLE_PUBLIC_HTML_INGESTION,
    previousDisable = process.env.DISABLE_PUBLIC_PROFILE_READING,
    previousFetch = globalThis.fetch;
  let calls = 0;
  delete process.env.DISABLE_PUBLIC_PROFILE_READING;
  globalThis.fetch = async (input) => {
    assert.equal(String(input), url);
    calls++;
    return new Response(html, {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  };
  try {
    for (const background of ["false", undefined]) {
      restore("ENABLE_PUBLIC_HTML_INGESTION", background);
      const response = await POST(
        new Request("https://tracker.test/api/public-profile", {
          method: "POST",
          body: JSON.stringify({ url, force: true }),
        }),
      );
      assert.equal(response.status, 200);
      const result = await response.json();
      assert.equal(result.snapshot.display_name, "Test Learner");
      assert.equal(result.snapshot.awards[0].title, "A public badge");
      assert.equal(result.ownership, "unverified");
    }
    assert.equal(calls, 2);
  } finally {
    globalThis.fetch = previousFetch;
    restore("ENABLE_PUBLIC_HTML_INGESTION", previousBackground);
    restore("DISABLE_PUBLIC_PROFILE_READING", previousDisable);
  }
});

test("manual profile reading has a separate explicit emergency pause", async () => {
  const previous = process.env.DISABLE_PUBLIC_PROFILE_READING;
  process.env.DISABLE_PUBLIC_PROFILE_READING = "true";
  try {
    const response = await POST(
      new Request("https://tracker.test/api/public-profile", {
        method: "POST",
        body: JSON.stringify({ url }),
      }),
    );
    assert.equal(response.status, 503);
    assert.equal((await response.json()).code, "source_disabled");
  } finally {
    restore("DISABLE_PUBLIC_PROFILE_READING", previous);
  }
});

test("public reader rejects malformed, oversized and non-Google inputs before collection", async () => {
  const previous = process.env.DISABLE_PUBLIC_PROFILE_READING;
  delete process.env.DISABLE_PUBLIC_PROFILE_READING;
  try {
    for (const [body, status] of [
      ["invalid json", 400],
      ["x".repeat(4097), 413],
      [JSON.stringify({ url: "https://console.cloud.google.com" }), 400],
      [JSON.stringify({ url, force: "yes" }), 400],
    ] as const) {
      const response = await POST(
        new Request("https://tracker.test/api/public-profile", {
          method: "POST",
          body,
        }),
      );
      assert.equal(response.status, status);
    }
  } finally {
    restore("DISABLE_PUBLIC_PROFILE_READING", previous);
  }
});
