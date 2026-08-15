import type {
  IndividualAssuranceStatus,
  IndividualAssuranceSummary,
} from "@/lib/identity-assurance";

export type OrganisationVerificationStatus =
  "pending" | "verified" | "needs_attention";

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
    organisationsRequiringAttention: state.organisations.filter(
      (organisation) => organisation.verificationStatus === "needs_attention",
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
