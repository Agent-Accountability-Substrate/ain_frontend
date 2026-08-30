import {
  isEmailOnlyAssurance,
  type IndividualAssuranceStatus,
  type IndividualAssuranceSummary,
} from "@/domains/identity/identity-assurance";
import {
  IDENTITY_ONBOARDING,
  NEW_ORGANISATION,
  orgHref,
} from "@/domains/workspace/workspace-routes";

/**
 * The registry's own vocabulary, unrenamed.
 *
 * `rejected` and `needs_attention` are opposites: `rejected` is a decision
 * already taken — terminal, and it frees the registration number, so the way
 * forward is a fresh registration — while `needs_attention` means the
 * registration is still live and somebody is waiting on *you*.
 *
 * Softer wording belongs on the rendered label — see the status labels in
 * `organisations-view` — because a rename inside the type travels into every
 * `filter` and counter downstream, where it stops being cosmetic.
 */
export type OrganisationVerificationStatus =
  "pending" | "needs_attention" | "verified" | "rejected";

export type OrganisationSummary = {
  /**
   * The internal uuid. Plumbing only: it addresses the registry's own
   * `/orgs/{organisation_id}` routes and never appears in a URL a person sees.
   */
  id: string;
  /**
   * `organisation.org_ulid` — minted once at creation, and already public: it
   * is the organisation segment of every AIN this organisation mints
   * (`did:ain:gb:<org-ulid>:<agent-ulid>`). This is what the address bar
   * carries.
   */
  ulid: string;
  name: string;
  membershipRole: "owner" | "member";
  verificationStatus: OrganisationVerificationStatus;
  /**
   * What trust operations said, for the two outcomes that need explaining.
   * Absent while pending and after a clean verification — neither has anything
   * to explain.
   */
  reviewReason?: string;
};

/**
 * One registered agent, as the workspace shows it.
 *
 * A projection of the registry's row rather than a re-export: `status` and
 * `risk_class` are open strings in the contract (the vocabulary is partner-
 * gated), so the frontend keeps them as strings too and renders whatever the
 * registry says instead of narrowing them into an enum that would go stale.
 */
export type WorkspaceAgent = {
  ain: string;
  name: string;
  role: string;
  status: string;
  riskClass: string;
  organisationId: string;
  validFrom: string | null;
  createdAt: string;
};

/** Someone who can act for an organisation. */
export type OrganisationMember = {
  id: string;
  email: string;
  role: string;
};

export type OrganisationActivity = {
  id: string;
  organisationId: string;
  summary: string;
  occurredAt: string;
};

