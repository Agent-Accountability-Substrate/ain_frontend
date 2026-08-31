import "server-only";

import { cache } from "react";
import { z } from "zod";

import { currentSession } from "@/auth";
import type {
  AgentRecord,
  AgentTransition,
} from "@/domains/agents/agent-record";
import type {
  AccountWorkspaceState,
  OrganisationMember,
  OrganisationSummary,
} from "@/domains/workspace/account-workspace";
import type { IndividualAssuranceSummary } from "@/domains/identity/identity-assurance";
import { getServerEnv } from "@/lib/config/server-env";

/**
 * The Data Access Layer for `ain_backend_api` — the only module that holds the
 * API origin or the caller's bearer token (Next 16.3 guidance: a `server-only`
 * DAL owns `process.env` access, so secrets never spread through the tree).
 *
 * It never accepts a token as an argument, so no route can be tricked into
 * forwarding someone else's, and never exports one — only the parsed result of
 * a call.
 *
 * Every response is parsed with Zod before it leaves this module, per the repo
 * rule: contract drift surfaces here as a loud failure rather than as
 * `undefined` rendering halfway down a page.
 */

/** Local default matching `uvicorn ain_backend_api.app:create_app --factory`. */
const LOCAL_API_BASE_URL = "http://127.0.0.1:8000";

/**
 * The registry could not be reached, or answered in a way we cannot use.
 *
 * `detail` carries the registry's own explanation for the log. A 503 means
 * either "storage is temporarily unavailable", where retrying helps, or
 * "issuance signing is not configured", where it never will.
 */
export class RegistryUnavailableError extends Error {
  readonly detail: string | undefined;
  /** The HTTP status, when there was a response at all. */
  readonly status: number | undefined;

  constructor(
    message: string,
    options?: ErrorOptions & { detail?: string; status?: number },
  ) {
    super(message, options);
    this.detail = options?.detail;
    this.status = options?.status;
  }
}

/** No usable session — the caller must authenticate before this can work. */
export class NotAuthenticatedError extends Error {}

/**
 * The registry refused this write, and said why in terms a person can act on.
 *
 * Separate from `RegistryUnavailableError` because the two need opposite
 * treatment: this one is the caller's to fix and its `detail` is safe to show,
 * while an unavailability is ours and its message is not. `status` lets a
 * caller tell "already registered" from "slow down" without matching on prose.
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

/**
 * The single-agent read.
 *
 * `document`, `scope` and `accountability` are nullable rather than optional
 * because a draft genuinely has none of them yet — the registry says so
 * explicitly instead of omitting keys, so a missing key stays a contract
 * error rather than an ordinary draft.
 *
 * `constraints` is `unknown` inside: contract v1 fixes the shape as
 * `{action_class: {key: <open JSON>}}` and deliberately says nothing about
 * what a key means. Narrowing it here would invent a vocabulary this layer
 * does not own.
 */
const agentRecordSchema = agentSchema.extend({
  document: z
    .object({
      document_version: z.number().int(),
      document_hash: z.string(),
      kid: z.string(),
      valid_from: z.iso.datetime({ offset: true }),
    })
    .nullable(),
  scope: z
    .object({
      action_classes: z.array(z.string()),
      constraints: z.record(z.string(), z.record(z.string(), z.unknown())),
      risk_level: z.string(),
      regulatory_mappings: z.array(z.string()),
    })
    .nullable(),
  accountability: z
    .object({
      role_title: z.string(),
      responsibility_area: z.string(),
      regulatory_identifier: z.string(),
    })
    .nullable(),
  external_identities: z.array(
    z.object({
      ref_type: z.string(),
      ref_value: z.string(),
      verified: z.boolean(),
    }),
  ),
  lifecycle: z.array(
    z.object({
      seq: z.number().int(),
      event_type: z.string(),
      occurred_at: z.iso.datetime({ offset: true }),
      event_hash: z.string(),
      previous_event_hash: z.string().nullable(),
    }),
  ),
  resolver_url: z.string().nullable(),
});

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
 * The registry's address for one path.
 *
 * Concatenated rather than `new URL(path, base)`: every path here is absolute,
 * and an absolute path replaces the base's own, so a registry mounted under a
 * prefix — `https://host/registry` behind a gateway — silently loses it. That
 * 404s every call in the deployment while still forwarding the caller's bearer
 * token to a path nobody meant, and nothing complains at boot.
 */
function apiUrl(path: string): URL {
  return new URL(`${baseUrl().replace(/\/+$/, "")}${path}`);
}

