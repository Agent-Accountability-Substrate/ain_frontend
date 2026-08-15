import { describe, expect, it } from "vitest";

import {
  getAccountOverviewStats,
  getSelectedOrganisation,
  getPrimaryNextActions,
  initialAccountWorkspaceState,
  type AccountWorkspaceState,
} from "@/lib/account-workspace";

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
    ).toEqual(["current", "available", "available", "available"]);
  });

  it("advances through organisation and agent prerequisites", () => {
    const verified: AccountWorkspaceState = {
      ...initialAccountWorkspaceState,
      individualAssurance: { status: "verified" },
    };
    expect(
      getPrimaryNextActions(verified).map((action) => action.state),
    ).toEqual(["completed", "current", "available", "available"]);

    const withOrganisation: AccountWorkspaceState = {
      ...verified,
      organisations: [
        {
          id: "org-1",
          name: "Verified organisation",
          membershipRole: "owner",
          verificationStatus: "verified",
        },
      ],
    };
    expect(
      getPrimaryNextActions(withOrganisation).map((action) => action.state),
    ).toEqual(["completed", "completed", "current", "available"]);

    const selected: AccountWorkspaceState = {
      ...withOrganisation,
      selectedOrganisationId: "org-1",
    };
    expect(
      getPrimaryNextActions(selected).map((action) => action.state),
    ).toEqual(["completed", "completed", "completed", "current"]);
  });

  it("treats membership, not ownership, as the organisation prerequisite", () => {
    const memberOfTwo: AccountWorkspaceState = {
      ...initialAccountWorkspaceState,
      individualAssurance: { status: "verified" },
      organisations: [
        {
          id: "org-1",
          name: "First member org",
          membershipRole: "member",
          verificationStatus: "verified",
        },
        {
          id: "org-2",
          name: "Second member org",
          membershipRole: "member",
          verificationStatus: "verified",
        },
      ],
    };

    // Belongs to two organisations, so "Create first organisation" is done and
    // "Select organisation" is the one thing left to do.
    expect(
      getPrimaryNextActions(memberOfTwo).map((action) => action.state),
    ).toEqual(["completed", "completed", "current", "available"]);

    const selected: AccountWorkspaceState = {
      ...memberOfTwo,
      selectedOrganisationId: "org-1",
    };
    expect(
      getPrimaryNextActions(selected).map((action) => action.state),
    ).toEqual(["completed", "completed", "completed", "current"]);
  });

  it("never marks two steps current at once", () => {
    const invitedBeforeVerifying: AccountWorkspaceState = {
      ...initialAccountWorkspaceState,
      organisations: [
        {
          id: "org-1",
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
          name: "Owner org",
          membershipRole: "owner",
          verificationStatus: "pending",
        },
        {
          id: "org-member",
          name: "Member org",
          membershipRole: "member",
          verificationStatus: "needs_attention",
        },
      ],
      selectedOrganisationId: "org-member",
      totalAccessibleAgents: 2,
    };

    expect(getAccountOverviewStats(state)).toEqual({
      verificationStatus: "not_started",
      organisationsOwned: 1,
      organisationsJoined: 1,
      organisationsPendingVerification: 1,
      organisationsRequiringAttention: 1,
      totalAccessibleAgents: 2,
    });
    expect(getSelectedOrganisation(state)?.id).toBe("org-member");
    expect(
      getSelectedOrganisation({ ...state, selectedOrganisationId: "missing" }),
    ).toBeUndefined();
  });
});
