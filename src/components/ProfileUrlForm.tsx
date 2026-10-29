"use client";
import { useState } from "react";
import { normalizeProfile } from "../lib/profile-url";
export default function ProfileUrlForm({
  initialUrl = "",
  busy = false,
  sample = false,
  onSubmit,
}: {
  initialUrl?: string;
  busy?: boolean;
  sample?: boolean;
  onSubmit: (url: string) => void | Promise<void>;
}) {
  const [url, setUrl] = useState(initialUrl),
    [error, setError] = useState("");
  return (
    <form
      className="profile-url-form"
      onSubmit={(e) => {
        e.preventDefault();
        try {
          const canonical = normalizeProfile(url.trim());
          setError("");
          void onSubmit(canonical);
        } catch (e) {
          setError(
            e instanceof Error
              ? e.message
              : "Enter a valid public profile URL.",
          );
        }
      }}
    >
      <label htmlFor="public-profile-url">
        Public Google Skills profile URL
      </label>
      <div className="profile-url-input-row">
        <input
          id="public-profile-url"
          type="url"
          required
          placeholder="https://www.skills.google/public_profiles/…"
          value={url}
          aria-describedby="profile-url-hint profile-url-error"
          onChange={(e) => {
            setUrl(e.target.value);
            setError("");
          }}
        />
        <button className="demo-button primary" disabled={busy}>
          {busy ? "Reading profile…" : "Track profile"}{" "}
          <span aria-hidden="true">→</span>
        </button>
      </div>
      <small id="profile-url-hint">
        {sample
          ? "Demo mode: the URL stays in this browser and loads sample progress."
          : "Read publicly visible badges. No Google sign-in, password, or Cloud Console access needed."}
      </small>
      <p id="profile-url-error" className="field-error" role="alert">
        {error}
      </p>
    </form>
  );
}
