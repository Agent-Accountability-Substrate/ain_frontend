import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { appFiles } from "@test/app-router-files";

/**
 * The membership check is inherited, and this is what keeps it that way.
 *
 * Every screen under `/o/[org]` is addressed by an organisation the caller
 * must belong to. `loadOrganisationPage` is where that is decided — it 404s a
 * ULID the account is not in — and `layout.tsx` runs it for the whole segment
 * so a new page cannot be written without it.
 *
 * A page that reaches for `loadWorkspace` directly instead would not fail:
 * `loadAccountWorkspace` falls back to the caller's own first organisation
 * when the URL names one it cannot find, so the page would render real data
 * under a stranger's ULID and answer 200. Read off the directory rather than a
 * list typed out again, because the failure mode is a file nobody remembered.
 */

const SEGMENT = "/(workspace)/o/[org]";

describe("the /o/[org] tenant gate", () => {
  const inSegment = appFiles().filter((file) => file.dir.startsWith(SEGMENT));

  const source = (file: { dir: string; name: string }) =>
    readFileSync(join(process.cwd(), "src/app", file.dir, file.name), "utf8");

  it("gates the whole segment from its own layout", () => {
    const layout = inSegment.filter(
      (file) => file.dir === SEGMENT && file.name === "layout.tsx",
    );

    expect(layout).toHaveLength(1);
    expect(source(layout[0]!)).toContain("loadOrganisationPage");
  });

  it("resolves the organisation through the gate on every page", () => {
    const pages = inSegment.filter((file) => file.name === "page.tsx");

    expect(pages.length).toBeGreaterThan(0);
    expect(
      pages
        .filter((page) => !source(page).includes("loadOrganisationPage"))
        .map((page) => `${page.dir}/${page.name}`),
    ).toEqual([]);
  });

  it("never reaches past the gate to the raw workspace loader", () => {
    // The import, not the word: `loadWorkspace` is named in prose in the
    // layout that explains why reaching for it here would be wrong.
    expect(
      inSegment
        .filter((file) => /\.tsx?$/.test(file.name))
        .filter((file) => !file.name.includes(".test."))
        .filter((file) =>
          source(file).includes('from "@/domains/workspace/workspace-page"'),
        )
        .map((file) => `${file.dir}/${file.name}`),
    ).toEqual([]);
  });
});
