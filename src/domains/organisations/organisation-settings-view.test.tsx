import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/domains/auth/auth-actions", () => ({ signOutAction: vi.fn() }));

import { OrganisationSettingsView } from "@/domains/organisations/organisation-settings-view";
import { type OrganisationSummary } from "@/domains/workspace/account-workspace";

const ORG: OrganisationSummary = {
  id: "6a1f6f38-0d3f-4c86-9a53-8c8f7a1e2b4d",
  ulid: "01ARZ3NDEKTSV4RRFFQ69G5FAV",
  name: "Example Holdings Ltd",
  membershipRole: "owner",
  verificationStatus: "verified",
};

describe("OrganisationSettingsView", () => {
  it("shows what the registry holds, including the identifier agents inherit", () => {
    render(<OrganisationSettingsView organisation={ORG} />);

    // The ULID is the organisation segment of every AIN registered here, so
    // seeing it is how someone connects an identifier back to a company.
    expect(screen.getAllByText(ORG.ulid).length).toBeGreaterThan(0);
    expect(screen.getByText("Owner")).toBeDefined();
  });

  it("explains a status rather than only naming it", () => {
    const rejected: OrganisationSummary = {
      ...ORG,
      verificationStatus: "rejected",
      reviewReason: "The company number belongs to a dissolved entity.",
    };

    render(<OrganisationSettingsView organisation={rejected} />);

    expect(
      screen.getByText(/the way forward is a fresh registration/i),
    ).toBeDefined();
    expect(
      screen.getByText("The company number belongs to a dissolved entity."),
    ).toBeDefined();
  });

  it("offers no edit, because a decided registration cannot be edited", () => {
    // A decision was made against these details; changing them after the fact
    // would invalidate it.
    render(<OrganisationSettingsView organisation={ORG} />);

    expect(screen.queryAllByRole("textbox")).toHaveLength(0);
    expect(
      screen.queryByRole("button", { name: /save|edit|update/i }),
    ).toBeNull();
  });

  it.each([
    ["pending", "Verification pending", /have not reviewed/i],
    ["needs_attention", "More information needed", /asked for something/i],
  ] as const)(
    "explains %s rather than only naming it",
    (status, label, detail) => {
      render(
        <OrganisationSettingsView
          organisation={{ ...ORG, verificationStatus: status }}
        />,
      );

      expect(screen.getAllByText(label).length).toBeGreaterThan(0);
      expect(screen.getByText(detail)).toBeDefined();
    },
  );

  it("marks a reviewer's note as a caution while the row is still live", () => {
    // Amber, not red: `needs_attention` is a task, `rejected` is a decision.
    render(
      <OrganisationSettingsView
        organisation={{
          ...ORG,
          verificationStatus: "needs_attention",
          reviewReason: "Confirm the registered office address.",
        }}
      />,
    );

    expect(
      screen.getByText("Confirm the registered office address."),
    ).toBeDefined();
  });
});
