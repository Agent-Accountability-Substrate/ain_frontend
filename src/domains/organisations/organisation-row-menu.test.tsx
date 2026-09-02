import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { leaveMock } = vi.hoisted(() => ({ leaveMock: vi.fn() }));

vi.mock("@/domains/organisations/organisation-actions", () => ({
  leaveOrganisationAction: leaveMock,
}));

import { OrganisationRowMenu } from "@/domains/organisations/organisation-row-menu";
import type { OrganisationSummary } from "@/domains/workspace/account-workspace";

const ULID = "01ARZ3NDEKTSV4RRFFQ69G5FAV";

const OWNED: OrganisationSummary = {
  id: "6a1f6f38-0d3f-4c86-9a53-8c8f7a1e2b4d",
  ulid: ULID,
  name: "Example Holdings Ltd",
  membershipRole: "owner",
  verificationStatus: "verified",
};

const JOINED: OrganisationSummary = { ...OWNED, membershipRole: "member" };

function open(organisation: OrganisationSummary) {
  render(<OrganisationRowMenu organisation={organisation} />);
  fireEvent.click(
    screen.getByRole("button", { name: `Actions for ${organisation.name}` }),
  );
  return screen.getByRole("menu");
}

describe("OrganisationRowMenu", () => {
  beforeEach(() => {
    leaveMock.mockReset();
    leaveMock.mockResolvedValue({ status: "idle" });
  });

  it("points at the organisation's own settings", () => {
    const menu = open(OWNED);

    expect(
      within(menu)
        .getByRole("menuitem", { name: "Organisation settings" })
        .getAttribute("href"),
    ).toBe(`/o/${ULID}/settings/registration`);
    expect(
      within(menu)
        .getByRole("menuitem", { name: "Members" })
        .getAttribute("href"),
    ).toBe(`/o/${ULID}/settings/members`);
  });

  it("does not offer an owner the way out", () => {
    // The owner is a column on the organisation's row rather than a role, so
    // an owner walking out would leave a registered company with signed
    // records and nobody who can act for it.
    const menu = open(OWNED);

    expect(
      within(menu).queryByRole("menuitem", { name: "Leave organisation" }),
    ).toBeNull();
  });

  it("asks before a member gives up their access", () => {
    const menu = open(JOINED);

    fireEvent.click(
      within(menu).getByRole("menuitem", { name: "Leave organisation" }),
    );

    const dialog = screen.getByRole("alertdialog");
    expect(
      within(dialog).getByRole("heading", {
        name: `Leave ${JOINED.name}?`,
      }),
    ).toBeDefined();
    // The confirmation carries the organisation, so the action never has to
    // guess which row it was opened from.
    expect(
      dialog.querySelector<HTMLInputElement>('input[name="organisationId"]')
        ?.value,
    ).toBe(JOINED.id);
    expect(within(dialog).getByRole("button", { name: "Leave" })).toBeDefined();
  });
});
