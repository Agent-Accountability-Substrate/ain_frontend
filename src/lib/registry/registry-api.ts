import "server-only";

import { z } from "zod";

import { auth } from "@/auth";
import type {
  AccountWorkspaceState,
  OrganisationSummary,
} from "@/domains/workspace/account-workspace";
import type { IndividualAssuranceSummary } from "@/domains/identity/identity-assurance";
import { getServerEnv } from "@/lib/config/server-env";

/**
 * The Data Access Layer for `ain_backend_api` — the only module that holds the
 * API origin or the caller's bearer token (Next 16.3 guidance: a `server-only`
 * DAL owns `process.env` access, so secrets never spread through the tree).
 *
 * Two things this deliberately does not do. It does not accept a token as an
 * argument: callers cannot supply one, so no route can be tricked into
 * forwarding someone else's. And it does not export the token — only the parsed
 * result of a call — so nothing downstream can pass it to a client component.
 *
 * Every response is parsed with Zod before it leaves this module, per the repo
 * rule. The backend is trusted for correctness, not for shape: a contract drift
 * should surface here as a loud failure rather than as `undefined` rendering
 * halfway down a page.
 */

/** Local default matching `uvicorn ain_backend_api.app:create_app --factory`. */
const LOCAL_API_BASE_URL = "http://127.0.0.1:8000";

/**
 * The registry could not be reached, or answered in a way we cannot use.
 *
 * `detail` is the registry's own explanation when it gave one. A 503 from this
 * backend has two quite different meanings — "storage is temporarily
 * unavailable", where retrying is the right advice, and "issuance signing is
 * not configured", where it never is. Both arrive as 503, so a caller that
 * only knows the status tells someone to retry something that cannot succeed.
 */
export class RegistryUnavailableError extends Error {
  readonly detail: string | undefined;

  constructor(message: string, options?: ErrorOptions & { detail?: string }) {
    super(message, options);
    this.detail = options?.detail;
  }
}

/** No usable session — the caller must authenticate before this can work. */
export class NotAuthenticatedError extends Error {}

/**
 * The registry refused this write, and said why in terms a person can act on.
 *
 * Separate from `RegistryUnavailableError` because the two need opposite
 * treatment: this one is the caller's to fix and its `detail` is safe to show,
 * while an unavailability is ours and its message is not. `status` is carried
 * so a caller can distinguish "already registered" from "slow down" without
 * matching on prose.
 */
export class RegistryRefusedError extends Error {
  constructor(
    readonly status: number,
    readonly detail: string,
  ) {
    super(detail);
  }
}

const membershipSchema = z.object({
  organisation_id: z.uuid(),
  roles: z.array(z.string()),
});

const whoAmISchema = z.object({
  subject: z.string(),
  // Plural, and an empty array is a valid answer: a person who has signed up
  // and joined nothing yet is in the state the product expects them to be in.
  organisations: z.array(membershipSchema),
});

/** The caller's own identity and authority, as the registry sees it. */
export type WhoAmI = z.infer<typeof whoAmISchema>;

const organisationSchema = z.object({
  organisation_id: z.uuid(),
  name: z.string(),
  jurisdiction: z.string(),
  org_ulid: z.string(),
  registration_number: z.string(),
  web_url: z.string().nullable(),
  // Parsed as the enum the registry actually returns, all four values. Not
  // coerced into a friendlier vocabulary here: `needs_attention` and
  // `rejected` mean opposite things to a reader, and collapsing them would
  // travel into every filter downstream.
  verification_status: z.enum([
    "pending",
    "needs_attention",
    "verified",
    "rejected",
  ]),
  review_reason: z.string().nullable(),
  verified_at: z.iso.datetime({ offset: true }).nullable(),
  roles: z.array(z.string()),
  is_owner: z.boolean(),
});

const organisationListSchema = z.object({
  organisations: z.array(organisationSchema),
});

export type RegistryOrganisation = z.infer<typeof organisationSchema>;

const agentSchema = z.object({
  agent_id: z.uuid(),
  ain: z.string(),
  name: z.string(),
  role: z.string(),
  status: z.string(),
  risk_class: z.string(),
  valid_from: z.iso.datetime({ offset: true }).nullable(),
  created_at: z.iso.datetime({ offset: true }),
});

