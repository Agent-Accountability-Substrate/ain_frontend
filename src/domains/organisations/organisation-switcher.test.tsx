import { fireEvent, render, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { pushMock } = vi.hoisted(() => ({ pushMock: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
  usePathname: () => "/organisations",
  useSearchParams: () => new URLSearchParams("tab=agents"),
}));

import { OrganisationSwitcher } from "@/domains/organisations/organisation-switcher";
import { chooseOption, openSelect, selectTrigger } from "@/lib/testing/select";

const ORGS = [
  { id: "org-a", name: "Alpha Ltd" },
  { id: "org-b", name: "Beta Ltd" },
];

const trigger = () => selectTrigger("Organisation switcher");

describe("OrganisationSwitcher", () => {
  beforeEach(() => pushMock.mockReset());

  it("puts the choice in the URL and keeps the rest of the query", async () => {
    // Selection lives in the URL and nowhere else: every tenant route names its
    // organisation in the path, and a cookie would put back ambient tenancy.
    render(
      <OrganisationSwitcher
        organisations={ORGS}
        selectedOrganisationId={null}
      />,
    );

    await chooseOption("Organisation switcher", "Beta Ltd");

    await waitFor(() =>
      expect(pushMock).toHaveBeenCalledWith(
        "/organisations?tab=agents&org=org-b",
      ),
    );
  });

  it("navigates when a choice is committed, not while arrowing through", async () => {
    // The native `<select>` this replaces moved the selection on every arrow
    // keypress, and each move was a `router.push` to a `force-dynamic` page.
    // Holding Down was a burst of server round trips that landed the caller
    // somewhere they never chose.
    render(
      <OrganisationSwitcher
        organisations={ORGS}
        selectedOrganisationId={null}
      />,
    );

    await openSelect("Organisation switcher");
    const focused = () => document.activeElement as HTMLElement;
    fireEvent.keyDown(focused(), { key: "ArrowDown" });
    fireEvent.keyDown(focused(), { key: "ArrowDown" });
    fireEvent.keyDown(focused(), { key: "ArrowUp" });

    expect(pushMock).not.toHaveBeenCalled();

    fireEvent.keyDown(focused(), { key: "Enter" });
    await waitFor(() => expect(pushMock).toHaveBeenCalledTimes(1));
  });

  it("says nothing is chosen rather than implying the first", () => {
    render(
      <OrganisationSwitcher
        organisations={ORGS}
        selectedOrganisationId={null}
      />,
    );

    expect(trigger().textContent).toContain("Select an organisation");
  });

  it("drops the placeholder once a choice exists", () => {
    render(
      <OrganisationSwitcher
        organisations={ORGS}
        selectedOrganisationId="org-a"
      />,
    );

    // The name, not the id — the reason `SelectField` requires `items` rather
    // than letting the trigger fall back to rendering the raw value.
    expect(trigger().textContent).toContain("Alpha Ltd");
    expect(trigger().textContent).not.toContain("Select an organisation");
    expect(trigger().textContent).not.toContain("org-a");
  });

  it("is disabled, and says why, when there is nothing to switch between", () => {
    render(
      <OrganisationSwitcher organisations={[]} selectedOrganisationId={null} />,
    );

    expect(trigger()).toHaveProperty("disabled", true);
    expect(trigger().textContent).toContain("No organisation selected");
  });
});
