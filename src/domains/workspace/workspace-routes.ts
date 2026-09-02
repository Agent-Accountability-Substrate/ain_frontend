import type {
  AccountWorkspaceState,
  OrganisationSummary,
} from "@/domains/workspace/account-workspace";

/**
 * Where the workspace lives.
 *
 * Every screen inside the workspace is addressed by the organisation's public
 * ULID — `/o/{ulid}/…` — so the tenant arrives with the request and is visible
 * in the address bar. The internal uuid stays behind the boundary, addressing
 * the registry's own `/orgs/{organisation_id}` routes.
 *
 * Settings split along the same line the data does. What belongs to the person
 * — their details, their identity check, the companies they can act for — is
 * addressed without a tenant, because no tenant owns it. What belongs to a
 * company — its registration record, its people — is addressed by its ULID
 * like every other screen scoped to it.
 *
 * The account-level pages keep the workspace around them all the same: the
 * shell resolves an organisation from the memberships rather than from the
 * address, so the switcher and the rail do not empty on arrival. That is
 * presentation, not scope — nothing on those pages is read or written per
 * organisation.
 */

/**
 * The namespace root. Not a screen: it resolves which organisation you are
 * acting for and sends you there, which is what an address with no tenant in
 * it can honestly do. Auth0 returns here after a sign-in.
 */
export const WORKSPACE = "/o";

/**
 * Registering a company, which is the one thing that happens outside an
 * organisation because it is what creates one.
 */
export const NEW_ORGANISATION = "/o/new";

/**
 * The identity check. Outside `/o` because it is about the person, not any one
 * company — the same check follows you into every organisation you join.
 */
export const IDENTITY_ONBOARDING = "/onboarding/identity";

/** The account's own settings, which no organisation owns. */
export const SETTINGS = "/settings";
export const ACCOUNT_SETTINGS = "/settings/account";
export const ORGANISATION_SETTINGS = "/settings/organisations";

/**
 * Which organisation the workspace shows when the address does not say — the
 * account's settings and the register-a-company screen carry no tenant.
 *
 * A preference, not an authority. It holds a ULID — already public, it is the
 * organisation segment of every AIN — and the server resolves it against the
 * caller's membership list on every read, exactly like a ULID in a path. One
 * naming an organisation you have left resolves to nothing and is ignored.
 */
export const ORGANISATION_PREFERENCE = "subra.organisation";

/** Written by the switcher, read by the loader every screen goes through. */
export function rememberOrganisation(ulid: string): void {
  // `Secure` wherever the page is served over TLS, which is everywhere but a
  // developer's machine. `Lax` because it only has to survive an ordinary
  // top-level navigation back into the app.
  const secure = window.location.protocol === "https:" ? "; secure" : "";
  document.cookie = `${ORGANISATION_PREFERENCE}=${ulid}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax${secure}`;
}

/** A ULID is 26 characters of Crockford base32, canonically uppercase. */
const ULID = /^[0-9ABCDEFGHJKMNPQRSTVWXYZ]{26}$/;

export const isOrganisationUlid = (value: string): boolean => ULID.test(value);

type OrganisationSection =
  "" | "agents" | "agents/new" | "settings/registration" | "settings/members";

export function orgHref(ulid: string, section: OrganisationSection = "") {
  return section === "" ? `/o/${ulid}` : `/o/${ulid}/${section}`;
}

/**
 * Where an authenticated arrival belongs.
 *
 * Into an organisation, or into registering one. Never onto a chooser: the
 * switcher is the first thing in the top bar, so a screen whose only job is to
 * ask which organisation you meant is a click that the bar already answers.
 */
export function landingHref(
  organisations: readonly Pick<OrganisationSummary, "ulid">[],
): string {
  const first = organisations[0];
  return first ? orgHref(first.ulid) : NEW_ORGANISATION;
}

/** The organisation the URL named, or the fallback the loader settled on. */
export function selectedOrganisation(
  state: AccountWorkspaceState,
): OrganisationSummary | null {
  return (
    state.organisations.find(
      (organisation) => organisation.id === state.selectedOrganisationId,
    ) ?? null
  );
}
