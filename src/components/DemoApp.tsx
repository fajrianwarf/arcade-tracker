"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  DEMO_CATALOG,
  DEMO_PROFILE_URL,
  DEMO_RULE,
  demoScore,
  demoLeaderboard,
  earnDemoAward,
  isDemoStale,
  linkDemoProfile,
  toggleSaved,
  type DemoActivity,
} from "../lib/demo/model";
import { useDemoTracker } from "../lib/demo/useDemoTracker";

type IconName =
  | "grid"
  | "spark"
  | "arrow"
  | "check"
  | "search"
  | "users"
  | "clock"
  | "refresh"
  | "bookmark"
  | "close"
  | "arrowUp"
  | "settings"
  | "cloud"
  | "chevron";
function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  const paths: Record<IconName, ReactNode> = {
    grid: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </>
    ),
    spark: (
      <path d="m12 2 2.8 7.2L22 12l-7.2 2.8L12 22l-2.8-7.2L2 12l7.2-2.8Z" />
    ),
    arrow: <path d="M4 12h16m-6-6 6 6-6 6" />,
    check: <path d="m5 12 4 4L19 6" />,
    search: (
      <>
        <circle cx="10.5" cy="10.5" r="6.5" />
        <path d="m16 16 5 5" />
      </>
    ),
    users: (
      <>
        <circle cx="9" cy="8" r="3" />
        <path d="M3 21v-3a6 6 0 0 1 12 0v3M16 5a3 3 0 0 1 0 6m2 4a5 5 0 0 1 3 5" />
      </>
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 6v6l4 2" />
      </>
    ),
    refresh: (
      <>
        <path d="M20 9a8 8 0 0 0-14-3L3 9m0-6v6h6M4 15a8 8 0 0 0 14 3l3-3m0 6v-6h-6" />
      </>
    ),
    bookmark: <path d="M6 3h12v18l-6-4-6 4Z" />,
    close: <path d="m6 6 12 12M6 18 18 6" />,
    arrowUp: <path d="M6 18 18 6M6 6h12v12" />,
    settings: (
      <>
        <path d="M4 7h16M4 17h16" />
        <circle cx="9" cy="7" r="3" />
        <circle cx="15" cy="17" r="3" />
      </>
    ),
    cloud: (
      <path d="M7 19a5 5 0 1 1 0-10h1a6 6 0 0 1 11-1 5.5 5.5 0 0 1 0 11Z" />
    ),
    chevron: <path d="m9 5 7 7-7 7" />,
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.65"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}
function kindLabel(kind: string) {
  return kind === "skill_badge"
    ? "Skill badge"
    : kind === "game"
      ? "Arcade game"
      : "Course";
}
function BadgeArt({
  activity,
  small = false,
}: {
  activity: DemoActivity;
  small?: boolean;
}) {
  return (
    <span className={`badge-art ${activity.color} ${small ? "small" : ""}`}>
      <span>
        <Icon
          name={
            activity.kind === "game"
              ? "spark"
              : activity.kind === "skill_badge"
                ? "cloud"
                : "grid"
          }
          size={small ? 20 : 29}
        />
      </span>
    </span>
  );
}
function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const node = ref.current;
    node?.showModal();
    return () => {
      if (node?.open) node.close();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className="demo-dialog"
      aria-labelledby="dialog-title"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
    >
      <div className="dialog-header">
        <h2 id="dialog-title">{title}</h2>
        <button
          className="icon-button"
          aria-label="Close dialog"
          onClick={onClose}
        >
          <Icon name="close" />
        </button>
      </div>
      {children}
    </dialog>
  );
}
export default function DemoApp() {
  const { state, setState, ready, storageNotice, phase, sync, reset } =
    useDemoTracker();
  const [tab, setTab] = useState<"Progress" | "Catalog" | "Community">(
    "Progress",
  );
  const [filter, setFilter] = useState("all"),
    [query, setQuery] = useState(""),
    [detail, setDetail] = useState<DemoActivity | null>(null);
  const [modal, setModal] = useState<"profile" | "lab" | "rules" | null>(null),
    [notice, setNotice] = useState("");
  const [name, setName] = useState("Alex Morgan"),
    [profileUrl, setProfileUrl] = useState(DEMO_PROFILE_URL),
    [formError, setFormError] = useState("");
  const [alias, setAlias] = useState(state.community.alias),
    [sort, setSort] = useState("points");
  useEffect(() => {
    setAlias(state.community.alias);
  }, [state.community.alias]);
  const busy = phase !== "idle",
    score = demoScore(state),
    completed = new Set(state.awards.map((a) => a.activity_id));
  const stale = ready && isDemoStale(state),
    board = demoLeaderboard(state);
  const filtered = DEMO_CATALOG.filter(
    (a) =>
      (filter === "all" ||
        (filter === "saved" && state.saved.includes(a.id)) ||
        a.kind === filter) &&
      `${a.title} ${a.topic}`.toLowerCase().includes(query.toLowerCase()),
  );
  const suggestions = DEMO_CATALOG.filter(
    (a) => !completed.has(a.id) && a.kind !== "other",
  ).slice(0, 2);
  const current =
    DEMO_CATALOG.find(
      (a) => state.saved.includes(a.id) && !completed.has(a.id),
    ) ?? suggestions[0];
  function toast(message: string) {
    setNotice(message);
  }
  function openProfile() {
    setName(state.profile.name);
    setProfileUrl(state.profile.url);
    setFormError("");
    setModal("profile");
  }
  function addAward(activity: DemoActivity) {
    setState((s) => earnDemoAward(s, activity.id));
    toast(`Sample badge earned: ${activity.title}.`);
    setDetail(null);
  }
  const navItems = [
    { label: "Progress", icon: "spark" },
    { label: "Catalog", icon: "grid" },
    { label: "Community", icon: "users" },
  ] as const;
  return (
    <div className="demo-app">
      <div className="demo-strip">
        <span className="demo-dot" />
        <strong>Demo workspace</strong>
        <span>Sample data · no accounts or keys needed</span>
        <button onClick={() => setModal("lab")}>
          Demo controls <Icon name="settings" size={14} />
        </button>
      </div>
      <div className="demo-shell">
        <header className="demo-header">
          <a href="/" className="demo-logo">
            <span className="logo-mark">
              <Icon name="spark" size={25} />
            </span>
            arcade<span>atlas</span>
          </a>
          <nav aria-label="Main navigation" className="demo-nav">
            {navItems.map((n) => (
              <button
                key={n.label}
                onClick={() => {
                  setTab(n.label);
                  setNotice("");
                }}
                aria-current={tab === n.label ? "page" : undefined}
                className={tab === n.label ? "selected" : ""}
              >
                <Icon name={n.icon} size={17} />
                {n.label}
              </button>
            ))}
          </nav>
          <button
            className="profile-chip"
            onClick={openProfile}
            disabled={!ready}
          >
            <span className="avatar">{state.profile.name.charAt(0)}</span>
            <span>
              {state.signedIn ? state.profile.name.split(" ")[0] : "Guest"}
            </span>
            <Icon name="chevron" size={14} />
          </button>
        </header>
        <main className="demo-main">
          <section className="demo-heading">
            <div>
              <div className="demo-eyebrow">
                {tab === "Progress"
                  ? "YOUR LEARNING, A LITTLE CLEARER"
                  : tab === "Catalog"
                    ? "A LITTLE CURIOSITY GOES A LONG WAY"
                    : "GOOD COMPANY. SHARED PROGRESS."}
              </div>
              <h1>
                {tab === "Progress" ? (
                  <>
                    Make room for <em>your next win.</em>
                  </>
                ) : tab === "Catalog" ? (
                  <>
                    Find your <em>next challenge.</em>
                  </>
                ) : (
                  <>
                    Go further, <em>together.</em>
                  </>
                )}
              </h1>
              <p>
                {tab === "Progress"
                  ? "Your badges, your next steps, and a community to grow with."
                  : tab === "Catalog"
                    ? "A small collection of sample games and skill badges to explore."
                    : "Celebrate the small wins. See what a community dashboard could feel like."}
              </p>
            </div>
            {tab === "Progress" ? (
              <button
                className="demo-button primary"
                onClick={() => {
                  void sync();
                  setNotice("");
                }}
                disabled={
                  !ready || busy || !state.signedIn || !state.profile.linked
                }
              >
                <Icon name="refresh" size={17} />
                {busy ? "Syncing…" : "Sync profile"}
              </button>
            ) : (
              <span className="soft-tag">
                <span className="demo-dot" /> Sample {tab.toLowerCase()}
              </span>
            )}
          </section>
          {!state.signedIn && (
            <div className="callout">
              <div>
                <strong>You’re exploring as a guest.</strong>
                <p>
                  Enter the demo to try profile sync, badge completion, and
                  community membership.
                </p>
              </div>
              <button
                className="demo-button primary"
                onClick={() => {
                  setState((s) => ({ ...s, signedIn: true }));
                  toast("You entered the demo. No email or password was used.");
                }}
              >
                Enter demo <Icon name="arrow" size={16} />
              </button>
            </div>
          )}
          {(notice || storageNotice) && (
            <div className="demo-notice" role="status">
              <Icon name="check" size={16} />
              <span>{notice || storageNotice}</span>
              <button
                aria-label="Dismiss notification"
                onClick={() => setNotice("")}
                disabled={!notice}
              >
                <Icon name="close" size={15} />
              </button>
            </div>
          )}
          {tab === "Progress" ? (
            <>
              <section className="demo-stats" aria-label="Progress summary">
                <article>
                  <div className="stat-label">
                    Demo points{" "}
                    <button
                      aria-label="View demo point rules"
                      onClick={() => setModal("rules")}
                    >
                      ⓘ
                    </button>
                  </div>
                  <div className="stat-number">
                    {score.points}
                    <span>pts</span>
                  </div>
                  <small>
                    <span className="tiny-dot" /> Sample rules · v1
                  </small>
                </article>
                <article>
                  <div className="stat-label">
                    Badges earned <Icon name="spark" size={17} />
                  </div>
                  <div className="stat-number">
                    {state.awards.length}
                    <span>/ {DEMO_CATALOG.length}</span>
                  </div>
                  <small>
                    {score.skills} skill badges · {score.games} games
                  </small>
                </article>
                <article>
                  <div className="stat-label">
                    Your next goal <Icon name="arrowUp" size={17} />
                  </div>
                  <div className="stat-number">
                    {state.goalPoints}
                    <span>points</span>
                  </div>
                  <div className="mini-progress">
                    <span
                      style={{
                        width: `${Math.min(100, (score.points / state.goalPoints) * 100)}%`,
                      }}
                    />
                  </div>
                  <small>
                    {Math.max(0, state.goalPoints - score.points)} more points
                    to your demo goal
                  </small>
                </article>
                <article>
                  <div className="stat-label">
                    Saved for later <Icon name="bookmark" size={17} />
                  </div>
                  <div className="stat-number">
                    {state.saved.length}
                    <span>activities</span>
                  </div>
                  <button
                    className="text-button"
                    onClick={() => {
                      setFilter("saved");
                      setTab("Catalog");
                    }}
                  >
                    Open your shortlist <Icon name="arrow" size={14} />
                  </button>
                </article>
              </section>
              <section className="demo-two-col">
                <article className="demo-panel learner-panel">
                  <div className="panel-heading">
                    <span className="demo-eyebrow">YOUR PUBLIC PROFILE</span>
                    <span
                      className={`status-pill ${state.lastError ? "warning" : stale ? "warning" : ""}`}
                    >
                      <span className="tiny-dot" />
                      {state.lastError
                        ? "Sync needs attention"
                        : stale
                          ? "Snapshot is stale"
                          : "Snapshot ready"}
                    </span>
                  </div>
                  <div className="learner-row">
                    <div className="large-avatar">
                      {state.profile.name
                        .split(" ")
                        .slice(0, 2)
                        .map((s) => s[0])
                        .join("")}
                    </div>
                    <div>
                      <h2>{state.profile.name}</h2>
                      <p>
                        {state.profile.linked
                          ? "Sample Google Skills profile"
                          : "No profile linked"}
                      </p>
                      <span className="subtle">
                        {state.signedIn
                          ? "Demo learner · ownership unverified"
                          : "Guest session"}
                      </span>
                    </div>
                    <button className="text-button" onClick={openProfile}>
                      Manage <Icon name="arrowUp" size={14} />
                    </button>
                  </div>
                  <div className="sync-status" aria-live="polite">
                    <Icon name="refresh" size={16} />
                    <span>
                      {busy
                        ? `${phase === "queued" ? "Queued" : phase === "fetching" ? "Reading sample profile" : "Saving sample snapshot"}…`
                        : (state.lastError ??
                          `Last synced ${new Date(state.lastSuccessAt).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "UTC" })} UTC`)}
                    </span>
                  </div>
                  {busy && (
                    <div className="sync-steps">
                      {["queued", "fetching", "saving"].map((s, i) => (
                        <span
                          key={s}
                          className={
                            ["queued", "fetching", "saving"].indexOf(phase) >= i
                              ? "done"
                              : ""
                          }
                        >
                          {i + 1}. {s}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="profile-foot">
                    <span>
                      Sync adds the next sample badge. Cached progress stays
                      visible.
                    </span>
                    <button
                      onClick={() => {
                        setState((s) => ({
                          ...s,
                          lastSuccessAt: "2026-01-01T00:00:00Z",
                        }));
                        toast(
                          "The snapshot is now stale. Sync profile to refresh it.",
                        );
                      }}
                      disabled={busy}
                    >
                      Try stale data
                    </button>
                  </div>
                </article>
                <article className="demo-panel next-panel">
                  <div>
                    <span className="demo-eyebrow">A GOOD NEXT STEP</span>
                    <span className="corner-spark">
                      <Icon name="spark" size={22} />
                    </span>
                  </div>
                  <h2>
                    {score.remaining_skill_badges
                      ? "One more skill.\nOne more point."
                      : "Keep your curiosity going."}
                  </h2>
                  <p>
                    {score.remaining_skill_badges
                      ? "You have an unpaired skill badge. Earn another to add a point under the demo rules."
                      : "Pick up a new challenge and add another small win to your journey."}
                  </p>
                  <button
                    className="text-button"
                    onClick={() => {
                      setFilter("skill_badge");
                      setTab("Catalog");
                    }}
                  >
                    Explore skill badges <Icon name="arrow" size={17} />
                  </button>
                  <span className="sample-rule">
                    Illustrative scoring · not official Arcade rules
                  </span>
                </article>
              </section>
              <section className="demo-panel journal-panel">
                <div className="panel-heading">
                  <div>
                    <h2>Achievement journal</h2>
                    <p>A small record of the things you’ve learned.</p>
                  </div>
                  <span className="soft-tag">
                    {state.awards.length} sample badges
                  </span>
                </div>
                {state.awards.length ? (
                  <div className="journal-grid">
                    {[...state.awards]
                      .reverse()
                      .slice(0, 6)
                      .map((award) => {
                        const a = DEMO_CATALOG.find(
                          (c) => c.id === award.activity_id,
                        )!;
                        return (
                          <button
                            className="journal-item"
                            key={a.id}
                            onClick={() => setDetail(a)}
                          >
                            <BadgeArt activity={a} small />
                            <span>
                              <strong>{a.title}</strong>
                              <small>
                                {kindLabel(a.kind)} · {award.earned_on}
                              </small>
                            </span>
                            <Icon name="chevron" size={16} />
                          </button>
                        );
                      })}
                  </div>
                ) : (
                  <div className="demo-empty">
                    <Icon name="spark" size={32} />
                    <h3>Your next badge starts here.</h3>
                    <p>
                      Sync the sample profile or simulate earning a badge in the
                      catalog.
                    </p>
                    <button
                      className="demo-button primary"
                      onClick={() => void sync()}
                      disabled={busy || !state.signedIn}
                    >
                      Sync sample profile
                    </button>
                  </div>
                )}
                <div className="journal-foot">
                  <span>
                    {state.awards.length > 6
                      ? "Showing your six most recent sample awards."
                      : "All achievements on this screen are fictional demo data."}
                  </span>
                  <button
                    className="text-button"
                    onClick={() => {
                      setFilter("all");
                      setTab("Catalog");
                    }}
                  >
                    Browse all activities <Icon name="arrow" size={15} />
                  </button>
                </div>
              </section>
              {current && (
                <section className="shortlist-banner">
                  <div>
                    <span className="demo-eyebrow">PICK UP SOMETHING NEW</span>
                    <h3>{current.title}</h3>
                    <p>
                      {current.minutes} min · {kindLabel(current.kind)} ·{" "}
                      {current.difficulty}
                    </p>
                  </div>
                  <button
                    className="demo-button secondary"
                    onClick={() => setDetail(current)}
                  >
                    View challenge <Icon name="arrow" size={16} />
                  </button>
                </section>
              )}
            </>
          ) : tab === "Catalog" ? (
            <>
              <section className="catalog-toolbar">
                <div className="catalog-filters" aria-label="Filter activities">
                  {[
                    { id: "all", label: "All activities" },
                    { id: "game", label: "Arcade games" },
                    { id: "skill_badge", label: "Skill badges" },
                    { id: "saved", label: "Saved" },
                  ].map((f) => (
                    <button
                      key={f.id}
                      aria-pressed={filter === f.id}
                      className={filter === f.id ? "selected" : ""}
                      onClick={() => setFilter(f.id)}
                    >
                      {f.label}
                      {f.id === "saved" && <span>{state.saved.length}</span>}
                    </button>
                  ))}
                </div>
                <label className="catalog-search">
                  <Icon name="search" size={18} />
                  <input
                    aria-label="Search activities"
                    placeholder="Search activities or topics…"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </label>
              </section>
              <div className="catalog-count">
                <span>{filtered.length} sample activities</span>
                <span>Availability and rewards are fictional</span>
              </div>
              {filtered.length ? (
                <section className="demo-catalog">
                  {filtered.map((a) => (
                    <article className="demo-activity" key={a.id}>
                      <div className={`activity-art ${a.color}`}>
                        <BadgeArt activity={a} />
                        {completed.has(a.id) && (
                          <span className="completed-tag">
                            <Icon name="check" size={13} />
                            Completed
                          </span>
                        )}
                        <button
                          className={`save-button ${state.saved.includes(a.id) ? "saved" : ""}`}
                          aria-label={`${state.saved.includes(a.id) ? "Unsave" : "Save"} ${a.title}`}
                          aria-pressed={state.saved.includes(a.id)}
                          onClick={() => {
                            setState((s) => toggleSaved(s, a.id));
                          }}
                          disabled={!ready}
                        >
                          <Icon name="bookmark" size={18} />
                        </button>
                      </div>
                      <div className="activity-content">
                        <div className="activity-meta">
                          <span>{kindLabel(a.kind)}</span>
                          <span>{a.topic}</span>
                        </div>
                        <h2>{a.title}</h2>
                        <p>{a.description}</p>
                        <div className="activity-bottom">
                          <span>
                            <Icon name="clock" size={14} />
                            {a.minutes} min
                          </span>
                          <button
                            className="text-button"
                            onClick={() => setDetail(a)}
                          >
                            View details <Icon name="arrow" size={15} />
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </section>
              ) : (
                <div className="demo-empty demo-panel">
                  <Icon name="search" size={30} />
                  <h3>No activities found.</h3>
                  <p>
                    Try another search, or save an activity to build your
                    shortlist.
                  </p>
                  <button
                    className="demo-button secondary"
                    onClick={() => {
                      setQuery("");
                      setFilter("all");
                    }}
                  >
                    Clear filters
                  </button>
                </div>
              )}
            </>
          ) : (
            <>
              <section className="community-summary">
                <div className="demo-panel">
                  <Icon name="users" size={24} />
                  <strong>{board.length}</strong>
                  <span>sample learners</span>
                </div>
                <div className="demo-panel">
                  <Icon name="spark" size={24} />
                  <strong>{board.reduce((sum, r) => sum + r.badges, 0)}</strong>
                  <span>sample badges earned</span>
                </div>
                <div className="community-note">
                  <strong>Learning looks better together.</strong>
                  <p>
                    These are fictional learners and illustrative points. No
                    real community data is shared.
                  </p>
                </div>
              </section>
              <div className="demo-community-layout">
                <section className="demo-panel leaderboard-panel">
                  <div className="panel-heading">
                    <div>
                      <h2>The community board</h2>
                      <p>A little friendly momentum.</p>
                    </div>
                    <label className="sort-label">
                      Rank by{" "}
                      <select
                        aria-label="Leaderboard metric"
                        value={sort}
                        onChange={(e) => setSort(e.target.value)}
                      >
                        <option value="points">Demo points</option>
                        <option value="badges">Badge count</option>
                      </select>
                    </label>
                  </div>
                  <div className="board-scroll">
                    <table className="demo-board">
                      <thead>
                        <tr>
                          <th scope="col">Rank</th>
                          <th scope="col">Learner</th>
                          <th scope="col">Badges</th>
                          <th scope="col">Demo points</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[...board]
                          .sort((a, b) =>
                            sort === "badges"
                              ? b.badges - a.badges || b.points - a.points
                              : b.points - a.points || b.badges - a.badges,
                          )
                          .map((r, i) => (
                            <tr key={r.id} className={r.you ? "your-row" : ""}>
                              <td>
                                <span
                                  className={`rank ${i === 0 ? "first" : ""}`}
                                >
                                  {String(i + 1).padStart(2, "0")}
                                </span>
                              </td>
                              <td>
                                <span
                                  aria-hidden="true"
                                  className={`board-avatar tone-${i % 3}`}
                                >
                                  {r.alias[0]}
                                </span>
                                <strong>{r.alias}</strong>
                                {r.you && (
                                  <>
                                    {" "}
                                    <span className="you-tag">You</span>
                                  </>
                                )}
                              </td>
                              <td>{r.badges}</td>
                              <td>
                                <strong>{r.points}</strong>
                                <span className="point-unit"> pts</span>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="board-foot">
                    Sample rule version {DEMO_RULE.id} · No facilitator or
                    reward eligibility
                  </div>
                </section>
                <aside className="demo-panel join-panel">
                  <span className="join-art">
                    <Icon name="users" size={36} />
                  </span>
                  <h2>
                    {state.community.visible
                      ? "You’re part of the board."
                      : "A spot for you, too."}
                  </h2>
                  <p>
                    {state.community.visible
                      ? "Your demo profile is opted in. Change your alias or leave whenever you like."
                      : "Choose a public alias and try joining the sample leaderboard."}
                  </p>
                  {state.lastError && state.community.visible && (
                    <div className="inline-warning">
                      Your row is hidden until the next successful sync.
                    </div>
                  )}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!state.signedIn || !state.profile.linked) {
                        toast(
                          "Enter the demo and link a sample profile first.",
                        );
                        return;
                      }
                      setState((s) => ({
                        ...s,
                        community: {
                          visible: true,
                          alias: alias.trim() || s.community.alias,
                        },
                      }));
                      toast(
                        "Your sample profile is now on the community board.",
                      );
                    }}
                  >
                    <label htmlFor="demo-alias">Your public alias</label>
                    <input
                      id="demo-alias"
                      required
                      maxLength={40}
                      value={alias}
                      onChange={(e) => setAlias(e.target.value)}
                      placeholder={state.community.alias}
                    />
                    <button
                      className="demo-button primary"
                      disabled={
                        !ready ||
                        busy ||
                        !state.signedIn ||
                        !state.profile.linked
                      }
                    >
                      {state.community.visible
                        ? "Update alias"
                        : "Join sample board"}
                      <Icon name="arrow" size={16} />
                    </button>
                  </form>
                  {state.community.visible && (
                    <button
                      className="text-button leave-button"
                      disabled={busy}
                      onClick={() => {
                        setState((s) => ({
                          ...s,
                          community: { ...s.community, visible: false },
                        }));
                        toast(
                          "You left the sample board. Your progress is still saved.",
                        );
                      }}
                    >
                      Leave board
                    </button>
                  )}
                  <small>
                    Saved in this browser only. Public profile ownership is
                    unverified.
                  </small>
                </aside>
              </div>
            </>
          )}
          <footer className="demo-footer">
            <div>
              <span className="footer-star">
                <Icon name="spark" size={16} />
              </span>
              <strong>arcadeatlas</strong>
              <span>A little progress, every day.</span>
            </div>
            <button onClick={() => setModal("rules")}>
              How demo points work <Icon name="arrowUp" size={13} />
            </button>
          </footer>
        </main>
      </div>
      {detail && (
        <Modal title={detail.title} onClose={() => setDetail(null)}>
          <div className={`detail-art ${detail.color}`}>
            <BadgeArt activity={detail} />
          </div>
          <div className="detail-tags">
            <span className="soft-tag">{kindLabel(detail.kind)}</span>
            <span className="soft-tag">{detail.difficulty}</span>
            <span className="soft-tag">{detail.minutes} min</span>
          </div>
          <p>{detail.description}</p>
          <div className="detail-note">
            <strong>Fictional demo activity</strong>
            <p>
              This badge is for testing the tracker. It is not a live Google
              Skills game, enrollment, or credential.
            </p>
          </div>
          <div className="dialog-actions">
            <button
              className="demo-button primary"
              disabled={
                completed.has(detail.id) ||
                !state.signedIn ||
                !state.profile.linked ||
                busy
              }
              onClick={() => addAward(detail)}
            >
              {completed.has(detail.id)
                ? "Badge already earned"
                : "Simulate earning badge"}
              <Icon name="check" size={16} />
            </button>
            <button
              className="demo-button secondary"
              aria-pressed={state.saved.includes(detail.id)}
              onClick={() => setState((s) => toggleSaved(s, detail.id))}
            >
              <Icon name="bookmark" size={16} />
              {state.saved.includes(detail.id) ? "Saved" : "Save for later"}
            </button>
          </div>
        </Modal>
      )}
      {modal === "profile" && (
        <Modal title="Your sample profile" onClose={() => setModal(null)}>
          <p>
            Try the profile-linking flow. Any valid public profile URL entered
            here stays local; the demo never fetches it from Google.
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              let u: URL;
              try {
                u = new URL(profileUrl);
                if (
                  u.protocol !== "https:" ||
                  ![
                    "www.skills.google",
                    "skills.google",
                    "www.cloudskillsboost.google",
                    "cloudskillsboost.google",
                  ].includes(u.hostname) ||
                  u.port ||
                  u.username ||
                  u.password ||
                  !/^\/public_profiles\/[a-f\d]{8}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{12}\/?$/i.test(
                    u.pathname,
                  )
                )
                  throw new Error();
              } catch {
                setFormError(
                  "Enter an HTTPS Google Skills public profile URL with its profile UUID.",
                );
                return;
              }
              const canonical = `https://www.skills.google${u.pathname.replace(/\/$/, "")}`;
              setState((s) =>
                canonical === s.profile.url
                  ? {
                      ...s,
                      profile: {
                        ...s.profile,
                        name: name.trim() || s.profile.name,
                      },
                    }
                  : linkDemoProfile(s, name, canonical),
              );
              setModal(null);
              toast(
                "Sample profile saved locally. Sync to simulate reading its badges.",
              );
            }}
          >
            <label htmlFor="demo-name">Display name</label>
            <input
              id="demo-name"
              required
              maxLength={60}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <label htmlFor="demo-profile-url">Public profile URL</label>
            <input
              id="demo-profile-url"
              type="url"
              required
              value={profileUrl}
              onChange={(e) => {
                setProfileUrl(e.target.value);
                setFormError("");
              }}
            />
            <p className="field-error" role="alert">
              {formError}
            </p>
            <small>
              Linking a different URL resets its sample awards and community
              opt-in.
            </small>
            <div className="dialog-actions">
              <button
                className="demo-button primary"
                disabled={busy || !state.signedIn}
              >
                Save sample profile
              </button>
              <button
                type="button"
                className="demo-button secondary"
                onClick={() => {
                  setName("Alex Morgan");
                  setProfileUrl(DEMO_PROFILE_URL);
                  setFormError("");
                }}
              >
                Use sample URL
              </button>
            </div>
          </form>
        </Modal>
      )}
      {modal === "rules" && (
        <Modal title="Illustrative point rules" onClose={() => setModal(null)}>
          <span className="soft-tag">{DEMO_RULE.id}</span>
          <p>
            These rules only demonstrate versioned calculation. They have not
            been verified against the current Google Skills Arcade program.
          </p>
          <ul className="rules-list">
            <li>
              <Icon name="spark" />
              <span>
                <strong>1 sample game → 1 point</strong>
                <small>Count each unique activity once.</small>
              </span>
            </li>
            <li>
              <Icon name="cloud" />
              <span>
                <strong>2 sample skill badges → 1 point</strong>
                <small>Only complete pairs add a point.</small>
              </span>
            </li>
            <li>
              <Icon name="grid" />
              <span>
                <strong>Sample courses → 0 points</strong>
                <small>Visible in your journal; excluded from scoring.</small>
              </span>
            </li>
          </ul>
          <p className="detail-note">
            Real mode keeps Arcade totals disabled until official season rules,
            dates, and badge eligibility are reviewed.
          </p>
        </Modal>
      )}
      {modal === "lab" && (
        <Modal title="Try the demo" onClose={() => setModal(null)}>
          <p>
            Explore the full workflow without a Supabase project, Google
            requests, or email delivery.
          </p>
          <div className="lab-list">
            <button
              disabled={busy || !state.signedIn}
              onClick={() => {
                setModal(null);
                void sync("success");
              }}
            >
              Successful sync
              <span>
                Add the next sample badge <Icon name="arrow" size={15} />
              </span>
            </button>
            <button
              disabled={busy || !state.signedIn}
              onClick={() => {
                setModal(null);
                void sync("private");
              }}
            >
              Simulate a private profile
              <span>
                Keep the last snapshot <Icon name="arrow" size={15} />
              </span>
            </button>
            <button
              disabled={busy || !state.signedIn}
              onClick={() => {
                setModal(null);
                void sync("rate_limit");
              }}
            >
              Simulate rate limiting
              <span>
                Show a recoverable HTTP 429 error{" "}
                <Icon name="arrow" size={15} />
              </span>
            </button>
            <button
              disabled={busy}
              onClick={() => {
                setState((s) => ({ ...s, signedIn: !s.signedIn }));
                setModal(null);
                toast(
                  state.signedIn
                    ? "Signed out of the demo. Your progress stays in this browser."
                    : "Entered the sample learner session.",
                );
              }}
            >
              {state.signedIn ? "Sign out of demo" : "Enter demo"}
              <span>
                No account or email needed <Icon name="arrow" size={15} />
              </span>
            </button>
            <button
              className="reset-button"
              onClick={() => {
                reset();
                setAlias("Alex M.");
                setQuery("");
                setFilter("all");
                setModal(null);
                toast("Demo reset to its starting data.");
              }}
            >
              Reset demo data
              <span>
                Restore the sample profile and badges{" "}
                <Icon name="refresh" size={15} />
              </span>
            </button>
          </div>
          <small>
            Demo changes are local to this browser. Resetting does not touch any
            real data.
          </small>
        </Modal>
      )}
    </div>
  );
}