const agentListSchema = z.object({ agents: z.array(agentSchema) });

export type RegistryAgent = z.infer<typeof agentSchema>;

const assuranceSchema = z.object({
  status: z.enum([
    "not_started",
    "pending",
    "verified",
    "needs_review",
    "failed",
    "expired",
  ]),
  assurance_profile: z.string().nullable(),
  provider_reference: z.string().nullable(),
  checked_at: z.iso.datetime({ offset: true }).nullable(),
  expires_at: z.iso.datetime({ offset: true }).nullable(),
  review_reason: z.string().nullable(),
});

function baseUrl(): string {
  return getServerEnv().AIN_API_BASE_URL ?? LOCAL_API_BASE_URL;
}

/**
 * Statuses whose `detail` is written for a person and is theirs to act on.
 *
 * An allowlist rather than "any 4xx", because most 4xx are not the caller's at
 * all. A **405** is the client calling a route the registry does not serve that
 * way — a version skew between the two, which showed up the first time this was
 * pointed at a backend running older code and rendered "Method Not Allowed" to
 * the user. A **404** on a tenant route means "not a member", and repeating the
 * registry's wording would tell a stranger which of the two it was. Both belong
 * on the unavailable side with everything else unrecognised.
 *
 * 403 "insufficient role" / "organisation is not verified", 409 "company
 * already registered", 422 "the member's email is not a usable address" and
 * 429's back-off are all written to be read. Add to this set only when the
 * registry gains another status that carries a message worth showing.
 */
const RELAYABLE = new Set([403, 409, 422, 429, 503]);

/** The registry's `{"detail": "..."}`, when it sent one we can show. */
async function refusalDetail(response: Response): Promise<string | null> {
  try {
    const body: unknown = await response.json();
    if (body !== null && typeof body === "object" && "detail" in body) {
      const detail = (body as { detail: unknown }).detail;
      // FastAPI's own 422 body is an array of per-field objects, which is not
      // something to put in front of a person. Only a plain string is shown.
      if (typeof detail === "string") return detail;
    }
  } catch {
    // No JSON, or unreadable. The caller falls back to its own wording.
  }
  return null;
}

async function request(
  path: string,
  init?: { method: "POST" | "PATCH"; body: unknown },
): Promise<unknown> {
  const session = await auth();
  // Absent covers both "not signed in" and "access token expired", which the
  // session callback collapses on purpose — neither can be fixed by retrying
  // the request, and both are fixed by signing in again.
  if (!session?.accessToken) throw new NotAuthenticatedError();

  let response: Response;
  try {
    response = await fetch(new URL(path, baseUrl()), {
      method: init?.method ?? "GET",
      headers: {
        authorization: `Bearer ${session.accessToken}`,
        ...(init && { "content-type": "application/json" }),
      },
      ...(init && { body: JSON.stringify(init.body) }),
      // Authority is re-read from the registry on every backend request, so a
      // cached response would reinstate exactly the staleness that reading it
      // per request exists to avoid.
      cache: "no-store",
    });
  } catch (cause) {
    // A transport failure is not an authorisation outcome; keep them distinct
    // so the UI never renders "you lack permission" for a connection refused.
    throw new RegistryUnavailableError(
      `could not reach the registry: ${path}`,
      {
        cause,
      },
    );
  }

  if (response.status === 401) throw new NotAuthenticatedError();
  if (!response.ok) {
    const detail = RELAYABLE.has(response.status)
      ? await refusalDetail(response)
      : null;
    // The status decides whose problem it is; the detail only decides how well
    // we can describe it. A 4xx the caller can act on is a refusal; a 5xx stays
    // an unavailability even when the registry told us exactly which subsystem
    // is unconfigured.
    if (detail !== null && response.status < 500) {
      throw new RegistryRefusedError(response.status, detail);
    }
    throw new RegistryUnavailableError(
      `registry answered ${response.status} for ${path}`,
      detail !== null ? { detail } : undefined,
    );
  }
  return response.json();
}

async function get(path: string): Promise<unknown> {
  return request(path);
}

