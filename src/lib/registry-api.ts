import "server-only";

import { z } from "zod";

import { auth } from "@/auth";
import type {
  AccountWorkspaceState,
  OrganisationSummary,
} from "@/lib/account-workspace";
import type { IndividualAssuranceSummary } from "@/lib/identity-assurance";
import { getServerEnv } from "@/lib/server-env";

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

/** The registry could not be reached, or answered in a way we cannot use. */
export class RegistryUnavailableError extends Error {}

/** No usable session — the caller must authenticate before this can work. */
export class NotAuthenticatedError extends Error {}

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
  // Parsed as the enum the registry actually returns. Not coerced into a
  // friendlier vocabulary here: `rejected` is terminal, and a name that
  // implied otherwise would travel into every filter downstream.
  verification_status: z.enum(["pending", "verified", "rejected"]),
  verified_at: z.iso.datetime().nullable(),
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
  valid_from: z.iso.datetime().nullable(),
  created_at: z.iso.datetime(),
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
  checked_at: z.iso.datetime().nullable(),
  expires_at: z.iso.datetime().nullable(),
  review_reason: z.string().nullable(),
});

function baseUrl(): string {
  return getServerEnv().AIN_API_BASE_URL ?? LOCAL_API_BASE_URL;
}

async function get(path: string): Promise<unknown> {
  const session = await auth();
  // Absent covers both "not signed in" and "access token expired", which the
  // session callback collapses on purpose — neither can be fixed by retrying
  // the request, and both are fixed by signing in again.
  if (!session?.accessToken) throw new NotAuthenticatedError();

  let response: Response;
  try {
    response = await fetch(new URL(path, baseUrl()), {
      headers: { authorization: `Bearer ${session.accessToken}` },
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
    throw new RegistryUnavailableError(
      `registry answered ${response.status} for ${path}`,
    );
  }
  return response.json();
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

function toSummary(organisation: RegistryOrganisation): OrganisationSummary {
  return {
    id: organisation.organisation_id,
    name: organisation.name,
    // The owner is the `organisation.owner_user_id` FK, not a role: an
    // organisation may have several admins and exactly one owner.
    membershipRole: organisation.is_owner ? "owner" : "member",
    verificationStatus: organisation.verification_status,
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
  const agentCounts = await Promise.all(
    organisations.map(
      async (organisation) =>
        (await listAgents(organisation.organisation_id)).length,
    ),
  );

  const summaries = organisations.map(toSummary);
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
