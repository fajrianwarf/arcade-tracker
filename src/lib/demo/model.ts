import { calculatePoints, type Rule } from "../points";

export type ActivityKind = "game" | "skill_badge" | "other";
export type DemoActivity = {
  id: string;
  title: string;
  kind: ActivityKind;
  description: string;
  topic: "Cloud" | "Data" | "AI" | "Security";
  minutes: number;
  color: string;
  difficulty: "Beginner" | "Intermediate";
};
// Fictional fixture identities. These are deliberately never passed to the real ingestion adapter.
export const DEMO_CATALOG: DemoActivity[] = [
  {
    id: "game-launch",
    title: "Arcade Launchpad",
    kind: "game",
    topic: "Cloud",
    minutes: 45,
    color: "mint",
    difficulty: "Beginner",
    description:
      "Find your footing in the cloud. Explore projects, resources, and your first deployment in this sample game.",
  },
  {
    id: "game-data",
    title: "Data Explorer",
    kind: "game",
    topic: "Data",
    minutes: 60,
    color: "blue",
    difficulty: "Beginner",
    description:
      "Follow a small dataset from storage to useful insights in a sample data adventure.",
  },
  {
    id: "game-serverless",
    title: "The Serverless Sprint",
    kind: "game",
    topic: "Cloud",
    minutes: 55,
    color: "peach",
    difficulty: "Intermediate",
    description:
      "Build an event-driven workflow and connect small services in this fictional challenge.",
  },
  {
    id: "game-ai",
    title: "AI Playground",
    kind: "game",
    topic: "AI",
    minutes: 50,
    color: "lilac",
    difficulty: "Beginner",
    description:
      "Explore prompts, model responses, and useful AI application patterns in this sample game.",
  },
  {
    id: "game-security",
    title: "Security Trail",
    kind: "game",
    topic: "Security",
    minutes: 65,
    color: "yellow",
    difficulty: "Intermediate",
    description:
      "Practice the basics of secure cloud access through a fictional set of challenges.",
  },
  {
    id: "skill-network",
    title: "Build Your First Cloud Network",
    kind: "skill_badge",
    topic: "Cloud",
    minutes: 40,
    color: "mint",
    difficulty: "Beginner",
    description:
      "Connect a few virtual resources and learn what makes a network work in this sample skill badge.",
  },
  {
    id: "skill-sql",
    title: "SQL for Curious Minds",
    kind: "skill_badge",
    topic: "Data",
    minutes: 35,
    color: "blue",
    difficulty: "Beginner",
    description:
      "Turn questions into queries with a small fictional analytics dataset.",
  },
  {
    id: "skill-container",
    title: "Container Foundations",
    kind: "skill_badge",
    topic: "Cloud",
    minutes: 50,
    color: "peach",
    difficulty: "Intermediate",
    description:
      "Package an application and explore containers through this sample learning activity.",
  },
  {
    id: "skill-ai",
    title: "Prompt, Test, Repeat",
    kind: "skill_badge",
    topic: "AI",
    minutes: 30,
    color: "lilac",
    difficulty: "Beginner",
    description:
      "Try a repeatable approach to writing and evaluating prompts in a fictional skill badge.",
  },
  {
    id: "skill-access",
    title: "Access with Confidence",
    kind: "skill_badge",
    topic: "Security",
    minutes: 40,
    color: "yellow",
    difficulty: "Beginner",
    description:
      "Practice least privilege and permission troubleshooting in this sample activity.",
  },
  {
    id: "skill-storage",
    title: "Storage, Sorted",
    kind: "skill_badge",
    topic: "Cloud",
    minutes: 35,
    color: "mint",
    difficulty: "Beginner",
    description:
      "Organize objects, choose a storage pattern, and learn about lifecycle rules in a fictional badge.",
  },
  {
    id: "course-cloud",
    title: "A Little Cloud Orientation",
    kind: "other",
    topic: "Cloud",
    minutes: 20,
    color: "stone",
    difficulty: "Beginner",
    description:
      "A short sample course to get oriented. Course completions do not add demo Arcade points.",
  },
];
export const DEMO_RULE: Rule = {
  id: "demo-2026-v1",
  starts_on: "2026-01-01",
  ends_on: "2026-12-31",
  skill_group_size: 2,
  skill_group_points: 1,
  game_points: 1,
};
export type DemoAward = { activity_id: string; earned_on: string };
export type DemoState = {
  version: 1;
  signedIn: boolean;
  profile: { name: string; url: string; linked: boolean };
  awards: DemoAward[];
  saved: string[];
  lastSuccessAt: string;
  lastError: string | null;
  goalPoints: number;
};
export const DEMO_PROFILE_URL =
  "https://www.skills.google/public_profiles/00000000-0000-4000-8000-000000000001";