/**
 * `GET /auth/whoami` — the authenticated echo.
 *
 * Worth more than it looks: the organisations and roles it returns are resolved
 * from the caller's `app_user` rows, not from the token, so a successful call
 * proves the whole chain — audience requested, Action stamping its claims,
 * backend verifying, membership resolved.
 */
export async function whoAmI(): Promise<WhoAmI> {
  return whoAmISchema.parse(await get("/auth/whoami"));
}

/** `GET /orgs` — every organisation the caller belongs to, with details. */
export async function listOrganisations(): Promise<RegistryOrganisation[]> {
  const body = organisationListSchema.parse(await get("/orgs"));
  return body.organisations;
}

/** `GET /orgs/{id}/agents` — the organisation's register of agents. */
export async function listAgents(
  organisationId: string,
): Promise<RegistryAgent[]> {
  const body = agentListSchema.parse(
    await get(`/orgs/${encodeURIComponent(organisationId)}/agents`),
  );
  return body.agents;
}

/**
 * `GET /identity/assurance` — how well the caller's own identity is known.
 *
 * Always answers; "nothing established yet" is `not_started`, not a 404. The
 * registry never writes this table, so today it is `not_started` for everyone
 * — the shape is here so the UI is already right when a provider lands.
 */
export async function identityAssurance(): Promise<IndividualAssuranceSummary> {
  const record = assuranceSchema.parse(await get("/identity/assurance"));
  // Optional-and-absent rather than explicitly null, because that is what the
  // frontend type says. `??` on each field would keep nulls; this drops the
  // keys entirely, so `"assuranceProfile" in summary` means what it looks like.
  return {
    status: record.status,
    ...(record.assurance_profile !== null && {
      assuranceProfile: record.assurance_profile,
    }),
    ...(record.provider_reference !== null && {
      providerReference: record.provider_reference,
    }),
    ...(record.checked_at !== null && { checkedAt: record.checked_at }),
    ...(record.expires_at !== null && { expiresAt: record.expires_at }),
    ...(record.review_reason !== null && {
      reviewReason: record.review_reason,
    }),
  };
}

const createdOrganisationSchema = z.object({
  organisation_id: z.uuid(),
  org_ulid: z.string(),
  verification_status: z.literal("pending"),
});

export type CreatedOrganisation = z.infer<typeof createdOrganisationSchema>;

export type NewOrganisation = {
  name: string;
  /** ISO 3166-1 alpha-2, lowercase — the registry rejects anything else. */
  jurisdiction: string;
  registrationNumber: string;
  address: string;
  webUrl?: string;
};

/**
 * `POST /orgs` — register a company. Anyone with a verified address may.
 *
 * The organisation is created `pending` and can do nothing until trust-ops
 * confirms the registration number against the company register and the
 * creator's authority to represent it out of band. That is why this needs no
 * gate of its own beyond being signed in.
 */
export async function createOrganisation(
  input: NewOrganisation,
): Promise<CreatedOrganisation> {
  return createdOrganisationSchema.parse(
    await request("/orgs", {
      method: "POST",
      body: {
        name: input.name,
        jurisdiction: input.jurisdiction,
        registration_number: input.registrationNumber,
        address: input.address,
        ...(input.webUrl && { web_url: input.webUrl }),
      },
    }),
  );
}

const registeredAgentSchema = z.object({
  agent_id: z.uuid(),
  ain: z.string(),
  status: z.literal("draft"),
});

export type RegisteredAgent = z.infer<typeof registeredAgentSchema>;

/** `POST /orgs/{id}/agents` — mint an AIN and open a draft. */
export async function registerAgent(
  organisationId: string,
  input: { name: string; role: string; riskClass: string },
): Promise<RegisteredAgent> {
  return registeredAgentSchema.parse(
    await request(`/orgs/${encodeURIComponent(organisationId)}/agents`, {
      method: "POST",
      body: { name: input.name, role: input.role, risk_class: input.riskClass },
    }),
  );
}

export type AgentDraftPatch = {
  scope: {
    actionClasses: string[];
    constraints: Record<string, Record<string, unknown>>;
    riskLevel: string;
    regulatoryMappings: string[];
  };
  accountability: {
    roleTitle: string;
    responsibilityArea: string;
    regulatoryIdentifier: string;
  };
};

