import { describe, expect, it } from "vitest";

import {
  getAccountOverviewStats,
  getSelectedOrganisation,
  getPrimaryNextActions,
  isSetupComplete,
  initialAccountWorkspaceState,
  type AccountWorkspaceState,
} from "@/domains/workspace/account-workspace";

describe("account workspace state", () => {
  it("derives an honest initial zero state", () => {
    expect(getAccountOverviewStats(initialAccountWorkspaceState)).toEqual({
      verificationStatus: "not_started",
      organisationsOwned: 0,
      organisationsJoined: 0,
      organisationsPendingVerification: 0,
      organisationsRequiringAttention: 0,
      totalAccessibleAgents: 0,
    });
    expect(
      getPrimaryNextActions(initialAccountWorkspaceState).map(
        (action) => action.state,
      ),
    ).toEqual(["current", "available", "available"]);
  });

  it("names the level that ticked the identity step", () => {
    // The registry derives `verified` at the `email_verified` profile from a
    // confirmed address (`ain_docs` DECISIONS.md, 2026-08-16), so this step
    // ticks itself at sign-up — and must not then claim a check on the person
    // has happened.
    const emailOnly: AccountWorkspaceState = {
      ...initialAccountWorkspaceState,
      individualAssurance: {
        status: "verified",
        assuranceProfile: "email_verified",
      },
    };
    const [identity] = getPrimaryNextActions(emailOnly);
    expect(identity?.state).toBe("completed");
    expect(identity?.detail).toBe("Your email address is confirmed");

    // A profile this build does not recognise gets no claim attached either
    // way: unknown is not evidence of weakness.
    const stronger: AccountWorkspaceState = {
      ...initialAccountWorkspaceState,
      individualAssurance: {
        status: "verified",
        assuranceProfile: "uk_gpg45_medium",
      },
    };
    expect(getPrimaryNextActions(stronger)[0]?.detail).toBe(
      "A one-off check on the person registering the company",
    );
  });

  it("advances through organisation and agent prerequisites", () => {
    const verified: AccountWorkspaceState = {
      ...initialAccountWorkspaceState,
      individualAssurance: { status: "verified" },
    };
    expect(
      getPrimaryNextActions(verified).map((action) => action.state),
    ).toEqual(["completed", "current", "available"]);

    const withOrganisation: AccountWorkspaceState = {
      ...verified,
      organisations: [
        {
          id: "org-1",
          ulid: "01ARZ3NDM8EKP43BFRAGZ8WSQ4",
          name: "Verified organisation",
          membershipRole: "owner",
          verificationStatus: "verified",
        },
      ],
    };
    expect(
      getPrimaryNextActions(withOrganisation).map((action) => action.state),
    ).toEqual(["completed", "completed", "current"]);

    // Registering an agent is the last step, and finishing it retires the
    // whole checklist rather than leaving four ticks on the screen.
    const withAgent: AccountWorkspaceState = {
      ...withOrganisation,
      selectedOrganisationId: "org-1",
      totalAccessibleAgents: 1,
    };
    expect(
      getPrimaryNextActions(withAgent).map((action) => action.state),
    ).toEqual(["completed", "completed", "completed"]);
    expect(isSetupComplete(withAgent)).toBe(true);
    expect(isSetupComplete(withOrganisation)).toBe(false);
  });

  it("treats membership, not ownership, as the organisation prerequisite", () => {
    const memberOfTwo: AccountWorkspaceState = {
      ...initialAccountWorkspaceState,
      individualAssurance: { status: "verified" },
      organisations: [
        {
          id: "org-1",
          ulid: "01ARZ3NDM8EKP43BFRAGZ8WSQ4",
          name: "First member org",
          membershipRole: "member",
          verificationStatus: "verified",
        },
        {
          id: "org-2",
          ulid: "01ARZ3NDK1X8080CGJJAQ6D2F2",
          name: "Second member org",
          membershipRole: "member",
          verificationStatus: "verified",
        },
      ],
    };

    // Belongs to two organisations, so registering one is done and the agent
    // is what is left. Which organisation is being acted for is not a step:
    // the address says so.
    expect(
      getPrimaryNextActions(memberOfTwo).map((action) => action.state),
    ).toEqual(["completed", "completed", "current"]);

    const withAgent: AccountWorkspaceState = {
      ...memberOfTwo,
      selectedOrganisationId: "org-1",
      totalAccessibleAgents: 2,
    };
    expect(
      getPrimaryNextActions(withAgent).map((action) => action.state),
    ).toEqual(["completed", "completed", "completed"]);
  });

  it("never marks two steps current at once", () => {
    const invitedBeforeVerifying: AccountWorkspaceState = {
      ...initialAccountWorkspaceState,
      organisations: [
        {
          id: "org-1",
          ulid: "01ARZ3NDM8EKP43BFRAGZ8WSQ4",
          name: "Invited org",
          membershipRole: "member",
          verificationStatus: "verified",
        },
      ],
      selectedOrganisationId: "org-1",
    };

    const states = getPrimaryNextActions(invitedBeforeVerifying).map(
      (action) => action.state,
    );
    expect(states.filter((value) => value === "current")).toHaveLength(1);
    expect(states[0]).toBe("current");
  });

  it("counts owner, member, pending and attention records independently", () => {
    const state: AccountWorkspaceState = {
      ...initialAccountWorkspaceState,
      organisations: [
        {
          id: "org-owner",
          ulid: "01ARZ3NDY9M0819S4JR5JNDFJ1",
          name: "Owner org",
          membershipRole: "owner",
          verificationStatus: "pending",
        },
        {
          id: "org-member",
          ulid: "01ARZ3NDFH2R0C9CT25Q1JT1B9",
          name: "Member org",
          membershipRole: "member",
          verificationStatus: "needs_attention",
        },
        // Rejected is finished, so it is deliberately absent from the
        // attention count below: there is nothing for the holder to do about
        // that row, and a queue that cannot be worked is not a queue.
        {
          id: "org-refused",
          ulid: "01ARZ3ND2WT561NDSYXBSXPKK0",
          name: "Refused org",
          membershipRole: "member",
          verificationStatus: "rejected",
        },
      ],
      selectedOrganisationId: "org-member",
      totalAccessibleAgents: 2,
    };

    expect(getAccountOverviewStats(state)).toEqual({
      verificationStatus: "not_started",
      organisationsOwned: 1,
      organisationsJoined: 2,
      organisationsPendingVerification: 1,
      organisationsRequiringAttention: 1,
      totalAccessibleAgents: 2,
    });
    expect(getSelectedOrganisation(state)?.id).toBe("org-member");
    expect(
      getSelectedOrganisation({ ...state, selectedOrganisationId: "missing" }),
    ).toBeUndefined();
  });

  it("holds a review as a wait rather than as a task you are failing", () => {
    // Nobody in this account can move a pending registration along. Leaving it
    // as an unticked box reads as something you have not got round to.
    const pending: AccountWorkspaceState = {
      ...initialAccountWorkspaceState,
      individualAssurance: { status: "verified" },
      organisations: [
        {
          id: "org-1",
          ulid: "01ARZ3NDM8EKP43BFRAGZ8WSQ4",
          name: "Pending organisation",
          membershipRole: "owner",
          verificationStatus: "pending",
        },
      ],
      selectedOrganisationId: "org-1",
    };

    const actions = getPrimaryNextActions(pending);

    expect(actions.map((action) => action.state)).toEqual([
      "completed",
      "completed",
      "waiting",
      "available",
    ]);
    // And the step behind it says why it cannot start, rather than being shut.
    expect(actions.at(-1)?.blockedBy).toBe("the company being verified");
    expect(actions.at(-1)?.href).toBeUndefined();
    // The checklist stays: it is the only thing on screen that explains the
    // locked agent form.
    expect(isSetupComplete(pending)).toBe(false);
  });

  it("points a reviewer's question at the record that answers it", () => {
    const needsAttention: AccountWorkspaceState = {
      ...initialAccountWorkspaceState,
      individualAssurance: { status: "verified" },
      organisations: [
        {
          id: "org-1",
          ulid: "01ARZ3NDM8EKP43BFRAGZ8WSQ4",
          name: "Queried organisation",
          membershipRole: "owner",
          verificationStatus: "needs_attention",
        },
      ],
      selectedOrganisationId: "org-1",
    };

    const wait = getPrimaryNextActions(needsAttention).find(
      (action) => action.state === "waiting",
    );

    expect(wait?.detail).toMatch(/asked for something/i);
    expect(wait?.href).toBe(
      "/o/01ARZ3NDM8EKP43BFRAGZ8WSQ4/settings/registration",
    );
  });

  it("offers no wait for a registration that is finished either way", () => {
    // `verified` has nothing left to wait for; `rejected` is a decision, and
    // the way on from it is a fresh registration — the step above, not a queue.
    for (const verificationStatus of ["verified", "rejected"] as const) {
      const state: AccountWorkspaceState = {
        ...initialAccountWorkspaceState,
        individualAssurance: { status: "verified" },
        organisations: [
          {
            id: "org-1",
            ulid: "01ARZ3NDM8EKP43BFRAGZ8WSQ4",
            name: "Decided organisation",
            membershipRole: "owner",
            verificationStatus,
          },
        ],
        selectedOrganisationId: "org-1",
      };

      expect(
        getPrimaryNextActions(state).some(
          (action) => action.state === "waiting",
        ),
      ).toBe(false);
    }
  });
});
