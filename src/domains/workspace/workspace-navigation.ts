import type { OrganisationSummary } from "@/domains/workspace/account-workspace";
import {
  ACCOUNT_SETTINGS,
  orgHref,
  ORGANISATION_SETTINGS,
} from "@/domains/workspace/workspace-routes";

/**
 * The rail's sections.
 *
 * They belong to the organisation you are in, not to the account: the switcher
 * above changes organisation, and the gear beside it opens settings. Evidence
 * packs and receipts join this list when the registry can answer for them,
 * which is the reason they live in a rail with room rather than a bar without.
 */

export type UserMenuItem = {
  label: string;
  href: string;
  requiresVerifiedAccount?: boolean;
};

export function sectionsFor(
  organisationUlid: string | null,
): readonly UserMenuItem[] {
  if (organisationUlid === null) return [];
  return [
    { label: "Home", href: orgHref(organisationUlid) },
    { label: "Agents", href: orgHref(organisationUlid, "agents") },
  ];
}

/**
 * The operator's own entry, appended only for someone holding `trust_ops`.
 *
 * Named for what it holds rather than for the team that works it. "Trust
 * operations" is our word for the function; "Reviews" is the thing on the
 * screen, and it needs no glossary. Hiding it is presentation, not a control:
 * the page redirects and the registry answers 403 regardless of what the rail
 * shows.
 */
const reviewsItem: UserMenuItem = {
  label: "Reviews",
  href: "/operations",
};

export function menuItemsFor(
  isOperator: boolean,
  organisationUlid: string | null = null,
): readonly UserMenuItem[] {
  const sections = sectionsFor(organisationUlid);
  return isOperator ? [...sections, reviewsItem] : sections;
}

export type SettingsSection = {
  label: string;
  href: string;
  detail: string;
};

export type SettingsGroup = {
  label: string;
  items: readonly SettingsSection[];
};

/**
 * Settings, as the gear opens it.
 *
 * Two groups, because a person arriving here does not know whether "members"
 * is a property of their account or of the company — they know they want to
 * add someone. Grouping under the account and under the organisation's own
 * name answers that without a sentence explaining it.
 *
 * The split is also where the addresses part: the account group is addressed
 * without a tenant because none owns it, and the organisation group carries
 * the ULID like every other screen scoped to a company. An account with no
 * company has the first group only.
 */
export function settingsGroupsFor(
  organisation: OrganisationSummary | null,
): readonly SettingsGroup[] {
  const account: SettingsGroup = {
    label: "Account",
    items: [
      {
        label: "Account & security",
        href: ACCOUNT_SETTINGS,
        detail: "Your details, how you sign in, and your identity check",
      },
      {
        label: "Organisations",
        href: ORGANISATION_SETTINGS,
        detail: "Every company this account can act for",
      },
    ],
  };

  if (organisation === null) return [account];

  return [
    account,
    {
      label: organisation.name,
      items: [
        {
          label: "Registration",
          href: orgHref(organisation.ulid, "settings/registration"),
          detail: "The company details on file, and where they stand",
        },
        {
          label: "Members",
          href: orgHref(organisation.ulid, "settings/members"),
          detail: "Who else can act for this company",
        },
      ],
    },
  ];
}
