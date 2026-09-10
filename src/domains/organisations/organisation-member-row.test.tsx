import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { removeMock } = vi.hoisted(() => ({ removeMock: vi.fn() }));

vi.mock("@/domains/organisations/organisation-actions", () => ({
  removeMemberAction: removeMock,
}));

import { OrganisationMemberRow } from "@/domains/organisations/organisation-member-row";
import type { OrganisationMember } from "@/domains/workspace/account-workspace";

const ORG_ID = "6a1f6f38-0d3f-4c86-9a53-8c8f7a1e2b4d";
const MEMBER_ID = "1f4f4c6e-0000-4000-8000-000000000001";

const AUDITOR: OrganisationMember = {
  id: MEMBER_ID,
  email: "auditor@bdo.example",
  role: "auditor",
  status: "pending",
};

const row = (member: OrganisationMember) =>
  render(<OrganisationMemberRow member={member} organisationId={ORG_ID} />);

describe("OrganisationMemberRow", () => {
  beforeEach(() => {
    removeMock.mockReset();
    removeMock.mockResolvedValue({ status: "idle" });
  });

  it("distinguishes an invitation from access", () => {
    // An invitation binds on the invitee's first verified login and grants
    // nothing until then, so the two must not read alike.
    row(AUDITOR);
    expect(screen.getByText("Invited")).toBeDefined();

    row({ ...AUDITOR, status: "active" });
    expect(screen.getByText("Active")).toBeDefined();
  });

  it("shows a status this release does not model as the registry's own word", () => {
    row({ ...AUDITOR, status: "quarantined" });

    expect(screen.getByText("quarantined")).toBeDefined();
  });

  it("does not offer to remove the owner", () => {
    // The owner is a column on the organisation rather than a role, so an
    // organisation without one could never be administered again.
    row({ ...AUDITOR, role: "owner", status: "active" });

    expect(screen.queryByRole("button", { name: "Remove" })).toBeNull();
  });

  it("asks first, and carries the member's id into the form", () => {
    row(AUDITOR);
    fireEvent.click(screen.getByRole("button", { name: "Remove" }));

    const dialog = screen.getByRole("alertdialog");
    expect(
      within(dialog).getByText(/Remove auditor@bdo.example\?/),
    ).toBeDefined();
    // The row is kept and marked removed, so anything it authorised stays
    // evidenceable — worth saying, because "remove" reads like a delete.
    expect(within(dialog).getByText(/stays evidenceable/)).toBeDefined();

    const data = new FormData(dialog.querySelector("form")!);
    expect(data.get("memberId")).toBe(MEMBER_ID);
    expect(data.get("organisationId")).toBe(ORG_ID);
  });

  it("keeps the dialog open on a refusal, where the reason is", () => {
    removeMock.mockResolvedValue({
      status: "error",
      message: "an organisation must keep at least one admin",
    });

    row({ ...AUDITOR, role: "org_admin", status: "active" });
    fireEvent.click(screen.getByRole("button", { name: "Remove" }));

    expect(screen.getByRole("alertdialog")).toBeDefined();
  });
});