/**
 * Statuses whose `detail` is written for a person and is theirs to act on.
 *
 * An allowlist rather than "any 4xx", because most 4xx are not the caller's at
 * all. A **405** is a version skew between client and registry, which would
 * otherwise render "Method Not Allowed" to a user. A **404** on a tenant route
 * means "not a member", and repeating the registry's wording would tell a
 * stranger which of the two it was. Both belong on the unavailable side.
 *
 * 403 "insufficient role", 409 "company already registered", 422 "the member's
 * email is not a usable address" and 429's back-off are all written to be
 * read. Add to this set only when the registry gains another status carrying a
 * message worth showing.
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
  init?: { method: "POST" | "PATCH" | "DELETE"; body?: unknown },
): Promise<unknown> {
  const session = await currentSession();
  // Absent covers both "not signed in" and "access token expired": neither is
  // fixed by retrying, and both are fixed by signing in again.
  if (!session?.accessToken) throw new NotAuthenticatedError();

  let response: Response;
  try {
    response = await fetch(apiUrl(path), {
      method: init?.method ?? "GET",
      headers: {
        authorization: `Bearer ${session.accessToken}`,
        ...(init?.body !== undefined && {
          "content-type": "application/json",
        }),
      },
      ...(init?.body !== undefined && { body: JSON.stringify(init.body) }),
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
      { status: response.status, ...(detail !== null && { detail }) },
    );
  }
  // A 204 has no body to parse, and a deletion is the ordinary case for one.
  if (response.status === 204) return null;
  return response.json();
}

async function get(path: string): Promise<unknown> {
  return request(path);
}

/**
 * `GET /auth/whoami` — the authenticated echo.
 *
 * The organisations and roles it returns are resolved from the caller's
 * `app_user` rows rather than from the token, so a successful call proves the
 * whole chain: audience requested, claims stamped, backend verifying,
 * membership resolved.
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
 * `GET /orgs/{id}/agents/{ain}` — one agent's whole record.
 *
 * The AIN is percent-encoded in the path. Its colons are legal `pchar` and
 * survive either way, but the identifier is opaque and byte-exact once minted,
 * so it is escaped rather than trusted to contain nothing else.
 */
export async function getAgent(
  organisationId: string,
  ain: string,
): Promise<AgentRecord | null> {
  let record: z.infer<typeof agentRecordSchema>;
  try {
    record = agentRecordSchema.parse(
      await get(
        `/orgs/${encodeURIComponent(organisationId)}/agents/${encodeURIComponent(ain)}`,
      ),
    );
  } catch (error) {
    // A 404 means this organisation has no such agent; the statuses
    // `isUnsupportedRoute` covers mean the registry has no single-agent read
    // at all, `PATCH` being the only method registered on this path. Neither
    // is an outage, and both come back as "no record", so a screen that merely
    // *offers* the record degrades to not offering it rather than taking a
    // working page down. Anything else is a real failure and stays one.
    if (
      isUnsupportedRoute(error) ||
      (error instanceof RegistryUnavailableError && error.status === 404)
    ) {
      return null;
    }
    throw error;
  }

  return {
    ain: record.ain,
    name: record.name,
    role: record.role,
    status: record.status,
    riskClass: record.risk_class,
    organisationId,
    validFrom: record.valid_from,
    createdAt: record.created_at,
    ...(record.document !== null && {
      document: {
        documentVersion: record.document.document_version,
        documentHash: record.document.document_hash,
        kid: record.document.kid,
        validFrom: record.document.valid_from,
      },
    }),
    ...(record.scope !== null && {
      scope: {
        actionClasses: record.scope.action_classes,
        constraints: record.scope.constraints,
        riskLevel: record.scope.risk_level,
        regulatoryMappings: record.scope.regulatory_mappings,
      },
    }),
    ...(record.accountability !== null && {
      accountability: {
        roleTitle: record.accountability.role_title,
        responsibilityArea: record.accountability.responsibility_area,
        regulatoryIdentifier: record.accountability.regulatory_identifier,
      },
    }),
    externalIdentities: record.external_identities.map((reference) => ({
      refType: reference.ref_type,
      refValue: reference.ref_value,
      verified: reference.verified,
    })),
    lifecycle: record.lifecycle.map((event) => ({
      seq: event.seq,
      eventType: event.event_type,
      occurredAt: event.occurred_at,
      eventHash: event.event_hash,
      previousEventHash: event.previous_event_hash,
    })),
    ...(record.resolver_url !== null && { resolverUrl: record.resolver_url }),
  };
}

/**
 * `GET /identity/assurance` — how well the caller's own identity is known.
 *
 * Always answers; "nothing established yet" is `not_started`, not a 404.
 */
