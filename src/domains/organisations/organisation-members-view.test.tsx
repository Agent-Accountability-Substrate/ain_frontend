import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/domains/organisations/organisation-actions", () => ({
  inviteMemberAction: vi.fn(),
  removeMemberAction: vi.fn(),
}));

import { OrganisationMembersView } from "@/domains/organisations/organisation-members-view";

const ORG_ID = "6a1f6f38-0d3f-4c86-9a53-8c8f7a1e2b4d";

const MEMBERS = [
  {
    id: "1f4f4c6e-0000-4000-8000-000000000001",
    email: "founder@example.com",
    role: "owner",
    status: "active",
  },
  {
    id: "1f4f4c6e-0000-4000-8000-000000000002",
    email: "auditor@example.com",
    role: "auditor",
    status: "pending",
  },
];

describe("OrganisationMembersView", () => {
  it("lists who can act, and what each of them may do", () => {
    render(
      <OrganisationMembersView
        organisationId={ORG_ID}
        members={MEMBERS}
        membersUnavailable={false}
      />,
    );

    const rows = screen.getAllByRole("listitem");
    expect(within(rows[0]!).getByText("founder@example.com")).toBeDefined();
    expect(within(rows[0]!).getByText("Owner")).toBeDefined();
    expect(within(rows[1]!).getByText("Auditor")).toBeDefined();
    // An invitation binds on the invitee's first verified login, so "invited"
    // and "has access" must not read alike.
    expect(within(rows[0]!).getByText("Active")).toBeDefined();
    expect(within(rows[1]!).getByText("Invited")).toBeDefined();
  });

  it("says the list is unavailable rather than saying nobody is here", () => {
    // The registry can add and remove members but cannot list them. "Nobody"
    // and "we cannot tell you" are different claims, and only one is true.
    render(
      <OrganisationMembersView
        organisationId={ORG_ID}
        members={[]}
        membersUnavailable
      />,
    );

    expect(screen.getByText("We cannot show this list yet")).toBeDefined();
  });

  it("takes any address, because an auditor need not hold a company mailbox", () => {
    render(
      <OrganisationMembersView
        organisationId={ORG_ID}
        members={MEMBERS}
        membersUnavailable={false}
      />,
    );

    const email = screen.getByRole("textbox", { name: /Email address/ });
    expect(email.getAttribute("type")).toBe("email");
    expect(
      screen.getByRole("combobox", { name: "Role" }).textContent,
    ).toContain("Compliance");
    // The organisation travels with the form, not with an ambient selection.
    expect(
      document.querySelector<HTMLInputElement>('input[name="organisationId"]')
        ?.value,
    ).toBe(ORG_ID);
  });
});
