"use client";
import { useMemo, useState, type ReactNode } from "react";
import {
  officialActivityUrl,
  selectCatalog,
  type CatalogItem,
  type CompletionFilter,
} from "../lib/catalog-view";
type Props = {
  items: CatalogItem[];
  completed: ReadonlySet<string>;
  saved: ReadonlySet<string>;
  sample?: boolean;
  profileLinked?: boolean;
  initialKind?: string;
  initialStatus?: CompletionFilter;
  onSave: (id: string) => void;
  onOpen?: (item: CatalogItem) => void;
  onTrack: () => void;
  renderArt?: (item: CatalogItem) => ReactNode;
};
function label(kind: string) {
  return kind === "game"
    ? "Arcade game"
    : kind === "skill_badge"
      ? "Skill badge"
      : "Course";
}
export default function CatalogPanel({
  items,
  completed,
  saved,
  sample = false,
  profileLinked = false,
  initialKind = "all",
  initialStatus = "all",
  onSave,
  onOpen,
  onTrack,
  renderArt,
}: Props) {
  const [kind, setKind] = useState(initialKind),
    [status, setStatus] = useState<CompletionFilter>(initialStatus),
    [query, setQuery] = useState(""),
    [view, setView] = useState<"grid" | "list">("grid"),
    [copied, setCopied] = useState("");
  const filtered = useMemo(
    () => selectCatalog(items, kind, status, query, completed, saved),
    [items, kind, status, query, completed, saved],
  );
  const count = (type: string) => items.filter((a) => a.kind === type).length;
  const done = items.filter((a) => completed.has(a.id)).length;
  async function copyCode(item: CatalogItem) {
    try {
      await navigator.clipboard.writeText(item.access_code!);
      setCopied(item.id);
    } catch {
      setCopied("unavailable");
    }
  }
  return (
    <div className="catalog-workspace">
      <details className="catalog-start-guide">
        <summary>
          <span className="catalog-guide-tag">GET STARTED</span>
          <strong>A simple path to your next badge</strong>
          <span className="guide-chevron">⌄</span>
        </summary>
        <div className="catalog-guide-steps">
          <article>
            <span>01</span>
            <div>
              <h3>Explore the games</h3>
              <p>
                Find a challenge that interests you. Check its availability on
                Google Skills.
              </p>
              <button
                className="text-button"
                onClick={() => {
                  setKind("game");
                  setStatus("all");
                  setQuery("");
                }}
              >
                Browse games →
              </button>
            </div>
          </article>
          <article>
            <span>02</span>
            <div>
              <h3>Build your skills</h3>
              <p>
                Save your targets and use your public profile to see what you’ve
                completed.
              </p>
              <button
                className="text-button"
                onClick={() => {
                  setKind("skill_badge");
                  setStatus("incomplete");
                  setQuery("");
                }}
              >
                Find your next skill badge →
              </button>
            </div>
          </article>
        </div>
      </details>
      <section className="catalog-profile-prompt">
        <div>
          <strong>
            {profileLinked
              ? "Your progress, right in the catalog."
              : "See which badges you’ve already earned."}
          </strong>
          <p>
            {sample
              ? "This workspace uses sample badges and illustrative points."
              : "Paste your public Google Skills profile URL to compare your earned badges."}
          </p>
        </div>
        <button className="demo-button secondary" onClick={onTrack}>
          {profileLinked ? "Manage profile" : "Track public profile"}{" "}
          <span aria-hidden="true">↗</span>
        </button>
      </section>
      <section className="demo-panel catalog-board">
        <div className="catalog-board-heading">
          <div>
            <h2>
              Badge catalog{" "}
              <span className="catalog-progress-count">
                {done}
                <small> / {items.length}</small>
              </span>
            </h2>
            <p>
              {sample
                ? "Fictional activities for trying the tracker."
                : "Reviewed activity identities. Availability and Arcade eligibility need separate verification."}
            </p>
          </div>
          <div
            className="catalog-view-switch"
            role="group"
            aria-label="Catalog view"
          >
            <button
              aria-label="Grid view"
              aria-pressed={view === "grid"}
              onClick={() => setView("grid")}
            >
              <svg
                width="17"
                height="17"
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                aria-hidden="true"
              >
                <rect x="2" y="2" width="6" height="6" rx="1" />
                <rect x="12" y="2" width="6" height="6" rx="1" />
                <rect x="2" y="12" width="6" height="6" rx="1" />
                <rect x="12" y="12" width="6" height="6" rx="1" />
              </svg>
            </button>
            <button
              aria-label="List view"
              aria-pressed={view === "list"}
              onClick={() => setView("list")}
            >
              <svg
                width="17"
                height="17"
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path d="M7 4h11M7 10h11M7 16h11M2 4h2M2 10h2M2 16h2" />
              </svg>
            </button>
          </div>
        </div>
        <div className="catalog-type-tabs" aria-label="Activity type">
          {[
            { id: "all", name: "All activities", n: items.length },
            { id: "game", name: "Arcade games", n: count("game") },
            {
              id: "skill_badge",
              name: "Skill badges",
              n: count("skill_badge"),
            },
          ].map((t) => (
            <button
              key={t.id}
              aria-pressed={kind === t.id}
              onClick={() => setKind(t.id)}
            >
              {t.name}
              <span>{t.n}</span>
            </button>
          ))}
        </div>
        <div className="catalog-filter-row">
          <label className="catalog-search">
            <svg
              width="17"
              height="17"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              aria-hidden="true"
            >
              <circle cx="8" cy="8" r="5.5" />
              <path d="m12 12 5 5" />
            </svg>
            <input
              aria-label="Search activities"
              placeholder="Search badges, topics, or difficulty…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {query && (
              <button aria-label="Clear search" onClick={() => setQuery("")}>
                ×
              </button>
            )}
          </label>
          <div className="catalog-status-tabs" aria-label="Completion filter">
            {[
              { id: "all", name: "All" },
              { id: "incomplete", name: "Not completed" },
              { id: "saved", name: "My targets" },
              { id: "complete", name: "Completed" },
            ].map((t) => (
              <button
                key={t.id}
                aria-pressed={status === t.id}
                onClick={() => setStatus(t.id as CompletionFilter)}
              >
                {t.name}
                {t.id === "saved" && <span>{saved.size}</span>}
              </button>
            ))}
          </div>
        </div>
        <div className="catalog-results-note" role="status">
          <span>
            {filtered.length}{" "}
            {filtered.length === 1 ? "activity" : "activities"}
            {query && ` matching “${query}”`}
          </span>
          <span>
            {sample
              ? "Sample rules · not official Arcade points"
              : "Only official Google Skills activity links"}
          </span>
        </div>
        {filtered.length ? (
          <div
            className={`catalog-results ${view === "list" ? "is-list" : ""}`}
          >
            {filtered.map((item) => {
              const url = officialActivityUrl(item.source_url);
              const earned = completed.has(item.id);
              return (
                <article
                  className={`catalog-tile ${earned ? "is-complete" : ""}`}
                  key={item.id}
                >
                  <div className="catalog-tile-art">
                    <span className={`catalog-kind ${item.kind}`}>
                      {label(item.kind)}
                    </span>
                    <button
                      className={`catalog-target ${saved.has(item.id) ? "is-saved" : ""}`}
                      aria-label={`${saved.has(item.id) ? "Unsave" : "Save"} ${item.title}`}
                      aria-pressed={saved.has(item.id)}
                      onClick={() => onSave(item.id)}
                    >
                      <svg
                        width="17"
                        height="17"
                        viewBox="0 0 20 20"
                        fill="none"
                        stroke="currentColor"
                        aria-hidden="true"
                      >
                        <path d="M5 2h10v16l-5-3-5 3Z" />
                      </svg>
                    </button>
                    <div className="catalog-emblem">
                      {renderArt ? (
                        renderArt(item)
                      ) : (
                        <span
                          className="catalog-default-badge"
                          aria-hidden="true"
                        >
                          ✧
                        </span>
                      )}
                    </div>
                    {earned && (
                      <span className="catalog-earned">✓ Completed</span>
                    )}
                  </div>
                  <div className="catalog-tile-main">
                    <div className="catalog-tile-labels">
                      <span>{item.topic ?? "Google Skills"}</span>
                      {item.difficulty && <span>{item.difficulty}</span>}
                    </div>
                    <h3>{item.title}</h3>
                    {item.description && <p>{item.description}</p>}
                    <div className="catalog-badge-facts">
                      <span>
                        {sample
                          ? item.kind === "game"
                            ? "1 demo point"
                            : item.kind === "skill_badge"
                              ? "2 badges → 1 demo point"
                              : "Completion badge"
                          : "Points pending verification"}
                      </span>
                      {item.minutes && <span>{item.minutes} min</span>}
                    </div>
                    {item.access_code && (
                      <button
                        className="catalog-access-code"
                        aria-label={`Copy access code for ${item.title}`}
                        onClick={() => void copyCode(item)}
                      >
                        <span>{item.access_code}</span>
                        <small>
                          {copied === item.id ? "Copied ✓" : "Copy code"}
                        </small>
                      </button>
                    )}
                    <div className="catalog-tile-footer">
                      {onOpen ? (
                        <button
                          className="demo-button secondary"
                          onClick={() => onOpen(item)}
                        >
                          View details <span aria-hidden="true">↗</span>
                        </button>
                      ) : url ? (
                        <a
                          className="demo-button secondary"
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {item.kind === "game" ? "Open game" : "Open badge"}{" "}
                          <span aria-hidden="true">↗</span>
                        </a>
                      ) : (
                        <span className="catalog-no-link">
                          Official activity link unavailable
                        </span>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="demo-empty">
            <h3>No activities found.</h3>
            <p>Try another search or adjust the type and completion filters.</p>
            <button
              className="demo-button secondary"
              onClick={() => {
                setQuery("");
                setKind("all");
                setStatus("all");
              }}
            >
              Clear filters
            </button>
          </div>
        )}
        {copied === "unavailable" && (
          <p role="status" className="catalog-copy-note">
            Clipboard access is unavailable. You can select and copy the code
            directly.
          </p>
        )}
      </section>
    </div>
  );
}
