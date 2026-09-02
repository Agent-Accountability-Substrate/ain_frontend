import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { inviteMock } = vi.hoisted(() => ({ inviteMock: vi.fn() }));

vi.mock("@/domains/organisations/organisation-actions", () => ({
  inviteMemberAction: inviteMock,
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
  beforeEach(() => {
    inviteMock.mockReset();
    inviteMock.mockResolvedValue({ status: "idle" });
  });

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
    // The complement of the same claim: an unread list must not be dressed as
    // an empty one. "Only you can act for this organisation" is a statement
    // about the tenant's membership, which the callout above has just said we
    // cannot read.
    expect(screen.queryByText(/Only you can act/)).toBeNull();
  });

  it("says only you can act when the list is readable and empty", () => {
    render(
      <OrganisationMembersView
        organisationId={ORG_ID}
        members={[]}
        membersUnavailable={false}
      />,
    );

    expect(
      screen.getByText(/Only you can act for this organisation/),
    ).toBeDefined();
    expect(screen.queryByText("We cannot show this list yet")).toBeNull();
  });

  it("counts a single member without pluralising", () => {
    render(
      <OrganisationMembersView
        organisationId={ORG_ID}
        members={[MEMBERS[0]!]}
        membersUnavailable={false}
      />,
    );

    expect(screen.getByRole("heading", { name: "1 member" })).toBeDefined();
  });

  it("names the address that was invited", async () => {
    inviteMock.mockResolvedValue({
      status: "invited",
      email: "auditor@bdo.example",
    });

    render(
      <OrganisationMembersView
        organisationId={ORG_ID}
        members={MEMBERS}
        membersUnavailable={false}
      />,
    );
    fireEvent.submit(document.querySelector("form")!);

    expect(
      await screen.findByText(/auditor@bdo.example can now act/),
    ).toBeDefined();
  });

  it("shows a refusal against the field it concerns", async () => {
    inviteMock.mockResolvedValue({
      status: "error",
      message: "that address already belongs to this organisation",
      errors: { email: "already a member" },
    });

    render(
      <OrganisationMembersView
        organisationId={ORG_ID}
        members={MEMBERS}
        membersUnavailable={false}
      />,
    );
    fireEvent.submit(document.querySelector("form")!);

    expect(
      await screen.findByText(/already belongs to this organisation/),
    ).toBeDefined();
    // The message says what happened; the field says where to fix it.
    expect(screen.getByText("already a member")).toBeDefined();
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
