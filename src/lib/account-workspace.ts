import type {
  IndividualAssuranceStatus,
  IndividualAssuranceSummary,
} from "@/lib/identity-assurance";

/**
 * The registry's own vocabulary, unrenamed.
 *
 * This union used to end in `needs_attention`, which reads as a work item —
 * something the holder can put right. `rejected` is the opposite: trust-ops
 * has decided, `verify` refuses anything that is not `pending`, membership
 * routes treat a rejected organisation as non-existent, and the partial unique
 * on the registration number exists so the *retry* is a new organisation
 * rather than a repair of this one. Calling it "needs attention" in the type
 * would send that promise into every `filter` and counter downstream.
 *
 * Softer wording belongs on the rendered label, not here — see the status
 * labels in `organisations-view`.
 *
 * A genuine "we need more from you, and your registration is still alive"
 * state is missing from the schema and belongs with the reject flow
 * (`DECISIONS.md`, 2026-08-16).
 */
export type OrganisationVerificationStatus =
  "pending" | "verified" | "rejected";

export type OrganisationSummary = {
  id: string;
  name: string;
  membershipRole: "owner" | "member";
  verificationStatus: OrganisationVerificationStatus;
};

export type OrganisationActivity = {
  id: string;
  organisationId: string;
  summary: string;
  occurredAt: string;
};

export type AccountWorkspaceState = {
  individualAssurance: IndividualAssuranceSummary;
  organisations: readonly OrganisationSummary[];
  selectedOrganisationId: string | null;
  totalAccessibleAgents: number;
  recentActivity: readonly OrganisationActivity[];
};

export type AccountOverviewStats = {
  verificationStatus: IndividualAssuranceStatus;
  organisationsOwned: number;
  organisationsJoined: number;
  organisationsPendingVerification: number;
  organisationsRequiringAttention: number;
  totalAccessibleAgents: number;
};

export type PrimaryNextAction = {
  label: string;
  detail: string;
  href?: string;
  state: "completed" | "current" | "available";
};

export const initialAccountWorkspaceState: AccountWorkspaceState = {
  individualAssurance: { status: "not_started" },
  organisations: [],
  selectedOrganisationId: null,
  totalAccessibleAgents: 0,
  recentActivity: [],
};

export function isAccountVerified(state: AccountWorkspaceState): boolean {
  return state.individualAssurance.status === "verified";
}

export function getSelectedOrganisation(
  state: AccountWorkspaceState,
): OrganisationSummary | undefined {
  return state.organisations.find(
    (organisation) => organisation.id === state.selectedOrganisationId,
  );
}

export function getAccountOverviewStats(
  state: AccountWorkspaceState,
): AccountOverviewStats {
  return {
    verificationStatus: state.individualAssurance.status,
    organisationsOwned: state.organisations.filter(
      (organisation) => organisation.membershipRole === "owner",
    ).length,
    organisationsJoined: state.organisations.filter(
      (organisation) => organisation.membershipRole === "member",
    ).length,
    organisationsPendingVerification: state.organisations.filter(
      (organisation) => organisation.verificationStatus === "pending",
    ).length,
    // A rejected registration does warrant the holder's notice — they should
    // know it will never verify. What it does not warrant is a prompt to fix
    // it, because there is nothing to fix: the next step is a fresh
    // registration, not an edit.
    organisationsRequiringAttention: state.organisations.filter(
      (organisation) => organisation.verificationStatus === "rejected",
    ).length,
    totalAccessibleAgents: state.totalAccessibleAgents,
  };
}

export function getPrimaryNextActions(
  state: AccountWorkspaceState,
): readonly PrimaryNextAction[] {
  // Belonging to an organisation is what unlocks the later steps, so these read
  // membership rather than ownership — a member of two organisations has one to
  // select and is not being asked to create their first.
  const steps = [
    {
      label: "Verify account",
      detail: "Complete individual identity due diligence",
      href: "/onboarding/identity",
      done: isAccountVerified(state),
    },
    {
      label: "Create first organisation",
      detail: "Register and verify a UK legal entity",
      href: "/organisations/new",
      done: state.organisations.length > 0,
    },
    {
      label: "Select organisation",
      detail: "Choose the organisation workspace to manage",
      href: "/organisations",
      done: Boolean(getSelectedOrganisation(state)),
    },
    {
      label: "Create first agent",
      detail: "Register an agent inside the selected organisation",
      href: "/agents/new",
      done: state.totalAccessibleAgents > 0,
    },
  ];

  // Progress is sequential, so only the first unfinished step is the primary
  // action. Anything after it is merely available — never a second "current".
  let currentTaken = false;

  return steps.map(({ done, ...action }): PrimaryNextAction => {
    if (done) return { ...action, state: "completed" };
    if (currentTaken) return { ...action, state: "available" };
    currentTaken = true;
    return { ...action, state: "current" };
  });
}