export async function identityAssurance(): Promise<IndividualAssuranceSummary> {
  const record = assuranceSchema.parse(await get("/identity/assurance"));
  // Optional-and-absent rather than explicitly null, matching the frontend
  // type: `??` would keep nulls, where this drops the keys entirely.
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
 * confirms the registration number and the creator's authority to represent it
 * out of band, which is why this needs no gate beyond being signed in.
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
 * The one write that needs custody provisioned: it canonicalises the payload,
 * has it signed, and appends the genesis lifecycle events in one transaction.
 * Without Vault the registry refuses rather than issue under a development key,
 * so a 503 here is configuration rather than a bug.
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
 * these organisations; the registry's `organisation_review_read` policy makes
 * the read possible, re-deriving the role from the database rather than
 * trusting the caller.
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

const memberSchema = z.object({
  member_id: z.uuid(),
  email: z.email(),
  role: z.string(),
});

const memberListSchema = z.object({ members: z.array(memberSchema) });

/**
 * `POST /orgs/{id}/members` — give someone access to this organisation.
 *
 * Any address, matching the registry: an auditor or outside adviser may need to
 * read a register without holding a company mailbox. The role is the limit.
 */
export async function inviteMember(
  organisationId: string,
  email: string,
  role: string,
): Promise<void> {
  await request(`/orgs/${encodeURIComponent(organisationId)}/members`, {
    method: "POST",
    body: { email, role },
  });
}

/**
 * Whether a failure means "the registry does not serve this route", rather
 * than anything being wrong.
 *
 * A **404** is the route not existing and a **405** the path existing for
 * another verb. A **422** is this shape too, and is the one that actually
 * answers today: `/orgs/{id}/members/me` is matched by the registry's
 * `/orgs/{organisation_id}/members/{member_id}`, whose `member_id` is a UUID,
 * so the literal `me` fails validation before any handler runs. FastAPI's 422
 * body is an array of per-field objects, so no detail survives `refusalDetail`
 * and it arrives here as an unavailability — which it is not.
 */
function isUnsupportedRoute(error: unknown): boolean {
  return (
    error instanceof RegistryUnavailableError &&
    (error.status === 404 || error.status === 405 || error.status === 422)
  );
}

/**
 * `GET /orgs/{id}/members` — who else can act for this organisation.
 *
 * The registry does not serve this yet. Returns `null` rather than an empty
 * array when the route is absent, so the page can say "not available" instead
 * of "nobody" — different claims, and only one of them true.
 */
export async function listMembers(
  organisationId: string,
): Promise<OrganisationMember[] | null> {
  try {
    const body = memberListSchema.parse(
      await get(`/orgs/${encodeURIComponent(organisationId)}/members`),
    );
    return body.members.map((member) => ({
      id: member.member_id,
      email: member.email,
      role: member.role,
    }));
  } catch (error) {
    // Only "the registry does not serve this route" becomes `null`. An expired
    // session, an outage, or a payload that fails the schema are all different
    // claims, and laundering them into "not available yet" would state as fact
    // something this module has no evidence for — and would swallow the loud
    // failure that contract drift is supposed to produce here.
    if (isUnsupportedRoute(error)) return null;
    throw error;
  }
}

/**
 * `DELETE /orgs/{id}/members/me` — give up your own access to a company.
 *
 * The registry removes a member by id and cannot yet name the caller's own, so
 * this route does not answer — see `isUnsupportedRoute` for the three ways it
 * says so, 422 being the one it actually sends. That comes back as
 * `"unsupported"` rather than an outage: nothing is wrong, so "try again
 * shortly" would be a promise nothing can keep.
 */
export async function leaveOrganisation(
  organisationId: string,
): Promise<"left" | "unsupported"> {
  try {
    await request(`/orgs/${encodeURIComponent(organisationId)}/members/me`, {
      method: "DELETE",
    });
    return "left";
  } catch (error) {
    if (isUnsupportedRoute(error)) return "unsupported";
    throw error;
  }
}

const transitionSchema = z.object({
  ain: z.string(),
  status: z.string(),
  event_type: z.string(),
  seq: z.number().int(),
  chain_head: z.string(),
});

/**
 * `POST /orgs/{id}/agents/{ain}/suspend` or `/revoke` — withdraw authority.
 *
 * Two verb sub-paths rather than one decision endpoint, matching the registry:
 * `revoked` is terminal and `suspended` is not, they admit different current
 * statuses, and each is a distinct act an operator performs.
 *
 * The reason is mandatory and lands in the audit log, never in the signed
 * event body — `ain-lifecycle-v1`'s key set is fixed, and an operator's
 * explanation is administrative context rather than authorised state.
 */
export async function transitionAgent(
  organisationId: string,
  ain: string,
  transition: AgentTransition,
  reason: string,
): Promise<z.infer<typeof transitionSchema>> {
  return transitionSchema.parse(
    await request(
      `/orgs/${encodeURIComponent(organisationId)}/agents/${encodeURIComponent(ain)}/${transition}`,
      { method: "POST", body: { reason } },
    ),
  );
}

function toSummary(organisation: RegistryOrganisation): OrganisationSummary {
  return {
    id: organisation.organisation_id,
    ulid: organisation.org_ulid,
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
 * A count field on `GET /orgs` would put a second definition of "how many
 * agents" in the API; revisit if a person ever belongs to enough organisations
 * for the round trips to show.
 *
 * The selected organisation is the caller's choice, passed in by the page —
 * not stored here and not guessed.
 */
export async function loadAccountWorkspace(
  /**
   * The organisation named by the URL, as its public ULID.
   *
   * Resolved against the caller's own membership list, which is what makes an
   * organisation they do not belong to indistinguishable from one that does
   * not exist: it is simply not in the map, so the page 404s like any other
   * resource you cannot see. No separate authorisation branch to keep correct.
   */
  selectedOrganisationUlid: string | null = null,
  /**
   * The organisation remembered from the last switch, for the screens whose
   * address names none. A fallback rather than a claim: one that no longer
   * resolves is ignored, where a URL naming the same organisation would 404.
   */
  rememberedOrganisationUlid: string | null = null,
  /**
   * Whether the per-organisation agent registers are wanted.
   *
   * Off for the shell, which renders none of them. On by default, so a screen
   * that needs them gets them by asking for nothing.
   */
  { withAgents = true }: { withAgents?: boolean } = {},
): Promise<AccountWorkspaceState> {
  const { summaries, isOperator, individualAssurance } =
    await fetchMemberships();
  const agentLists = withAgents ? await fetchAgentLists() : [];

  const named =
    selectedOrganisationUlid === null
      ? null
      : (summaries.find(
          (summary) => summary.ulid === selectedOrganisationUlid,
        ) ?? null);
  // The address, then the last switch, then the only membership there is —
  // which is not a guess, because with one there is nothing to choose between.
  const selected =
    named ??
    summaries.find((summary) => summary.ulid === rememberedOrganisationUlid) ??
    (summaries.length === 1 ? summaries[0]! : null);

  return {
    individualAssurance,
    isOperator,
    organisations: summaries,
    selectedOrganisationId: selected?.id ?? null,
    // Distinct from the fallback above: a URL that named an organisation the
    // caller is not in resolved to nothing, and the page turns that into a 404
    // rather than quietly showing them a different one.
    namedOrganisationFound: selectedOrganisationUlid === null || named !== null,
    totalAccessibleAgents: agentLists.reduce(
      (total, entry) => total + entry.agents.length,
      0,
    ),
    // Already fetched, parsed and validated to produce that number, so
    // keeping the rows costs nothing.
    agents: agentLists.flatMap((entry) =>
      entry.agents.map((agent) => ({
        ain: agent.ain,
        name: agent.name,
        role: agent.role,
        status: agent.status,
        riskClass: agent.risk_class,
        organisationId: entry.organisationId,
        validFrom: agent.valid_from,
        createdAt: agent.created_at,
      })),
    ),
    recentActivity: [],
  };
}

/**
 * The memberships side of the workspace, fetched once per request.
 *
 * `cache` rather than a module-level variable: per-request memoisation, so the
 * shell and the page inside it share one round trip and two different requests
 * share nothing.
 *
 * Nothing about the caller's *choice* of organisation is in here — that is a
 * pure function of this data and the URL, so it belongs where the URL is known.
 */
const fetchMemberships = cache(async () => {
  const [organisations, individualAssurance] = await Promise.all([
    listOrganisations(),
    identityAssurance(),
  ]);

  const summaries = organisations.map(toSummary);
  // Read off the raw roles before `toSummary` drops them. The console's
  // navigation entry keys on this; the registry refuses the routes regardless,
  // so this decides what is *offered*, never what is permitted.
  const isOperator = organisations.some((organisation) =>
    organisation.roles.includes("trust_ops"),
  );

  return { organisations, summaries, isOperator, individualAssurance };
});

/**
 * The agent registers, which cost one request per organisation.
 *
 * Its own memoised read rather than part of the one above, because the shell
 * needs none of it. The workspace layout wraps every authenticated route, so
 * folding the fan-out into the shared fetch made `/demo`, the account settings
 * and the identity check each pay a request per organisation for rows nothing
 * on those pages renders.
 */
const fetchAgentLists = cache(async () => {
  const { organisations } = await fetchMemberships();
  // allSettled, not all: one organisation's agent list failing must not throw
  // away the memberships, statuses and assurance already fetched and send the
  // whole page to the outage screen. Nothing authorisation- or
  // correctness-bearing reads these, so an empty register is the right way to
  // degrade.
  return (
    await Promise.allSettled(
      organisations.map(async (organisation) => ({
        organisationId: organisation.organisation_id,
        agents: await listAgents(organisation.organisation_id),
      })),
    )
  ).map((result, index) =>
    result.status === "fulfilled"
      ? result.value
      : {
          organisationId: organisations[index]!.organisation_id,
          agents: [] as RegistryAgent[],
        },
  );
});