export function createDemoState(now = "2026-10-29T08:00:00.000Z"): DemoState {
  return {
    version: 1,
    signedIn: true,
    profile: { name: "Alex Morgan", url: DEMO_PROFILE_URL, linked: true },
    awards: [
      "game-launch",
      "game-data",
      "skill-network",
      "skill-sql",
      "skill-container",
      "course-cloud",
    ].map((activity_id, i) => ({
      activity_id,
      earned_on: `2026-10-${String(21 + i).padStart(2, "0")}`,
    })),
    saved: ["game-serverless", "skill-ai"],
    lastSuccessAt: now,
    lastError: null,
    goalPoints: 8,
  };
}
export function demoScore(state: DemoState) {
  return calculatePoints(
    state.awards.map((a) => ({
      external_id: a.activity_id,
      activity_id: a.activity_id,
      earned_on: a.earned_on,
      kind: DEMO_CATALOG.find((c) => c.id === a.activity_id)!.kind,
    })),
    DEMO_RULE,
  );
}
export function isDemoStale(state: DemoState, now = Date.now()) {
  return now - Date.parse(state.lastSuccessAt) > 6 * 3600_000;
}
export function toggleSaved(state: DemoState, id: string): DemoState {
  if (!DEMO_CATALOG.some((a) => a.id === id)) return state;
  return {
    ...state,
    saved: state.saved.includes(id)
      ? state.saved.filter((s) => s !== id)
      : [...state.saved, id],
  };
}
export function earnDemoAward(
  state: DemoState,
  id: string,
  now = new Date().toISOString(),
): DemoState {
  if (
    !state.profile.linked ||
    !state.signedIn ||
    !DEMO_CATALOG.some((a) => a.id === id) ||
    state.awards.some((a) => a.activity_id === id)
  )
    return state;
  // A fixture award's date stays in the versioned demo season even after 2026.
  return {
    ...state,
    awards: [...state.awards, { activity_id: id, earned_on: "2026-10-29" }],
    lastSuccessAt: now,
    lastError: null,
  };
}
export function completeDemoSync(
  state: DemoState,
  outcome: "success" | "private" | "rate_limit",
  now = new Date().toISOString(),
): DemoState {
  if (!state.profile.linked || !state.signedIn) return state;
  if (outcome !== "success")
    return {
      ...state,
      lastError:
        outcome === "private"
          ? "The sample profile is private. Your last successful snapshot is preserved."
          : "Sample source returned HTTP 429. Try again; your last snapshot is preserved.",
    };
  const next = DEMO_CATALOG.find(
    (a) => !state.awards.some((e) => e.activity_id === a.id),
  );
  return next
    ? earnDemoAward(state, next.id, now)
    : { ...state, lastSuccessAt: now, lastError: null };
}
export function linkDemoProfile(
  state: DemoState,
  name: string,
  url: string,
): DemoState {
  return {
    ...state,
    profile: {
      name: name.trim().slice(0, 60) || "Demo learner",
      url,
      linked: true,
    },
    awards: [],
    lastError: null,
  };
}
export function restoreDemoState(raw: string | null): DemoState | null {
  if (!raw) return null;
  try {
    const s = JSON.parse(raw);
    const known = (id: unknown) =>
      typeof id === "string" && DEMO_CATALOG.some((a) => a.id === id);
    if (
      s.version !== 1 ||
      typeof s.signedIn !== "boolean" ||
      typeof s.profile?.name !== "string" ||
      s.profile.name.length > 60 ||
      typeof s.profile?.url !== "string" ||
      typeof s.profile?.linked !== "boolean" ||
      !Array.isArray(s.awards) ||
      !Array.isArray(s.saved) ||
      typeof s.lastSuccessAt !== "string" ||
      !Number.isFinite(Date.parse(s.lastSuccessAt)) ||
      !Number.isInteger(s.goalPoints) ||
      s.goalPoints < 1 ||
      s.goalPoints > 100
    )
      return null;
    if (s.lastError !== null && typeof s.lastError !== "string") return null;
    if (
      s.awards.some(
        (a: DemoAward) =>
          !a ||
          !known(a.activity_id) ||
          !/^2026-\d{2}-\d{2}$/.test(a.earned_on),
      ) ||
      s.saved.some((id: string) => !known(id))
    )
      return null;
    // Dedupe persisted state rather than inflate the displayed award total.
    return {
      version: 1,
      signedIn: s.signedIn,
      profile: s.profile,
      lastSuccessAt: s.lastSuccessAt,
      lastError: s.lastError,
      goalPoints: s.goalPoints,
      awards: s.awards.filter(
        (a: DemoAward, i: number, all: DemoAward[]) =>
          all.findIndex((b) => b.activity_id === a.activity_id) === i,
      ),
      saved: [...new Set<string>(s.saved)],
    };
  } catch {
    return null;
  }
}
