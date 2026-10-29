import { test } from "node:test";
import assert from "node:assert/strict";
import { selectCatalog, officialActivityUrl } from "../src/lib/catalog-view";
import { DEMO_CATALOG } from "../src/lib/demo/model";
const completed = new Set(["game-launch", "skill-sql"]);
const targets = new Set(["game-serverless", "skill-ai"]);
test("catalog type, completion, target and search filters compose", () => {
  assert.equal(
    selectCatalog(DEMO_CATALOG, "game", "all", "", completed, targets).length,
    5,
  );
  assert.deepEqual(
    selectCatalog(DEMO_CATALOG, "all", "complete", "", completed, targets).map(
      (a) => a.id,
    ),
    ["game-launch", "skill-sql"],
  );
  assert.equal(
    selectCatalog(
      DEMO_CATALOG,
      "skill_badge",
      "saved",
      "prompt",
      completed,
      targets,
    )[0]?.id,
    "skill-ai",
  );
  assert.equal(
    selectCatalog(
      DEMO_CATALOG,
      "game",
      "incomplete",
      "data",
      completed,
      targets,
    )[0]?.id,
    "game-data",
  );
  assert.equal(
    selectCatalog(
      DEMO_CATALOG,
      "all",
      "all",
      "  NO SUCH BADGE ",
      completed,
      targets,
    ).length,
    0,
  );
});
test("catalog links accept canonical Google Skills activities and exclude GitHub or solution search links", () => {
  assert.equal(
    officialActivityUrl(
      "https://www.cloudskillsboost.google/course_templates/631?x=1",
    ),
    "https://www.skills.google/course_templates/631",
  );
  for (const bad of [
    "https://github.com/example/solutions",
    "https://www.google.com/search?q=badge+github",
    "javascript:alert(1)",
    "https://www.skills.google.evil.com/games/1",
    "https://user:pass@www.skills.google/games/1",
    "https://www.skills.google/api/1",
  ])
    assert.equal(officialActivityUrl(bad), null);
});