/**
 * `PATCH /orgs/{id}/agents/{ain}` — attach scope and named accountability.
 *
 * A scope write is a full supersede, so the caller states the whole scope. The
 * registry has no defaults here on purpose: a partial scope would silently
 * declare a deny-all one nobody wrote.
 */
export async function patchAgent(
  organisationId: string,
  ain: string,
  patch: AgentDraftPatch,
): Promise<void> {
  await request(
    `/orgs/${encodeURIComponent(organisationId)}/agents/${encodeURIComponent(ain)}`,
    {
      method: "PATCH",
      body: {
        scope: {
          action_classes: patch.scope.actionClasses,
          constraints: patch.scope.constraints,
          risk_level: patch.scope.riskLevel,
          regulatory_mappings: patch.scope.regulatoryMappings,
        },
        accountability: {
          role_title: patch.accountability.roleTitle,
          responsibility_area: patch.accountability.responsibilityArea,
          regulatory_identifier: patch.accountability.regulatoryIdentifier,
        },
      },
    },
  );
}

const submittedAgentSchema = z.object({
  ain: z.string(),
  status: z.string(),
  document_version: z.number().int(),
  document_hash: z.string(),
  kid: z.string(),
  chain_head: z.string(),
  resolver_url: z.string(),
});

export type SubmittedAgent = z.infer<typeof submittedAgentSchema>;

/**
 * `POST /orgs/{id}/agents/{ain}/submit` — sign the document and activate.
 *
 * The one write here that needs custody provisioned: it canonicalises the
 * payload, has it signed, and appends the genesis lifecycle events in one
 * transaction. Without Vault the registry refuses rather than issuing an agent
 * under a development key, which is why a 503 from this call is configuration
 * rather than a bug.
 */
export async function submitAgent(
  organisationId: string,
  ain: string,
): Promise<SubmittedAgent> {
  return submittedAgentSchema.parse(
    await request(
      `/orgs/${encodeURIComponent(organisationId)}/agents/${encodeURIComponent(ain)}/submit`,
      { method: "POST", body: {} },
    ),
  );
}

const reviewItemSchema = z.object({
  organisation_id: z.uuid(),
  name: z.string(),
  jurisdiction: z.string(),
  registration_number: z.string(),
  web_url: z.string().nullable(),
  address: z.string(),
  verification_status: z.enum(["pending", "needs_attention"]),
  review_reason: z.string().nullable(),
  created_at: z.iso.datetime({ offset: true }),
});

const reviewQueueSchema = z.object({
  organisations: z.array(reviewItemSchema),
});

export type ReviewItem = z.infer<typeof reviewItemSchema>;

/**
 * `GET /operations/review-queue` — what trust operations has left to decide.
 *
 * The one cross-tenant list in the product. The operator belongs to none of
 * these organisations; the registry's `organisation_review_read` policy is
 * what makes the read possible, and it re-derives the role from the database
 * rather than trusting the caller.
 */
export async function listReviewQueue(): Promise<ReviewItem[]> {
  const body = reviewQueueSchema.parse(await get("/operations/review-queue"));
  return body.organisations;
}

const registerRecordSchema = z.object({
  company_name: z.string(),
  company_status: z.string(),
  company_type: z.string().nullable(),
  date_of_creation: z.string().nullable(),
  registered_office_address: z.string().nullable(),
});

const registrationCheckSchema = z.object({
  registration_number: z.string(),
  jurisdiction: z.string(),
  claimed_name: z.string(),
  claimed_address: z.string(),
  // Absent when the register holds no such company — a finding, and a loud one.
  register: registerRecordSchema.nullable(),
  name_matches: z.boolean().nullable(),
  is_active: z.boolean().nullable(),
});

export type RegistrationCheck = z.infer<typeof registrationCheckSchema>;

/**
 * `GET /orgs/{id}/registration-check` — what the company register says.
 *
 * Advisory only. It confirms a company exists under that number and what it is
 * called; whether *this person* may act for it is published nowhere, so this
 * informs the decision and never makes it.
 */
export async function checkRegistration(
  organisationId: string,
): Promise<RegistrationCheck> {
  return registrationCheckSchema.parse(
    await get(`/orgs/${encodeURIComponent(organisationId)}/registration-check`),
  );
}

