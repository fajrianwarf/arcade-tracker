import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { fetchProfile } from "../../../lib/profile";
import { SourceError } from "../../../lib/profile-url";
import { PublicProfileReader } from "../../../lib/public-profile";
export const maxDuration = 30;
const reader = new PublicProfileReader(fetchProfile);
export async function POST(request: Request) {
  if (process.env.ENABLE_PUBLIC_HTML_INGESTION !== "true")
    return NextResponse.json(
      {
        error:
          "Live profile reading is not enabled yet. The demo remains available; no Google sign-in is needed.",
        code: "source_disabled",
      },
      { status: 503 },
    );
  try {
    const stream = request.body?.getReader();
    if (!stream)
      return NextResponse.json(
        { error: "Enter a public Google Skills profile URL." },
        { status: 400 },
      );
    const parts: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const { done, value } = await stream.read();
      if (done) break;
      size += value.length;
      if (size > 4096) {
        await stream.cancel();
        return NextResponse.json(
          { error: "Request is too large." },
          { status: 413 },
        );
      }
      parts.push(value);
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const part of parts) {
      bytes.set(part, offset);
      offset += part.length;
    }
    let body: { url?: unknown; force?: unknown };
    try {
      body = JSON.parse(new TextDecoder().decode(bytes));
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON request." },
        { status: 400 },
      );
    }
    if (
      !body ||
      typeof body.url !== "string" ||
      (body.force !== undefined && typeof body.force !== "boolean")
    )
      return NextResponse.json(
        { error: "Enter a public Google Skills profile URL." },
        { status: 400 },
      );
    const ip =
      request.headers.get("x-vercel-forwarded-for") ??
      request.headers.get("x-forwarded-for") ??
      "local";
    const caller = createHash("sha256")
      .update(ip.split(",")[0].trim())
      .digest("hex");
    const result = await reader.read(body.url, caller, body.force === true);
    return NextResponse.json(
      {
        ...result,
        ownership: "unverified",
        adapter: "unsupported_public_html",
      },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    if (error instanceof SourceError) {
      const status =
        error.code === "invalid_url"
          ? 400
          : error.code === "rate_limited"
            ? 429
            : error.code === "busy"
              ? 503
              : error.code === "unavailable"
                ? 404
                : 502;
      return NextResponse.json(
        { error: error.message, code: error.code },
        {
          status,
          headers: status === 429 ? { "Retry-After": "60" } : undefined,
        },
      );
    }
    return NextResponse.json(
      { error: "Unable to read this public profile. Please try again later." },
      { status: 502 },
    );
  }
}
