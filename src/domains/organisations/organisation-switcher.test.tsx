import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { pushMock } = vi.hoisted(() => ({ pushMock: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
  usePathname: () => "/organisations",
  useSearchParams: () => new URLSearchParams("tab=agents"),
}));

import { OrganisationSwitcher } from "@/domains/organisations/organisation-switcher";

const ORGS = [
  { id: "org-a", name: "Alpha Ltd" },
  { id: "org-b", name: "Beta Ltd" },
];

describe("OrganisationSwitcher", () => {
  beforeEach(() => pushMock.mockReset());

  it("puts the choice in the URL and keeps the rest of the query", () => {
    // Selection lives in the URL and nowhere else: every tenant route names its
    // organisation in the path, and a cookie would put back ambient tenancy.
    render(
      <OrganisationSwitcher
        organisations={ORGS}
        selectedOrganisationId={null}
      />,
    );

    fireEvent.change(
      screen.getByRole("combobox", { name: "Organisation switcher" }),
      {
        target: { value: "org-b" },
      },
    );

    expect(pushMock).toHaveBeenCalledWith(
      "/organisations?tab=agents&org=org-b",
    );
  });

  it("says nothing is chosen rather than implying the first", () => {
    render(
      <OrganisationSwitcher
        organisations={ORGS}
        selectedOrganisationId={null}
      />,
    );

    expect(
      screen.getByRole("combobox", { name: "Organisation switcher" }),
    ).toHaveProperty("value", "");
    expect(
      screen.getByRole("option", { name: /select an organisation/i }),
    ).toBeDefined();
  });

  it("drops the placeholder once a choice exists", () => {
    render(
      <OrganisationSwitcher
        organisations={ORGS}
        selectedOrganisationId="org-a"
      />,
    );

    expect(
      screen.getByRole("combobox", { name: "Organisation switcher" }),
    ).toHaveProperty("value", "org-a");
    expect(
      screen.queryByRole("option", { name: /select an organisation/i }),
    ).toBeNull();
  });

  it("is disabled, and says why, when there is nothing to switch between", () => {
    render(
      <OrganisationSwitcher organisations={[]} selectedOrganisationId={null} />,
    );

    expect(
      screen.getByRole("combobox", { name: "Organisation switcher" }),
    ).toHaveProperty("disabled", true);
    expect(
      screen.getByRole("option", { name: /no organisation selected/i }),
    ).toBeDefined();
  });

  it("clears the parameter rather than writing an empty one", () => {
    render(
      <OrganisationSwitcher
        organisations={ORGS}
        selectedOrganisationId="org-a"
      />,
    );

    fireEvent.change(
      screen.getByRole("combobox", { name: "Organisation switcher" }),
      { target: { value: "" } },
    );

    expect(pushMock).toHaveBeenCalledWith("/organisations?tab=agents");
  });
});