export type AccountWorkspaceState = {
  individualAssurance: IndividualAssuranceSummary;
  /**
   * Whether this person holds `trust_ops`, which the schema confines to the
   * platform organisation. Decides whether the console is *offered* in the
   * navigation — never whether it is permitted, which the registry settles on
   * every request.
   */
  isOperator: boolean;
  organisations: readonly OrganisationSummary[];
  selectedOrganisationId: string | null;
  /**
   * False only when the URL named an organisation this account is not in.
   * The page turns that into a 404; nothing else reads it.
   */
  namedOrganisationFound: boolean;
  totalAccessibleAgents: number;
  /** Every agent this account can reach, across the organisations it belongs to. */
  agents: readonly WorkspaceAgent[];
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

/**
 * A step in getting an account to its first signed record.
 *
 * `waiting` is its own state: between registering a company and registering an
 * agent sits a review nobody in this account can act on, and holding that as
 * an unticked box reads as a task you are failing rather than a queue you are
 * in.
 */
export type PrimaryNextAction = {
  label: string;
  detail: string;
  href?: string;
  state: "completed" | "current" | "available" | "waiting";
  /** What this step is holding up, on the step that cannot start yet. */
  blockedBy?: string;
};

export const initialAccountWorkspaceState: AccountWorkspaceState = {
  individualAssurance: { status: "not_started" },
  isOperator: false,
  organisations: [],
  selectedOrganisationId: null,
  namedOrganisationFound: true,
  totalAccessibleAgents: 0,
  agents: [],
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

/**
 * Which organisation the shell shows on a screen that names none.
 *
 * Registering a company and the account's own settings belong to the person,
 * so their addresses carry no tenant — but arriving at one is not leaving the
 * company you were in, and a switcher that empties says you have. This is
 * presentation only: nothing on those screens is read or written per
 * organisation. An account with no memberships has nothing to show, and the
 * shell falls back to the wordmark.
 */
export function contextOrganisation(
  state: AccountWorkspaceState,
): OrganisationSummary | null {
  return getSelectedOrganisation(state) ?? state.organisations[0] ?? null;
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
    // Only `needs_attention`. A rejected registration is finished — the holder
    // should know, but there is nothing for them to do about *that* row, so
    // counting it here would put work in a queue that cannot be worked.
    organisationsRequiringAttention: state.organisations.filter(
      (organisation) => organisation.verificationStatus === "needs_attention",
    ).length,
    totalAccessibleAgents: state.totalAccessibleAgents,
  };
}

export function getPrimaryNextActions(
  state: AccountWorkspaceState,
): readonly PrimaryNextAction[] {
  const selected = getSelectedOrganisation(state);
  const organisation = selected ?? state.organisations[0];
  const registered = state.organisations.length > 0;
  // `verified` is the only status that lets the registry accept an agent.
  // `rejected` is finished rather than pending, and the way on from it is a
  // fresh registration, which is the step above rather than a wait.
  const underReview =
    organisation !== undefined &&
    (organisation.verificationStatus === "pending" ||
      organisation.verificationStatus === "needs_attention");
  const verifiedOrganisation = organisation?.verificationStatus === "verified";

  const steps: (Omit<PrimaryNextAction, "state"> & {
    done: boolean;
    waiting?: boolean;
  })[] = [
    {
      label: "Verify your identity",
      // Ticked at sign-up, because the registry derives `verified` at the
      // `email_verified` profile from a confirmed address (`ain_docs`
      // DECISIONS.md, 2026-08-16). A step that ticks itself for an email
      // round-trip would overclaim, so the level is named here rather than
      // left to the settings screen.
      detail: isEmailOnlyAssurance(state.individualAssurance)
        ? "Your email address is confirmed"
        : "A one-off check on the person registering the company",
      href: IDENTITY_ONBOARDING,
      done: isAccountVerified(state),
    },
    {
      label: "Register your company",
      detail: "The legal entity its agents will answer for",
      href: NEW_ORGANISATION,
      done: registered,
    },
  ];

  // Only once there is something to review. Before that it would be a step
  // describing a queue nobody is in.
  if (underReview) {
    steps.push({
      label: "We check the company",
      detail:
        organisation.verificationStatus === "needs_attention"
          ? "A reviewer has asked for something before they can decide"
          : "Confirming the registration number and your authority to act for it",
      ...(organisation.verificationStatus === "needs_attention" && {
        href: orgHref(organisation.ulid, "settings/registration"),
      }),
      done: false,
      waiting: true,
    });
  }

  steps.push({
    label: "Register your first agent",
    detail: "Mint a permanent identifier and sign its record",
    ...(verifiedOrganisation && {
      href: orgHref(organisation.ulid, "agents/new"),
    }),
    ...(registered &&
      !verifiedOrganisation && {
        blockedBy: "the company being verified",
      }),
    done: state.totalAccessibleAgents > 0,
  });

  // Only a step that is yours and unblocked can be the current one; a wait
  // never is, and neither is anything behind it.
  const current = steps.findIndex(
    (step) =>
      !step.done && step.waiting !== true && step.blockedBy === undefined,
  );

  return steps.map((step, index) => ({
    label: step.label,
    detail: step.detail,
    ...(step.href !== undefined && { href: step.href }),
    ...(step.blockedBy !== undefined && { blockedBy: step.blockedBy }),
    state: step.done
      ? ("completed" as const)
      : step.waiting === true
        ? ("waiting" as const)
        : index === current
          ? ("current" as const)
          : ("available" as const),
  }));
}

/**
 * Whether setup is still worth showing. Once the last step lands the checklist
 * goes, permanently.
 *
 * A step waiting on us keeps it on screen: it is the only place that says what
 * the wait is and what it is holding up, and hiding it would leave someone
 * looking at a locked agent form with no explanation.
 */
export function isSetupComplete(state: AccountWorkspaceState): boolean {
  return getPrimaryNextActions(state).every(
    (action) => action.state === "completed",
  );
}
