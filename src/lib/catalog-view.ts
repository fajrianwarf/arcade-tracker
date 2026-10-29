export type CatalogKind = "game" | "skill_badge" | "other";
export type CatalogItem = {
  id: string;
  title: string;
  kind: CatalogKind;
  description?: string;
  topic?: string;
  difficulty?: string;
  minutes?: number;
  source_url?: string;
  access_code?: string;
};
export type CompletionFilter = "all" | "incomplete" | "saved" | "complete";
export function selectCatalog(
  items: CatalogItem[],
  kind: string,
  status: CompletionFilter,
  query: string,
  completed: ReadonlySet<string>,
  saved: ReadonlySet<string>,
) {
  const search = query.trim().toLocaleLowerCase();
  return items.filter(
    (a) =>
      (kind === "all" || a.kind === kind) &&
      (status === "all" ||
        (status === "incomplete" && !completed.has(a.id)) ||
        (status === "complete" && completed.has(a.id)) ||
        (status === "saved" && saved.has(a.id))) &&
      [a.title, a.topic, a.difficulty]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase()
        .includes(search),
  );
}
// Catalog CTAs must lead to Google Skills activities, never solution repositories.
export function officialActivityUrl(input?: string): string | null {
  if (!input) return null;
  try {
    const u = new URL(input);
    if (
      u.protocol !== "https:" ||
      u.port ||
      u.username ||
      u.password ||
      ![
        "www.skills.google",
        "skills.google",
        "www.cloudskillsboost.google",
        "cloudskillsboost.google",
      ].includes(u.hostname) ||
      !/^\/(games|course_templates|quests)\/\d+\/?$/.test(u.pathname)
    )
      return null;
    return `https://www.skills.google${u.pathname.replace(/\/$/, "")}`;
  } catch {
    return null;
  }
}
