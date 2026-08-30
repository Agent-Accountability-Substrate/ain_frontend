import { describe, expect, it } from "vitest";

import { menuItemsFor } from "@/domains/workspace/workspace-navigation";

const ULID = "01ARZ3NDEKTSV4RRFFQ69G5FAV";

describe("workspace navigation", () => {
  it("offers the organisation's own sections", () => {
    // Settings is not among them: the gear in the top bar opens it, and it
    // takes a column of its own rather than a place in the rail.
    expect(menuItemsFor(false, ULID)).toEqual([
      { label: "Home", href: `/o/${ULID}` },
      { label: "Agents", href: `/o/${ULID}/agents` },
    ]);
  });

  it("does not put Organisations beside the switcher that already goes there", () => {
    const labels = menuItemsFor(true, ULID).map((item) => item.label);
    expect(labels).not.toContain("Organisations");
    // Account and security is a property of the person, so it lives in the
    // account menu rather than among one organisation's sections.
    expect(labels).not.toContain("Account & Security");
  });

  it("shows nothing rather than one item pointing at the page you are on", () => {
    // Sections belong to an organisation. Without one there are none, and a
    // bar carrying a single link to the current page is worse than an empty
    // one.
    expect(menuItemsFor(false, null)).toEqual([]);
  });

  it("appends the console only for an operator", () => {
    // Presentation, not a control: the page redirects and the registry answers
    // 403 regardless of what the rail shows.
    expect(menuItemsFor(false, ULID).map((i) => i.label)).not.toContain(
      "Reviews",
    );
    expect(menuItemsFor(true, ULID).map((i) => i.label)).toContain("Reviews");
  });

  it("names the console for what it holds, not for the team that works it", () => {
    // "Trust operations" is our word for the function. Nobody signing in has
    // read the glossary.
    expect(menuItemsFor(true, ULID).map((i) => i.label)).not.toContain(
      "Trust operations",
    );
  });
});