const verificationDecisionSchema = z.object({
  organisation_id: z.uuid(),
  verification_status: z.string(),
  review_reason: z.string().nullable(),
  verified_at: z.iso.datetime({ offset: true }).nullable(),
});

export type VerificationOutcome = "verified" | "needs_attention" | "rejected";

/** `POST /orgs/{id}/verification` — record the outcome of a review. */
export async function recordVerification(
  organisationId: string,
  outcome: VerificationOutcome,
  reviewReason: string | null,
): Promise<z.infer<typeof verificationDecisionSchema>> {
  return verificationDecisionSchema.parse(
    await request(`/orgs/${encodeURIComponent(organisationId)}/verification`, {
      method: "POST",
      body: {
        outcome,
        // Omitted rather than null for a verified outcome: the registry refuses
        // a reason there rather than ignoring one.
        ...(reviewReason !== null && { review_reason: reviewReason }),
      },
    }),
  );
}

function toSummary(organisation: RegistryOrganisation): OrganisationSummary {
  return {
    id: organisation.organisation_id,
    name: organisation.name,
    // The owner is the `organisation.owner_user_id` FK, not a role: an
    // organisation may have several admins and exactly one owner.
    membershipRole: organisation.is_owner ? "owner" : "member",
    verificationStatus: organisation.verification_status,
    // Optional-and-absent rather than null, matching the frontend type.
    ...(organisation.review_reason !== null && {
      reviewReason: organisation.review_reason,
    }),
  };
}

/**
 * Everything the authenticated shell needs, in one call per page.
 *
 * The agent count is a sum across organisations, so it costs one request each.
 * That is deliberate rather than overlooked: the number appears on one card,
 * and a count field on `GET /orgs` would put a second definition of "how many
 * agents" in the API for it. Revisit if a person ever belongs to enough
 * organisations for the round trips to show.
 *
 * `selectedOrganisationId` is the caller's choice, passed in by the page. It is
 * not stored here and not guessed: every tenant route on the backend names its
 * organisation in the path, and the client should say which one it means for
 * the same reason.
 */
export async function loadAccountWorkspace(
  selectedOrganisationId: string | null = null,
): Promise<AccountWorkspaceState> {
  const [organisations, individualAssurance] = await Promise.all([
    listOrganisations(),
    identityAssurance(),
  ]);
  // allSettled, not all: this fan-out exists to sum one number for one stat
  // tile and one checklist tick, and Promise.all rejects on the first
  // rejection -- so a single organisation's agent list failing threw away the
  // organisations, names, statuses, review reasons, isOperator and assurance
  // that had already been fetched successfully, and the user got the full-page
  // outage screen. Nothing authorisation- or correctness-bearing reads the
  // count, so an undercount on a card is the right way to degrade.
  const agentCounts = (
    await Promise.allSettled(
      organisations.map(
        async (organisation) =>
          (await listAgents(organisation.organisation_id)).length,
      ),
    )
  ).map((result) => (result.status === "fulfilled" ? result.value : 0));

  const summaries = organisations.map(toSummary);
  // Read off the raw roles before `toSummary` drops them. The console's
  // navigation entry keys on this; the registry refuses the routes regardless,
  // so this decides what is *offered*, never what is permitted.
  const isOperator = organisations.some((organisation) =>
    organisation.roles.includes("trust_ops"),
  );
  const selected =
    selectedOrganisationId !== null &&
    summaries.some((summary) => summary.id === selectedOrganisationId)
      ? selectedOrganisationId
      : // Falling back to the only organisation is not a guess: with one
        // membership there is nothing to choose between. With several, no
        // choice has been made and the UI must say so rather than pick.
        summaries.length === 1
        ? summaries[0]!.id
        : null;

  return {
    individualAssurance,
    isOperator,
    organisations: summaries,
    selectedOrganisationId: selected,
    totalAccessibleAgents: agentCounts.reduce((total, n) => total + n, 0),
    // No source yet. `audit_log` holds the rows, but nothing exposes them and
    // what an activity feed may disclose — audit entries name the acting
    // subject — is a decision, not a wiring job. Empty is the honest value;
    // inventing one here would be worse than the gap.
    recentActivity: [],
  };
}
