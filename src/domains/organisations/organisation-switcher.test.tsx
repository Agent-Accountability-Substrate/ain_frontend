import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { pathnameMock, refreshMock } = vi.hoisted(() => ({
  pathnameMock: vi.fn(),
  refreshMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: pathnameMock,
  useRouter: () => ({ refresh: refreshMock }),
}));

import { OrganisationSwitcher } from "@/domains/organisations/organisation-switcher";

const ALPHA = {
  id: "3f1b1f7e-0000-4000-8000-00000000000a",
  ulid: "01ARZ3NDEKTSV4RRFFQ69G5FAV",
  name: "Alpha Ltd",
};
const BETA = {
  id: "3f1b1f7e-0000-4000-8000-00000000000b",
  ulid: "01BX5ZZKBKACTAV9WEVGEMMVRZ",
  name: "Beta Ltd",
};
const ORGS = [ALPHA, BETA];

function open(selectedOrganisationId: string | null = ALPHA.id) {
  render(
    <OrganisationSwitcher
      organisations={ORGS}
      selectedOrganisationId={selectedOrganisationId}
    />,
  );
  fireEvent.click(screen.getByRole("button"));
  return screen.getByRole("menu");
}

describe("OrganisationSwitcher", () => {
  beforeEach(() => {
    pathnameMock.mockReset();
    refreshMock.mockReset();
    pathnameMock.mockReturnValue(`/o/${ALPHA.ulid}`);
  });

  it("names the organisation being acted for", () => {
    render(
      <OrganisationSwitcher
        organisations={ORGS}
        selectedOrganisationId={BETA.id}
      />,
    );

    expect(screen.getByRole("button").textContent).toContain("Beta Ltd");
  });

  it("switches by navigating, so the choice is in the URL and in history", () => {
    // Links commit once, on activation, and can be opened in a new tab —
    // where a `<select>` moves the selection on every arrow keypress, each one
    // a router push to a `force-dynamic` page.
    const menu = open();

    expect(
      within(menu)
        .getByRole("menuitem", { name: /Beta Ltd/ })
        .getAttribute("href"),
    ).toBe(`/o/${BETA.ulid}`);
  });

  it("keeps you on the screen you were on", () => {
    // Standing on an agent register and switching shows that organisation's
    // agent register, rather than dropping you back at a home page.
    pathnameMock.mockReturnValue(`/o/${ALPHA.ulid}/agents`);

    const menu = open();

    expect(
      within(menu)
        .getByRole("menuitem", { name: /Beta Ltd/ })
        .getAttribute("href"),
    ).toBe(`/o/${BETA.ulid}/agents`);
  });

  it("stays put on a screen that belongs to no organisation", () => {
    // The account's own settings have no per-organisation equivalent, so
    // "show me this in the other company" has no answer but this one.
    // Rewriting the address to /o/<other> would close the page instead.
    pathnameMock.mockReturnValue("/settings/account");

    const menu = open();

    expect(
      within(menu)
        .getByRole("menuitem", { name: /Beta Ltd/ })
        .getAttribute("href"),
    ).toBe("/settings/account");
  });

  it("does not mistake the create screen for an organisation", () => {
    // `/o/new` sits under /o without being a tenant. Slicing the prefix by
    // length rather than reading the segment turned it into /o/<other>.
    pathnameMock.mockReturnValue("/o/new");

    const menu = open();

    expect(
      within(menu)
        .getByRole("menuitem", { name: /Beta Ltd/ })
        .getAttribute("href"),
    ).toBe("/o/new");
  });

  it("marks the current organisation rather than only ticking it", () => {
    const menu = open();

    expect(
      within(menu)
        .getByRole("menuitem", { name: /Alpha Ltd/ })
        .getAttribute("aria-current"),
    ).toBe("true");
    expect(
      within(menu)
        .getByRole("menuitem", { name: /Beta Ltd/ })
        .getAttribute("aria-current"),
    ).toBeNull();
  });

  it("offers the list and the way to add one, not just the switch", () => {
    const menu = open();

    expect(
      within(menu)
        .getByRole("menuitem", { name: "Manage organisations" })
        .getAttribute("href"),
    ).toBe("/settings/organisations");
    expect(
      within(menu)
        .getByRole("menuitem", { name: /Register a company/ })
        .getAttribute("href"),
    ).toBe("/o/new");
  });

  it("says nothing is chosen rather than implying the first", () => {
    pathnameMock.mockReturnValue("/o");
    render(
      <OrganisationSwitcher
        organisations={ORGS}
        selectedOrganisationId={null}
      />,
    );

    expect(screen.getByRole("button").textContent).toContain(
      "No organisation selected",
    );
  });

  it("asks for the page again when the address will not change", () => {
    // The account's settings and the register-a-company screen: the link goes
    // nowhere new, so nothing would re-render and the switch would look inert.
    pathnameMock.mockReturnValue("/settings/account");

    const menu = open();
    fireEvent.click(within(menu).getByRole("menuitem", { name: /Beta Ltd/ }));

    expect(refreshMock).toHaveBeenCalled();
  });

  it("leaves the navigation to do the work when the address does change", () => {
    pathnameMock.mockReturnValue(`/o/${ALPHA.ulid}/agents`);

    const menu = open();
    fireEvent.click(within(menu).getByRole("menuitem", { name: /Beta Ltd/ }));

    expect(refreshMock).not.toHaveBeenCalled();
  });
});
