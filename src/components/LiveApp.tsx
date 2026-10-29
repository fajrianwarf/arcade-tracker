"use client";
import { useEffect, useState } from "react";
import CatalogPanel from "./CatalogPanel";
import ProfileUrlForm from "./ProfileUrlForm";
import { officialActivityUrl, type CatalogItem } from "../lib/catalog-view";
import type { ProfileSnapshot } from "../lib/profile";
type Tab = "Progress" | "Catalog";
const SNAPSHOT_KEY = "arcade-atlas.public-profile.v1",
  TARGETS_KEY = "arcade-atlas.public-targets.v1";
export default function LiveApp({
  initialTab = "Progress",
}: { initialTab?: Tab } = {}) {
  const [tab, setTab] = useState<Tab>(initialTab),
    [snapshot, setSnapshot] = useState<ProfileSnapshot | null>(null),
    [items, setItems] = useState<CatalogItem[]>([]),
    [targets, setTargets] = useState<string[]>([]),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [error, setError] = useState(""),
    [ready, setReady] = useState(false);
  useEffect(() => {
    try {
      const saved = localStorage.getItem(SNAPSHOT_KEY);
      if (saved) {
        const s = JSON.parse(saved);
        if (
          typeof s.url === "string" &&
          typeof s.display_name === "string" &&
          typeof s.fetched_at === "string" &&
          Array.isArray(s.awards) &&
          s.awards.every(
            (a: {
              activity_url: unknown;
              title: unknown;
              credential_url: unknown;
              external_id: unknown;
            }) =>
              a &&
              typeof a.title === "string" &&
              typeof a.external_id === "string" &&
              typeof a.credential_url === "string" &&
              (a.activity_url === null || typeof a.activity_url === "string"),
          )
        )
          setSnapshot(s);
      }
      const list = JSON.parse(localStorage.getItem(TARGETS_KEY) ?? "[]");
      if (Array.isArray(list) && list.every((v) => typeof v === "string"))
        setTargets(list);
    } catch {
      /* Ignore corrupt optional browser cache. */
    }
    setReady(true);
  }, []);
  useEffect(() => {
    if (!ready) return;
    try {
      if (snapshot)
        localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(snapshot));
      localStorage.setItem(TARGETS_KEY, JSON.stringify(targets));
    } catch {
      /* Persistence is optional; current session remains usable. */
    }
  }, [snapshot, targets, ready]);
  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    setError("");
    if (tab === "Catalog") {
      fetch("/api/catalog", {
        signal: controller.signal,
      })
        .then(async (res) => {
          const data = await res.json();
          if (!res.ok) throw new Error(data.error ?? "Unable to load data.");
          if (active) {
            setItems(data.items);
          }
        })
        .catch((e) => {
          if (active) setError(e.message);
        });
    }
    return () => {
      active = false;
      controller.abort();
    };
  }, [tab]);
  async function track(url: string, force = false) {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch("/api/public-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, force }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Unable to read profile.");
      setSnapshot(data.snapshot);
      setMessage(
        data.cached
          ? "Loaded your cached public snapshot."
          : "Public profile updated. Only visible awards were observed.",
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to read profile.");
    } finally {
      setBusy(false);
    }
  }
  const awardUrls = new Set(
    (snapshot?.awards ?? [])
      .map((a) => officialActivityUrl(a.activity_url ?? undefined))
      .filter(Boolean),
  );
  const completed = new Set(
    items
      .filter((a) => awardUrls.has(officialActivityUrl(a.source_url)))
      .map((a) => a.id),
  );
  function toggleTarget(id: string) {
    setTargets((s) =>
      s.includes(id) ? s.filter((v) => v !== id) : [...s, id],
    );
  }
  return (
    <div className="demo-app">
      <div className="demo-strip">
        <span className="demo-dot" />
        <strong>Public profile tracker</strong>
        <span>Public Google Skills badges · independent learning tool</span>
      </div>
      <div className="demo-shell">
        <header className="demo-header">
          <a href="/" className="demo-logo">
            <span className="logo-mark">✧</span>arcade<span>atlas</span>
          </a>
          <nav className="demo-nav" aria-label="Main navigation">
            {(["Progress", "Catalog"] as const).map((t) => (
              <button
                key={t}
                aria-current={tab === t ? "page" : undefined}
                className={tab === t ? "selected" : ""}
                onClick={() => setTab(t)}
              >
                {t}
              </button>
            ))}
          </nav>
          <span className="soft-tag">Google Skills</span>
        </header>
        <main className="demo-main">
          <section className="demo-heading">
            <div>
              <span className="demo-eyebrow">
                YOUR LEARNING, A LITTLE CLEARER
              </span>
              <h1>
                {tab === "Catalog" ? (
                  <>
                    Find your <em>next challenge.</em>
                  </>
                ) : (
                  <>
                    Your progress starts <em>with one link.</em>
                  </>
                )}
              </h1>
              <p>
                {tab === "Progress"
                  ? "Paste your public Google Skills profile URL. No Google account sign-in required."
                  : "Explore games and skill badges. Save your next targets."}
              </p>
            </div>
          </section>
          {error && (
            <div className="inline-warning live-error" role="alert">
              {error}
              {snapshot &&
                tab === "Progress" &&
                " Your previous snapshot is still visible."}
            </div>
          )}
          {message && (
            <p role="status" className="demo-notice">
              {message}
            </p>
          )}
          {tab === "Progress" ? (
            <>
              <section className="demo-panel profile-entry-panel">
                <div>
                  <span className="demo-eyebrow">
                    PUBLIC GOOGLE SKILLS PROFILE
                  </span>
                  <h2>One link. Your learning in view.</h2>
                  <p>
                    Use the shareable profile link from Google Skills, where
                    your badges are displayed.
                  </p>
                </div>
                <ProfileUrlForm
                  key={snapshot?.url ?? "empty"}
                  initialUrl={snapshot?.url}
                  busy={busy}
                  onSubmit={(url) => track(url)}
                />
              </section>
              {snapshot ? (
                <>
                  <section className="demo-two-col">
                    <article className="demo-panel learner-panel">
                      <div className="panel-heading">
                        <span className="demo-eyebrow">
                          YOUR PUBLIC SNAPSHOT
                        </span>
                        <span className="soft-tag">Ownership unverified</span>
                      </div>
                      <div className="learner-row">
                        <div className="large-avatar">
                          {snapshot.display_name.charAt(0)}
                        </div>
                        <div>
                          <h2>{snapshot.display_name}</h2>
                          <p>{snapshot.awards.length} visible badges</p>
                        </div>
                      </div>
                      <p className="subtle">
                        Last observed{" "}
                        {new Date(snapshot.fetched_at).toLocaleString()} ·
                        visible page only
                      </p>
                      <button
                        className="demo-button secondary"
                        disabled={busy}
                        onClick={() => void track(snapshot.url, true)}
                      >
                        {busy ? "Refreshing…" : "Refresh public profile"}
                      </button>
                    </article>
                    <article className="demo-panel next-panel">
                      <span className="demo-eyebrow">FIND YOUR NEXT STEP</span>
                      <h2>Keep your curiosity going.</h2>
                      <p>
                        Open the catalog to compare your earned badges and save
                        activities to your targets.
                      </p>
                      <button
                        className="text-button"
                        onClick={() => setTab("Catalog")}
                      >
                        Browse the catalog →
                      </button>
                      <small className="sample-rule">
                        Arcade points remain pending verified season rules.
                      </small>
                    </article>
                  </section>
                  <section className="demo-panel journal-panel">
                    <div className="panel-heading">
                      <h2>Achievement journal</h2>
                      <span className="soft-tag">
                        {snapshot.awards.length} observed awards
                      </span>
                    </div>
                    <div className="journal-grid">
                      {snapshot.awards.map((a) => (
                        <div className="journal-item" key={a.external_id}>
                          <span
                            className="catalog-default-badge small"
                            aria-hidden="true"
                          >
                            ✧
                          </span>
                          <span>
                            <strong>{a.title}</strong>
                            <small>
                              {a.earned_label || "Earned date unavailable"}
                            </small>
                          </span>
                        </div>
                      ))}
                    </div>
                  </section>
                </>
              ) : (
                <section className="demo-panel demo-empty">
                  <h3>Bring your badges into view.</h3>
                  <p>
                    Your profile must be public. A Cloud Console account URL
                    does not show learning badges.
                  </p>
                </section>
              )}
            </>
          ) : (
            <CatalogPanel
              items={items}
              completed={completed}
              saved={new Set(targets)}
              profileLinked={!!snapshot}
              onSave={toggleTarget}
              onTrack={() => setTab("Progress")}
            />
          )}
          <footer className="demo-footer">
            <strong>✧ arcadeatlas</strong>
            <span>Independent tracker · Public data only</span>
          </footer>
        </main>
      </div>
    </div>
  );
}
