import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/domains/auth/auth-actions", () => ({ signOutAction: vi.fn() }));

import { AccountSecurityView } from "@/domains/identity/account-security-view";
import {
  initialAccountWorkspaceState,
  type AccountWorkspaceState,
  type OrganisationSummary,
} from "@/domains/workspace/account-workspace";

const ORG: OrganisationSummary = {
  id: "6a1f6f38-0d3f-4c86-9a53-8c8f7a1e2b4d",
  ulid: "01ARZ3NDEKTSV4RRFFQ69G5FAV",
  name: "Example Holdings Ltd",
  membershipRole: "owner",
  verificationStatus: "verified",
};

const STATE: AccountWorkspaceState = {
  ...initialAccountWorkspaceState,
  organisations: [ORG],
  selectedOrganisationId: ORG.id,
};

function renderView(state: AccountWorkspaceState = STATE) {
  render(
    <AccountSecurityView
      email="casey@example.com"
      name="Casey Morgan"
      state={state}
    />,
  );
}

describe("AccountSecurityView", () => {
  it("shows the account, not the machinery behind it", () => {
    renderView();

    expect(
      screen.getByRole("heading", { name: "Account & security" }),
    ).toBeDefined();
    expect(screen.getByText("Casey Morgan")).toBeDefined();
    expect(screen.getByText("casey@example.com")).toBeDefined();
  });

  it("names no identity vendor, because that is not the reader's concern", () => {
    renderView();

    expect(screen.queryByText(/auth0/i)).toBeNull();
    expect(screen.queryByText(/protected workspace session/i)).toBeNull();
    expect(
      screen.queryByText(/never treated as identity assurance/i),
    ).toBeNull();
  });

  it("makes the identity check actionable while it is unfinished", () => {
    renderView();

    expect(screen.getByText("Not started")).toBeDefined();
    expect(
      screen.getByRole("link", { name: "Start identity check" }),
    ).toHaveProperty("href", "http://localhost:3000/onboarding/identity");
  });

  it("offers nothing to do once the check has passed", () => {
    renderView({ ...STATE, individualAssurance: { status: "verified" } });

    expect(screen.getByText("Verified")).toBeDefined();
    expect(screen.queryByRole("link", { name: /identity check/i })).toBeNull();
  });

  it("leaves signing out to the account menu that already has it", () => {
    renderView();

    // A second sign-out on a settings page is a second place to look for the
    // same control. The menu in the top bar is on every screen.
    expect(screen.queryByRole("button", { name: "Sign out" })).toBeNull();
  });

  it("can be left without hunting for the gear again", () => {
    renderView();

    expect(
      screen
        .getByRole("link", { name: "Back to settings" })
        .getAttribute("href"),
    ).toBe("/settings");
  });

  it("shows a name and an address it does not have", () => {
    render(<AccountSecurityView email={null} name={null} state={STATE} />);

    expect(screen.getByText("Not set")).toBeDefined();
    expect(screen.getByText("Not available")).toBeDefined();
  });

  it("shows what a reviewer said, and when the check last ran", () => {
    renderView({
      ...STATE,
      individualAssurance: {
        status: "needs_review",
        reviewReason: "The document photograph was unreadable.",
        checkedAt: "2026-08-01T10:00:00Z",
      },
    });

    expect(screen.getByText("Being reviewed")).toBeDefined();
    expect(
      screen.getByText("The document photograph was unreadable."),
    ).toBeDefined();
    // The record, rather than a sentence about it.
    expect(screen.getByText("Checked")).toBeDefined();
    expect(screen.getByText("1 August 2026")).toBeDefined();
    // Nothing to do while somebody else is looking at it.
    expect(
      screen.queryByRole("link", { name: /identity check|again/i }),
    ).toBeNull();
  });

  it("says what a verified-from-email account actually holds", () => {
    // The registry answers `verified` at the `email_verified` profile for a
    // confirmed address (`ain_docs` DECISIONS.md, 2026-08-16). A bare green
    // "Verified" would claim a document check had happened.
    renderView({
      ...STATE,
      individualAssurance: {
        status: "verified",
        assuranceProfile: "email_verified",
      },
    });

    expect(screen.getByText("Verified · email only")).toBeDefined();
    expect(screen.queryByText("email_verified")).toBeNull();
    expect(
      screen.getByText(/we have only confirmed your email address/),
    ).toBeDefined();
    // Nothing to do, but the check that supersedes it is worth reading about.
    expect(
      screen.getByRole("link", { name: "What the full check involves" }),
    ).toHaveProperty("href", "http://localhost:3000/onboarding/identity");
  });

  it("keeps the record once the check has passed", () => {
    // A check that has passed stops being a task and becomes something you may
    // need to quote. Nothing here is document data — the outcome, the dates
    // and an opaque reference are all it holds.
    renderView({
      ...STATE,
      individualAssurance: {
        status: "verified",
        checkedAt: "2026-08-01T10:00:00Z",
        expiresAt: "2027-08-01T10:00:00Z",
        assuranceProfile: "GPG45 medium",
        providerReference: "idv_01ARZ3NDEKTSV4RRFFQ69G5FAV",
      },
    });

    expect(screen.getByText("1 August 2026")).toBeDefined();
    expect(screen.getByText("1 August 2027")).toBeDefined();
    expect(screen.getByText("GPG45 medium")).toBeDefined();
    expect(screen.getByText("idv_01ARZ3NDEKTSV4RRFFQ69G5FAV")).toBeDefined();
    // Passed means there is nothing to do, not that there is nothing to see.
    expect(screen.queryByRole("link", { name: /again|check/i })).toBeNull();
  });

  it("does not leave a failed check at a dead end", () => {
    // The onboarding screen promises a human review when the provider cannot
    // place someone; this is where that promise is kept.
    renderView({ ...STATE, individualAssurance: { status: "failed" } });

    expect(screen.getByText("Could not be completed")).toBeDefined();
    expect(screen.getByRole("link", { name: "Try again" })).toBeDefined();
    expect(screen.getByText(/review it by hand/i)).toBeDefined();
  });
});
