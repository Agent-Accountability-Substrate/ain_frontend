import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { OrganisationHomeView } from "@/domains/organisations/organisation-home-view";
import {
  initialAccountWorkspaceState,
  type AccountWorkspaceState,
  type OrganisationSummary,
  type WorkspaceAgent,
} from "@/domains/workspace/account-workspace";

vi.mock("@/domains/auth/auth-actions", () => ({ signOutAction: vi.fn() }));

const ORG: OrganisationSummary = {
  id: "6a1f6f38-0d3f-4c86-9a53-8c8f7a1e2b4d",
  ulid: "01ARZ3NDEKTSV4RRFFQ69G5FAV",
  name: "Example Holdings Ltd",
  membershipRole: "owner",
  verificationStatus: "verified",
};

const OTHER: OrganisationSummary = {
  id: "6a1f6f38-0d3f-4c86-9a53-8c8f7a1e2b4e",
  ulid: "01BX5ZZKBKACTAV9WEVGEMMVRZ",
  name: "Northgate Trading Ltd",
  membershipRole: "member",
  verificationStatus: "verified",
};

const agent = (
  name: string,
  organisationId: string,
  status = "active",
): WorkspaceAgent => ({
  ain: `did:ain:gb:01ARZ3NDEKTSV4RRFFQ69G5FAV:${name.toUpperCase().padEnd(26, "0")}`,
  name,
  role: "does a thing",
  status,
  riskClass: "high",
  organisationId,
  validFrom: "2026-07-23T10:42:00Z",
  createdAt: "2026-07-23T10:40:00Z",
});

function state(overrides: Partial<AccountWorkspaceState> = {}) {
  return {
    ...initialAccountWorkspaceState,
    organisations: [ORG, OTHER],
    selectedOrganisationId: ORG.id,
    ...overrides,
  };
}

describe("OrganisationHomeView", () => {
  it("shows this organisation's agents, and only this organisation's", () => {
    // Home is the head of the register, not the register: Agents is that.
    render(
      <OrganisationHomeView
        organisation={ORG}
        state={state({
          agents: [agent("Mine", ORG.id), agent("Theirs", OTHER.id)],
        })}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Example Holdings Ltd" }),
    ).toBeDefined();
    const register = screen.getByRole("region", { name: "1 agent" });
    expect(within(register).getByText("Mine")).toBeDefined();
    expect(within(register).queryByText("Theirs")).toBeNull();
  });

  it("keeps the account-setup checklist alongside it", () => {
    render(<OrganisationHomeView organisation={ORG} state={state()} />);

    expect(
      screen.getByRole("heading", {
        name: /steps? left|Nothing to do right now/,
      }),
    ).toBeDefined();
  });

  it("does not state the review twice while the checklist is saying it", () => {
    // The callout read "We are confirming the company and your authority to
    // act for it"; the checklist's "We check the company" step carries the
    // same sentence a column away. Both together said one fact twice.
    //
    // The prop and the state carry the same organisation, as they do in
    // production — `loadOrganisationPage` passes `selectedOrganisation(state)`
    // — because the callout reads the prop and the checklist reads the state.
    const pending = { ...ORG, verificationStatus: "pending" } as const;
    render(
      <OrganisationHomeView
        organisation={pending}
        state={state({ organisations: [pending, OTHER] })}
      />,
    );

    expect(screen.queryByText("Agents cannot be registered yet")).toBeNull();
    expect(screen.getByText("We check the company")).toBeDefined();
  });

  it("still says a registration was refused, which no step covers", () => {
    // The checklist can only show the next step locked. That does not say the
    // registration was decided against, so the callout is not a restatement.
    render(
      <OrganisationHomeView
        organisation={{
          ...ORG,
          verificationStatus: "rejected",
          reviewReason: "The company number belongs to a dissolved entity.",
        }}
        state={state()}
      />,
    );

    expect(
      screen.getByText("This registration was not approved"),
    ).toBeDefined();
  });

  it("reads an empty estate as empty rather than as a pass", () => {
    // "No agents registered" sat under a green tick, which reads as all-clear
    // for a state that is simply nothing yet.
    render(
      <OrganisationHomeView organisation={ORG} state={state({ agents: [] })} />,
    );

    expect(screen.getByText("Nothing to review yet")).toBeDefined();
  });

  it("says what is standing in the way rather than only that it cannot proceed", () => {
    render(
      <OrganisationHomeView
        organisation={{
          ...ORG,
          verificationStatus: "needs_attention",
          reviewReason: "Send a director's proof of address.",
        }}
        state={state()}
      />,
    );

    expect(
      screen.getByText("Send a director's proof of address."),
    ).toBeDefined();
    expect(
      screen.queryByRole("link", { name: /Register an agent/ }),
    ).toBeNull();
  });

  it("surfaces agents that are not currently active", () => {
    render(
      <OrganisationHomeView
        organisation={ORG}
        state={state({
          agents: [agent("Live", ORG.id), agent("Halted", ORG.id, "suspended")],
        })}
      />,
    );

    expect(screen.getByText("1 of 2 not active")).toBeDefined();
  });
});
